export interface SendTextMessage {
  to: string;
  text: string;
  instanceId: string;
}

export interface SendMediaMessage {
  to: string;
  mediaUrl: string;
  mediaType: string;
  caption?: string;
  instanceId: string;
}

export interface SendTemplateMessage {
  to: string;
  templateName: string;
  parameters: Record<string, string>;
  instanceId: string;
}

export interface WhatsAppProviderPort {
  connect(instanceId: string): Promise<{ qrCode?: string }>;
  disconnect(instanceId: string): Promise<void>;
  getStatus(instanceId: string): Promise<string>;
  sendText(data: SendTextMessage): Promise<{ messageId: string }>;
  sendMedia(data: SendMediaMessage): Promise<{ messageId: string }>;
  sendTemplate(data: SendTemplateMessage): Promise<{ messageId: string }>;
}
