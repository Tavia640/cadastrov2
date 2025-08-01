// Este arquivo foi desabilitado pois o sistema não usa mais Resend API
// Toda funcionalidade de email foi migrada para EmailJS
// Veja: src/lib/emailJsService.ts

export class EmailService {
  static async enviarPDFs(): Promise<{ success: boolean; message: string }> {
    return {
      success: false,
      message: 'Sistema Resend desabilitado. Use EmailJS em seu lugar.'
    };
  }
}
