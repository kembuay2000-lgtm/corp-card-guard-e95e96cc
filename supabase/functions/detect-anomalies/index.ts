import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Authenticate user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Starting anomaly detection...');
    let alertsCreated = 0;

    // 1. Detectar saques acima de R$ 2.000
    const { data: highWithdrawals } = await supabase
      .from('transactions')
      .select('*')
      .eq('categoria', 'Saque')
      .gt('valor_transacao', 2000);

    // 4. Detectar fracionamento suspeito (múltiplas transações similares em curto período)
    const { data: allTransactions } = await supabase
      .from('transactions')
      .select('*')
      .order('data_transacao')
      .order('cpf_portador');

    // Agrupar por portador e data para detectar fracionamento
    const fractionationMap = new Map<string, Array<any>>();
    if (allTransactions) {
      allTransactions.forEach(t => {
        const key = `${t.cpf_portador}_${t.data_transacao}`;
        if (!fractionationMap.has(key)) {
          fractionationMap.set(key, []);
        }
        fractionationMap.get(key)!.push(t);
      });

      // Detectar transações fracionadas (3+ transações de valores similares no mesmo dia)
      for (const [key, transactions] of fractionationMap.entries()) {
        if (transactions.length >= 3) {
          const values = transactions.map(t => t.valor_transacao).sort((a, b) => a - b);
          const maxDiff = values[values.length - 1] - values[0];
          const avgValue = values.reduce((sum, v) => sum + v, 0) / values.length;
          
          // Se a diferença entre os valores for pequena (< 20% da média), é suspeito
          if (maxDiff / avgValue < 0.2 && avgValue > 200) {
            const totalAmount = values.reduce((sum, v) => sum + v, 0);
            const [cpf, date] = key.split('_');
            const cardHolder = transactions[0].nome_portador;

            const { data: existingAlert } = await supabase
              .from('alerts')
              .select('id')
              .eq('card_holder', cardHolder)
              .eq('alert_date', date)
              .eq('alert_type', 'suspicious_fractionation')
              .single();

            if (!existingAlert) {
              const { error: insertError } = await supabase
                .from('alerts')
                .insert({
                  severity: 'high',
                  alert_type: 'suspicious_fractionation',
                  title: 'Fracionamento Suspeito Detectado',
                  description: `${transactions.length} transações de valores similares (média: ${avgValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}) totalizando ${totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} no mesmo dia.`,
                  amount: totalAmount,
                  alert_date: date,
                  card_holder: cardHolder,
                  status: 'pending'
                });
              
              if (!insertError) alertsCreated++;
            }
          }
        }
      }
    }

    // 5. Detectar concentração de fornecedor (mesmo CNPJ recebe > 70% dos valores)
    const { data: supplierData } = await supabase
      .from('transactions')
      .select('cpf_portador, nome_portador, cnpj_cpf_favorecido, nome_favorecido, valor_transacao')
      .not('cnpj_cpf_favorecido', 'is', null);

    if (supplierData) {
      const holderSuppliers = new Map<string, Map<string, { total: number; count: number; supplierName: string }>>();
      
      supplierData.forEach(t => {
        if (!holderSuppliers.has(t.cpf_portador)) {
          holderSuppliers.set(t.cpf_portador, new Map());
        }
        const suppliers = holderSuppliers.get(t.cpf_portador)!;
        if (!suppliers.has(t.cnpj_cpf_favorecido)) {
          suppliers.set(t.cnpj_cpf_favorecido, { total: 0, count: 0, supplierName: t.nome_favorecido });
        }
        const supplier = suppliers.get(t.cnpj_cpf_favorecido)!;
        supplier.total += parseFloat(t.valor_transacao);
        supplier.count++;
      });

      for (const [cpf, suppliers] of holderSuppliers.entries()) {
        const totalSpent = Array.from(suppliers.values()).reduce((sum, s) => sum + s.total, 0);
        
        for (const [cnpj, data] of suppliers.entries()) {
          const concentration = data.total / totalSpent;
          
          if (concentration > 0.7 && data.count >= 5) {
            const holder = supplierData.find(t => t.cpf_portador === cpf);
            
            const { data: existingAlert } = await supabase
              .from('alerts')
              .select('id')
              .eq('card_holder', holder?.nome_portador)
              .eq('alert_type', 'supplier_concentration')
              .ilike('description', `%${cnpj}%`)
              .single();

            if (!existingAlert) {
              const { error: insertError } = await supabase
                .from('alerts')
                .insert({
                  severity: 'medium',
                  alert_type: 'supplier_concentration',
                  title: 'Concentração de Fornecedor',
                  description: `${(concentration * 100).toFixed(1)}% das transações (${data.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}) concentradas no fornecedor ${data.supplierName} (${cnpj}).`,
                  amount: data.total,
                  alert_date: new Date().toISOString().split('T')[0],
                  card_holder: holder?.nome_portador,
                  status: 'pending'
                });
              
              if (!insertError) alertsCreated++;
            }
          }
        }
      }
    }

    // 6. Detectar portadores inativos (sem transações nos últimos 60 dias, mas com transação recente)
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: recentTransactions } = await supabase
      .from('transactions')
      .select('cpf_portador, nome_portador, data_transacao, valor_transacao')
      .gte('data_transacao', thirtyDaysAgo.toISOString().split('T')[0])
      .order('data_transacao');

    if (recentTransactions) {
      const activeHolders = new Set(recentTransactions.map(t => t.cpf_portador));
      
      for (const holder of activeHolders) {
        const { data: historicalTxns } = await supabase
          .from('transactions')
          .select('data_transacao, valor_transacao')
          .eq('cpf_portador', holder)
          .lt('data_transacao', sixtyDaysAgo.toISOString().split('T')[0])
          .order('data_transacao', { ascending: false })
          .limit(1);

        if (!historicalTxns || historicalTxns.length === 0) {
          const recentTxn = recentTransactions.find(t => t.cpf_portador === holder);
          
          const { data: existingAlert } = await supabase
            .from('alerts')
            .select('id')
            .eq('card_holder', recentTxn?.nome_portador)
            .eq('alert_type', 'inactive_cardholder')
            .single();

          if (!existingAlert && recentTxn) {
            const { error: insertError } = await supabase
              .from('alerts')
              .insert({
                severity: 'medium',
                alert_type: 'inactive_cardholder',
                title: 'Portador Inativo com Transação Recente',
                description: `Portador sem histórico nos últimos 60 dias apresentou transação recente de ${recentTxn.valor_transacao.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}.`,
                amount: recentTxn.valor_transacao,
                alert_date: recentTxn.data_transacao,
                card_holder: recentTxn.nome_portador,
                status: 'pending'
              });
            
            if (!insertError) alertsCreated++;
          }
        }
      }
    }

    // 7. Lei de Benford (análise do primeiro dígito)
    const { data: benfordData } = await supabase
      .from('transactions')
      .select('cpf_portador, nome_portador, valor_transacao');

    if (benfordData) {
      const holderDigits = new Map<string, { name: string; digits: number[] }>();
      
      benfordData.forEach(t => {
        const firstDigit = parseInt(t.valor_transacao.toString().replace(/[^0-9]/g, '')[0]);
        if (firstDigit > 0) {
          if (!holderDigits.has(t.cpf_portador)) {
            holderDigits.set(t.cpf_portador, { name: t.nome_portador, digits: Array(9).fill(0) });
          }
          holderDigits.get(t.cpf_portador)!.digits[firstDigit - 1]++;
        }
      });

      // Lei de Benford: esperado [30.1%, 17.6%, 12.5%, 9.7%, 7.9%, 6.7%, 5.8%, 5.1%, 4.6%]
      const benfordExpected = [0.301, 0.176, 0.125, 0.097, 0.079, 0.067, 0.058, 0.051, 0.046];

      for (const [cpf, data] of holderDigits.entries()) {
        const total = data.digits.reduce((sum, count) => sum + count, 0);
        if (total >= 30) { // Análise significativa com pelo menos 30 transações
          const distribution = data.digits.map(count => count / total);
          
          // Calcular chi-quadrado
          let chiSquare = 0;
          for (let i = 0; i < 9; i++) {
            const expected = benfordExpected[i] * total;
            const observed = data.digits[i];
            chiSquare += Math.pow(observed - expected, 2) / expected;
          }

          // Chi-quadrado crítico para 8 graus de liberdade e p=0.05 é ~15.51
          if (chiSquare > 15.51) {
            const { data: existingAlert } = await supabase
              .from('alerts')
              .select('id')
              .eq('card_holder', data.name)
              .eq('alert_type', 'benford_anomaly')
              .single();

            if (!existingAlert) {
              const { error: insertError } = await supabase
                .from('alerts')
                .insert({
                  severity: 'low',
                  alert_type: 'benford_anomaly',
                  title: 'Anomalia na Lei de Benford',
                  description: `Distribuição dos primeiros dígitos das transações não segue o padrão esperado pela Lei de Benford (χ² = ${chiSquare.toFixed(2)}). Pode indicar manipulação de valores.`,
                  amount: 0,
                  alert_date: new Date().toISOString().split('T')[0],
                  card_holder: data.name,
                  status: 'pending'
                });
              
              if (!insertError) alertsCreated++;
            }
          }
        }
      }
    }

    if (highWithdrawals && highWithdrawals.length > 0) {
      console.log(`Found ${highWithdrawals.length} high value withdrawals`);
      
      for (const transaction of highWithdrawals) {
        // Verificar se já existe alerta para esta transação
        const { data: existingAlert } = await supabase
          .from('alerts')
          .select('id')
          .eq('transaction_id', transaction.id)
          .single();

        if (!existingAlert) {
          const { error: insertError } = await supabase
            .from('alerts')
            .insert({
              transaction_id: transaction.id,
              severity: 'high',
              alert_type: 'high_value_withdrawal',
              title: 'Saque de Alto Valor',
              description: `Saque de ${transaction.valor_transacao.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} detectado.`,
              amount: transaction.valor_transacao,
              alert_date: transaction.data_transacao,
              card_holder: transaction.nome_portador,
              status: 'pending'
            });

          if (!insertError) alertsCreated++;
        }
      }
    }

    // 2. Detectar múltiplas transações no mesmo dia (>5)
    const { data: dailyTransactions } = await supabase
      .from('transactions')
      .select('data_transacao, cpf_portador, nome_portador')
      .order('data_transacao');

    if (dailyTransactions) {
      const dailyMap = new Map<string, { count: number; cpf: string; name: string }>();
      
      dailyTransactions.forEach(t => {
        const key = `${t.cpf_portador}_${t.data_transacao}`;
        const existing = dailyMap.get(key);
        if (existing) {
          existing.count++;
        } else {
          dailyMap.set(key, { count: 1, cpf: t.cpf_portador, name: t.nome_portador });
        }
      });

      for (const [key, data] of dailyMap.entries()) {
        if (data.count > 5) {
          const date = key.split('_')[1];
          
          // Verificar se já existe alerta
          const { data: existingAlert } = await supabase
            .from('alerts')
            .select('id')
            .eq('card_holder', data.name)
            .eq('alert_date', date)
            .eq('alert_type', 'multiple_transactions')
            .single();

          if (!existingAlert) {
            const { error: insertError } = await supabase
              .from('alerts')
              .insert({
                severity: 'medium',
                alert_type: 'multiple_transactions',
                title: 'Múltiplas Transações no Mesmo Dia',
                description: `${data.count} transações realizadas no mesmo dia por ${data.name}.`,
                amount: 0,
                alert_date: date,
                card_holder: data.name,
                status: 'pending'
              });

            if (!insertError) alertsCreated++;
          }
        }
      }
    }

    // 3. Detectar transações em finais de semana
    const { data: weekendTransactions } = await supabase
      .from('transactions')
      .select('*')
      .order('data_transacao');

    if (weekendTransactions) {
      for (const transaction of weekendTransactions) {
        const date = new Date(transaction.data_transacao);
        const dayOfWeek = date.getDay();
        
        // 0 = Sunday, 6 = Saturday
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          // Verificar se já existe alerta
          const { data: existingAlert } = await supabase
            .from('alerts')
            .select('id')
            .eq('transaction_id', transaction.id)
            .eq('alert_type', 'weekend_transaction')
            .single();

          if (!existingAlert && transaction.valor_transacao > 500) {
            const { error: insertError } = await supabase
              .from('alerts')
              .insert({
                transaction_id: transaction.id,
                severity: 'low',
                alert_type: 'weekend_transaction',
                title: 'Transação em Final de Semana',
                description: `Transação de ${transaction.valor_transacao.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} realizada em final de semana.`,
                amount: transaction.valor_transacao,
                alert_date: transaction.data_transacao,
                card_holder: transaction.nome_portador,
                status: 'pending'
              });

            if (!insertError) alertsCreated++;
          }
        }
      }
    }

    console.log(`Anomaly detection completed. Created ${alertsCreated} alerts.`);

    return new Response(
      JSON.stringify({
        success: true,
        alertsCreated,
        message: `Análise concluída. ${alertsCreated} alertas criados.`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in anomaly detection:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
