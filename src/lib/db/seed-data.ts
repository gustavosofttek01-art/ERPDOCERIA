import { PGlite } from '@electric-sql/pglite';

export async function SEED_DEMO_DATA(db: PGlite) {
  // Check if organization exists
  const check = await db.query('SELECT COUNT(*) as count FROM organizations;');
  const count = Number((check.rows[0] as any)?.count || 0);
  if (count > 0) {
    return; // Already seeded
  }

  console.log('Seeding initial DoceControl ERP database...');

  await db.exec(`
    -- 1. Organization
    INSERT INTO organizations (id, name, trade_name, document, phone, email, address, settings)
    VALUES (
      'org_default',
      'Doce Arte Confeitaria Artesanal Ltda',
      'Doce Arte Confeitaria & Café',
      '12.345.678/0001-90',
      '(62) 3942-8800',
      'contato@docearteconfeitaria.com.br',
      '{"street": "Rua 9, Setor Marista", "number": "412", "city": "Goiânia", "state": "GO", "zip": "74150-130"}'::jsonb,
      '{"currency": "BRL", "timezone": "America/Sao_Paulo", "negative_stock_allowed": false}'::jsonb
    );

    -- 2. Users
    INSERT INTO users (id, organization_id, name, email, password_hash, role, phone, active)
    VALUES
      ('usr_admin', 'org_default', 'Mariana Silva', 'mariana@docecontrol.com.br', 'hash_mariana_admin', 'admin', '(62) 98111-2233', true),
      ('usr_gerente', 'org_default', 'Carlos Eduardo', 'carlos@docecontrol.com.br', 'hash_carlos_gerente', 'gerente', '(62) 98222-3344', true),
      ('usr_confeiteira', 'org_default', 'Beatriz Lima', 'beatriz@docecontrol.com.br', 'hash_beatriz_chefe', 'confeiteiro', '(62) 98333-4455', true),
      ('usr_atendente', 'org_default', 'Lucas Fernandes', 'lucas@docecontrol.com.br', 'hash_lucas_atend', 'atendente', '(62) 98444-5566', true);

    -- 3. Channels
    INSERT INTO channels (id, display_name, platform_type, status, config_json, auto_sync_stock, auto_sync_price, last_sync_at)
    VALUES
      ('loja_virtual', 'Loja Virtual Oficial', 'e-commerce', 'conectado', '{"webhook_enabled": true, "domain": "loja.docearte.com.br"}'::jsonb, true, true, CURRENT_TIMESTAMP),
      ('ifood', 'iFood Restaurante & Doceria', 'ifood', 'conectado', '{"merchant_id": "ifood_merchant_7821", "catalog_synced": true}'::jsonb, true, true, CURRENT_TIMESTAMP - interval '10 minutes'),
      ('99food', '99Food Delivery', '99food', 'conectado', '{"shop_id": "nnfood_9982", "sync_errors_count": 1}'::jsonb, true, false, CURRENT_TIMESTAMP - interval '45 minutes'),
      ('pdv', 'PDV Balcão Caixa 1', 'pdv', 'conectado', '{"printer_thermal": "Epson TM-T20X", "offline_buffer": true}'::jsonb, true, true, CURRENT_TIMESTAMP),
      ('whatsapp', 'WhatsApp Business Oficial', 'whatsapp', 'conectado', '{"phone_number": "+5562981112233", "verified": true}'::jsonb, false, false, CURRENT_TIMESTAMP);

    -- 4. Categories
    INSERT INTO categories (id, organization_id, name, slug, description, sort_order, active)
    VALUES
      ('cat_brigadeiros', 'org_default', 'Brigadeiros & Docinhos Gourmet', 'brigadeiros-docinhos', 'Doces finos enrolados na mão e finalizados na hora', 1, true),
      ('cat_bolos', 'org_default', 'Bolos & Tortas Artesanais', 'bolos-tortas', 'Bolos vulcão caseiros e tortas confeitadas', 2, true),
      ('cat_trufas', 'org_default', 'Trufas & Chocolates Belgas', 'trufas-chocolates', 'Bombons artesanais e barras temperadas', 3, true),
      ('cat_potes', 'org_default', 'Sobremesas & Bolos de Pote', 'sobremesas-potes', 'Sobremesas individuais prontas para delivery', 4, true),
      ('cat_cafes', 'org_default', 'Cafeteria & Bebidas', 'cafeteria-bebidas', 'Cafés especiais, cappuccinos e chás gelados', 5, true);

    -- 5. Products
    INSERT INTO products (
      id, organization_id, category_id, sku, barcode, name, description, unit,
      sale_price, cost_price, min_stock, current_stock, reserved_stock, allow_negative_stock,
      is_produced, active, shelf_life_days
    )
    VALUES
      ('prd_brig_pist', 'org_default', 'cat_brigadeiros', 'BRIG-PIST-01', '789100010001', 'Brigadeiro Gourmet de Pistache Puro', 'Feito com pasta de pistache italiana 100% pura e granulado crocante', 'un', 6.50, 2.20, 15.00, 48.00, 4.00, false, true, true, 7),
      ('prd_brig_belg', 'org_default', 'cat_brigadeiros', 'BRIG-BELG-01', '789100010002', 'Brigadeiro Belga 54% Callebaut', 'Clássico brigadeiro de chocolate amargo 54% com splits de chocolate belga', 'un', 5.00, 1.50, 20.00, 65.00, 0.00, false, true, true, 7),
      ('prd_bolo_cen', 'org_default', 'cat_bolos', 'BOLO-CEN-01', '789100010003', 'Bolo Caseiro Vulcão de Cenoura com Brigadeiro', 'Bolo fofinho de cenoura com piscina de brigadeiro cremoso (Serve 8 fatias)', 'un', 48.00, 16.50, 3.00, 6.00, 1.00, false, true, true, 4),
      ('prd_torta_lim', 'org_default', 'cat_bolos', 'TORTA-LIM-01', '789100010004', 'Torta Fina de Limão Siciliano com Merengue', 'Massa sablée crocante, curd de limão siciliano e merengue tostado', 'fatia', 18.50, 6.10, 5.00, 12.00, 0.00, false, true, true, 3),
      ('prd_trufa_mar', 'org_default', 'cat_trufas', 'TRUFA-MAR-01', '789100010005', 'Trufa Artesanal de Maracujá Fresco', 'Ganache branca infusionada com maracujá fresco coberta com chocolate 54%', 'un', 7.00, 2.10, 10.00, 35.00, 0.00, false, true, true, 10),
      ('prd_pote_red', 'org_default', 'cat_potes', 'POTE-RED-01', '789100010006', 'Bolo de Pote Red Velvet Especial 250g', 'Camadas de massa aveludada vermelha e autêntico creme de cream cheese', 'un', 18.00, 6.20, 8.00, 2.00, 0.00, false, true, true, 4),
      ('prd_pudim_van', 'org_default', 'cat_potes', 'PUDIM-VAN-01', '789100010007', 'Mini Pudim Fava de Baunilha 180g', 'Sem furinhos, calda de caramelo brilhante e fava de baunilha de Madagascar', 'un', 14.00, 4.30, 6.00, 5.00, 0.00, false, true, true, 5),
      ('prd_cafe_cap', 'org_default', 'cat_cafes', 'CAFE-CAP-01', '789100010008', 'Cappuccino Cremoso Italiano 200ml', 'Espresso duplo, leite vaporizado cremoso, canela e raspas de cacau belga', 'un', 12.00, 3.10, 10.00, 100.00, 0.00, false, false, true, 1);

    -- 6. Channel Product Overrides
    INSERT INTO channel_product_overrides (id, product_id, channel_id, price_override, is_available, external_id, external_sku, sync_status, last_sync_at)
    VALUES
      ('cpo_1', 'prd_brig_pist', 'ifood', 7.50, true, 'ifood_prod_01', 'BRIG-PIST-01', 'sincronizado', CURRENT_TIMESTAMP),
      ('cpo_2', 'prd_brig_pist', '99food', 7.50, true, 'nn_prod_01', 'BRIG-PIST-01', 'sincronizado', CURRENT_TIMESTAMP),
      ('cpo_3', 'prd_pote_red', 'ifood', 21.00, true, 'ifood_prod_06', 'POTE-RED-01', 'sincronizado', CURRENT_TIMESTAMP),
      ('cpo_4', 'prd_pote_red', '99food', 21.00, true, 'nn_prod_06', 'POTE-RED-01', 'falhou', CURRENT_TIMESTAMP - interval '30 minutes'),
      ('cpo_5', 'prd_bolo_cen', 'ifood', 55.00, true, 'ifood_prod_03', 'BOLO-CEN-01', 'sincronizado', CURRENT_TIMESTAMP);

    -- 7. Insumos / Ingredientes
    INSERT INTO ingredients (id, organization_id, sku, name, unit, cost_per_unit, current_stock, min_stock)
    VALUES
      ('ing_leite_cond', 'org_default', 'INS-LT-COND', 'Leite Condensado Moça Integral 395g', 'un', 6.80, 85.00, 24.00),
      ('ing_creme_leite', 'org_default', 'INS-CRM-LEIT', 'Creme de Leite Fresco Pasteurizado', 'l', 14.50, 20.00, 10.00),
      ('ing_choc_belga', 'org_default', 'INS-CHOC-BELG', 'Chocolate Callebaut 54.5% Gotas', 'kg', 78.00, 18.50, 5.00),
      ('ing_pasta_pist', 'org_default', 'INS-PST-PIST', 'Pasta Pura de Pistache Siciliano 100%', 'kg', 220.00, 3.20, 1.00),
      ('ing_farinha', 'org_default', 'INS-FAR-ESP', 'Farinha de Trigo Especial Orgânica', 'kg', 5.50, 40.00, 15.00),
      ('ing_cenoura', 'org_default', 'INS-CEN-ORG', 'Cenouras Selecionadas Orgânicas', 'kg', 4.80, 15.00, 5.00),
      ('ing_cream_cheese', 'org_default', 'INS-CRM-CHS', 'Queijo Cream Cheese Tradicional', 'kg', 38.00, 6.00, 4.00),
      ('ing_emb_pote', 'org_default', 'INS-EMB-POT', 'Pote Cristal Descartável 250ml com Tampa', 'un', 0.85, 120.00, 50.00);

    -- 8. Receitas
    INSERT INTO recipes (id, organization_id, product_id, name, yield_quantity, yield_unit, preparation_time_minutes, batch_cost, unit_cost, packaging_cost, instructions, active)
    VALUES
      (
        'rcp_brig_pist', 'org_default', 'prd_brig_pist', 'Receita Mestre - Brigadeiro de Pistache (Lote 50 un)',
        50.00, 'un', 45, 58.00, 1.16, 0.40,
        '1. Misturar leite condensado, creme de leite e pasta de pistache em fogo brando. 2. Ponto de brigadeiro de enrolar. 3. Bolear em 20g e cobrir.',
        true
      ),
      (
        'rcp_bolo_cen', 'org_default', 'prd_bolo_cen', 'Bolo Caseiro Vulcão de Cenoura (Lote 4 bolos)',
        4.00, 'un', 70, 66.00, 16.50, 2.50,
        '1. Bater cenouras, ovos e óleo no liquidificador. 2. Incorporar secos delicadamente. 3. Assar a 180C por 35 min. 4. Cobrir com brigadeiro vulcão.',
        true
      );

    -- 9. Itens da Receita
    INSERT INTO recipe_items (id, recipe_id, ingredient_id, quantity, unit)
    VALUES
      ('rcp_it_1', 'rcp_brig_pist', 'ing_leite_cond', 2.00, 'un'),
      ('rcp_it_2', 'rcp_brig_pist', 'ing_creme_leite', 0.40, 'l'),
      ('rcp_it_3', 'rcp_brig_pist', 'ing_pasta_pist', 0.15, 'kg'),
      ('rcp_it_4', 'rcp_bolo_cen', 'ing_cenoura', 1.00, 'kg'),
      ('rcp_it_5', 'rcp_bolo_cen', 'ing_farinha', 0.80, 'kg'),
      ('rcp_it_6', 'rcp_bolo_cen', 'ing_leite_cond', 2.00, 'un'),
      ('rcp_it_7', 'rcp_bolo_cen', 'ing_choc_belga', 0.20, 'kg');

    -- 10. Lotes e Rastreabilidade
    INSERT INTO lots (id, organization_id, product_id, lot_number, manufactured_at, expires_at, initial_quantity, current_quantity, status)
    VALUES
      ('lot_pudim_exp', 'org_default', 'prd_pudim_van', 'LOTE-2026-PUD01', CURRENT_TIMESTAMP - interval '3 days', CURRENT_TIMESTAMP + interval '1 day 12 hours', 10.00, 5.00, 'alerta_vencimento'),
      ('lot_brig_pist', 'org_default', 'prd_brig_pist', 'LOTE-2026-PST02', CURRENT_TIMESTAMP - interval '1 day', CURRENT_TIMESTAMP + interval '6 days', 50.00, 48.00, 'valido'),
      ('lot_bolo_cen', 'org_default', 'prd_bolo_cen', 'LOTE-2026-CEN01', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + interval '3 days', 6.00, 6.00, 'valido');

    -- 11. Clientes
    INSERT INTO customers (id, organization_id, name, phone, email, address, total_orders, total_spent, lgpd_consent)
    VALUES
      ('cli_gabriel', 'org_default', 'Gabriel Santos', '(62) 99123-4567', 'gabriel.santos@gmail.com', '{"street": "Av. T-63", "number": "1200", "neighborhood": "Bueno", "city": "Goiânia"}'::jsonb, 6, 385.00, true),
      ('cli_juliana', 'org_default', 'Juliana Ribeiro', '(62) 98765-4321', 'juliana.ribeiro@hotmail.com', '{"street": "Rua 15", "number": "450", "neighborhood": "Marista", "city": "Goiânia"}'::jsonb, 2, 110.00, true),
      ('cli_fernanda', 'org_default', 'Fernanda Costa', '(62) 99888-7766', 'fernanda.costa@empresa.com.br', '{"street": "Alameda Ricardo Paranhos", "number": "780", "neighborhood": "Marista", "city": "Goiânia"}'::jsonb, 12, 1420.00, true),
      ('cli_marcelo', 'org_default', 'Marcelo Vieira', '(62) 98444-1122', 'marcelo.v@outlook.com', null, 3, 76.00, true);

    -- 12. Pedidos Centralizados
    INSERT INTO orders (
      id, organization_id, channel_id, external_id, order_number, customer_id, customer_name, customer_phone,
      delivery_type, delivery_address, subtotal, delivery_fee, discount, marketplace_fee, total_amount,
      estimated_cmv, estimated_net_profit, status, payment_method, payment_status, preparation_time_minutes,
      deadline_at, idempotency_key, created_at
    )
    VALUES
      (
        'ord_1041', 'org_default', 'ifood', 'IFD-99812', '#1041', 'cli_gabriel', 'Gabriel Santos', '(62) 99123-4567',
        'delivery', '{"street": "Av. T-63", "number": "1200", "neighborhood": "Bueno", "city": "Goiânia"}'::jsonb,
        70.00, 8.00, 0.00, 12.60, 78.00, 20.90, 44.50,
        'em_preparo', 'marketplace', 'aprovado', 25,
        CURRENT_TIMESTAMP - interval '10 minutes',
        'idemp_ord_1041', CURRENT_TIMESTAMP - interval '35 minutes'
      ),
      (
        'ord_1042', 'org_default', 'whatsapp', 'WPP-4410', '#1042', 'cli_juliana', 'Juliana Ribeiro', '(62) 98765-4321',
        'retirada', null,
        48.00, 0.00, 0.00, 0.00, 48.00, 16.50, 31.50,
        'recebido', 'pix', 'pendente', 20,
        CURRENT_TIMESTAMP + interval '15 minutes',
        'idemp_ord_1042', CURRENT_TIMESTAMP - interval '5 minutes'
      ),
      (
        'ord_1043', 'org_default', 'loja_virtual', 'ECOMM-772', '#1043', 'cli_fernanda', 'Fernanda Costa', '(62) 99888-7766',
        'delivery', '{"street": "Alameda Ricardo Paranhos", "number": "780", "neighborhood": "Marista", "city": "Goiânia"}'::jsonb,
        130.00, 12.00, 10.00, 5.20, 132.00, 42.00, 84.80,
        'confirmado', 'cartao_credito', 'aprovado', 30,
        CURRENT_TIMESTAMP + interval '20 minutes',
        'idemp_ord_1043', CURRENT_TIMESTAMP - interval '10 minutes'
      ),
      (
        'ord_1044', 'org_default', 'pdv', 'PDV-0912', '#1044', 'cli_marcelo', 'Marcelo Vieira (Balcão)', '(62) 98444-1122',
        'balcao', null,
        34.00, 0.00, 0.00, 0.50, 34.00, 9.20, 24.30,
        'concluido', 'pix', 'aprovado', 5,
        CURRENT_TIMESTAMP - interval '1 hour',
        'idemp_ord_1044', CURRENT_TIMESTAMP - interval '1 hour 10 minutes'
      );

    -- 13. Itens dos Pedidos
    INSERT INTO order_items (id, order_id, product_id, product_name, quantity, unit_price, cost_price, total_price, notes)
    VALUES
      ('oit_1', 'ord_1041', 'prd_brig_pist', 'Brigadeiro Gourmet de Pistache Puro', 2.00, 7.50, 2.20, 15.00, 'Enviar embalagem de presente'),
      ('oit_2', 'ord_1041', 'prd_bolo_cen', 'Bolo Caseiro Vulcão de Cenoura com Brigadeiro', 1.00, 55.00, 16.50, 55.00, null),
      ('oit_3', 'ord_1042', 'prd_bolo_cen', 'Bolo Caseiro Vulcão de Cenoura com Brigadeiro', 1.00, 48.00, 16.50, 48.00, 'Cliente retira às 17h'),
      ('oit_4', 'ord_1043', 'prd_brig_pist', 'Brigadeiro Gourmet de Pistache Puro', 10.00, 6.50, 2.20, 65.00, null),
      ('oit_5', 'ord_1043', 'prd_torta_lim', 'Torta Fina de Limão Siciliano com Merengue', 3.00, 18.50, 6.10, 55.50, null),
      ('oit_6', 'ord_1044', 'prd_cafe_cap', 'Cappuccino Cremoso Italiano 200ml', 2.00, 12.00, 3.10, 24.00, null),
      ('oit_7', 'ord_1044', 'prd_brig_belg', 'Brigadeiro Belga 54% Callebaut', 2.00, 5.00, 1.50, 10.00, null);

    -- 14. Transações Financeiras
    INSERT INTO financial_transactions (
      id, organization_id, order_id, channel_id, type, category, description,
      gross_amount, fee_amount, net_amount, payment_method, status, due_date
    )
    VALUES
      ('fin_1', 'org_default', 'ord_1044', 'pdv', 'receita', 'Venda Balcão', 'Venda PDV #1044 - Marcelo Vieira', 34.00, 0.50, 33.50, 'pix', 'pago', CURRENT_DATE),
      ('fin_2', 'org_default', 'ord_1043', 'loja_virtual', 'receita', 'Venda E-commerce', 'Venda Online #1043 - Fernanda Costa', 132.00, 5.20, 126.80, 'cartao_credito', 'pago', CURRENT_DATE),
      ('fin_3', 'org_default', 'ord_1041', 'ifood', 'receita', 'Venda iFood', 'Venda iFood #1041 - Gabriel Santos', 78.00, 12.60, 65.40, 'marketplace', 'pago', CURRENT_DATE),
      ('fin_4', 'org_default', null, null, 'despesa', 'Fornecedores', 'Compra Insumos - Cacau Show / Callebaut Distribuidor', 450.00, 0.00, 450.00, 'cartao_debito', 'pago', CURRENT_DATE - interval '1 day'),
      ('fin_5', 'org_default', null, null, 'despesa', 'Embalagens', 'Caixas Kraft e Potes Delivery - PlastPel', 180.00, 0.00, 180.00, 'pix', 'pago', CURRENT_DATE - interval '2 days');

    -- 15. Movimentações de Estoque
    INSERT INTO inventory_movements (
      id, organization_id, product_id, ingredient_id, movement_type, quantity,
      previous_stock, new_stock, reason, reference_id, user_id, idempotency_key
    )
    VALUES
      ('mov_1', 'org_default', 'prd_brig_pist', null, 'entrada', 50.00, 0.00, 50.00, 'Produção de lote #LOT-2026-PST02', 'rcp_brig_pist', 'usr_confeiteira', 'idemp_mov_1'),
      ('mov_2', 'org_default', 'prd_brig_pist', null, 'venda', 2.00, 50.00, 48.00, 'Venda Balcão PDV #1044', 'ord_1044', 'usr_atendente', 'idemp_mov_2'),
      ('mov_3', 'org_default', 'prd_pote_red', null, 'perda', 1.00, 3.00, 2.00, 'Avaria na embalagem durante refrigeração', null, 'usr_gerente', 'idemp_mov_3');

    -- 16. Fila de Sincronização e Logs
    INSERT INTO integration_queue (id, channel_id, task_type, payload, idempotency_key, status, attempts, last_error)
    VALUES (
      'que_nnfood_1', '99food', 'sync_product',
      '{"sku": "POTE-RED-01", "name": "Bolo de Pote Red Velvet", "price": 21.00, "is_available": true}'::jsonb,
      'idemp_nn_sync_pote_red', 'falhou', 3,
      '429 Too Many Requests: Rate limit excedido na API da 99Food. Aguarde intervalo de retry.'
    );

    INSERT INTO integration_sync_logs (id, channel_id, event_type, entity_id, status, payload, response, retry_count, error_message)
    VALUES
      ('log_ifd_1', 'ifood', 'preco', 'prd_brig_pist', 'sincronizado', '{"sku": "BRIG-PIST-01", "price": 7.50}'::jsonb, '{"status": 200, "message": "Catalog item price updated"}'::jsonb, 0, null),
      ('log_nn_1', '99food', 'estoque', 'prd_pote_red', 'falhou', '{"sku": "POTE-RED-01", "stock": 2}'::jsonb, '{"status": 429, "error": "rate_limit_exceeded"}'::jsonb, 3, 'Timeout ao conectar com gateway 99Food.');

    -- 17. Notificações do Sistema
    INSERT INTO notifications (id, organization_id, type, priority, title, message, link)
    VALUES
      ('notif_1', 'org_default', 'pedido_atrasado', 'critica', 'Pedido #1041 Atrasado (iFood)', 'O pedido #1041 de Gabriel Santos excedeu o tempo de preparo em 10 minutos.', '/pedidos'),
      ('notif_2', 'org_default', 'alerta_estoque', 'alta', 'Estoque Crítico: Bolo de Pote Red Velvet', 'Apenas 2 unidades restantes em estoque (mínimo configurado: 8 un).', '/estoque'),
      ('notif_3', 'org_default', 'validade_proxima', 'alta', 'Lote Próximo do Vencimento: Mini Pudim', 'Lote LOTE-2026-PUD01 vence em menos de 48 horas (5 unidades).', '/producao'),
      ('notif_4', 'org_default', 'falha_sincronizacao', 'media', 'Falha de Sincronização 99Food', 'Item POTE-RED-01 falhou após 3 tentativas devido a rate limit da plataforma.', '/integracoes');

    -- 18. Mensagens WhatsApp de Exemplo
    INSERT INTO whatsapp_messages (id, organization_id, direction, channel_type, recipient_or_sender, message_type, content, command_executed, status, external_id)
    VALUES
      ('wmsg_1', 'org_default', 'inbound', 'official_cloud', '+5562991234567', 'text', 'Olá, gostaria de saber se vocês têm brigadeiro de pistache hoje?', null, 'recebido', 'wamid_1'),
      ('wmsg_2', 'org_default', 'outbound', 'official_cloud', '+5562991234567', 'text', 'Olá! Sim, temos brigadeiros de pistache frescos acabados de sair da confeitaria! Deseja reservar uma caixinha?', null, 'entregue', 'wamid_2'),
      ('wmsg_3', 'org_default', 'inbound', 'official_cloud', '+5562981112233', 'text', '/estoque pistache', '/estoque', 'recebido', 'wamid_3'),
      ('wmsg_4', 'org_default', 'outbound', 'official_cloud', '+5562981112233', 'command_response', '📦 [DoceControl Estoque]\n• Brigadeiro Gourmet de Pistache Puro (BRIG-PIST-01): 48 un disponíveis (4 reservadas)\n• Insumo Pasta Pura de Pistache: 3.2 kg em estoque', '/estoque', 'enviado', 'wamid_4');
  `);

  console.log('DoceControl ERP demo database seeded successfully!');
}
