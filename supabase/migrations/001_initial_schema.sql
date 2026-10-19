-- ====================================================================
-- DoceControl ERP - Migração Inicial do Banco de Dados
-- PostgreSQL / Supabase Schema Completo
-- ====================================================================

-- 1. Organizações (Tenancy / Unidade da Doceria)
CREATE TABLE IF NOT EXISTS organizations (
    id TEXT PRIMARY KEY DEFAULT 'org_default',
    name TEXT NOT NULL,
    trade_name TEXT,
    document TEXT, -- CNPJ
    phone TEXT,
    email TEXT,
    address JSONB,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Usuários e Permissões
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'gerente', 'confeiteiro', 'atendente')),
    phone TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Categorias de Produtos
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    sort_order INT DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Produtos Acabados e Itens de Venda
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
    sku TEXT UNIQUE NOT NULL,
    barcode TEXT,
    name TEXT NOT NULL,
    description TEXT,
    unit TEXT NOT NULL DEFAULT 'un' CHECK (unit IN ('un', 'kg', 'g', 'cento', 'fatia', 'caixa')),
    sale_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    cost_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    min_stock NUMERIC(10, 2) NOT NULL DEFAULT 5.00,
    current_stock NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    reserved_stock NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    allow_negative_stock BOOLEAN DEFAULT FALSE,
    is_produced BOOLEAN DEFAULT TRUE,
    active BOOLEAN DEFAULT TRUE,
    image_url TEXT,
    shelf_life_days INT DEFAULT 5,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_org_sku ON products(organization_id, sku);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);

-- 5. Canais de Venda e Integrações
CREATE TABLE IF NOT EXISTS channels (
    id TEXT PRIMARY KEY, -- 'loja_virtual', 'ifood', '99food', 'pdv', 'whatsapp'
    display_name TEXT NOT NULL,
    platform_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'desconectado' CHECK (status IN ('conectado', 'desconectado', 'em_homologacao', 'erro')),
    config_json JSONB DEFAULT '{}'::jsonb,
    auto_sync_stock BOOLEAN DEFAULT TRUE,
    auto_sync_price BOOLEAN DEFAULT TRUE,
    auto_accept_orders BOOLEAN DEFAULT FALSE,
    last_sync_at TIMESTAMPTZ,
    last_error TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6. Preços e Disponibilidade Específicos por Canal
CREATE TABLE IF NOT EXISTS channel_product_overrides (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    channel_id TEXT NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    price_override NUMERIC(10, 2),
    is_available BOOLEAN DEFAULT TRUE,
    external_id TEXT,
    external_sku TEXT,
    sync_status TEXT NOT NULL DEFAULT 'pendente' CHECK (sync_status IN ('sincronizado', 'pendente', 'falhou', 'nao_suportado')),
    last_sync_at TIMESTAMPTZ,
    last_error TEXT,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, channel_id)
);

