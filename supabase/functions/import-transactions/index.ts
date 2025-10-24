import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TransactionRow {
  cpf_portador: string;
  nome_portador: string;
  cnpj_cpf_favorecido: string | null;
  nome_favorecido: string | null;
  tipo_transacao: string;
  data_transacao: string;
  valor_transacao: number;
  mes_extrato: number;
  ano_extrato: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user is authenticated and has auditor or admin role
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has required role
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const hasPermission = roles?.some(r => ['auditor', 'admin'].includes(r.role));
    if (!hasPermission) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Requires auditor or admin role' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { csvContent } = await req.json();
    
    if (!csvContent) {
      return new Response(
        JSON.stringify({ error: 'CSV content is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Starting CSV processing...');

    // Parse CSV
    const lines = csvContent.split('\n').filter((line: string) => line.trim());
    const transactions: TransactionRow[] = [];

    // Skip header (first line)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      // Parse CSV considering semicolon separator and quoted fields
      const fields = line.split(';').map((field: string) => 
        field.replace(/^"/, '').replace(/"$/, '').trim()
      );

      if (fields.length >= 15) {
        const valorStr = fields[14].replace(',', '.');
        const valor = parseFloat(valorStr);
        
        if (isNaN(valor)) {
          console.warn(`Skipping line ${i + 1}: Invalid valor_transacao`);
          continue;
        }

        // Convert date from DD/MM/YYYY to YYYY-MM-DD
        const dataTransacao = fields[13];
        const dateParts = dataTransacao.split('/');
        let formattedDate = dataTransacao;
        if (dateParts.length === 3) {
          formattedDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
        }

        transactions.push({
          cpf_portador: fields[8],
          nome_portador: fields[9],
          cnpj_cpf_favorecido: fields[10] || null,
          nome_favorecido: fields[11] || null,
          tipo_transacao: fields[12],
          data_transacao: formattedDate,
          valor_transacao: valor,
          mes_extrato: parseInt(fields[7]),
          ano_extrato: parseInt(fields[6]),
        });
      }
    }

    console.log(`Parsed ${transactions.length} transactions`);

    // Insert in batches of 500
    const batchSize = 500;
    let inserted = 0;
    let errors = 0;

    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize);
      
      const { error } = await supabase
        .from('transactions')
        .insert(batch);

      if (error) {
        console.error(`Error inserting batch ${i / batchSize + 1}:`, error);
        errors += batch.length;
      } else {
        inserted += batch.length;
        console.log(`Inserted batch ${i / batchSize + 1}: ${batch.length} records`);
      }
    }

    console.log(`Import completed: ${inserted} inserted, ${errors} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        inserted,
        errors,
        total: transactions.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in import-transactions:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
