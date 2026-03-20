import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.config.getOrThrow<string>('GMAIL_USER'),
        pass: this.config.getOrThrow<string>('GMAIL_APP_PASSWORD'),
      },
    });
  }

  async sendVerificationCode(to: string, code: string, name: string) {
    await this.transporter.sendMail({
      from: `"CineRank" <${this.config.getOrThrow<string>('GMAIL_USER')}>`,
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
    await this.transporter.sendMail({
      from: `"CineRank" <${this.config.getOrThrow<string>('GMAIL_USER')}>`,
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
