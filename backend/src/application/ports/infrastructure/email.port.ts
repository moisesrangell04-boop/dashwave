export interface SendEmailOptions {
  to: string;
  subject: string;
  body: string;
  html?: string;
}

export interface EmailPort {
  send(options: SendEmailOptions): Promise<void>;
  sendTemplate(template: string, to: string, data: Record<string, unknown>): Promise<void>;
}
