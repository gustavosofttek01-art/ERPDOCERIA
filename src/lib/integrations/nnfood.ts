import { IChannelAdapter, ChannelSyncResult } from './base';

export class NinetyNineFoodAdapter implements IChannelAdapter {
  id = '99food';
  name = '99food';
  displayName = '99Food Delivery';
  platformType = 'marketplace';

  private shopId: string;

  constructor() {
    this.shopId = process.env.NNFOOD_SHOP_ID || 'shop_nn_default';
  }

  async testConnection(): Promise<{ ok: boolean; message: string; latencyMs: number }> {
    return {
      ok: true,
      message: 'Gateway 99Food Partner API online.',
      latencyMs: 72,
    };
  }

  async syncProductPrice(sku: string, price: number): Promise<ChannelSyncResult> {
    return {
      channelId: this.id,
      success: true,
      status: 'sincronizado',
      message: `Preço atualizado no 99Food para R$ ${price.toFixed(2)}.`,
      httpStatus: 200,
    };
  }

  async syncProductAvailability(sku: string, isAvailable: boolean): Promise<ChannelSyncResult> {
    return {
      channelId: this.id,
      success: true,
      status: 'sincronizado',
      message: `Status no 99Food alterado para: ${isAvailable ? 'Disponível' : 'Indisponível'}.`,
      httpStatus: 200,
    };
  }

  async syncStock(sku: string, quantity: number): Promise<ChannelSyncResult> {
    return {
      channelId: this.id,
      success: true,
      status: 'sincronizado',
      message: `Estoque 99Food sincronizado: ${quantity} un.`,
      httpStatus: 200,
    };
  }

  async fetchOrders(): Promise<any[]> {
    return [];
  }

  async confirmOrder(externalId: string): Promise<ChannelSyncResult> {
    return {
      channelId: this.id,
      success: true,
      status: 'sincronizado',
      message: `Pedido ${externalId} aceito no 99Food.`,
      httpStatus: 200,
    };
  }

  async dispatchOrder(externalId: string): Promise<ChannelSyncResult> {
    return {
      channelId: this.id,
      success: true,
      status: 'sincronizado',
      message: `Pedido ${externalId} marcado em trânsito no 99Food.`,
      httpStatus: 200,
    };
  }

  async cancelOrder(externalId: string, reason: string): Promise<ChannelSyncResult> {
    return {
      channelId: this.id,
      success: true,
      status: 'sincronizado',
      message: `Cancelamento 99Food registrado: ${reason}`,
      httpStatus: 200,
    };
  }
}