-- 7. Histórico de Alterações de Produtos
CREATE TABLE IF NOT EXISTS product_history (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES users(id),
    field_changed TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 8. Ingredientes / Matérias-Primas (Insumos da Confeitaria)
CREATE TABLE IF NOT EXISTS ingredients (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    sku TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    unit TEXT NOT NULL DEFAULT 'kg' CHECK (unit IN ('kg', 'g', 'l', 'ml', 'un')),
    cost_per_unit NUMERIC(10, 4) NOT NULL DEFAULT 0.0000,
    current_stock NUMERIC(10, 3) NOT NULL DEFAULT 0.000,
    min_stock NUMERIC(10, 3) NOT NULL DEFAULT 2.000,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 9. Receitas / Fichas Técnicas
CREATE TABLE IF NOT EXISTS recipes (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    yield_quantity NUMERIC(10, 2) NOT NULL DEFAULT 1.00,
    yield_unit TEXT NOT NULL DEFAULT 'un',
    preparation_time_minutes INT DEFAULT 45,
    batch_cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    unit_cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    packaging_cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    instructions TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 10. Itens da Receita (Ingredientes e Quantidades)
CREATE TABLE IF NOT EXISTS recipe_items (
    id TEXT PRIMARY KEY,
    recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    ingredient_id TEXT NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
    quantity NUMERIC(10, 4) NOT NULL,
    unit TEXT NOT NULL
);

-- 11. Lotes e Rastreabilidade
CREATE TABLE IF NOT EXISTS lots (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    lot_number TEXT NOT NULL,
    manufactured_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    initial_quantity NUMERIC(10, 2) NOT NULL,
    current_quantity NUMERIC(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'valido' CHECK (status IN ('valido', 'alerta_vencimento', 'vencido', 'esgotado')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 12. Ordens de Produção
CREATE TABLE IF NOT EXISTS production_orders (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    recipe_id TEXT NOT NULL REFERENCES recipes(id),
    product_id TEXT NOT NULL REFERENCES products(id),
    lot_id TEXT REFERENCES lots(id),
    batch_count NUMERIC(10, 2) NOT NULL DEFAULT 1.00,
    planned_quantity NUMERIC(10, 2) NOT NULL,
    produced_quantity NUMERIC(10, 2) NOT NULL,
    loss_quantity NUMERIC(10, 2) DEFAULT 0.00,
    loss_reason TEXT,
    total_cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    unit_cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'concluido' CHECK (status IN ('concluido', 'cancelado')),
    notes TEXT,
    created_by TEXT REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 13. Movimentações de Estoque
CREATE TABLE IF NOT EXISTS inventory_movements (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
    ingredient_id TEXT REFERENCES ingredients(id) ON DELETE CASCADE,
    movement_type TEXT NOT NULL CHECK (movement_type IN ('entrada', 'saida', 'reserva', 'venda', 'perda', 'ajuste', 'devolucao', 'inventario')),
    quantity NUMERIC(10, 3) NOT NULL,
    previous_stock NUMERIC(10, 3) NOT NULL,
    new_stock NUMERIC(10, 3) NOT NULL,
    reason TEXT NOT NULL,
    reference_id TEXT,
    user_id TEXT REFERENCES users(id),
    idempotency_key TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_movements_prod ON inventory_movements(product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_movements_ingr ON inventory_movements(ingredient_id, created_at DESC);

-- 14. Clientes (CRM com LGPD)
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address JSONB,
    notes TEXT,
    total_orders INT DEFAULT 0,
    total_spent NUMERIC(10, 2) DEFAULT 0.00,
    lgpd_consent BOOLEAN DEFAULT TRUE,
    anonymized BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 15. Pedidos Centralizados
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    channel_id TEXT NOT NULL REFERENCES channels(id),
    external_id TEXT,
    order_number TEXT NOT NULL,
    customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    delivery_type TEXT NOT NULL DEFAULT 'balcao' CHECK (delivery_type IN ('retirada', 'delivery', 'balcao')),
    delivery_address JSONB,
    subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    discount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    marketplace_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    estimated_cmv NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    estimated_net_profit NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'recebido' CHECK (status IN ('recebido', 'confirmado', 'em_preparo', 'pronto', 'enviado', 'concluido', 'cancelado')),
    payment_method TEXT NOT NULL DEFAULT 'dinheiro' CHECK (payment_method IN ('pix', 'cartao_credito', 'cartao_debito', 'dinheiro', 'marketplace', 'faturado')),
    payment_status TEXT NOT NULL DEFAULT 'pendente' CHECK (payment_status IN ('pendente', 'aprovado', 'estornado', 'falhou')),
    preparation_time_minutes INT DEFAULT 20,
    deadline_at TIMESTAMPTZ,
    cancelled_reason TEXT,
    idempotency_key TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(channel_id, external_id)
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);

-- 16. Itens de Pedidos
CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL REFERENCES products(id),
    product_name TEXT NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    cost_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_price NUMERIC(10, 2) NOT NULL,
    notes TEXT
);

-- 17. Transações Financeiras
CREATE TABLE IF NOT EXISTS financial_transactions (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    order_id TEXT REFERENCES orders(id) ON DELETE SET NULL,
    channel_id TEXT REFERENCES channels(id),
    type TEXT NOT NULL CHECK (type IN ('receita', 'despesa')),
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    gross_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    fee_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    net_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    payment_method TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pago' CHECK (status IN ('pago', 'pendente', 'cancelado')),
    due_date DATE DEFAULT CURRENT_DATE,
    paid_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fin_type_date ON financial_transactions(type, due_date DESC);

-- 18. Fila de Sincronização e Tarefas Assíncronas
CREATE TABLE IF NOT EXISTS integration_queue (
    id TEXT PRIMARY KEY,
    channel_id TEXT NOT NULL REFERENCES channels(id),
    task_type TEXT NOT NULL CHECK (task_type IN ('sync_product', 'sync_stock', 'sync_price', 'sync_status', 'fetch_orders')),
    payload JSONB NOT NULL,
    idempotency_key TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'processando', 'concluido', 'falhou')),
    attempts INT DEFAULT 0,
    max_attempts INT DEFAULT 5,
    next_retry_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    last_error TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 19. Logs de Sincronização de Integrações
CREATE TABLE IF NOT EXISTS integration_sync_logs (
    id TEXT PRIMARY KEY,
    channel_id TEXT NOT NULL REFERENCES channels(id),
    event_type TEXT NOT NULL,
    entity_id TEXT,
    status TEXT NOT NULL CHECK (status IN ('sincronizado', 'pendente', 'falhou', 'nao_suportado')),
    payload JSONB,
    response JSONB,
    retry_count INT DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sync_logs_channel ON integration_sync_logs(channel_id, created_at DESC);

-- 20. Mensagens do WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    channel_type TEXT NOT NULL CHECK (channel_type IN ('official_cloud', 'evolution')),
    recipient_or_sender TEXT NOT NULL,
    message_type TEXT NOT NULL DEFAULT 'text',
    content TEXT NOT NULL,
    command_executed TEXT,
    status TEXT NOT NULL DEFAULT 'enviado' CHECK (status IN ('recebido', 'enviado', 'entregue', 'lido', 'falhou')),
    external_id TEXT,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wa_created ON whatsapp_messages(created_at DESC);

-- 21. Logs de Auditoria
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id TEXT,
    user_name TEXT,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id TEXT,
    old_values JSONB,
    new_values JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);

-- 22. Notificações do Sistema
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('alerta_estoque', 'pedido_atrasado', 'validade_proxima', 'falha_sincronizacao', 'novo_pedido')),
    priority TEXT NOT NULL DEFAULT 'media' CHECK (priority IN ('baixa', 'media', 'alta', 'critica')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notif_unread ON notifications(read, priority, created_at DESC);
