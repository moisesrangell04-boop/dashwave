import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('SMTP_HOST');
    if (host) {
      this.transporter = nodemailer.createTransport({
        host,
        port: this.config.get<number>('SMTP_PORT') ?? 587,
        secure: false,
        auth: {
          user: this.config.get<string>('SMTP_USER'),
          pass: this.config.get<string>('SMTP_PASS'),
        },
      });
    }
  }

  async sendPasswordReset(email: string, resetUrl: string): Promise<void> {
    if (!this.transporter) {
      this.logger.warn(`[DEV] Password reset link for ${email}: ${resetUrl}`);
      return;
    }

    const from = this.config.get<string>('SMTP_FROM') ?? 'noreply@wavecrm.com.br';

    await this.transporter.sendMail({
      from,
      to: email,
      subject: 'Redefinição de senha - Wave CRM',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
          <h2 style="margin:0 0 8px;color:#111">Redefinição de senha</h2>
          <p style="color:#555;margin:0 0 24px">
            Recebemos uma solicitação para redefinir a senha da sua conta Wave CRM.
            Clique no botão abaixo para criar uma nova senha. O link expira em <strong>1 hora</strong>.
          </p>
          <a href="${resetUrl}"
             style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;
                    text-decoration:none;border-radius:6px;font-weight:600">
            Redefinir senha
          </a>
          <p style="color:#999;font-size:12px;margin:24px 0 0">
            Se você não solicitou isso, ignore este email. Nenhuma ação é necessária.
          </p>
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
          <p style="color:#999;font-size:12px;margin:0">Wave CRM</p>
        </div>
      `,
    });

    this.logger.log(`Password reset email sent to ${email}`);
  }
}
