export type UserRole = 'admin' | 'gerente' | 'confeiteiro' | 'atendente';

export interface User {
  id: string;
  organization_id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  active: boolean;
  created_at: string;
}

export interface Organization {
  id: string;
  name: string;
  trade_name?: string;
  document?: string;
  phone?: string;
  email?: string;
  address?: any;
  settings?: any;
}

export interface Category {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  description?: string;
  sort_order: number;
  active: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  organization_id: string;
  category_id?: string;
  category_name?: string;
  sku: string;
  barcode?: string;
  name: string;
  description?: string;
  unit: 'un' | 'kg' | 'g' | 'cento' | 'fatia' | 'caixa';
  sale_price: number;
  cost_price: number;
  min_stock: number;
  current_stock: number;
  reserved_stock: number;
  available_stock?: number;
  allow_negative_stock: boolean;
  is_produced: boolean;
  active: boolean;
  image_url?: string;
  shelf_life_days: number;
  created_at: string;
  updated_at: string;
  overrides?: ChannelProductOverride[];
}

export interface ChannelProductOverride {
  id: string;
  product_id: string;
  channel_id: string;
  channel_name?: string;
  price_override?: number;
  is_available: boolean;
  external_id?: string;
  external_sku?: string;
  sync_status: 'sincronizado' | 'pendente' | 'falhou' | 'nao_suportado';
  last_sync_at?: string;
  last_error?: string;
}

export interface Ingredient {
  id: string;
  organization_id: string;
  sku: string;
  name: string;
  unit: 'kg' | 'g' | 'l' | 'ml' | 'un';
  cost_per_unit: number;
  current_stock: number;
  min_stock: number;
  created_at: string;
}

export interface RecipeItem {
  id: string;
  recipe_id: string;
  ingredient_id: string;
  ingredient_name?: string;
  ingredient_unit?: string;
  cost_per_unit?: number;
  quantity: number;
  unit: string;
  item_cost?: number;
}

export interface Recipe {
  id: string;
  organization_id: string;
  product_id?: string;
  product_name?: string;
  name: string;
  yield_quantity: number;
  yield_unit: string;
  preparation_time_minutes: number;
  batch_cost: number;
  unit_cost: number;
  packaging_cost: number;
  instructions?: string;
  active: boolean;
  items?: RecipeItem[];
  created_at: string;
}

export interface Lot {
  id: string;
  organization_id: string;
  product_id: string;
  product_name?: string;
  lot_number: string;
  manufactured_at: string;
  expires_at: string;
  initial_quantity: number;
  current_quantity: number;
  status: 'valido' | 'alerta_vencimento' | 'vencido' | 'esgotado';
  days_until_expiry?: number;
}

export interface ProductionOrder {
  id: string;
  organization_id: string;
  recipe_id: string;
  recipe_name?: string;
  product_id: string;
  product_name?: string;
  lot_id?: string;
  batch_count: number;
  planned_quantity: number;
  produced_quantity: number;
  loss_quantity: number;
  loss_reason?: string;
  total_cost: number;
  unit_cost: number;
  status: 'concluido' | 'cancelado';
  notes?: string;
  created_by?: string;
  created_at: string;
}

export interface InventoryMovement {
  id: string;
  organization_id: string;
  product_id?: string;
  product_name?: string;
  ingredient_id?: string;
  ingredient_name?: string;
  movement_type: 'entrada' | 'saida' | 'reserva' | 'venda' | 'perda' | 'ajuste' | 'devolucao' | 'inventario';
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reason: string;
  reference_id?: string;
  user_id?: string;
  user_name?: string;
  idempotency_key?: string;
  created_at: string;
}

export type OrderStatus = 'recebido' | 'confirmado' | 'em_preparo' | 'pronto' | 'enviado' | 'concluido' | 'cancelado';
export type PaymentMethod = 'pix' | 'cartao_credito' | 'cartao_debito' | 'dinheiro' | 'marketplace' | 'faturado';
export type PaymentStatus = 'pendente' | 'aprovado' | 'estornado' | 'falhou';

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  cost_price: number;
  total_price: number;
  notes?: string;
}

