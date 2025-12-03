# Sistema de Auditoria Contínua para Cartão Corporativo

Sistema desenvolvido para auditoria contínua de transações de cartão corporativo, utilizando dados do CPGF (Cartão de Pagamento do Governo Federal) como base simulada.

## 📋 Sobre o Projeto

Este projeto foi desenvolvido como trabalho acadêmico para a disciplina de **Auditoria de Sistemas** do curso de **Sistemas de Informação**. O sistema implementa um conjunto completo de ferramentas para monitoramento, análise e auditoria de transações financeiras corporativas.

### Objetivos

- Implementar programa de testes automatizados para detecção de anomalias
- Criar interface para gestão de alertas pela equipe de RH e Auditoria Interna
- Garantir rastreabilidade completa de acessos aos dados sensíveis
- Gerar relatórios de compliance para documentação oficial

## 🚀 Funcionalidades

### Importação de Dados
- Upload de arquivos CSV com transações do CPGF
- Processamento em lotes de 1.000 registros
- Validação rigorosa de campos obrigatórios
- Categorização automática de transações

### Programa de Testes de Auditoria (10 testes automáticos)

| # | Teste | Descrição | Severidade |
|---|-------|-----------|------------|
| 1 | Saques de Alto Valor | Transações acima de R$ 2.000 | Crítico |
| 2 | Múltiplas Transações Diárias | Mais de 5 transações no mesmo dia | Médio |
| 3 | Transações em Finais de Semana | Valores acima de R$ 500 em sábados/domingos | Médio |
| 4 | Fracionamento Suspeito | Múltiplas transações pequenas sequenciais | Crítico |
| 5 | Concentração de Fornecedor | Alto volume em único fornecedor | Médio |
| 6 | Portadores Inativos | Transações de portadores sem atividade recente | Médio |
| 7 | Anomalia Lei de Benford | Distribuição atípica de dígitos iniciais | Médio |
| 8 | Anomalia Geográfica | Transações em locais distantes em curto período | Crítico |
| 9 | Frequência em Estabelecimentos | Padrões de uso repetido suspeito | Médio |
| 10 | Auditoria de Acesso | Registro de todos os acessos a dados sensíveis | Info |

### Gestão de Alertas
- Visualização em tempo real de alertas gerados
- Workflow de justificativas com upload de documentos
- Aprovação/rejeição por gestores autorizados
- Histórico completo de cada alerta

### Dashboard de Auditoria
- Estatísticas de acesso ao sistema
- Detecção de acessos suspeitos (horários incomuns, múltiplos IPs)
- Gráficos de atividade por hora e tabela
- Identificação de usuários mais ativos

### Relatórios e Exportação
- Exportação de transações para PDF e Excel
- Relatório completo de auditoria em PDF
- Timeline de alertas para compliance
- Documentação de justificativas aprovadas/rejeitadas

### Controle de Acesso
- Autenticação via Supabase Auth
- Três perfis de usuário: Admin, Auditor, RH
- Row Level Security (RLS) em todas as tabelas
- Registro de auditoria de todos os acessos

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 18, TypeScript, Vite
- **Estilização**: Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Edge Functions, Auth)
- **Gráficos**: Recharts
- **Exportação**: jsPDF, jspdf-autotable, xlsx
- **Gerenciamento de Estado**: TanStack Query

## 📁 Estrutura do Projeto

```
src/
├── components/
│   ├── audit/              # Componentes do dashboard de auditoria
│   │   ├── AuditActivityChart.tsx
│   │   ├── AuditReportExport.tsx
│   │   ├── AuditStats.tsx
│   │   └── AuditSuspiciousAlerts.tsx
│   ├── ui/                 # Componentes base (shadcn/ui)
│   ├── AlertJustificationDialog.tsx
│   ├── AlertJustificationReview.tsx
│   ├── AlertsSection.tsx
│   ├── Hero.tsx
│   ├── Navbar.tsx
│   ├── StatsOverview.tsx
│   ├── TestsProgram.tsx
│   ├── TransactionImport.tsx
│   └── TransactionsDashboard.tsx
├── contexts/
│   └── AuthContext.tsx     # Contexto de autenticação
├── hooks/
│   ├── useAuditLog.ts      # Hook para logging de auditoria
│   └── use-toast.ts
├── integrations/
│   └── supabase/           # Configuração do Supabase
├── pages/
│   ├── AuditDashboard.tsx  # Dashboard de auditoria
│   ├── Auth.tsx            # Página de login
│   ├── Index.tsx           # Página principal
│   ├── NotFound.tsx
│   └── Transactions.tsx    # Listagem de transações
└── App.tsx                 # Roteamento principal

supabase/
├── functions/
│   ├── detect-anomalies/   # Detecção de anomalias
│   ├── import-transactions/ # Importação de CSV
│   └── log-audit/          # Registro de auditoria
└── config.toml             # Configuração do Supabase
```

## 🗄️ Modelo de Dados

### Tabelas Principais

- **transactions**: Armazena todas as transações importadas
- **alerts**: Alertas gerados pelos testes de auditoria
- **alert_justifications**: Justificativas enviadas pelos portadores
- **alert_attachments**: Documentos anexados às justificativas
- **audit_logs**: Logs de acesso ao sistema
- **profiles**: Informações dos usuários
- **user_roles**: Papéis de acesso dos usuários

## 🔒 Segurança

- **Row Level Security (RLS)**: Todas as tabelas possuem políticas de segurança
- **Autenticação**: Gerenciada pelo Supabase Auth
- **Auditoria de Acesso**: Todos os acessos são registrados com IP, user agent e timestamp
- **Proteção de Dados**: Dados sensíveis protegidos por controle de acesso baseado em papéis

## 📊 Como Usar

### 1. Acessar o Sistema
- Faça login com suas credenciais
- O sistema verificará automaticamente seu perfil de acesso

### 2. Importar Transações
- Acesse a página principal
- Clique em "Importar CSV"
- Selecione o arquivo de transações do CPGF
- Aguarde o processamento

### 3. Detectar Anomalias
- Após a importação, clique em "Detectar Anomalias"
- O sistema executará os 10 testes automaticamente
- Os alertas serão exibidos na seção de alertas

### 4. Gerenciar Alertas
- Visualize os alertas gerados
- Envie justificativas quando necessário
- Gestores podem aprovar ou rejeitar justificativas

### 5. Gerar Relatórios
- Acesse o Dashboard de Auditoria
- Visualize estatísticas de acesso
- Exporte relatórios em PDF para compliance

## 👥 Perfis de Acesso

| Perfil | Permissões |
|--------|------------|
| Admin | Acesso total ao sistema |
| Auditor | Importar transações, detectar anomalias, gerenciar alertas, gerar relatórios |
| RH | Visualizar alertas, aprovar/rejeitar justificativas |

## 📝 Licença

Este projeto foi desenvolvido para fins acadêmicos.

## 👨‍💻 Desenvolvimento

Desenvolvido utilizando [Lovable](https://lovable.dev) - Plataforma de desenvolvimento com IA.

---

**Disciplina**: Auditoria de Sistemas  
**Curso**: Sistemas de Informação  
**Data**: 2025
