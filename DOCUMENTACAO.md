# Documentação Técnica - Sistema de Auditoria Contínua

## Sumário

1. [Visão Geral](#visão-geral)
2. [Arquitetura do Sistema](#arquitetura-do-sistema)
3. [Módulos e Componentes](#módulos-e-componentes)
4. [Testes de Auditoria](#testes-de-auditoria)
5. [Fluxos de Trabalho](#fluxos-de-trabalho)
6. [Banco de Dados](#banco-de-dados)
7. [Segurança](#segurança)
8. [API e Edge Functions](#api-e-edge-functions)
9. [Guia de Instalação](#guia-de-instalação)
10. [Troubleshooting](#troubleshooting)

---

## Visão Geral

O Sistema de Auditoria Contínua para Cartão Corporativo é uma aplicação web desenvolvida para automatizar o processo de auditoria de transações financeiras. O sistema utiliza dados do CPGF (Cartão de Pagamento do Governo Federal) como base simulada e implementa um conjunto abrangente de testes para identificar potenciais irregularidades.

### Principais Características

- **Auditoria Automatizada**: 10 testes automáticos para detecção de anomalias
- **Gestão de Alertas**: Workflow completo de justificativas e aprovações
- **Rastreabilidade**: Logs completos de todos os acessos ao sistema
- **Relatórios**: Exportação para PDF e Excel para compliance
- **Segurança**: Controle de acesso baseado em papéis (RBAC)

---

## Arquitetura do Sistema

### Stack Tecnológica

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND                                │
│  React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      SUPABASE                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  PostgreSQL │  │    Auth     │  │   Edge Functions    │  │
│  │  (Database) │  │ (Autenticação)│ │ (Lógica de Negócio)│  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Fluxo de Dados

```
Usuário → Frontend React → Supabase Client → Edge Functions → PostgreSQL
                                    ↓
                              Auth (JWT)
                                    ↓
                              RLS Policies
```

---

## Módulos e Componentes

### Páginas Principais

#### 1. Index (Página Principal)
**Arquivo**: `src/pages/Index.tsx`

Componentes incluídos:
- `Navbar`: Navegação principal
- `Hero`: Banner de boas-vindas
- `TransactionImport`: Upload de arquivos CSV
- `StatsOverview`: Estatísticas em tempo real
- `TransactionsDashboard`: Últimas transações
- `AlertsSection`: Alertas gerados
- `TestsProgram`: Programa de testes

#### 2. Transactions (Transações)
**Arquivo**: `src/pages/Transactions.tsx`

Funcionalidades:
- Listagem paginada de transações
- Filtros avançados (período, categoria, valor, portador)
- Exportação para PDF e Excel
- Busca por texto

#### 3. AuditDashboard (Dashboard de Auditoria)
**Arquivo**: `src/pages/AuditDashboard.tsx`

Componentes:
- `AuditStats`: Estatísticas de acesso
- `AuditActivityChart`: Gráficos de atividade
- `AuditSuspiciousAlerts`: Alertas de acessos suspeitos
- `AuditReportExport`: Exportação de relatórios

### Componentes de Alerta

#### AlertJustificationDialog
**Arquivo**: `src/components/AlertJustificationDialog.tsx`

Permite que portadores enviem justificativas para alertas, incluindo:
- Texto explicativo
- Upload de documentos comprobatórios

#### AlertJustificationReview
**Arquivo**: `src/components/AlertJustificationReview.tsx`

Permite que gestores revisem justificativas:
- Visualizar justificativa e anexos
- Aprovar ou rejeitar
- Adicionar comentários

---

## Testes de Auditoria

### Detalhamento dos 10 Testes

#### 1. Saques de Alto Valor
```javascript
// Critério: valor_transacao > 2000 AND tipo_transacao = 'SAQUE'
// Severidade: Crítico
```
Identifica saques que excedem R$ 2.000, valor considerado atípico para operações regulares.

#### 2. Múltiplas Transações Diárias
```javascript
// Critério: COUNT(*) > 5 por dia por portador
// Severidade: Médio
```
Detecta quando um portador realiza mais de 5 transações no mesmo dia.

#### 3. Transações em Finais de Semana
```javascript
// Critério: dia_semana IN (0, 6) AND valor > 500
// Severidade: Médio
```
Identifica transações significativas realizadas em sábados ou domingos.

#### 4. Fracionamento Suspeito
```javascript
// Critério: Múltiplas transações sequenciais com valores similares
// Severidade: Crítico
```
Detecta possível fracionamento para evitar limites de aprovação.

#### 5. Concentração de Fornecedor
```javascript
// Critério: Volume alto em único CNPJ/CPF favorecido
// Severidade: Médio
```
Identifica concentração excessiva de gastos em um único fornecedor.

#### 6. Portadores Inativos
```javascript
// Critério: Transação de portador sem atividade nos últimos 90 dias
// Severidade: Médio
```
Detecta uso de cartões que estavam inativos.

#### 7. Anomalia Lei de Benford
```javascript
// Critério: Distribuição de primeiros dígitos fora do esperado
// Severidade: Médio
```
Aplica análise estatística baseada na Lei de Benford para detectar manipulação.

#### 8. Anomalia Geográfica
```javascript
// Critério: Transações em locais distantes em curto período
// Severidade: Crítico
```
Identifica impossibilidade física de deslocamento entre transações.

#### 9. Frequência em Estabelecimentos
```javascript
// Critério: Padrão de uso repetitivo suspeito
// Severidade: Médio
```
Detecta uso frequente e padronizado em estabelecimentos específicos.

#### 10. Auditoria de Acesso
```javascript
// Registro: user_id, timestamp, ip_address, user_agent, action
// Severidade: Info
```
Registra todos os acessos a dados sensíveis para rastreabilidade.

---

## Fluxos de Trabalho

### Fluxo de Importação de Transações

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ Upload CSV  │ ──► │ Edge Function    │ ──► │ Validação       │
│             │     │ import-transactions│    │ de Campos       │
└─────────────┘     └──────────────────┘     └─────────────────┘
                                                      │
                                                      ▼
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ Relatório   │ ◄── │ Inserção em      │ ◄── │ Processamento   │
│ de Status   │     │ Lotes (1000)     │     │ de Registros    │
└─────────────┘     └──────────────────┘     └─────────────────┘
```

### Fluxo de Detecção de Anomalias

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ Trigger     │ ──► │ Edge Function    │ ──► │ Execução dos    │
│ Manual/Auto │     │ detect-anomalies │     │ 10 Testes       │
└─────────────┘     └──────────────────┘     └─────────────────┘
                                                      │
                                                      ▼
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ Dashboard   │ ◄── │ Inserção na      │ ◄── │ Classificação   │
│ Atualizado  │     │ Tabela alerts    │     │ por Severidade  │
└─────────────┘     └──────────────────┘     └─────────────────┘
```

### Fluxo de Justificativas

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ Alerta      │ ──► │ Portador Envia   │ ──► │ Justificativa   │
│ Gerado      │     │ Justificativa    │     │ Registrada      │
└─────────────┘     └──────────────────┘     └─────────────────┘
                                                      │
                                                      ▼
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ Alerta      │ ◄── │ Gestor Aprova/   │ ◄── │ Gestor Revisa   │
│ Atualizado  │     │ Rejeita          │     │ Documentação    │
└─────────────┘     └──────────────────┘     └─────────────────┘
```

---

## Banco de Dados

### Diagrama de Entidades

```
┌─────────────────┐       ┌─────────────────┐
│   transactions  │       │     alerts      │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │◄──────│ transaction_id  │
│ cpf_portador    │       │ id (PK)         │
│ nome_portador   │       │ alert_type      │
│ data_transacao  │       │ severity        │
│ valor_transacao │       │ status          │
│ tipo_transacao  │       │ card_holder     │
│ categoria       │       │ amount          │
│ nome_favorecido │       └────────┬────────┘
│ location        │                │
└─────────────────┘                │
                                   │
┌─────────────────┐                │
│alert_justifications│◄────────────┘
├─────────────────┤
│ id (PK)         │
│ alert_id (FK)   │
│ justification_text│
│ approval_status │
│ submitted_by    │
│ reviewed_by     │
└────────┬────────┘
         │
         │
┌────────▼────────┐       ┌─────────────────┐
│alert_attachments│       │   audit_logs    │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │
│ justification_id│       │ user_id         │
│ file_name       │       │ action          │
│ file_url        │       │ table_name      │
│ file_size       │       │ ip_address      │
└─────────────────┘       │ user_agent      │
                          │ created_at      │
                          └─────────────────┘

┌─────────────────┐       ┌─────────────────┐
│    profiles     │       │   user_roles    │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │
│ full_name       │       │ user_id (FK)    │
│ created_at      │       │ role            │
│ updated_at      │       │ created_at      │
└─────────────────┘       └─────────────────┘
```

### Índices de Performance

```sql
-- Índices criados para otimização de consultas
CREATE INDEX idx_transactions_cpf ON transactions(cpf_portador);
CREATE INDEX idx_transactions_data ON transactions(data_transacao);
CREATE INDEX idx_transactions_valor ON transactions(valor_transacao);
CREATE INDEX idx_transactions_periodo ON transactions(mes_extrato, ano_extrato);
CREATE INDEX idx_transactions_categoria ON transactions(categoria);
```

---

## Segurança

### Row Level Security (RLS)

Todas as tabelas possuem RLS habilitado com políticas específicas:

```sql
-- Exemplo: Política para tabela transactions
CREATE POLICY "Usuários autenticados podem visualizar transações"
ON transactions FOR SELECT
TO authenticated
USING (true);

-- Exemplo: Política para tabela audit_logs
CREATE POLICY "Apenas auditores podem ver logs"
ON audit_logs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('auditor', 'admin')
  )
);
```

### Controle de Acesso (RBAC)

| Recurso | Admin | Auditor | RH |
|---------|-------|---------|-----|
| Importar CSV | ✅ | ✅ | ❌ |
| Detectar Anomalias | ✅ | ✅ | ❌ |
| Ver Transações | ✅ | ✅ | ✅ |
| Ver Alertas | ✅ | ✅ | ✅ |
| Aprovar Justificativas | ✅ | ✅ | ✅ |
| Dashboard Auditoria | ✅ | ✅ | ❌ |
| Exportar Relatórios | ✅ | ✅ | ✅ |
| Ver Logs de Acesso | ✅ | ✅ | ❌ |

---

## API e Edge Functions

### import-transactions

**Endpoint**: `POST /functions/v1/import-transactions`

**Payload**:
```json
{
  "csvData": "string (conteúdo do CSV)"
}
```

**Resposta**:
```json
{
  "success": true,
  "message": "Importação concluída",
  "stats": {
    "total": 1000,
    "imported": 985,
    "errors": 10,
    "skipped": 5
  }
}
```

### detect-anomalies

**Endpoint**: `POST /functions/v1/detect-anomalies`

**Payload**: Nenhum (usa dados do banco)

**Resposta**:
```json
{
  "success": true,
  "alertsCreated": 25,
  "tests": {
    "highValueWithdrawals": 5,
    "multipleDaily": 8,
    "weekendTransactions": 12
  }
}
```

### log-audit

**Endpoint**: `POST /functions/v1/log-audit`

**Payload**:
```json
{
  "action": "VIEW",
  "table_name": "transactions",
  "record_id": "optional-uuid"
}
```

---

## Guia de Instalação

### Pré-requisitos

- Node.js 18+
- npm ou bun
- Conta no Supabase

### Passos

1. **Clone o repositório**
```bash
git clone <url-do-repositorio>
cd <nome-do-projeto>
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
# O projeto já está configurado com o Supabase
# As credenciais estão em src/integrations/supabase/client.ts
```

4. **Execute o projeto**
```bash
npm run dev
```

5. **Acesse no navegador**
```
http://localhost:5173
```

---

## Troubleshooting

### Problemas Comuns

#### Erro ao importar CSV
- **Causa**: Formato do arquivo incorreto
- **Solução**: Verifique se o delimitador é ponto-e-vírgula (;) e o encoding é UTF-8

#### Detecção de anomalias não funciona
- **Causa**: Falta de autenticação ou permissão
- **Solução**: Verifique se está logado com perfil Auditor ou Admin

#### Gráficos não aparecem
- **Causa**: Dados insuficientes na tabela audit_logs
- **Solução**: Navegue pelo sistema para gerar logs de acesso

#### Erro de RLS
- **Causa**: Política de segurança bloqueando acesso
- **Solução**: Verifique se o usuário tem o role correto na tabela user_roles

### Logs e Debug

Para visualizar logs das Edge Functions:
1. Acesse o painel do Supabase
2. Vá em Functions → Logs
3. Filtre pela função desejada

---

## Contato e Suporte

**Disciplina**: Auditoria de Sistemas  
**Curso**: Sistemas de Informação  
**Ano**: 2025

---

*Documentação gerada para fins acadêmicos.*
