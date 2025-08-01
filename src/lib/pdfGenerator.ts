import jsPDF from 'jspdf';

export interface DadosCliente {
  nome?: string;
  cpf?: string;
  rg?: string;
  orgaoEmissor?: string;
  estadoEmissor?: string;
  profissao?: string;
  dataNascimento?: string;
  estadoCivil?: string;
  email?: string;
  telefone?: string;

  // Campos de endereço
  logradouro?: string;
  numero?: string;
  bairro?: string;
  complemento?: string;
  cep?: string;
  cidade?: string;
  estado?: string;

  // Campos do cônjuge
  nomeConjuge?: string;
  cpfConjuge?: string;
  rgConjuge?: string;
  orgaoEmissorConjuge?: string;
  estadoEmissorConjuge?: string;
  profissaoConjuge?: string;
  dataNascimentoConjuge?: string;
  estadoCivilConjuge?: string;
  emailConjuge?: string;
  telefoneConjuge?: string;

  [key: string]: any;
}

export interface DadosNegociacao {
  liner?: string;
  closer?: string;
  liderSala?: string;
  nomeSala?: string;
  tipoVenda?: string;
  parcelasPagasSala: Array<{
    tipo: string;
    valorTotal: string;
    valorDistribuido: string;
    quantidadeCotas: string;
    formasPagamento: string[];
  }>;
  contratos: Array<{
    empreendimento: string;
    categoriaPreco: string;
    valor: string;
    [key: string]: any;
  }>;
  informacoesPagamento: Array<{
    tipo: string;
    total: string;
    qtdParcelas: string;
    valorParcela: string;
    formaPagamento: string;
    primeiroVencimento: string;
  }>;
}

export class PDFGenerator {
  private static createField(
    pdf: jsPDF,
    label: string,
    value: string,
    x: number,
    y: number,
    width: number,
    height: number = 8
  ) {
    // Label
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.text(label + ":", x + 2, y - 1);
    
    // Campo
    pdf.rect(x, y, width, height);
    
    // Valor
    if (value) {
      pdf.setFontSize(9);
      pdf.text(value, x + 2, y + 5);
    }
  }

  private static createTableHeader(
    pdf: jsPDF,
    headers: string[],
    x: number,
    y: number,
    widths: number[],
    height: number = 8
  ) {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    
    let currentX = x;
    headers.forEach((header, index) => {
      pdf.rect(currentX, y, widths[index], height);
      pdf.text(header, currentX + 2, y + 5);
      currentX += widths[index];
    });
    
    return y + height;
  }

  private static createTableRow(
    pdf: jsPDF,
    values: string[],
    x: number,
    y: number,
    widths: number[],
    height: number = 8
  ) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    
    let currentX = x;
    values.forEach((value, index) => {
      pdf.rect(currentX, y, widths[index], height);
      if (value) {
        pdf.text(value, currentX + 2, y + 5);
      }
      currentX += widths[index];
    });
    
