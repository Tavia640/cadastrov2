import jsPDF from 'jspdf';
import { DadosCliente, DadosNegociacao } from './pdfGenerator';

export class PDFGeneratorOfficial {
  
  static gerarPDFCadastroOficial(dadosCliente: DadosCliente, dadosNegociacao?: DadosNegociacao): Blob {
    try {
      console.log('🔍 Iniciando geração PDF Cadastro...');
      console.log('📊 Dados do cliente:', dadosCliente);

      if (!dadosCliente) {
        throw new Error('Dados do cliente não fornecidos para PDF de cadastro');
      }

      // Função auxiliar para converter valores para string de forma segura
      const safeString = (value: any): string => {
        if (value === null || value === undefined) return '';
        return String(value).trim();
      };

      // Função para limitar texto
      const limitText = (text: string, maxLength: number): string => {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
      };

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.width;
      const pageHeight = pdf.internal.pageSize.height;

      // Configurações otimizadas
      const margin = 10;
      const lineHeight = 5.5;
      let currentY = margin;

      // Função auxiliar para quebrar linha
      const nextLine = (lines = 1) => {
        currentY += lineHeight * lines;
        if (currentY > pageHeight - margin - 10) {
          pdf.addPage();
          currentY = margin;
        }
      };

      // Função para desenhar caixa
      const drawBox = (x: number, y: number, w: number, h: number) => {
        pdf.rect(x, y, w, h);
      };

      // CABEÇALHO
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text('FORMULARIO', margin, currentY);
      pdf.text('Codigo: FOR.02.01.002', pageWidth - 55, currentY);
      nextLine();

      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('FICHA DE CADASTRO DE CLIENTE', pageWidth/2, currentY, { align: 'center' });
      pdf.setFont('helvetica', 'normal');

      pdf.setFontSize(8);
      pdf.text('Rev.: 24/07/2025 - Ver.02', pageWidth - 55, currentY);
      nextLine();
      pdf.text('Pagina: 1 de 2', pageWidth - 30, currentY);
      nextLine(1.5);

      // Linha divisória
      pdf.line(margin, currentY, pageWidth - margin, currentY);
      nextLine(1.5);

      // DADOS DO CLIENTE
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text('DADOS DO CLIENTE:', margin, currentY);
      nextLine(1.8);

      // Configurações da tabela
      const tableWidth = pageWidth - 2 * margin;
      const rowHeight = 7;

      // Nome
      drawBox(margin, currentY, tableWidth, rowHeight);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Nome:', margin + 2, currentY + 4.5);
      pdf.setFont('helvetica', 'normal');
      pdf.text(limitText(safeString(dadosCliente.nome), 55), margin + 20, currentY + 4.5);
      nextLine(1.3);

      // CPF
      drawBox(margin, currentY, tableWidth, rowHeight);
      pdf.setFont('helvetica', 'bold');
      pdf.text('CPF:', margin + 2, currentY + 4.5);
      pdf.setFont('helvetica', 'normal');
      pdf.text(safeString(dadosCliente.cpf), margin + 20, currentY + 4.5);
      nextLine(1.3);

      // RG, Órgão, UF
      const rgWidth = tableWidth * 0.5;
      const orgaoWidth = tableWidth * 0.25;
      const ufWidth = tableWidth * 0.25;

      drawBox(margin, currentY, rgWidth, rowHeight);
      drawBox(margin + rgWidth, currentY, orgaoWidth, rowHeight);
      drawBox(margin + rgWidth + orgaoWidth, currentY, ufWidth, rowHeight);

      pdf.setFont('helvetica', 'bold');
      pdf.text('RG:', margin + 2, currentY + 4.5);
      pdf.text('ORGAO:', margin + rgWidth + 2, currentY + 4.5);
      pdf.text('UF:', margin + rgWidth + orgaoWidth + 2, currentY + 4.5);

      pdf.setFont('helvetica', 'normal');
      pdf.text(safeString(dadosCliente.rg), margin + 15, currentY + 4.5);
      pdf.text(limitText(safeString(dadosCliente.orgaoEmissor), 10), margin + rgWidth + 25, currentY + 4.5);
      pdf.text(safeString(dadosCliente.estadoEmissor), margin + rgWidth + orgaoWidth + 15, currentY + 4.5);
      nextLine(1.3);

      // Profissão
      drawBox(margin, currentY, tableWidth, rowHeight);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Profissao:', margin + 2, currentY + 4.5);
      pdf.setFont('helvetica', 'normal');
      pdf.text(limitText(safeString(dadosCliente.profissao), 50), margin + 28, currentY + 4.5);
      nextLine(1.3);

      // Estado Civil
      drawBox(margin, currentY, tableWidth, rowHeight);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Estado Civil:', margin + 2, currentY + 4.5);
      pdf.setFont('helvetica', 'normal');
      pdf.text(safeString(dadosCliente.estadoCivil), margin + 35, currentY + 4.5);
      nextLine(1.3);

      // E-mail
      drawBox(margin, currentY, tableWidth, rowHeight);
      pdf.setFont('helvetica', 'bold');
      pdf.text('E-mail:', margin + 2, currentY + 4.5);
      pdf.setFont('helvetica', 'normal');
      pdf.text(limitText(safeString(dadosCliente.email), 45), margin + 22, currentY + 4.5);
      nextLine(1.3);

      // Telefone
      drawBox(margin, currentY, tableWidth, rowHeight);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Telefone:', margin + 2, currentY + 4.5);
      pdf.setFont('helvetica', 'normal');
      pdf.text(safeString(dadosCliente.telefone), margin + 28, currentY + 4.5);
      nextLine(1.5);

      // DADOS DO CÔNJUGE
      nextLine(0.5); // Espaço adicional antes do título
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text('DADOS DO CONJUGE:', margin, currentY);
      nextLine(2);

      // Nome do cônjuge
      drawBox(margin, currentY, tableWidth, rowHeight);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Nome:', margin + 2, currentY + 4.5);
      pdf.setFont('helvetica', 'normal');
      pdf.text(limitText(safeString(dadosCliente.nomeConjuge), 55), margin + 20, currentY + 4.5);
      nextLine(1.3);

      // CPF do cônjuge
      drawBox(margin, currentY, tableWidth, rowHeight);
      pdf.setFont('helvetica', 'bold');
      pdf.text('CPF:', margin + 2, currentY + 4.5);
      pdf.setFont('helvetica', 'normal');
      pdf.text(safeString(dadosCliente.cpfConjuge), margin + 20, currentY + 4.5);
      nextLine(1.3);

      // RG, Órgão, UF do cônjuge
      drawBox(margin, currentY, rgWidth, rowHeight);
      drawBox(margin + rgWidth, currentY, orgaoWidth, rowHeight);
      drawBox(margin + rgWidth + orgaoWidth, currentY, ufWidth, rowHeight);

      pdf.setFont('helvetica', 'bold');
      pdf.text('RG:', margin + 2, currentY + 4.5);
      pdf.text('ORGAO:', margin + rgWidth + 2, currentY + 4.5);
      pdf.text('UF:', margin + rgWidth + orgaoWidth + 2, currentY + 4.5);

      pdf.setFont('helvetica', 'normal');
      pdf.text(safeString(dadosCliente.rgConjuge), margin + 15, currentY + 4.5);
      pdf.text(limitText(safeString(dadosCliente.orgaoEmissorConjuge), 10), margin + rgWidth + 25, currentY + 4.5);
      pdf.text(safeString(dadosCliente.estadoEmissorConjuge), margin + rgWidth + orgaoWidth + 15, currentY + 4.5);
      nextLine(1.3);

      // Demais campos do cônjuge
      const camposConjuge = [
        { label: 'Profissao:', valor: dadosCliente.profissaoConjuge, limit: 50 },
        { label: 'Estado Civil:', valor: dadosCliente.estadoCivilConjuge, limit: 30 },
        { label: 'E-mail:', valor: dadosCliente.emailConjuge, limit: 45 },
        { label: 'Telefone:', valor: dadosCliente.telefoneConjuge, limit: 30 }
      ];

      camposConjuge.forEach(campo => {
        drawBox(margin, currentY, tableWidth, rowHeight);
        pdf.setFont('helvetica', 'bold');
        pdf.text(campo.label, margin + 2, currentY + 4.5);
        pdf.setFont('helvetica', 'normal');
        pdf.text(limitText(safeString(campo.valor), campo.limit), margin + 35, currentY + 4.5);
        nextLine(1.3);
      });

      nextLine(0.5);

      // ENDEREÇO
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text('ENDERECO:', margin, currentY);
      nextLine(1.8);

      // Logradouro e Número
      const logradouroWidth = tableWidth * 0.7;
      const numeroWidth = tableWidth * 0.3;

      drawBox(margin, currentY, logradouroWidth, rowHeight);
      drawBox(margin + logradouroWidth, currentY, numeroWidth, rowHeight);

      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Logradouro:', margin + 2, currentY + 4.5);
      pdf.text('No:', margin + logradouroWidth + 2, currentY + 4.5);

      pdf.setFont('helvetica', 'normal');
      pdf.text(limitText(safeString(dadosCliente.logradouro), 35), margin + 30, currentY + 4.5);
      pdf.text(safeString(dadosCliente.numero), margin + logradouroWidth + 15, currentY + 4.5);
      nextLine(1.3);

      // Bairro
      drawBox(margin, currentY, tableWidth, rowHeight);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Bairro:', margin + 2, currentY + 4.5);
      pdf.setFont('helvetica', 'normal');
      pdf.text(limitText(safeString(dadosCliente.bairro), 50), margin + 25, currentY + 4.5);
      nextLine(1.3);

      // Complemento e CEP
      const complementoWidth = tableWidth * 0.6;
      const cepWidth = tableWidth * 0.4;

      drawBox(margin, currentY, complementoWidth, rowHeight);
      drawBox(margin + complementoWidth, currentY, cepWidth, rowHeight);

      pdf.setFont('helvetica', 'bold');
      pdf.text('Complemento:', margin + 2, currentY + 4.5);
      pdf.text('CEP:', margin + complementoWidth + 2, currentY + 4.5);

      pdf.setFont('helvetica', 'normal');
      pdf.text(limitText(safeString(dadosCliente.complemento), 25), margin + 35, currentY + 4.5);
      pdf.text(safeString(dadosCliente.cep), margin + complementoWidth + 20, currentY + 4.5);
      nextLine(1.3);

      // Cidade e UF
      const cidadeWidth = tableWidth * 0.7;
      const ufEnderecoWidth = tableWidth * 0.3;

      drawBox(margin, currentY, cidadeWidth, rowHeight);
      drawBox(margin + cidadeWidth, currentY, ufEnderecoWidth, rowHeight);

      pdf.setFont('helvetica', 'bold');
      pdf.text('Cidade:', margin + 2, currentY + 4.5);
      pdf.text('UF:', margin + cidadeWidth + 2, currentY + 4.5);

      pdf.setFont('helvetica', 'normal');
      pdf.text(limitText(safeString(dadosCliente.cidade), 40), margin + 25, currentY + 4.5);
      pdf.text(safeString(dadosCliente.estado), margin + cidadeWidth + 15, currentY + 4.5);
      nextLine(1.5);

      // SALA DE VENDAS
      nextLine(1); // Espaço adicional antes do título
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text('SALA DE VENDAS:', margin, currentY);
      nextLine(1.5);

      // Checkbox BEEBACK (não marcado por padrão)
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.rect(margin, currentY - 2.5, 2.5, 2.5);
      pdf.text('BEEBACK', margin + 4, currentY);
      nextLine(1.8);

      // Campos da sala de vendas com dados preenchidos quando disponível
      const salaVendas = dadosNegociacao?.nomeSala || '';
      const liner = dadosNegociacao?.liner || '';
      const closer = dadosNegociacao?.closer || '';
      const liderSala = dadosNegociacao?.liderSala || '';

      const camposSala = [
        `SALA DE VENDAS: ${limitText(salaVendas, 40)}`,
        `LINER: ${limitText(liner, 25)}    EMPRESA (Liner): ________________`,
        `CLOSER: ${limitText(closer, 24)}    EMPRESA (Closer): _______________`,
        'PEP: __________________    EMPRESA (PEP): __________________',
        `LIDER DE SALA: ${limitText(liderSala, 50)}`,
        'SUB LIDER DE SALA: ___________________________________________'
      ];

      camposSala.forEach(campo => {
        pdf.setFontSize(7);
        pdf.text(campo, margin, currentY);
        nextLine(0.8);
      });

      // CAMPO DE ASSINATURA DO CLIENTE
      nextLine(1.5);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text('ASSINATURA DO CLIENTE:', margin, currentY);

      // Linha para assinatura
      pdf.line(margin + 50, currentY + 8, pageWidth - margin, currentY + 8);

      nextLine(1.5);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.text('Data: ___/___/______', margin, currentY);

      console.log('✅ PDF de Cadastro gerado com sucesso');
      const blob = pdf.output('blob');
      console.log('📦 Blob de Cadastro criado:', blob.size, 'bytes');
      return blob;
    } catch (error: any) {
      console.error('❌ Erro na geração do PDF de Cadastro:', error);
      throw new Error(`Falha na geração do PDF de Cadastro: ${error.message}`);
    }
  }

