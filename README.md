# 🍰 DoceControl ERP — Sistema de Gestão para Confeitarias e Docerias

O **DoceControl ERP** é uma plataforma completa e moderna desenvolvida especificamente para as operações reais do varejo alimentício e confeitarias artesanais. O sistema centraliza catálogo mestre, controle atômico de estoque com prevenção de saldo negativo, ordens de produção com baixa proporcional de insumos, gestão de pedidos multicanal (iFood, 99Food, WhatsApp, Loja Virtual e PDV Balcão), DRE financeira operacional e um módulo interativo de comandos via WhatsApp Business.

---

## 🌟 O Coração do Sistema: Central de Operações

A **Central de Operações** foi concebida para que a liderança da confeitaria obtenha em uma única tela as respostas em tempo real para as **cinco perguntas fundamentais**:

1. **O que está funcionando?**  
   Painel de integridade de canais (iFood, 99Food, Loja Virtual, PDV, WhatsApp), impressora térmica de comandas, webhooks e latência de rede.
2. **Quais produtos estão acabando?**  
   Itens abaixo do estoque mínimo de segurança com cálculo de déficit e botão direto de "Produzir Receita".
3. **Quais pedidos estão atrasados?**  
   Monitoramento em tempo real do SLA de preparo e entrega, contagem regressiva de minutos excedidos e botões rápidos para avançar status ("Pronto" ou "Concluir").
4. **Quais plataformas ainda não sincronizaram?**  
   Fila de retentativas assíncronas com tratamento de rate-limits, mensagens claras de erro e botão de **Reprocessar com 1 Clique**.
5. **O que precisa da minha atenção agora?**  
   Feed inteligente priorizado contendo lotes próximos da validade (< 3 dias), pedidos recebidos aguardando aceite e alertas críticos.

---

## 🛠️ Stack Tecnológica

- **Framework Web**: Next.js 14 com App Router e TypeScript
- **Estilização**: Tailwind CSS com paleta especializada para confeitaria e componentes de alta legibilidade (sem dependência exclusiva de cores para estados)
- **Banco de Dados**: PostgreSQL com migrations versionadas e Row Level Security (RLS)
  - **Produção**: Supabase PostgreSQL (`@supabase/supabase-js`)
  - **Ambiente Local / Testes**: Motor PostgreSQL embutido (PGlite WASM) garantindo execução autônoma, transações ACID atômicas e zero mocks
- **Regras de Negócio & Serviços**: API server-side orientada a serviços (`StockService`, `OrderService`, `RecipeService`, `ProductService`, `FinancialService`, `OperationsService`)
- **Adaptadores de Integração**: Arquitetura desacoplada (`IFoodAdapter`, `NinetyNineFoodAdapter`, `LojaVirtualAdapter`, `PDVAdapter`) com fila assíncrona e backoff exponencial
- **Mensageria & Automação**: WhatsApp Business Cloud API Oficial com processador de comandos administrativos (`/estoque`, `/vendas`, `/desativar`) e adaptador Evolution API
- **Testes Automatizados**: Suíte completa com Vitest cobrindo concorrência, idempotência, transações e validações Zod

---

## 📂 Estrutura do Projeto

```
ERPDOCERIA/
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql    # 22 tabelas relacionais completas
│       ├── 002_rls_and_policies.sql  # Row Level Security por organização
│       └── 003_seed_demo.sql         # Dados reais de demonstração da confeitaria
├── src/
│   ├── app/
│   │   ├── api/                      # 14 endpoints REST server-side
│   │   │   ├── operations-center/    # Dados das 5 perguntas operacionais
│   │   │   ├── products/             # CRUD e override por canal
│   │   │   ├── stock/movements/      # Movimentações atômicas de estoque
│   │   │   ├── orders/               # Criação, reserva e máquina de estados
│   │   │   ├── recipes/              # Fichas técnicas e produção de lotes
│   │   │   ├── financial/            # DRE, taxas de canal e transações
│   │   │   ├── whatsapp/             # Webhook Meta e envio de mensagens
│   │   │   ├── integrations/         # Fila e reprocessamento com 1 clique
│   │   │   ├── reports/export/       # Exportação CSV auditável
│   │   │   └── customers/            # CRM e anonimização LGPD
│   │   ├── operacoes/                # Tela Central de Operações
│   │   ├── pedidos/                  # Gestão de pedidos e kanban de cozinha
│   │   ├── produtos/                 # Catálogo mestre
│   │   ├── estoque/                  # Controle físico e extrato
│   │   ├── producao/                 # Produção e rastreabilidade de lotes
│   │   ├── clientes/                 # CRM e governança LGPD
│   │   ├── financeiro/               # DRE e fluxo de caixa
│   │   ├── whatsapp/                 # Simulador e comandos do bot
│   │   ├── integracoes/              # Monitoramento de marketplaces
│   │   ├── relatorios/               # Relatórios e downloads CSV
│   │   ├── configuracoes/            # Parâmetros e RBAC
│   │   ├── layout.tsx                # Layout principal com sidebar e header
│   │   └── page.tsx                  # Visão Geral (Dashboard)
│   ├── lib/
│   │   ├── db/                       # Cliente PostgreSQL unificado e migrations
│   │   ├── services/                 # Serviços de negócio atômicos
│   │   ├── integrations/             # Adaptadores iFood, 99Food, PDV e Fila
│   │   └── whatsapp/                 # Cliente Cloud API e Bot
│   └── tests/                        # Testes unitários e de integração
└── package.json
```

---

## 🚀 Como Executar Localmente

### 1. Clonar e Instalar Dependências
```bash
git clone https://github.com/gustavosofttek01-art/ERPDOCERIA.git
cd ERPDOCERIA
npm install
```

### 2. Configurar Variáveis de Ambiente
Copie o arquivo de exemplo:
```bash
cp .env.example .env.local
```
*Em ambiente de desenvolvimento local, o sistema roda imediatamente sem necessidade de credenciais externas, utilizando o PostgreSQL embutido com dados de demonstração da confeitaria.*

### 3. Rodar Testes Automatizados
```bash
npm test
```
Executa a suíte de 13 testes cobrindo:
- Bloqueio de estoque negativo e idempotência
- Máquina de estados de pedidos e estorno rastreável de cancelamentos
- Consumo atômico de insumos na produção de receitas e cálculo de validade
- Comandos administrativos em tempo real do WhatsApp
- Fila de retentativas com backoff de integrações

### 4. Iniciar Servidor de Desenvolvimento
```bash
npm run dev
```
Acesse `http://localhost:3000` no seu navegador.

### 5. Build para Produção
```bash
npm run build
npm start
```

---

## 🔒 Segurança, LGPD e Governança

- **Isolamento Organizacional**: Todas as tabelas possuem `organization_id` e políticas RLS prontas para o Supabase.
- **Prevenção de Duplicidade**: Índices únicos em `idempotency_key` e `(channel_id, external_id)` para impedir vendas duplicadas ou débitos repetidos.
- **LGPD**: Rotas e telas de controle de dados pessoais com recurso de anonimização com 1 clique (`Cliente Anonimizado (LGPD)`).
- **Controle de Acesso Baseado em Funções (RBAC)**: Perfis segregados para `admin`, `gerente`, `confeiteiro` e `atendente`.
- **Trilha de Auditoria**: Registro imutável em `audit_logs` para alterações de preço, desativação de itens e cancelamento de pedidos.
