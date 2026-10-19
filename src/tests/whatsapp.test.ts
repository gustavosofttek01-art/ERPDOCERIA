import { describe, it, expect, beforeAll } from 'vitest';
import { getDb } from '../lib/db';
import { WhatsAppBot } from '../lib/whatsapp/bot';

describe('WhatsAppBot - Comandos Administrativos em Tempo Real', () => {
  beforeAll(async () => {
    await getDb();
  });

  it('deve responder comando /estoque com dados reais do banco', async () => {
    const response = await WhatsAppBot.handleCommand('/estoque pistache', '+5562981112233');
    expect(response).toContain('Brigadeiro Gourmet de Pistache');
    expect(response).toContain('Disponível');
  });

  it('deve responder comando /vendas com números calculados do dia', async () => {
    const response = await WhatsAppBot.handleCommand('/vendas', '+5562981112233');
    expect(response).toContain('Faturamento Bruto');
    expect(response).toContain('Total de Pedidos');
  });

  it('deve desativar produto via comando /desativar quando usuário for autorizado', async () => {
    // Número cadastrado da Mariana (admin): (62) 98111-2233
    const response = await WhatsAppBot.handleCommand('/desativar BOLO-CEN-01', '5562981112233');
    expect(response).toContain('Desativado com Sucesso');
  });
});
