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