export interface Order {
  id: string;
  organization_id: string;
  channel_id: string;
  channel_name?: string;
  external_id?: string;
  order_number: string;
  customer_id?: string;
  customer_name: string;
  customer_phone?: string;
  delivery_type: 'retirada' | 'delivery' | 'balcao';
  delivery_address?: any;
  subtotal: number;
  delivery_fee: number;
  discount: number;
  marketplace_fee: number;
  total_amount: number;
  estimated_cmv: number;
  estimated_net_profit: number;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  preparation_time_minutes: number;
  deadline_at?: string;
  cancelled_reason?: string;
  idempotency_key?: string;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  is_delayed?: boolean;
  minutes_remaining?: number;
}

export interface Customer {
  id: string;
  organization_id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: any;
  notes?: string;
  total_orders: number;
  total_spent: number;
  lgpd_consent: boolean;
  anonymized: boolean;
  created_at: string;
}

export interface Channel {
  id: string;
  display_name: string;
  platform_type: string;
  status: 'conectado' | 'desconectado' | 'em_homologacao' | 'erro';
  config_json?: any;
  auto_sync_stock: boolean;
  auto_sync_price: boolean;
  auto_accept_orders: boolean;
  last_sync_at?: string;
  last_error?: string;
  pending_tasks_count?: number;
}

export interface IntegrationSyncLog {
  id: string;
  channel_id: string;
  channel_name?: string;
  event_type: string;
  entity_id?: string;
  status: 'sincronizado' | 'pendente' | 'falhou' | 'nao_suportado';
  payload?: any;
  response?: any;
  retry_count: number;
  error_message?: string;
  created_at: string;
}

export interface IntegrationQueueTask {
  id: string;
  channel_id: string;
  channel_name?: string;
  task_type: 'sync_product' | 'sync_stock' | 'sync_price' | 'sync_status' | 'fetch_orders';
  payload: any;
  idempotency_key: string;
  status: 'pendente' | 'processando' | 'concluido' | 'falhou';
  attempts: number;
  max_attempts: number;
  next_retry_at: string;
  last_error?: string;
  created_at: string;
}

export interface WhatsAppMessage {
  id: string;
  organization_id: string;
  direction: 'inbound' | 'outbound';
  channel_type: 'official_cloud' | 'evolution';
  recipient_or_sender: string;
  message_type: string;
  content: string;
  command_executed?: string;
  status: 'recebido' | 'enviado' | 'entregue' | 'lido' | 'falhou';
  external_id?: string;
  error_message?: string;
  created_at: string;
}

export interface FinancialTransaction {
  id: string;
  organization_id: string;
  order_id?: string;
  channel_id?: string;
  channel_name?: string;
  type: 'receita' | 'despesa';
  category: string;
  description: string;
  gross_amount: number;
  fee_amount: number;
  net_amount: number;
  payment_method: string;
  status: 'pago' | 'pendente' | 'cancelado';
  due_date: string;
  paid_at?: string;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  organization_id: string;
  type: 'alerta_estoque' | 'pedido_atrasado' | 'validade_proxima' | 'falha_sincronizacao' | 'novo_pedido';
  priority: 'baixa' | 'media' | 'alta' | 'critica';
  title: string;
  message: string;
  link?: string;
  read: boolean;
  created_at: string;
}

export interface OperationsCenterData {
  operationalHealth: {
    allGood: boolean;
    activeChannelsCount: number;
    totalChannelsCount: number;
    channels: {
      id: string;
      name: string;
      status: string;
      lastSync: string;
      hasErrors: boolean;
    }[];
  };
  lowStockItems: {
    id: string;
    sku: string;
    name: string;
    currentStock: number;
    minStock: number;
    unit: string;
    severity: 'critico' | 'atencao';
  }[];
  delayedOrders: {
    id: string;
    orderNumber: string;
    customerName: string;
    channelName: string;
    status: OrderStatus;
    totalAmount: number;
    delayedMinutes: number;
    deadlineAt: string;
  }[];
  unsyncedPlatforms: {
    channelId: string;
    channelName: string;
    failedTasksCount: number;
    pendingTasksCount: number;
    lastError?: string;
  }[];
  urgentAttentionItems: {
    id: string;
    type: string;
    priority: 'critica' | 'alta' | 'media';
    title: string;
    message: string;
    actionLabel: string;
    actionUrl: string;
    timeAgo: string;
  }[];
}
