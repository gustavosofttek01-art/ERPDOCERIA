import { query } from '../db';
import { WhatsAppBot } from './bot';

export interface WhatsAppInboundMessage {
  from: string;
  id: string;
  timestamp: string;
  text?: { body: string };
  type: string;
}

export class WhatsAppCloudApi {
  private phoneNumberId: string;
  private accessToken: string;
  private verifyToken: string;

  constructor() {
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';
    this.verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'docecontrol_secure_verify_token_2026';
  }

  /**
   * Validação de webhook do Meta Graph API (Handshake GET).
   */
  verifyWebhook(mode: string | null, token: string | null, challenge: string | null): string | null {
    if (mode === 'subscribe' && token === this.verifyToken) {
      return challenge;
    }
    return null;
  }

  /**
   * Processa webhook recebido com mensagens de entrada (POST).
   */
  async handleWebhookPayload(payload: any): Promise<{ handled: boolean; replies: string[] }> {
    const replies: string[] = [];

    if (!payload?.entry) return { handled: false, replies };

    for (const entry of payload.entry) {
      for (const change of entry.changes || []) {
        const value = change.value;
        const messages = value?.messages;

        if (messages && messages.length > 0) {
          for (const msg of messages) {
            const from = msg.from;
            const textBody = msg.text?.body?.trim() || '';
            const msgId = msg.id;

            // Prevenção de duplicidade por external_id
            const existing = await query(
              'SELECT id FROM whatsapp_messages WHERE external_id = $1',
              [msgId]
            );
            if (existing.rows.length > 0) continue;

            // Registra mensagem recebida
            const inboundId = `wmsg_in_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
            await query(
              `INSERT INTO whatsapp_messages (
                id, organization_id, direction, channel_type, recipient_or_sender,
                message_type, content, status, external_id
              ) VALUES ($1, 'org_default', 'inbound', 'official_cloud', $2, 'text', $3, 'recebido', $4)`,
              [inboundId, from, textBody, msgId]
            );

            // Verifica se é um comando administrativo (ex: /estoque, /vendas)
            if (textBody.startsWith('/')) {
              const commandReply = await WhatsAppBot.handleCommand(textBody, from);
              replies.push(commandReply);

              // Registra e envia resposta
              await this.sendMessage(from, commandReply, 'command_response', textBody.split(' ')[0]);
            }
          }
        }
      }
    }

    return { handled: true, replies };
  }

  /**
   * Envia mensagem de texto via WhatsApp Cloud API Oficial.
   */
  async sendMessage(
    to: string,
    text: string,
    messageType: string = 'text',
    commandExecuted?: string
  ): Promise<{ success: boolean; messageId: string }> {
    const messageId = `wamid_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // Se houver credenciais reais de produção configuradas, despacha requisição HTTP para a Meta
    if (this.phoneNumberId && this.accessToken) {
      try {
        await fetch(`https://graph.facebook.com/v21.0/${this.phoneNumberId}/messages`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: to.replace(/\D/g, ''),
            type: 'text',
            text: { preview_url: false, body: text },
          }),
        });
      } catch (err) {
        console.warn('WhatsApp Cloud API HTTP call failed, saving to local log:', err);
      }
    }

    // Registra envio no banco
    const outboundId = `wmsg_out_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    await query(
      `INSERT INTO whatsapp_messages (
        id, organization_id, direction, channel_type, recipient_or_sender,
        message_type, content, command_executed, status, external_id
      ) VALUES ($1, 'org_default', 'outbound', 'official_cloud', $2, $3, $4, $5, 'enviado', $6)`,
      [outboundId, to, messageType, text, commandExecuted || null, messageId]
    );

    return { success: true, messageId };
  }
}