    return y + height;
  }

  static gerarPDFCadastroCliente(dadosCliente: DadosCliente): string {
    const pdf = this.createPDFCadastroCliente(dadosCliente);
    return pdf.output('datauristring');
  }

  static gerarPDFCadastroClienteBlob(dadosCliente: DadosCliente): Blob {
    const pdf = this.createPDFCadastroCliente(dadosCliente);
    return pdf.output('blob');
  }

  private static createPDFCadastroCliente(dadosCliente: DadosCliente): jsPDF {
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    try {
      // Header com logo GAV
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.rect(10, 10, 30, 15);
      pdf.text("GAV", 18, 20);
      pdf.setFontSize(8);
      pdf.text("RESORTS", 16, 23);
      
      // Título centralizado
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.text("Ficha de Cadastro de Cliente", 75, 20);
      
      // Info do formulário (direita)
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      pdf.text("Código: FCR 02/01 rev.", 150, 12);
      pdf.text("Data: " + new Date().toLocaleDateString('pt-BR') + " rev.", 150, 16);
      pdf.text("Página: 1 de 1", 150, 20);
      
      // Seção DADOS DO CLIENTE
      let yPos = 35;
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.rect(10, yPos - 5, 190, 8);
      pdf.text("DADOS DO CLIENTE:", 12, yPos);
      yPos += 15;
      
      // Campos do cliente
      this.createField(pdf, "Nome", dadosCliente.nome || "", 10, yPos, 190, 8);
      yPos += 12;
      
      this.createField(pdf, "CPF", dadosCliente.cpf || "", 10, yPos, 190, 8);
      yPos += 12;
      
      // RG e ÓRGÃO/UF na mesma linha
      this.createField(pdf, "RG", dadosCliente.rg || "", 10, yPos, 120, 8);
      this.createField(pdf, "ÓRGÃO/UF", 
        (dadosCliente.orgaoEmissor || "") + "/" + (dadosCliente.estadoEmissor || ""), 
        135, yPos, 65, 8);
      yPos += 12;
      
      this.createField(pdf, "Profissão", dadosCliente.profissao || "", 10, yPos, 190, 8);
      yPos += 12;
      
      this.createField(pdf, "Estado Civil", dadosCliente.estadoCivil || "", 10, yPos, 190, 8);
      yPos += 12;
      
      this.createField(pdf, "E-mail", dadosCliente.email || "", 10, yPos, 190, 8);
      yPos += 12;
      
      this.createField(pdf, "Telefone", dadosCliente.telefone || "", 10, yPos, 190, 8);
      yPos += 20;
      
      // Seção DADOS DO CÔNJUGE
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.rect(10, yPos - 5, 190, 8);
      pdf.text("DADOS DO CÔNJUGE:", 12, yPos);
      yPos += 15;
      
      // Campos do cônjuge (vazios conforme imagem)
      this.createField(pdf, "Nome", "", 10, yPos, 190, 8);
      yPos += 12;
      
      this.createField(pdf, "CPF", "", 10, yPos, 190, 8);
      yPos += 12;
      
      this.createField(pdf, "RG", "", 10, yPos, 120, 8);
      this.createField(pdf, "ÓRGÃO/UF", "", 135, yPos, 65, 8);
      yPos += 12;
      
      this.createField(pdf, "Profissão", "", 10, yPos, 190, 8);
      yPos += 12;
      
      this.createField(pdf, "Estado Civil", "", 10, yPos, 190, 8);
      yPos += 12;
      
      this.createField(pdf, "E-mail", "", 10, yPos, 190, 8);
      yPos += 12;
      
      this.createField(pdf, "Telefone", "", 10, yPos, 190, 8);
      yPos += 20;
      
      // Seção ENDEREÇO
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.rect(10, yPos - 5, 190, 8);
      pdf.text("ENDEREÇO:", 12, yPos);
      yPos += 15;
      
      // Campos de endereço (vazios conforme padrão)
      this.createField(pdf, "Logradouro", "", 10, yPos, 130, 8);
      this.createField(pdf, "Nº", "", 145, yPos, 55, 8);
      yPos += 12;
      
      this.createField(pdf, "Bairro", "", 10, yPos, 190, 8);
      yPos += 12;
      
      this.createField(pdf, "Complemento", "", 10, yPos, 130, 8);
      this.createField(pdf, "CEP", "", 145, yPos, 55, 8);
      yPos += 12;
      
      this.createField(pdf, "Cidade", "", 10, yPos, 130, 8);
      this.createField(pdf, "UF", "", 145, yPos, 55, 8);
      
      return pdf;
      
    } catch (error) {
      console.error('Erro ao gerar PDF de cadastro:', error);
      throw new Error('Falha na geração do PDF de cadastro do cliente');
    }
  }

  static gerarPDFNegociacao(dadosCliente: DadosCliente, dadosNegociacao: DadosNegociacao): string {
    const pdf = this.createPDFNegociacao(dadosCliente, dadosNegociacao);
    return pdf.output('datauristring');
  }

  static gerarPDFNegociacaoBlob(dadosCliente: DadosCliente, dadosNegociacao: DadosNegociacao): Blob {
    const pdf = this.createPDFNegociacao(dadosCliente, dadosNegociacao);
    return pdf.output('blob');
  }

  private static createPDFNegociacao(dadosCliente: DadosCliente, dadosNegociacao: DadosNegociacao): jsPDF {
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    try {
      // Header GAV
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.rect(10, 10, 30, 15);
      pdf.text("GAV", 18, 20);
      pdf.setFontSize(8);
      pdf.text("RESORTS", 16, 23);
      
      // Título
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.text("Ficha de Negociação de Cota", 75, 20);
      
      // Info página
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      pdf.text("Código: FCR 02/01 rev.", 150, 12);
      pdf.text("Data: " + new Date().toLocaleDateString('pt-BR') + " rev.", 150, 16);
      pdf.text("Página: 1 de 2", 150, 20);
      
      // Dados básicos
      let yPos = 35;
      
      // Cliente
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.text("CLIENTE:", 12, yPos);
      pdf.rect(10, yPos + 2, 190, 8);
      pdf.setFont("helvetica", "normal");
      pdf.text(dadosCliente.nome || "", 12, yPos + 7);
      yPos += 15;
      
      // CPF
      pdf.setFont("helvetica", "bold");
      pdf.text("CPF:", 12, yPos);
      pdf.rect(10, yPos + 2, 190, 8);
      pdf.setFont("helvetica", "normal");
      pdf.text(dadosCliente.cpf || "", 12, yPos + 7);
      yPos += 15;
      
      // Sala de vendas
      pdf.setFont("helvetica", "bold");
      pdf.text("SALA DE VENDAS: GRAMADO - HORTÊNSIAS", 12, yPos);
      yPos += 10;
      
      // Liner e Closer
      pdf.text("LINER:", 12, yPos);
      pdf.setFont("helvetica", "normal");
      pdf.text(dadosNegociacao.liner || "", 30, yPos);
      pdf.setFont("helvetica", "bold");
      pdf.text("CLOSER:", 120, yPos);
      pdf.setFont("helvetica", "normal");
      pdf.text(dadosNegociacao.closer || "", 145, yPos);
      yPos += 15;
      
      // Tipo de venda
      pdf.setFont("helvetica", "normal");
      const tipos = ['PADRÃO', 'SEMESTRAL', 'ANUAL', 'À VISTA', 'ATÉ 36x', 'LINEAR'];
      const tipoAtivo = dadosNegociacao.tipoVenda?.toUpperCase();
      
      let tipoTexto = tipos.map(tipo => {
        return tipoAtivo === tipo.toLowerCase().replace('à ', 'a-').replace(' ', '-') 
          ? `(X) ${tipo}` 
          : `( ) ${tipo}`;
      }).join(' ');
      
      pdf.text(tipoTexto, 12, yPos);
      yPos += 15;
      
      // Tabela de Parcelas Pagas na Sala
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.text("PARCELAS PAGAS NA SALA:", 12, yPos);
      yPos += 8;
      
      // Cabeçalho da tabela
      const headers = ['Tipo', 'Valor Total', 'Valor Distrib.', 'Qtd', 'Forma Pag.'];
      const widths = [40, 30, 30, 20, 30];
      
      yPos = this.createTableHeader(pdf, headers, 10, yPos, widths, 10);
      
      // Linhas da tabela
      for (let i = 0; i < Math.max(6, dadosNegociacao.parcelasPagasSala.length); i++) {
        const parcela = dadosNegociacao.parcelasPagasSala[i];
        const values = parcela ? [
          parcela.tipo || '',
          parcela.valorTotal || '',
          parcela.valorDistribuido || '',
          parcela.quantidadeCotas || '',
          parcela.formasPagamento?.[0] || ''
        ] : ['', '', '', '', ''];
        
        yPos = this.createTableRow(pdf, values, 10, yPos, widths, 8);
      }
      
      yPos += 10;
      
      // Informações de pagamento
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.text("INFORMAÇÕES DE PAGAMENTO:", 12, yPos);
      yPos += 10;
      
      // Cabeçalho da tabela de pagamentos
      const headersPag = ['Tipo', 'Total', 'Qtd', 'Vlr Parc.', 'Forma', '1º Venc.'];
      const widthsPag = [30, 25, 15, 25, 25, 25];
      
      yPos = this.createTableHeader(pdf, headersPag, 10, yPos, widthsPag, 8);
      
      // Dados das informações de pagamento (apenas com valores)
      dadosNegociacao.informacoesPagamento
        .filter(info => info.total && parseFloat(info.total) > 0)
        .forEach(info => {
          const values = [
            info.tipo,
            info.total,
            info.qtdParcelas,
            info.valorParcela,
            info.formaPagamento,
            info.primeiroVencimento
          ];
          yPos = this.createTableRow(pdf, values, 10, yPos, widthsPag, 6);
        });
      
      return pdf;
      
    } catch (error) {
      console.error('Erro ao gerar PDF de negociação:', error);
      throw new Error('Falha na geração do PDF de negociação');
    }
  }
}
