import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Download, FileSpreadsheet, FileText, Filter, Search } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

interface Transaction {
  id: string;
  cpf_portador: string;
  nome_portador: string;
  tipo_transacao: string;
  data_transacao: string;
  valor_transacao: number;
  categoria: string;
  nome_favorecido: string | null;
  cnpj_cpf_favorecido: string | null;
}

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [minValue, setMinValue] = useState("");
  const [maxValue, setMaxValue] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [transactions, searchTerm, categoryFilter, dateFrom, dateTo, minValue, maxValue]);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('data_transacao', { ascending: false })
        .limit(1000);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      toast({
        title: "Erro ao carregar transações",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...transactions];

    // Filtro de busca (nome portador ou favorecido)
    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.nome_portador.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.nome_favorecido?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro de categoria
    if (categoryFilter !== "all") {
      filtered = filtered.filter(t => t.categoria === categoryFilter);
    }

    // Filtro de data
    if (dateFrom) {
      filtered = filtered.filter(t => t.data_transacao >= dateFrom);
    }
    if (dateTo) {
      filtered = filtered.filter(t => t.data_transacao <= dateTo);
    }

    // Filtro de valor
    if (minValue) {
      filtered = filtered.filter(t => t.valor_transacao >= parseFloat(minValue));
    }
    if (maxValue) {
      filtered = filtered.filter(t => t.valor_transacao <= parseFloat(maxValue));
    }

    setFilteredTransactions(filtered);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setCategoryFilter("all");
    setDateFrom("");
    setDateTo("");
    setMinValue("");
    setMaxValue("");
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text("Relatório de Transações CPGF", 14, 20);
    
    doc.setFontSize(11);
    doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, 14, 28);
    doc.text(`Total de transações: ${filteredTransactions.length}`, 14, 34);
    
    const tableData = filteredTransactions.map(t => [
      format(new Date(t.data_transacao), "dd/MM/yyyy", { locale: ptBR }),
      t.nome_portador,
      t.categoria,
      t.tipo_transacao,
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.valor_transacao),
      t.nome_favorecido || 'N/A'
    ]);

    autoTable(doc, {
      startY: 40,
      head: [['Data', 'Portador', 'Categoria', 'Tipo', 'Valor', 'Favorecido']],
      body: tableData,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [34, 89, 156] },
    });

    doc.save(`transacoes-${format(new Date(), "yyyy-MM-dd")}.pdf`);
    
    toast({
      title: "PDF exportado",
      description: "O relatório foi gerado com sucesso.",
    });
  };

  const exportToExcel = () => {
    const excelData = filteredTransactions.map(t => ({
      'Data': format(new Date(t.data_transacao), "dd/MM/yyyy", { locale: ptBR }),
      'CPF Portador': t.cpf_portador,
      'Portador': t.nome_portador,
      'Categoria': t.categoria,
      'Tipo Transação': t.tipo_transacao,
      'Valor': t.valor_transacao,
      'Favorecido': t.nome_favorecido || 'N/A',
      'CPF/CNPJ Favorecido': t.cnpj_cpf_favorecido || 'N/A',
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transações");
    
    XLSX.writeFile(wb, `transacoes-${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    
    toast({
      title: "Excel exportado",
      description: "A planilha foi gerada com sucesso.",
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const totalValue = filteredTransactions.reduce((sum, t) => sum + t.valor_transacao, 0);

  const categories = ["Compra", "Saque", "Alimentação", "Combustível", "Hospedagem", "Transporte", "Material de Escritório", "Equipamentos", "Outros"];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Carregando transações...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Detalhes de Transações</h1>
          <p className="text-muted-foreground">
            Análise detalhada com filtros avançados e exportação
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros Avançados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Buscar Portador/Favorecido</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Nome do portador ou favorecido"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Categoria</label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as categorias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Data Inicial</label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Data Final</label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Valor Mínimo</label>
                <Input
                  type="number"
                  placeholder="R$ 0,00"
                  value={minValue}
                  onChange={(e) => setMinValue(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Valor Máximo</label>
                <Input
                  type="number"
                  placeholder="R$ 10.000,00"
                  value={maxValue}
                  onChange={(e) => setMaxValue(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={clearFilters} variant="outline">
                Limpar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <CardTitle>Transações Encontradas</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {filteredTransactions.length.toLocaleString('pt-BR')} transações • Total: {formatCurrency(totalValue)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={exportToPDF} variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Exportar PDF
                </Button>
                <Button onClick={exportToExcel} variant="outline">
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Exportar Excel
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Portador</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Favorecido</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.slice(0, 100).map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">
                        {format(new Date(transaction.data_transacao), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>{transaction.nome_portador}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          {transaction.categoria}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {transaction.tipo_transacao}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(transaction.valor_transacao)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {transaction.nome_favorecido || 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {filteredTransactions.length > 100 && (
              <p className="text-sm text-muted-foreground mt-4 text-center">
                Mostrando 100 de {filteredTransactions.length.toLocaleString('pt-BR')} transações. Use os filtros para refinar a busca.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
