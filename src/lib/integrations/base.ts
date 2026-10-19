export interface ChannelSyncResult {
  channelId: string;
  success: boolean;
  status: 'sincronizado' | 'pendente' | 'falhou' | 'nao_suportado';
  message: string;
  httpStatus?: number;
  data?: any;
}

export interface IChannelAdapter {
  id: string;
  name: string;
  displayName: string;
  platformType: string;

  testConnection(): Promise<{ ok: boolean; message: string; latencyMs: number }>;
  syncProductPrice(sku: string, price: number): Promise<ChannelSyncResult>;
  syncProductAvailability(sku: string, isAvailable: boolean): Promise<ChannelSyncResult>;
  syncStock(sku: string, quantity: number): Promise<ChannelSyncResult>;
  fetchOrders(): Promise<any[]>;
  confirmOrder(externalId: string): Promise<ChannelSyncResult>;
  dispatchOrder(externalId: string): Promise<ChannelSyncResult>;
  cancelOrder(externalId: string, reason: string): Promise<ChannelSyncResult>;
}