  static gerarPDFNegociacaoOficial(dadosCliente: DadosCliente, dadosNegociacao: DadosNegociacao): Blob {
    try {
      console.log('🔍 Iniciando geração PDF Negociação...');
      console.log('📊 Dados do cliente:', dadosCliente);
      console.log('📊 Dados da negociação:', dadosNegociacao);

      // Verificar se os dados essenciais existem
      if (!dadosCliente || typeof dadosCliente !== 'object') {
        throw new Error('Dados do cliente não fornecidos ou inválidos');
      }
      if (!dadosNegociacao || typeof dadosNegociacao !== 'object') {
        throw new Error('Dados da negociação não fornecidos ou inválidos');
      }

      // Garantir que arrays essenciais existam
      if (!Array.isArray(dadosNegociacao.parcelasPagasSala)) {
        dadosNegociacao.parcelasPagasSala = [];
      }
      if (!Array.isArray(dadosNegociacao.contratos)) {
        dadosNegociacao.contratos = [];
      }
      if (!Array.isArray(dadosNegociacao.informacoesPagamento)) {
        dadosNegociacao.informacoesPagamento = [];
      }

      // Função auxiliar para converter valores para string de forma segura
      const safeString = (value: any): string => {
        if (value === null || value === undefined) return '';
        return String(value).trim();
      };

      // Função para limitar texto
      const limitText = (text: string, maxLength: number): string => {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
      };

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.width;
      const pageHeight = pdf.internal.pageSize.height;

      const margin = 10;
      const lineHeight = 5.5;
      let currentY = margin;

      const nextLine = (lines = 1) => {
        currentY += lineHeight * lines;
        if (currentY > pageHeight - margin - 10) {
          pdf.addPage();
          currentY = margin;
        }
      };

      const drawBox = (x: number, y: number, w: number, h: number) => {
        pdf.rect(x, y, w, h);
      };

      // CABEÇALHO
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text('FORMULARIO', margin, currentY);
      pdf.text('Codigo: FOR.02.01.002', pageWidth - 55, currentY);
      nextLine();

      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('FICHA DE NEGOCIACAO DE COTA', pageWidth/2, currentY, { align: 'center' });
      pdf.setFont('helvetica', 'normal');

      pdf.setFontSize(8);
      pdf.text('Rev.: 24/07/2025 - Ver.02', pageWidth - 55, currentY);
      nextLine();
      pdf.text('Pagina: 2 de 2', pageWidth - 30, currentY);
      nextLine(1.5);

      // Linha divisória
      pdf.line(margin, currentY, pageWidth - margin, currentY);
      nextLine(1.5);

      // DADOS BÁSICOS
      pdf.setFontSize(9);
      pdf.text(`CLIENTE: ${limitText(safeString(dadosCliente.nome), 50)}`, margin, currentY);
      nextLine();
      pdf.text(`CPF: ${safeString(dadosCliente.cpf)}`, margin, currentY);
      nextLine();
      pdf.text(`SALA DE VENDAS: ${limitText(safeString(dadosNegociacao.nomeSala), 40)}`, margin, currentY);
      nextLine();
      pdf.text(`LINER: ${limitText(safeString(dadosNegociacao.liner), 20)}     CLOSER: ${limitText(safeString(dadosNegociacao.closer), 20)}`, margin, currentY);
      nextLine();
      pdf.text(`LIDER DE SALA: ${limitText(safeString(dadosNegociacao.liderSala), 40)}`, margin, currentY);
      nextLine(1.5);

      // TIPO DE VENDA - Checkboxes
      const tiposVenda = ['PADRAO', 'SEMESTRAL', 'ANUAL', 'A VISTA', 'ATE 36x', 'LINEAR'];
      let xPos = margin;

      tiposVenda.forEach(tipo => {
        pdf.rect(xPos, currentY - 2.5, 2.5, 2.5);
        const tipoSelecionado = safeString(dadosNegociacao.tipoVenda).toUpperCase();
        if (tipoSelecionado && (
          tipo === tipoSelecionado ||
          (tipo === 'SEMESTRAL' && tipoSelecionado === 'SEMESTRAL') ||
          (tipo === 'ANUAL' && tipoSelecionado === 'ANUAL') ||
          (tipo === 'A VISTA' && tipoSelecionado === 'A_VISTA') ||
          (tipo === 'ATE 36x' && tipoSelecionado === 'ATE_36X') ||
          (tipo === 'LINEAR' && tipoSelecionado === 'LINEAR') ||
          (tipo === 'PADRAO' && tipoSelecionado === 'PADRAO')
        )) {
          pdf.text('X', xPos + 0.5, currentY - 1);
        }
        pdf.text(tipo, xPos + 4, currentY);
        xPos += 26;
      });
      nextLine(2);

      // TABELA DE PARCELAS PAGAS EM SALA
      const totalTableWidth = pageWidth - 2 * margin;
      const colWidths = [
        totalTableWidth * 0.22,
        totalTableWidth * 0.18,
        totalTableWidth * 0.15,
        totalTableWidth * 0.22,
        totalTableWidth * 0.23
      ];
      const headers = [
        'Tipo de Parcela Paga em Sala',
        'Valor Total Pago em Sala',
        'Quantidade de cotas',
        'Valor distribuido para cada Unidade',
        'Forma de Pagamento'
      ];

      // Cabeçalho da tabela
      let xPos2 = margin;
      headers.forEach((header, i) => {
        drawBox(xPos2, currentY, colWidths[i], 7);
        pdf.setFontSize(7);
        pdf.text(header, xPos2 + 1, currentY + 4.5);
        xPos2 += colWidths[i];
      });
      nextLine(1.3);

      // Dados da tabela - estrutura fixa com tipos pré-definidos
      const tiposParcelaFixos = ['Entrada', '( ) Sinal', '( ) Saldo'];
      const parcelasPagasSala = dadosNegociacao.parcelasPagasSala || [];

      tiposParcelaFixos.forEach(tipoFixo => {
        const parcelaCorrespondente = parcelasPagasSala.find(parcela =>
          parcela && parcela.tipo && tipoFixo.toLowerCase().includes(parcela.tipo.toLowerCase())
        );

        xPos2 = margin;
        const valores = [
          tipoFixo,
          parcelaCorrespondente?.valorTotal ? `R$ ${safeString(parcelaCorrespondente.valorTotal)}` : '',
          safeString(parcelaCorrespondente?.quantidadeCotas),
          parcelaCorrespondente?.valorDistribuido ? `R$ ${safeString(parcelaCorrespondente.valorDistribuido)}` : '',
          (parcelaCorrespondente?.formasPagamento || []).join(', ')
        ];

        valores.forEach((valor, i) => {
          drawBox(xPos2, currentY, colWidths[i], 5.5);
          pdf.setFontSize(7);
          pdf.text(limitText(valor || '', 25), xPos2 + 1, currentY + 3.5);
          xPos2 += colWidths[i];
        });
        nextLine();
      });

      nextLine(1.5);

      // TABELA DE CONTRATOS
      pdf.setFontSize(9);
      pdf.text('Contratos:', margin, currentY);
      nextLine();

      const contratoHeaders = ['Contrato', 'Empreendimento', 'Torre/Bloco', 'Apt.', 'Cota', 'Vista da UH.', 'PCD', 'Valor'];
      const totalContratoWidth = pageWidth - 2 * margin;
      const contratoWidths = [
        totalContratoWidth * 0.14,
        totalContratoWidth * 0.21,
        totalContratoWidth * 0.14,
        totalContratoWidth * 0.09,
        totalContratoWidth * 0.09,
        totalContratoWidth * 0.12,
        totalContratoWidth * 0.09,
        totalContratoWidth * 0.12
      ];

      // Cabeçalho contratos
      xPos2 = margin;
      contratoHeaders.forEach((header, i) => {
        drawBox(xPos2, currentY, contratoWidths[i], 7);
        pdf.setFontSize(7);
        pdf.text(header, xPos2 + 1, currentY + 4.5);
        xPos2 += contratoWidths[i];
      });
      nextLine(1.3);

      // Dados dos contratos
      const contratos = dadosNegociacao.contratos || [];
      if (contratos.length === 0) {
        xPos2 = margin;
        contratoWidths.forEach((width, i) => {
          drawBox(xPos2, currentY, width, 5.5);
          xPos2 += width;
        });
        nextLine();
      } else {
        contratos.forEach((contrato, index) => {
          xPos2 = margin;
          const contratoValues = [
            '( ) Fisico (X) Digital',
            limitText(safeString(contrato?.empreendimento), 20),
            safeString(contrato?.torre),
            safeString(contrato?.apartamento),
            safeString(contrato?.cota),
            '____________________',
            '( ) Sim ( ) Nao',
            contrato?.valor ? `R$ ${safeString(contrato.valor)}` : ''
          ];

          contratoValues.forEach((valor, i) => {
            drawBox(xPos2, currentY, contratoWidths[i], 5.5);
            pdf.setFontSize(6);
            pdf.text(valor || '', xPos2 + 1, currentY + 3.5);
            xPos2 += contratoWidths[i];
          });
          nextLine();
        });
      }

      nextLine(1.5);

      // TABELA DE PAGAMENTOS
      pdf.setFontSize(8);
      pdf.text('O financeiro descrito abaixo e referente a cada unidade separadamente.', margin, currentY);
      nextLine(1.5);

      const pagamentoHeaders = ['Tipo', 'Total', 'Qtd. Parcelas', 'Valor Parcela', 'Forma de Pag.', '1o Vencimento'];
      const totalPagamentoWidth = pageWidth - 2 * margin;
      const pagamentoWidths = [
        totalPagamentoWidth * 0.17,
        totalPagamentoWidth * 0.15,
        totalPagamentoWidth * 0.15,
        totalPagamentoWidth * 0.15,
        totalPagamentoWidth * 0.18,
        totalPagamentoWidth * 0.20
      ];

      // Cabeçalho pagamentos
      xPos2 = margin;
      pagamentoHeaders.forEach((header, i) => {
        drawBox(xPos2, currentY, pagamentoWidths[i], 7);
        pdf.setFontSize(7);
        pdf.text(header, xPos2 + 1, currentY + 4.5);
        xPos2 += pagamentoWidths[i];
      });
      nextLine(1.3);

      // Dados dos pagamentos - estrutura fixa sem 2ª entrada
      const tiposPagamentoFixos = ['Entrada', 'Entrada Restante', 'Sinal', 'Saldo'];
      const informacoesPagamento = dadosNegociacao.informacoesPagamento || [];

      console.log('🔍 Informações de pagamento disponíveis:', informacoesPagamento);

      tiposPagamentoFixos.forEach(tipoFixo => {
        let infoPagamento;

        // Busca específica por tipo
        if (tipoFixo === 'Entrada') {
          infoPagamento = informacoesPagamento.find(info =>
            info && info.tipo && (info.tipo === '1ª Entrada' || info.tipo === '1a Entrada' || info.tipo === 'Entrada')
          );
        } else if (tipoFixo === 'Entrada Restante') {
          infoPagamento = informacoesPagamento.find(info =>
            info && info.tipo && (info.tipo === 'Restante da Entrada')
          );
        } else {
          infoPagamento = informacoesPagamento.find(info =>
            info && info.tipo && info.tipo.toLowerCase().includes(tipoFixo.toLowerCase())
          );
        }

        console.log(`🔍 Buscando ${tipoFixo}, encontrado:`, infoPagamento);

        xPos2 = margin;
        const pagamentoValues = [
          tipoFixo,
          infoPagamento?.total ? `R$ ${safeString(infoPagamento.total)}` : '',
          safeString(infoPagamento?.qtdParcelas),
          infoPagamento?.valorParcela ? `R$ ${safeString(infoPagamento.valorParcela)}` : '',
          limitText(safeString(infoPagamento?.formaPagamento), 15),
          infoPagamento?.primeiroVencimento ? (() => {
            try {
              return new Date(infoPagamento.primeiroVencimento).toLocaleDateString('pt-BR');
            } catch {
              return safeString(infoPagamento.primeiroVencimento);
            }
          })() : ''
        ];

        pagamentoValues.forEach((valor, i) => {
          drawBox(xPos2, currentY, pagamentoWidths[i], 5.5);
          pdf.setFontSize(7);
          pdf.text(valor || '', xPos2 + 1, currentY + 3.5);
          xPos2 += pagamentoWidths[i];
        });
        nextLine();
      });

      // CAMPO DE ASSINATURA DO CLIENTE
      nextLine(2.5);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text('ASSINATURA DO CLIENTE:', margin, currentY);

      // Linha para assinatura
      pdf.line(margin + 50, currentY + 8, pageWidth - margin, currentY + 8);

      nextLine(1.5);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.text('Data: ___/___/______', margin, currentY);

      console.log('✅ PDF de Negociação gerado com sucesso');
      const blob = pdf.output('blob');
      console.log('📦 Blob de Negociação criado:', blob.size, 'bytes');
      return blob;
    } catch (error: any) {
      console.error('❌ Erro na geração do PDF de Negociação:', error);
      throw new Error(`Falha na geração do PDF de Negociação: ${error.message}`);
    }
  }
}
