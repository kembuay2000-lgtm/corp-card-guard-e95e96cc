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
  categoria: string;
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
      console.error('CSV content is missing');
      return new Response(
        JSON.stringify({ error: 'CSV content is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Starting CSV processing... Content length: ${csvContent.length} chars`);

    // Parse CSV with better error handling
    const lines = csvContent.split('\n').filter((line: string) => line.trim());
    console.log(`Total lines found: ${lines.length}`);
    
    const transactions: TransactionRow[] = [];
    let skipped = 0;

    // Skip header (first line)
    for (let i = 1; i < lines.length; i++) {
      try {
        const line = lines[i];
        // Parse CSV considering semicolon separator and quoted fields
        const fields = line.split(';').map((field: string) => 
          field.replace(/^"/, '').replace(/"$/, '').trim()
        );

        if (fields.length < 15) {
          skipped++;
          continue;
        }

        // Validate required fields
        const cpfPortador = fields[8]?.trim();
        const nomePortador = fields[9]?.trim();
        const tipoTransacao = fields[12]?.trim();
        const dataTransacao = fields[13]?.trim();
        const valorStr = fields[14]?.trim();

        if (!cpfPortador || !nomePortador || !tipoTransacao || !dataTransacao || !valorStr) {
          console.warn(`Line ${i + 1}: Missing required fields`);
          skipped++;
          continue;
        }

        const valor = parseFloat(valorStr.replace(',', '.'));
        
        if (isNaN(valor)) {
          console.warn(`Line ${i + 1}: Invalid valor_transacao: ${valorStr}`);
          skipped++;
          continue;
        }

        // Convert date from DD/MM/YYYY to YYYY-MM-DD
        const dateParts = dataTransacao.split('/');
        if (dateParts.length !== 3) {
          console.warn(`Line ${i + 1}: Invalid date format: ${dataTransacao}`);
          skipped++;
          continue;
        }

        const day = dateParts[0].padStart(2, '0');
        const month = dateParts[1].padStart(2, '0');
        const year = dateParts[2];
        
        if (year.length !== 4 || parseInt(month) > 12 || parseInt(day) > 31) {
          console.warn(`Line ${i + 1}: Invalid date values: ${dataTransacao}`);
          skipped++;
          continue;
        }

        const formattedDate = `${year}-${month}-${day}`;

        const mesExtrato = parseInt(fields[7]);
        const anoExtrato = parseInt(fields[6]);

        if (isNaN(mesExtrato) || isNaN(anoExtrato) || mesExtrato < 1 || mesExtrato > 12) {
          console.warn(`Line ${i + 1}: Invalid mes/ano extrato`);
          skipped++;
          continue;
        }

        // Categorize transaction type
        let categoria = 'Outros';
        const tipoTransacaoUpper = tipoTransacao.toUpperCase();
        if (tipoTransacaoUpper.includes('SAQUE')) categoria = 'Saque';
        else if (tipoTransacaoUpper.includes('COMBUSTIVEL')) categoria = 'Combustível';
        else if (tipoTransacaoUpper.includes('REFEICAO') || tipoTransacaoUpper.includes('ALIMENTACAO')) categoria = 'Alimentação';
        else if (tipoTransacaoUpper.includes('MATERIAL')) categoria = 'Material';
        else if (tipoTransacaoUpper.includes('COMPRA')) categoria = 'Compra';

        const cnpjCpfFavorecido = fields[10]?.trim();
        const nomeFavorecido = fields[11]?.trim();

        transactions.push({
          cpf_portador: cpfPortador,
          nome_portador: nomePortador,
          cnpj_cpf_favorecido: (!cnpjCpfFavorecido || cnpjCpfFavorecido === '-2') ? null : cnpjCpfFavorecido,
          nome_favorecido: (!nomeFavorecido || nomeFavorecido === 'NAO SE APLICA') ? null : nomeFavorecido,
          tipo_transacao: tipoTransacao,
          data_transacao: formattedDate,
          valor_transacao: valor,
          mes_extrato: mesExtrato,
          ano_extrato: anoExtrato,
          categoria
        });
      } catch (error) {
        console.error(`Error parsing line ${i + 1}:`, error);
        skipped++;
      }
    }

    console.log(`Parsed ${transactions.length} transactions, skipped ${skipped} lines`);

    if (transactions.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'No valid transactions found in CSV',
          skipped 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert in batches of 1000 for better performance
    const batchSize = 1000;
    let inserted = 0;
    let errors = 0;
    const errorDetails: string[] = [];

    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize);
      
      try {
        const { error } = await supabase
          .from('transactions')
          .insert(batch);

        if (error) {
          console.error(`Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error.message);
          errorDetails.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
          errors += batch.length;
        } else {
          inserted += batch.length;
          console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}: ${batch.length} records (${inserted}/${transactions.length})`);
        }
      } catch (batchError: any) {
        console.error(`Exception in batch ${Math.floor(i / batchSize) + 1}:`, batchError);
        errorDetails.push(`Batch ${Math.floor(i / batchSize) + 1}: ${batchError.message}`);
        errors += batch.length;
      }
    }

    console.log(`Import completed: ${inserted} inserted, ${errors} errors, ${skipped} skipped`);

    return new Response(
      JSON.stringify({
        success: true,
        inserted,
        errors,
        skipped,
        total: transactions.length,
        errorDetails: errorDetails.length > 0 ? errorDetails : undefined
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
