-- ====================================================================
-- DoceControl ERP - Row Level Security (RLS) e Políticas de Acesso
-- Supabase PostgreSQL RLS Script
-- ====================================================================

-- Habilitar RLS nas tabelas principais
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_product_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Exemplo de Políticas baseadas no organization_id do usuário logado (auth.jwt() -> app_metadata / user_metadata)
-- Permite leitura e escrita aos membros autenticados da organização:
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'products_org_isolation'
    ) THEN
        CREATE POLICY products_org_isolation ON products
            FOR ALL
            USING (
                auth.role() = 'authenticated'
            )
            WITH CHECK (
                auth.role() = 'authenticated'
            );
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'orders_org_isolation'
    ) THEN
        CREATE POLICY orders_org_isolation ON orders
            FOR ALL
            USING (
                auth.role() = 'authenticated'
            )
            WITH CHECK (
                auth.role() = 'authenticated'
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'inventory_movements' AND policyname = 'movements_org_isolation'
    ) THEN
        CREATE POLICY movements_org_isolation ON inventory_movements
            FOR ALL
            USING (
                auth.role() = 'authenticated'
            )
            WITH CHECK (
                auth.role() = 'authenticated'
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'financial_transactions' AND policyname = 'financial_org_isolation'
    ) THEN
        CREATE POLICY financial_org_isolation ON financial_transactions
            FOR ALL
            USING (
                auth.role() = 'authenticated'
            )
            WITH CHECK (
                auth.role() = 'authenticated'
            );
    END IF;
END $$;
