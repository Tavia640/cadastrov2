import emailjs from '@emailjs/browser';
import { DadosCliente, DadosNegociacao } from './pdfGenerator';
import { PDFGenerator } from './pdfGenerator';

export interface EmailJsPayload {
  clientData: DadosCliente;
  fichaData: DadosNegociacao;
}

export interface EmailJsConfig {
  serviceId: string;
  templateId: string;
  publicKey: string;
  destinationEmail: string;
  fromEmail?: string;
}

export class EmailJsService {
  private static config: EmailJsConfig = {
    serviceId: "service_ldi1oub",
    templateId: "template_gavn8gt",
    publicKey: "220ao3TEOhWHfxHtM",
    destinationEmail: "admudrive2025@gavresorts.com.br",
    fromEmail: "noreply@gavresorts.com"
  };

  static async init(config?: Partial<EmailJsConfig>): Promise<void> {
    console.log('🚀 Inicializando EmailJS com configurações padrão...');

    // Tentar carregar do localStorage primeiro (mais confiável que Supabase)
    try {
      const localConfig = {
        serviceId: localStorage.getItem('EMAILJS_SERVICE_ID'),
        templateId: localStorage.getItem('EMAILJS_TEMPLATE_ID'),
        publicKey: localStorage.getItem('EMAILJS_PUBLIC_KEY'),
        destinationEmail: localStorage.getItem('EMAILJS_DESTINATION_EMAIL'),
        fromEmail: localStorage.getItem('EMAILJS_FROM_EMAIL')
      };

      if (localConfig.serviceId) this.config.serviceId = localConfig.serviceId;
      if (localConfig.templateId) this.config.templateId = localConfig.templateId;
      if (localConfig.publicKey) this.config.publicKey = localConfig.publicKey;
      if (localConfig.destinationEmail) this.config.destinationEmail = localConfig.destinationEmail;
      if (localConfig.fromEmail) this.config.fromEmail = localConfig.fromEmail;

      if (localConfig.serviceId || localConfig.templateId || localConfig.publicKey) {
        console.log('📋 Configurações carregadas do localStorage');
      } else {
        console.log('📋 Usando configurações padrão (localStorage vazio)');
      }
    } catch (localError) {
      console.warn('⚠️ Não foi possível acessar localStorage, usando valores padrão');
    }

    // Aplicar configurações passadas como parâmetro (têm prioridade)
    if (config) {
      this.config = { ...this.config, ...config };
      console.log('📋 Configurações personalizadas aplicadas');
    }

    // Inicializar EmailJS
    emailjs.init(this.config.publicKey);
    console.log('✅ EmailJS inicializado com sucesso:', {
      serviceId: this.config.serviceId,
      templateId: this.config.templateId,
      destinationEmail: this.config.destinationEmail
    });
  }

  static async enviarFichaPorEmail(payload: EmailJsPayload): Promise<{ success: boolean; message: string; messageId?: string }> {
    try {
      console.log('🚀 Iniciando envio de ficha por email via EmailJS...');

      // Inicializar configurações
      try {
        await this.init();
      } catch (initError: any) {
        console.warn('⚠️ Erro na inicialização, usando configurações padrão:', initError.message);
        // Continuar com configurações padrão
        emailjs.init(this.config.publicKey);
      }

      // Validar dados antes do envio
      this.validarPayload(payload);

      // Gerar PDFs como data URI
      console.log('📄 Gerando PDFs...');
      const pdfCadastro = PDFGenerator.gerarPDFCadastroCliente(payload.clientData);
      const pdfNegociacao = PDFGenerator.gerarPDFNegociacao(payload.clientData, payload.fichaData);
      
      // Preparar dados para o template do EmailJS
      const templateParams = {
        to_name: payload.clientData.nome || "Cliente",
        to_email: this.config.destinationEmail,
        from_email: this.config.fromEmail,
        client_name: payload.clientData.nome,
        client_cpf: payload.clientData.cpf,
        client_phone: payload.clientData.telefone,
        closer: payload.fichaData.closer || 'Não informado',
        liner: payload.fichaData.liner || 'Não informado',
        tipo_venda: payload.fichaData.tipoVenda || 'Não informado',
        message: `Segue em anexo a ficha de negociação de cota para o cliente ${payload.clientData.nome}.`,
        pdf_cadastro: pdfCadastro,
        pdf_negociacao: pdfNegociacao,
        attachment_name_1: `Cadastro_${payload.clientData.nome?.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`,
        attachment_name_2: `Negociacao_${payload.clientData.nome?.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
      };

      console.log('📧 Enviando email via EmailJS...');

      // Validar configuração antes do envio
      if (!this.config.serviceId || !this.config.templateId || !this.config.publicKey) {
        throw new Error('Configuração do EmailJS incompleta. Verifique serviceId, templateId e publicKey.');
      }

      // Enviar email usando EmailJS
      const response = await emailjs.send(
        this.config.serviceId,
        this.config.templateId,
        templateParams
      );

      console.log('✅ Email enviado com sucesso:', response);

      return {
        success: true,
        message: `Ficha enviada com sucesso para ${this.config.destinationEmail}`,
        messageId: response.text
      };

    } catch (error: any) {
      console.error('❌ Erro no envio da ficha:', error);

      let errorMessage = 'Erro desconhecido no envio da ficha';

      // Tratar erros específicos do EmailJS
      if (error.status) {
        switch (error.status) {
          case 400:
            errorMessage = 'Erro de configuração: Verifique se o serviço e template do EmailJS estão configurados corretamente.';
            break;
          case 401:
            errorMessage = 'Erro de autenticação: Chave pública do EmailJS inválida.';
            break;
          case 402:
            errorMessage = 'Limite de envios excedido: Verifique sua conta EmailJS.';
            break;
          case 404:
            errorMessage = 'Serviço ou template não encontrado: Verifique as configurações do EmailJS.';
            break;
          case 413:
            errorMessage = 'Arquivo muito grande: Os PDFs podem estar muito grandes para envio.';
            break;
          case 422:
            errorMessage = 'Dados inválidos: Verifique se todos os campos obrigatórios estão preenchidos.';
            break;
          case 429:
            errorMessage = 'Muitas tentativas: Aguarde alguns minutos antes de tentar novamente.';
            break;
          default:
            errorMessage = `Erro do EmailJS (${error.status}): ${error.text || 'Erro não especificado'}`;
        }
      } else if (error.text) {
        errorMessage = `Erro do EmailJS: ${error.text}`;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      return {
        success: false,
        message: errorMessage
      };
    }
  }

  private static validarPayload(payload: EmailJsPayload): void {
    if (!payload.clientData) {
      throw new Error('Dados do cliente são obrigatórios');
    }
    
    if (!payload.fichaData) {
      throw new Error('Dados da negociação são obrigatórios');
    }
    
    if (!payload.clientData.nome) {
      throw new Error('Nome do cliente é obrigatório');
    }
    
    console.log('✅ Payload validado com sucesso');
  }

  static updateConfig(newConfig: Partial<EmailJsConfig>): void {
    this.config = { ...this.config, ...newConfig };
    if (newConfig.publicKey) {
      emailjs.init(this.config.publicKey);
    }
  }

  static getConfig(): EmailJsConfig {
    return { ...this.config };
  }
}
