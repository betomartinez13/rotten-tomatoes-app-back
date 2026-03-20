import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private resend: Resend;

  constructor(private config: ConfigService) {
    this.resend = new Resend(this.config.getOrThrow<string>('RESEND_API_KEY'));
  }

  async sendVerificationCode(to: string, code: string, name: string) {
    console.log(`[Mail] Verification code sent to ${to}`);
    await this.resend.emails.send({
      from: 'CineRank <onboarding@resend.dev>',
      to,
      subject: 'Verifica tu cuenta en CineRank',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2>Bienvenido a CineRank, ${name}!</h2>
          <p>Usa este código para verificar tu cuenta:</p>
          <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; text-align: center; padding: 24px; background: #f4f4f4; border-radius: 8px;">
            ${code}
          </div>
          <p style="color: #888; margin-top: 16px;">Este código expira en <strong>15 minutos</strong>.</p>
        </div>
      `,
    });
  }

  async sendResetCode(to: string, code: string, name: string) {
    console.log(`[Mail] Password reset code sent to ${to}`);
    await this.resend.emails.send({
      from: 'CineRank <onboarding@resend.dev>',
      to,
      subject: 'Código para restablecer tu contraseña',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2>Hola, ${name}</h2>
          <p>Tu código para restablecer la contraseña es:</p>
          <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; text-align: center; padding: 24px; background: #f4f4f4; border-radius: 8px;">
            ${code}
          </div>
          <p style="color: #888; margin-top: 16px;">Este código expira en <strong>15 minutos</strong>.</p>
          <p style="color: #888;">Si no solicitaste este código, ignora este mensaje.</p>
        </div>
      `,
    });
  }
}
