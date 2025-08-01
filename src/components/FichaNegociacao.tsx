import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, AlertTriangle, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { PDFGenerator, DadosCliente, DadosNegociacao } from '@/lib/pdfGenerator';
import { EmailJsService } from '@/lib/emailJsService';
import { FichaStorageService } from '@/lib/fichaStorageService';
import { SessionService } from '@/lib/sessionService';
import SessionHeader from '@/components/SessionHeader';

interface ParcelaPagaSala {
  id: string;
  tipo: string;
  valorTotal: string;
  valorDistribuido: string;
  quantidadeCotas: string;
  formasPagamento: string[];
}

interface Contrato {
  id: string;
  tipoContrato: string;
  empreendimento: string;
  empreendimentoId?: string;
  torre: string;
  apartamento: string;
  cota: string;
  categoriaPreco: string;
  valor: string;
}

interface InformacaoPagamento {
  id: string;
  tipo: string;
  total: string;
  qtdParcelas: string;
  valorParcela: string;
  formaPagamento: string;
  primeiroVencimento: string;
}

interface Empreendimento {
  id: string;
  nome: string;
  descricao?: string;
}

interface CategoriaPreco {
  categoria_preco: string;
  vir_cota: number;
  empreendimento_id: string;
  total_entrada?: number;
  total_sinal?: number;
  total_saldo?: number;
  sinal_qtd?: number;
  saldo_qtd?: number;
  percentual_entrada?: number;
  percentual_sinal?: number;
  percentual_saldo?: number;
}

interface Torre {
  id: string;
  nome: string;
  empreendimento_id: string;
}

interface DadosCalculados {
  valorTotal: number;
  valorSinal: number;
  valorSaldo: number;
  maxParcelasSinal: number;
  maxParcelasSaldo: number;
}

const FichaNegociacao = () => {
  const navigate = useNavigate();
  const [liner, setLiner] = useState('');
  const [closer, setCloser] = useState('');
  const [liderSala, setLiderSala] = useState('');
  const [nomeSala, setNomeSala] = useState('');
  const [tipoVenda, setTipoVenda] = useState('');
  const [parcelasPagasSala, setParcelasPagasSala] = useState<ParcelaPagaSala[]>([{
    id: '1',
    tipo: 'Entrada',
    valorTotal: '',
    valorDistribuido: '',
    quantidadeCotas: '',
    formasPagamento: ['']
  }]);
  const [contratos, setContratos] = useState<Contrato[]>([{
    id: '1',
    tipoContrato: '',
    empreendimento: '',
    empreendimentoId: '',
    torre: '',
    apartamento: '',
    cota: '',
    categoriaPreco: '',
    valor: ''
  }]);
  const [informacoesPagamento, setInformacoesPagamento] = useState<InformacaoPagamento[]>([
    { id: '1', tipo: '1ª Entrada', total: '', qtdParcelas: '', valorParcela: '', formaPagamento: '', primeiroVencimento: '' },
    { id: '2', tipo: 'Restante da Entrada', total: '', qtdParcelas: '', valorParcela: '', formaPagamento: '', primeiroVencimento: '' },
    { id: '4', tipo: 'Sinal', total: '', qtdParcelas: '', valorParcela: '', formaPagamento: '', primeiroVencimento: '' },
    { id: '5', tipo: 'Saldo', total: '', qtdParcelas: '', valorParcela: '', formaPagamento: '', primeiroVencimento: '' }
  ]);

  // Estados para dados do Supabase
  const [empreendimentos, setEmpreendimentos] = useState<Empreendimento[]>([]);
  const [categoriasPreco, setCategoriasPreco] = useState<CategoriaPreco[]>([]);
  const [torres, setTorres] = useState<Torre[]>([]);

  // Função para sincronizar formas de pagamento da primeira entrada
  const sincronizarFormasPagamento = (formasPagamento: string[]) => {
    setInformacoesPagamento(prev => {
      const novasInformacoes = [...prev];
      const primeiraEntradaIndex = novasInformacoes.findIndex(info => info.tipo === '1ª Entrada');

      if (primeiraEntradaIndex !== -1 && formasPagamento.length > 0) {
        // Pegar a primeira forma de pagamento válida
        const primeiraForma = formasPagamento.find(forma => forma && forma.trim() !== '');
        if (primeiraForma) {
          novasInformacoes[primeiraEntradaIndex].formaPagamento = primeiraForma;
        }
      }

      return novasInformacoes;
    });
  };
  const [loading, setLoading] = useState(true);

  // Estados para alertas de autorização
  const [alertas, setAlertas] = useState<{[key: string]: string}>({});

  // Função para validar primeira entrada
  const validarPrimeiraEntrada = (valor: number): string | null => {
    if (valor < 1000) {
      return 'ERRO: Primeira entrada não pode ser menor que R$ 1.000,00';
    }
    if (valor === 1000) {
      return 'Precisa de autorização do líder de sala';
    }
    if (valor > 1330) {
      return null; // Sem mensagem
    }
    return 'Precisa de autorização do líder de sala';
  };

  // Função para validar restante da entrada
  const validarRestanteEntrada = (qtdParcelas: number): string | null => {
    if (qtdParcelas <= 2) {
      return null; // Sem mensagem
    }
    return 'Precisa de autorização do líder de sala';
  };

  // Função para validar data do primeiro vencimento do sinal
  const validarDataVencimentoSinal = (dataVencimento: string): string | null => {
    if (!dataVencimento) return null;
    
    const hoje = new Date();
    const vencimento = new Date(dataVencimento);
    const diferencaDias = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 3600 * 24));
    
    if (diferencaDias <= 150) {
      return null; // Sem alerta
    }
    if (diferencaDias <= 210) {
      return 'Precisa de autorização do regional';
    }
    return 'Precisa de autorização da diretoria';
  };

  // Função para auditoria de valores
  const realizarAuditoriaValores = (): { valida: boolean; detalhes: string } => {
    const contratoAtivo = contratos.find(c => c.empreendimentoId && c.valor);
    if (!contratoAtivo) {
      return { valida: false, detalhes: 'Nenhum contrato válido encontrado' };
    }

    const valorTotal = parseFloat(contratoAtivo.valor) || 0;
    
    // Somar todas as entradas
    const totalEntradas = informacoesPagamento
      .filter(info => info.tipo.includes('ª Entrada') || info.tipo === 'Restante da Entrada')
      .reduce((total, info) => total + (parseFloat(info.total) || 0), 0);
    
    const sinalInfo = informacoesPagamento.find(info => info.tipo === 'Sinal');
    const saldoInfo = informacoesPagamento.find(info => info.tipo === 'Saldo');
    
    const valorSinal = parseFloat(sinalInfo?.total || '0');
    const valorSaldo = parseFloat(saldoInfo?.total || '0');
    
    const somaTotal = totalEntradas + valorSinal + valorSaldo;
    const diferenca = Math.abs(valorTotal - somaTotal);
    
    return {
      valida: diferenca < 0.01, // Tolerância para erros de arredondamento
      detalhes: `Valor Total: R$ ${valorTotal.toFixed(2)} | Entradas: R$ ${totalEntradas.toFixed(2)} | Sinal: R$ ${valorSinal.toFixed(2)} | Saldo: R$ ${valorSaldo.toFixed(2)} | Diferen��a: R$ ${diferenca.toFixed(2)}`
    };
  };

  // Função para atualizar alertas (com hierarquia - mostrar apenas o de maior prioridade)
  const atualizarAlertas = () => {
    const alertasTemp: Array<{key: string, nivel: number, mensagem: string}> = [];
    
    // Validar primeira entrada (nível 1 - líder de sala)
    const primeiraEntrada = informacoesPagamento.find(info => info.tipo === '1ª Entrada');
    if (primeiraEntrada?.total) {
      const valor = parseFloat(primeiraEntrada.total);
      const alerta = validarPrimeiraEntrada(valor);
      if (alerta) {
        const nivel = alerta.includes('ERRO') ? 0 : 1; // Erro tem prioridade máxima
        alertasTemp.push({key: 'primeira_entrada', nivel, mensagem: alerta});
      }
    }
    
    // Validar restante da entrada (nível 1 - líder de sala)
    const restanteEntrada = informacoesPagamento.find(info => info.tipo === 'Restante da Entrada');
    if (restanteEntrada?.qtdParcelas) {
      const qtd = parseInt(restanteEntrada.qtdParcelas);
      const alerta = validarRestanteEntrada(qtd);
      if (alerta) {
        alertasTemp.push({key: 'restante_entrada', nivel: 1, mensagem: alerta});
      }
    }
    
    // Validar data do sinal (nível 2 - regional, n��vel 3 - diretoria)
    const sinalInfo = informacoesPagamento.find(info => info.tipo === 'Sinal');
    if (sinalInfo?.primeiroVencimento) {
      const alerta = validarDataVencimentoSinal(sinalInfo.primeiroVencimento);
      if (alerta) {
        const nivel = alerta.includes('diretoria') ? 3 : 2;
        alertasTemp.push({key: 'data_sinal', nivel, mensagem: alerta});
      }
    }
    
    // Validar datas para sinal e saldo (apenas dias 05 ou 15)
    const validarDiaVencimento = (info: InformacaoPagamento) => {
      if (info.primeiroVencimento && (info.tipo === 'Sinal' || info.tipo === 'Saldo')) {
        const data = new Date(info.primeiroVencimento);
        const dia = data.getDate();
        if (dia !== 5 && dia !== 15) {
          return `${info.tipo}: Data deve ser dia 05 ou 15 do mês`;
        }
      }
      return null;
    };
    
    informacoesPagamento.forEach(info => {
      const alertaData = validarDiaVencimento(info);
      if (alertaData) {
        alertasTemp.push({key: `data_${info.tipo}`, nivel: 0, mensagem: `ERRO: ${alertaData}`});
      }
    });
    
    // Mostrar apenas o alerta de maior prioridade (maior nível)
    if (alertasTemp.length > 0) {
      const alertaMaximo = alertasTemp.reduce((max, current) => 
        current.nivel > max.nivel ? current : max
      );
      setAlertas({[alertaMaximo.key]: alertaMaximo.mensagem});
    } else {
      setAlertas({});
    }
  };

  // Função para calcular data inteligente baseada em parcelas - sempre dia 15
  const calcularDataInteligente = (dataBase: Date, mesesParaAdicionar: number): Date => {
    // Criar uma nova data a partir da string para evitar problemas de timezone
    const dataBaseStr = dataBase.toISOString().split('T')[0]; // YYYY-MM-DD
    const [ano, mes, dia] = dataBaseStr.split('-').map(Number);
    
    // Criar nova data com o mês ajustado
    let novoAno = ano;
    let novoMes = mes + mesesParaAdicionar;
    
    // Ajustar ano se necessário
    while (novoMes > 12) {
      novoMes -= 12;
      novoAno += 1;
    }
    
    // Sempre criar com dia 15
    const novaData = new Date(novoAno, novoMes - 1, 15); // mes - 1 porque Date usa base 0
    
    return novaData;
  };

  // Função para atualizar datas automaticamente baseado na entrada restante
  const atualizarDatasInteligentes = (dataEntradaRestante: string, qtdParcelasEntrada: number, qtdParcelasSinal: number) => {
    if (!dataEntradaRestante || qtdParcelasEntrada <= 0) return;
    
    const dataBase = new Date(dataEntradaRestante);
    
    // Calcular data do sinal: data base + quantidade de parcelas da entrada restante
    const dataSinal = calcularDataInteligente(dataBase, qtdParcelasEntrada);
    
    // Calcular data do saldo: data do sinal + quantidade de parcelas do sinal
    const dataSaldo = calcularDataInteligente(dataSinal, qtdParcelasSinal || 1);
    
    // Atualizar as informações de pagamento
    const novasInformacoes = [...informacoesPagamento];
    
    const sinalIndex = novasInformacoes.findIndex(info => info.tipo === 'Sinal');
    if (sinalIndex !== -1) {
      novasInformacoes[sinalIndex].primeiroVencimento = dataSinal.toISOString().split('T')[0];
    }
    
    const saldoIndex = novasInformacoes.findIndex(info => info.tipo === 'Saldo');
    if (saldoIndex !== -1) {
      novasInformacoes[saldoIndex].primeiroVencimento = dataSaldo.toISOString().split('T')[0];
    }
    
    setInformacoesPagamento(novasInformacoes);
  };

  // Função para recalcular restante da entrada
  const recalcularRestanteEntrada = (informacoes: InformacaoPagamento[]) => {
    const contratoAtivo = contratos.find(c => c.empreendimentoId);
    if (!contratoAtivo) return informacoes;

    const empreendimento = empreendimentos.find(emp => emp.id === contratoAtivo.empreendimentoId);
    const valorEntrada = empreendimento ? calcularValorEntrada(empreendimento.nome) : 0;
    
    // Calcular total das entradas (1ª, 2ª, etc.)
    const totalEntradas = informacoes
      .filter(info => info.tipo.includes('ª Entrada'))
      .reduce((total, info) => total + (parseFloat(info.total) || 0), 0);
    
    const restante = valorEntrada - totalEntradas;
    
    // Atualizar restante da entrada
    const novasInformacoes = [...informacoes];
    const restanteEntradaIndex = novasInformacoes.findIndex(info => info.tipo === 'Restante da Entrada');
    
    if (restanteEntradaIndex !== -1) {
      if (restante > 0) {
        novasInformacoes[restanteEntradaIndex].total = restante.toString();
        novasInformacoes[restanteEntradaIndex].valorParcela = (restante / (parseInt(novasInformacoes[restanteEntradaIndex].qtdParcelas) || 1)).toFixed(2);
      } else {
        novasInformacoes[restanteEntradaIndex].total = '0';
        novasInformacoes[restanteEntradaIndex].valorParcela = '0';
        novasInformacoes[restanteEntradaIndex].qtdParcelas = '1';
      }
    }
    
    return novasInformacoes;
  };

  // Executar valida��ões sempre que informações mudarem
  useEffect(() => {
    atualizarAlertas();
  }, [informacoesPagamento, contratos]);

  // Recalcular restante da entrada quando contratos/empreendimentos mudarem
  useEffect(() => {
    if (contratos.length > 0 && empreendimentos.length > 0) {
      const informacoesAtualizadas = recalcularRestanteEntrada(informacoesPagamento);
      if (JSON.stringify(informacoesAtualizadas) !== JSON.stringify(informacoesPagamento)) {
        setInformacoesPagamento(informacoesAtualizadas);
      }    
    }
  }, [contratos, empreendimentos]);

  // Carregar dados do Supabase
  useEffect(() => {
    const carregarDados = async () => {
      try {
        // Carregar empreendimentos
        const { data: empreendimentosData, error: errorEmpreendimentos } = await supabase
          .from('empreendimentos')
          .select('*')
          .eq('status', 'ATIVO');

        if (errorEmpreendimentos) throw errorEmpreendimentos;
        setEmpreendimentos(empreendimentosData || []);

        // Carregar categorias de preço das vendas normais com todos os campos (apenas registros mais recentes)
        const { data: tiposVendaNormal, error: errorTiposVenda } = await supabase
          .from('tipos_venda_normal')
          .select('categoria_preco, vir_cota, empreendimento_id, total_entrada, total_sinal, total_saldo, sinal_qtd, saldo_qtd, percentual_entrada, percentual_sinal, percentual_saldo, created_at')
          .order('created_at', { ascending: false });

        if (errorTiposVenda) throw errorTiposVenda;
        
        // Filtrar apenas o registro mais recente de cada categoria por empreendimento
        const categoriasUnicas = tiposVendaNormal?.reduce((acc, curr) => {
          const key = `${curr.empreendimento_id}-${curr.categoria_preco}`;
          if (!acc[key] || new Date(curr.created_at) > new Date(acc[key].created_at)) {
            acc[key] = curr;
          }
          return acc;
        }, {} as Record<string, any>);
        
        setCategoriasPreco(Object.values(categoriasUnicas || {}));

        // Carregar torres
        const { data: torresData, error: errorTorres } = await supabase
          .from('torres')
          .select('*');

        if (errorTorres) throw errorTorres;
        setTorres(torresData || []);

      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, []);

  // Filtrar categorias por empreendimento
  const getCategoriasPorEmpreendimento = (empreendimentoId: string) => {
    return categoriasPreco.filter(cat => cat.empreendimento_id === empreendimentoId);
  };

  // Filtrar torres por empreendimento
  const getTorresPorEmpreendimento = (empreendimentoId: string) => {
    return torres.filter(torre => torre.empreendimento_id === empreendimentoId);
  };

  // Calcular dados automaticamente baseado na categoria
  const calcularDadosCategoria = (empreendimentoId: string, categoriaPreco: string): DadosCalculados | null => {
    const categoria = categoriasPreco.find(cat => 
      cat.empreendimento_id === empreendimentoId && cat.categoria_preco === categoriaPreco
    );

    if (!categoria) return null;

    return {
      valorTotal: categoria.vir_cota || 0,
      valorSinal: categoria.total_sinal || 0,
      valorSaldo: categoria.total_saldo || 0,
      maxParcelasSinal: categoria.sinal_qtd || 1,
      maxParcelasSaldo: categoria.saldo_qtd || 1
    };
  };

  // Função para calcular o total de todas as entradas (1ª, 2ª, 3ª, etc.)
  const calcularTotalEntradas = (informacoes: InformacaoPagamento[]): number => {
    return informacoes
      .filter(info => info.tipo.includes('ª Entrada'))
      .reduce((total, info) => total + (parseFloat(info.total) || 0), 0);
  };

  // Função para calcular valor de entrada baseado no empreendimento
  const calcularValorEntrada = (empreendimentoNome: string): number => {
    const empreendimentosEspeciais = ['Gran Garden', 'Gran Valley'];
    return empreendimentosEspeciais.includes(empreendimentoNome) ? 4490 : 3990;
  };

  // Preencher automaticamente informações de pagamento
  const preencherInformacoesPagamento = (dados: DadosCalculados, empreendimentoId?: string) => {
    // Buscar nome do empreendimento se fornecido
    const empreendimento = empreendimentoId ? empreendimentos.find(emp => emp.id === empreendimentoId) : null;
    const valorEntrada = empreendimento ? calcularValorEntrada(empreendimento.nome) : 0;

    const novasInformacoes = informacoesPagamento.map(info => {
      // Não preencher automaticamente a 1ª Entrada, deixar que seja sincronizada pelo "Valor Distribuído"
      if (info.tipo === 'Sinal') {
        return {
          ...info,
          total: dados.valorSinal.toString(),
          qtdParcelas: dados.maxParcelasSinal.toString(),
          valorParcela: (dados.valorSinal / dados.maxParcelasSinal).toFixed(2)
        };
      }
      if (info.tipo === 'Saldo') {
        return {
          ...info,
          total: dados.valorSaldo.toString(),
          qtdParcelas: dados.maxParcelasSaldo.toString(),
          valorParcela: (dados.valorSaldo / dados.maxParcelasSaldo).toFixed(2)
        };
      }
      return info;
    });
    setInformacoesPagamento(novasInformacoes);
  };

  // Validar quantidade de parcelas
  const validarQuantidadeParcelas = (tipo: string, quantidade: number, empreendimentoId: string, categoriaPreco: string): boolean => {
    const dados = calcularDadosCategoria(empreendimentoId, categoriaPreco);
    if (!dados) return true;

    if (tipo === 'Sinal' && quantidade > dados.maxParcelasSinal) return false;
    if (tipo === 'Saldo' && quantidade > dados.maxParcelasSaldo) return false;
    return true;
  };

  const adicionarFormaPagamento = (parcelaId: string) => {
    const newParcelas = [...parcelasPagasSala];
    const parcelaIndex = newParcelas.findIndex(p => p.id === parcelaId);
    if (parcelaIndex !== -1) {
      newParcelas[parcelaIndex].formasPagamento.push('');
      setParcelasPagasSala(newParcelas);
    }
  };

  const adicionarParcelaPagaSala = () => {
    setParcelasPagasSala([...parcelasPagasSala, {
      id: Date.now().toString(),
      tipo: '',
      valorTotal: '',
      valorDistribuido: '',
      quantidadeCotas: '',
      formasPagamento: ['']
    }]);
  };

  const removerParcelaPagaSala = (id: string) => {
    setParcelasPagasSala(parcelasPagasSala.filter(p => p.id !== id));
  };

  const adicionarContrato = () => {
    setContratos([...contratos, {
      id: Date.now().toString(),
      tipoContrato: '',
      empreendimento: '',
      empreendimentoId: '',
      torre: '',
      apartamento: '',
      cota: '',
      categoriaPreco: '',
      valor: ''
    }]);
  };

  const removerContrato = (id: string) => {
    setContratos(contratos.filter(c => c.id !== id));
  };

  const adicionarEntrada = () => {
    // Contar quantas entradas já existem para numerar a nova
    const entradasExistentes = informacoesPagamento.filter(info => info.tipo.includes('ª Entrada'));
    const proximoNumero = entradasExistentes.length + 1;
    const novoTipo = `${proximoNumero}ª Entrada`;
    
    setInformacoesPagamento([...informacoesPagamento, {
      id: Date.now().toString(),
      tipo: novoTipo,
      total: '',
      qtdParcelas: '',
      valorParcela: '',
      formaPagamento: '',
      primeiroVencimento: ''
    }]);
  };

  const removerInformacaoPagamento = (id: string) => {
    setInformacoesPagamento(informacoesPagamento.filter(i => i.id !== id));
  };

  const limparFicha = () => {
    setLiner('');
    setCloser('');
    setTipoVenda('');
    setParcelasPagasSala([{
      id: '1',
      tipo: 'Entrada',
      valorTotal: '',
      valorDistribuido: '',
      quantidadeCotas: '',
      formasPagamento: ['']
    }]);
    setContratos([{
      id: '1',
      tipoContrato: '',
      empreendimento: '',
      empreendimentoId: '',
      torre: '',
      apartamento: '',
      cota: '',
      categoriaPreco: '',
      valor: ''
    }]);
    setInformacoesPagamento([
      { id: '1', tipo: '1ª Entrada', total: '', qtdParcelas: '', valorParcela: '', formaPagamento: '', primeiroVencimento: '' },
      { id: '2', tipo: 'Restante da Entrada', total: '', qtdParcelas: '', valorParcela: '', formaPagamento: '', primeiroVencimento: '' },
      { id: '3', tipo: '2ª Entrada', total: '', qtdParcelas: '', valorParcela: '', formaPagamento: '', primeiroVencimento: '' },
      { id: '4', tipo: 'Sinal', total: '', qtdParcelas: '', valorParcela: '', formaPagamento: '', primeiroVencimento: '' },
      { id: '5', tipo: 'Saldo', total: '', qtdParcelas: '', valorParcela: '', formaPagamento: '', primeiroVencimento: '' }
    ]);
  };

  const salvarFicha = async () => {
    try {
      console.log('🚀 Iniciando processo de salvamento...');

      // Validar campos obrigatórios
      if (!liner.trim()) {
        alert('❌ Campo LINER é obrigatório!');
        return;
      }

      // Verificar se há alertas críticos (apenas erros, não avisos)
      const alertasCriticos = Object.values(alertas).filter(alerta =>
        alerta.includes('ERRO') && !alerta.includes('AVISO')
      );

      if (alertasCriticos.length > 0) {
        console.warn('⚠️ Alertas encontrados:', alertasCriticos);
        // Mostrar alerta mas permitir continuar se for apenas aviso
        if (alertasCriticos.some(alerta => alerta.includes('CRÍTICO'))) {
          alert('Não é possível salvar devido a erros críticos. Verifique os campos obrigatórios.');
          return;
        }
      }

      // Recuperar dados do cliente
      const dadosClienteString = localStorage.getItem('dadosCliente');
      if (!dadosClienteString) {
        alert('Dados do cliente não encontrados. Volte ao cadastro do cliente.');
        return;
      }

      const dadosCliente: DadosCliente = JSON.parse(dadosClienteString);

      // Preparar dados da negociação
      const dadosNegociacao: DadosNegociacao = {
        liner,
        closer,
        liderSala,
        nomeSala,
        tipoVenda,
        parcelasPagasSala,
        contratos,
        informacoesPagamento
      };

      // Obter nome do consultor da sessão
      const session = SessionService.getSession();
      const nomeConsultor = session?.nome || 'Consultor não identificado';

      console.log('💾 Salvando ficha para administração...');

      // Salvar ficha para os administradores
      const fichaId = FichaStorageService.salvarFicha(dadosCliente, dadosNegociacao, nomeConsultor);

      console.log('✅ Processo concluído com sucesso!');
      alert(`✅ Ficha salva com sucesso!\n\nID da Ficha: ${fichaId}\n\nA ficha foi enviada para a administração e estará disponível para impressão.`);

    } catch (error: any) {
      console.error('❌ Erro no processo de salvamento:', error);
      alert(`❌ Erro ao processar a ficha: ${error.message || 'Erro desconhecido'}`);
    }
  };

  const enviarPorEmailJS = async () => {
    try {
      console.log('📧 Iniciando processo de envio via EmailJS...');

      // Verificar se há alertas críticos (apenas erros, não avisos)
      const alertasCriticos = Object.values(alertas).filter(alerta =>
        alerta.includes('ERRO') && !alerta.includes('AVISO')
      );

      if (alertasCriticos.length > 0) {
        console.warn('⚠️ Alertas encontrados:', alertasCriticos);
        if (alertasCriticos.some(alerta => alerta.includes('CRÍTICO'))) {
          alert('Não é possível enviar devido a erros críticos. Verifique os campos obrigatórios.');
          return;
        }
      }

      // Recuperar dados do cliente
      const dadosClienteString = localStorage.getItem('dadosCliente');
      if (!dadosClienteString) {
        alert('Dados do cliente não encontrados. Volte ao cadastro do cliente.');
        return;
      }

      const dadosCliente: DadosCliente = JSON.parse(dadosClienteString);

      // Preparar dados da negociação
      const dadosNegociacao: DadosNegociacao = {
        liner,
        closer,
        liderSala,
        nomeSala,
        tipoVenda,
        parcelasPagasSala,
        contratos,
        informacoesPagamento
      };

      console.log('📧 Enviando ficha via EmailJS...');

      // Enviar ficha via EmailJS
      const resultado = await EmailJsService.enviarFichaPorEmail({
        clientData: dadosCliente,
        fichaData: dadosNegociacao
      });

      if (resultado.success) {
        console.log('✅ Processo concluído com sucesso!');
        alert(`��� Ficha enviada com sucesso por email!\n\n${resultado.message}`);
      } else {
        console.error('❌ Falha no envio:', resultado.message);
        alert(`❌ Erro no envio: ${resultado.message}`);
      }

    } catch (error: any) {
      console.error('�� Erro no processo de envio:', error);
      alert(`❌ Erro ao enviar a ficha: ${error.message || 'Erro desconhecido'}`);
    }
  };

  const imprimirFichas = () => {
    try {
      console.log('🖨️ Iniciando processo de impressão...');

      // Recuperar dados do cliente
      const dadosClienteString = localStorage.getItem('dadosCliente');
      if (!dadosClienteString) {
        alert('Dados do cliente não encontrados. Volte ao cadastro do cliente.');
        return;
      }

      const dadosCliente: DadosCliente = JSON.parse(dadosClienteString);
      console.log('📋 Dados do cliente recuperados:', dadosCliente);

      // Preparar dados da negociação
      const dadosNegociacao: DadosNegociacao = {
        liner,
        closer,
        liderSala,
        nomeSala,
        tipoVenda,
        parcelasPagasSala,
        contratos,
        informacoesPagamento
      };

      console.log('💼 Dados da negociação preparados:', dadosNegociacao);
      console.log('📄 Gerando PDFs para impressão...');

      // Gerar PDFs como blob URLs para impressão
      const pdfCadastroBlob = PDFGenerator.gerarPDFCadastroClienteBlob(dadosCliente);
      const pdfNegociacaoBlob = PDFGenerator.gerarPDFNegociacaoBlob(dadosCliente, dadosNegociacao);

      console.log('🖨️ Abrindo PDFs para impressão...');

      // Criar URLs para os blobs
      const urlCadastro = URL.createObjectURL(pdfCadastroBlob);
      const urlNegociacao = URL.createObjectURL(pdfNegociacaoBlob);

      // Abrir PDFs em novas janelas para impressão
      const janelaCadastro = window.open(urlCadastro, '_blank');
      const janelaNegociacao = window.open(urlNegociacao, '_blank');

      // Aguardar carregamento e imprimir
      setTimeout(() => {
        if (janelaCadastro) {
          janelaCadastro.print();
        }
        if (janelaNegociacao) {
          janelaNegociacao.print();
        }

        // Limpar URLs após uso
        setTimeout(() => {
          URL.revokeObjectURL(urlCadastro);
          URL.revokeObjectURL(urlNegociacao);
        }, 5000);
      }, 1500);

      console.log('✅ PDFs abertos para impressão!');

    } catch (error: any) {
      console.error('❌ Erro na impressão:', error);
      alert(`❌ Erro ao gerar PDFs para impressão: ${error.message || 'Erro desconhecido'}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SessionHeader />
      <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/cadastro-cliente')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <CardTitle className="text-2xl font-bold">
              Ficha de Negociação de Cota
            </CardTitle>
            <div className="w-20" /> {/* Spacer for centering */}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Seção Inicial */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="liner">LINER: *</Label>
              <Input
                id="liner"
                value={liner}
                onChange={(e) => setLiner(e.target.value)}
                className="mt-1"
                required
                placeholder="Nome do liner (obrigatório)"
              />
            </div>
            <div>
              <Label htmlFor="closer">CLOSER:</Label>
              <Input
                id="closer"
                value={closer}
                onChange={(e) => setCloser(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="liderSala">LÍDER DE SALA:</Label>
              <Input
                id="liderSala"
                value={liderSala}
                onChange={(e) => setLiderSala(e.target.value)}
                className="mt-1"
                placeholder="Nome do líder de sala"
              />
            </div>
            <div>
              <Label htmlFor="nomeSala">NOME DA SALA:</Label>
              <Input
                id="nomeSala"
                value={nomeSala}
                onChange={(e) => setNomeSala(e.target.value)}
                className="mt-1"
                placeholder="Nome da sala de vendas"
              />
            </div>
          </div>

          {/* Tipo de Venda */}
          <div>
            <Label className="text-base font-semibold">TIPO DE VENDA: *</Label>
            <RadioGroup value={tipoVenda} onValueChange={setTipoVenda} className="mt-2">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="semestral" id="semestral" />
                  <Label htmlFor="semestral">Semestral</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="anual" id="anual" />
                  <Label htmlFor="anual">Anual</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="a-vista" id="a-vista" />
                  <Label htmlFor="a-vista">À Vista</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ate-36x" id="ate-36x" />
                  <Label htmlFor="ate-36x">Até 36x</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="padrao" id="padrao" />
                  <Label htmlFor="padrao">Padrão</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="linear" id="linear" />
                  <Label htmlFor="linear">Linear</Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {/* Tipo de Parcela Paga em Sala */}
          <div>
            <Label className="text-lg font-semibold">Tipo de Parcela Paga em Sala *</Label>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full border border-border">
                <thead>
                  <tr className="bg-muted">
                    <th className="border border-border p-3 text-left">Tipo de Parcela Paga em Sala</th>
                    <th className="border border-border p-3 text-left">Valor Total Pago em Sala *</th>
                    <th className="border border-border p-3 text-left">Valor Distribuído para cada Unidade *</th>
                    <th className="border border-border p-3 text-left">Quantidade de Cotas *</th>
                    <th className="border border-border p-3 text-left">Forma de Pag. *</th>
                    <th className="border border-border p-3 text-left">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {parcelasPagasSala.map((parcela, index) => (
                    <tr key={parcela.id}>
                      <td className="border border-border p-3">
                        <Input
                          value={parcela.tipo}
                          onChange={(e) => {
                            const newParcelas = [...parcelasPagasSala];
                            newParcelas[index].tipo = e.target.value;
                            setParcelasPagasSala(newParcelas);
                          }}
                          placeholder="Tipo de parcela"
                        />
                      </td>
                      <td className="border border-border p-3">
                        <Input
                          value={parcela.valorTotal}
                          onChange={(e) => {
                            const newParcelas = [...parcelasPagasSala];
                            newParcelas[index].valorTotal = e.target.value;
                            setParcelasPagasSala(newParcelas);
                          }}
                          placeholder="Valor total"
                          type="number"
                        />
                      </td>
                       <td className="border border-border p-3">
                         <Input
                           value={parcela.valorDistribuido}
                             onChange={(e) => {
                              const newParcelas = [...parcelasPagasSala];
                              newParcelas[index].valorDistribuido = e.target.value;
                              setParcelasPagasSala(newParcelas);

                                // Clonar valor para 1ª Entrada automaticamente
                                const novasInformacoes = [...informacoesPagamento];
                                const primeiraEntradaIndex = novasInformacoes.findIndex(info => info.tipo === '1ª Entrada');
                                if (primeiraEntradaIndex !== -1) {
                                  novasInformacoes[primeiraEntradaIndex].total = e.target.value;
                                  novasInformacoes[primeiraEntradaIndex].valorParcela = e.target.value;
                                  novasInformacoes[primeiraEntradaIndex].qtdParcelas = '1';
                                  
                                  // Preencher forma de pagamento automaticamente se estiver vazia
                                  if (!novasInformacoes[primeiraEntradaIndex].formaPagamento && parcela.formasPagamento[0]) {
                                    novasInformacoes[primeiraEntradaIndex].formaPagamento = parcela.formasPagamento[0];
                                  }
                                }
                                
                                // Recalcular restante da entrada
                                const informacoesAtualizadas = recalcularRestanteEntrada(novasInformacoes);
                                setInformacoesPagamento(informacoesAtualizadas);
                            }}
                           placeholder="Valor distribuído"
                           type="number"
                         />
                       </td>
                      <td className="border border-border p-3">
                        <Input
                          value={parcela.quantidadeCotas}
                          onChange={(e) => {
                            const newParcelas = [...parcelasPagasSala];
                            newParcelas[index].quantidadeCotas = e.target.value;
                            setParcelasPagasSala(newParcelas);
                          }}
                          placeholder="Qtd cotas"
                          type="number"
                        />
                      </td>
                      <td className="border border-border p-3">
                        <div className="space-y-2">
                          {parcela.formasPagamento.map((forma, formaIndex) => (
                            <div key={formaIndex} className="flex items-center space-x-2">
                              <Select
                                value={forma}
                                onValueChange={(value) => {
                                  const newParcelas = [...parcelasPagasSala];
                                  newParcelas[index].formasPagamento[formaIndex] = value;
                                  setParcelasPagasSala(newParcelas);

                                  // Se for a primeira entrada (tipo "Entrada"), sincronizar com informações de pagamento
                                  if (parcela.tipo === 'Entrada') {
                                    sincronizarFormasPagamento(newParcelas[index].formasPagamento);
                                  }
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione forma" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                                  <SelectItem value="cartao-credito">Cartão de Crédito</SelectItem>
                                  <SelectItem value="cartao-debito">Cartão de Débito</SelectItem>
                                  <SelectItem value="pix">PIX</SelectItem>
                                  <SelectItem value="transferencia">Transferência</SelectItem>
                                  <SelectItem value="boleto">Boleto</SelectItem>
                                </SelectContent>
                              </Select>
                              {parcela.formasPagamento.length > 1 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const newParcelas = [...parcelasPagasSala];
                                    newParcelas[index].formasPagamento = newParcelas[index].formasPagamento.filter((_, i) => i !== formaIndex);
                                    setParcelasPagasSala(newParcelas);
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          ))}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => adicionarFormaPagamento(parcela.id)}
                            className="w-full"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Adicionar Forma de Pagamento
                          </Button>
                        </div>
                      </td>
                      <td className="border border-border p-3">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removerParcelaPagaSala(parcela.id)}
                          disabled={parcelasPagasSala.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Separator />

          {/* Contratos */}
          <div>
            <Label className="text-lg font-semibold">Contratos *</Label>
            <Button onClick={adicionarContrato} className="mt-2 mb-4" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Contrato
            </Button>
            <div className="overflow-x-auto">
              <table className="w-full border border-border">
                <thead>
                  <tr className="bg-muted">
                    <th className="border border-border p-3 text-left">Tipo de Contrato *</th>
                    <th className="border border-border p-3 text-left">Empreendimento *</th>
                    <th className="border border-border p-3 text-left">Torre *</th>
                    <th className="border border-border p-3 text-left">Apartamento *</th>
                    <th className="border border-border p-3 text-left">Cota *</th>
                    <th className="border border-border p-3 text-left">Categoria de Preço *</th>
                    <th className="border border-border p-3 text-left">Valor *</th>
                    <th className="border border-border p-3 text-left">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {contratos.map((contrato, index) => (
                    <tr key={contrato.id}>
                      <td className="border border-border p-3">
                        <div className="space-y-1">
                          <div className="text-sm text-muted-foreground">Físico</div>
                          <div className="text-sm text-muted-foreground">Digital</div>
                        </div>
                      </td>
                      <td className="border border-border p-3">
                        <Select
                          value={contrato.empreendimentoId || ''}
                          onValueChange={(value) => {
                            const newContratos = [...contratos];
                            // Buscar o nome do empreendimento pelo ID selecionado
                            const empreendimentoSelecionado = empreendimentos.find(emp => emp.id === value);
                            newContratos[index].empreendimento = empreendimentoSelecionado?.nome || value;
                            // Salvar também o ID para usar nas validações
                            newContratos[index].empreendimentoId = value;
                            // Limpar categoria e torre quando mudar empreendimento
                            newContratos[index].categoriaPreco = '';
                            newContratos[index].torre = '';
                            setContratos(newContratos);
                          }}
                          disabled={loading}
                        >
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder={loading ? "Carregando..." : "Selecione empreendimento"} />
                          </SelectTrigger>
                          <SelectContent className="bg-background z-50">
                            {empreendimentos.map((emp) => (
                              <SelectItem key={emp.id} value={emp.id}>
                                {emp.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                       <td className="border border-border p-3">
                         <Input
                           value={contrato.torre}
                           onChange={(e) => {
                             const newContratos = [...contratos];
                             newContratos[index].torre = e.target.value;
                             setContratos(newContratos);
                           }}
                           placeholder="Torre"
                         />
                       </td>
                      <td className="border border-border p-3">
                        <Input
                          value={contrato.apartamento}
                          onChange={(e) => {
                            const newContratos = [...contratos];
                            newContratos[index].apartamento = e.target.value;
                            setContratos(newContratos);
                          }}
                          placeholder="Apartamento"
                        />
                      </td>
                      <td className="border border-border p-3">
                        <Input
                          value={contrato.cota}
                          onChange={(e) => {
                            const newContratos = [...contratos];
                            newContratos[index].cota = e.target.value;
                            setContratos(newContratos);
                          }}
                          placeholder="Cota"
                        />
                      </td>
                      <td className="border border-border p-3">
                        <Select
                          value={contrato.categoriaPreco}
                          onValueChange={(value) => {
                            const newContratos = [...contratos];
                            newContratos[index].categoriaPreco = value;
                            // Auto-preencher valor baseado na categoria selecionada
                            const categoria = categoriasPreco.find(cat =>
                              cat.categoria_preco === value && cat.empreendimento_id === contrato.empreendimentoId
                            );
                            if (categoria) {
                              newContratos[index].valor = categoria.vir_cota.toString();
                              
                               // Preencher automaticamente as informações de pagamento
                               const dados = calcularDadosCategoria(contrato.empreendimentoId, value);
                               if (dados) {
                                 preencherInformacoesPagamento(dados, contrato.empreendimentoId);
                               }
                            }
                            setContratos(newContratos);
                          }}
                          disabled={!contrato.empreendimentoId || loading}
                        >
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder={
                              !contrato.empreendimentoId
                                ? "Selecione empreendimento primeiro"
                                : "Selecione categoria de preço"
                            } />
                          </SelectTrigger>
                          <SelectContent className="bg-background z-50">
                            {getCategoriasPorEmpreendimento(contrato.empreendimentoId).map((categoria) => (
                              <SelectItem key={categoria.categoria_preco} value={categoria.categoria_preco}>
                                {categoria.categoria_preco} - R$ {categoria.vir_cota.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="border border-border p-3">
                        <Input
                          value={contrato.valor}
                          onChange={(e) => {
                            const newContratos = [...contratos];
                            newContratos[index].valor = e.target.value;
                            setContratos(newContratos);
                          }}
                          placeholder="Valor"
                          type="number"
                        />
                      </td>
                      <td className="border border-border p-3">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removerContrato(contrato.id)}
                          disabled={contratos.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Separator />

          {/* Local para Assinatura */}
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              O financeiro descrito acima �� referente a cada unidade separadamente.
            </p>
            <div className="border-t border-border pt-4">
              <Label className="text-base font-semibold">Assinatura do Cliente</Label>
              <div className="h-16 border border-dashed border-border mt-2 flex items-center justify-center">
                <span className="text-muted-foreground text-sm">Local para Assinatura do Cliente</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Alertas de Validação */}
          {Object.keys(alertas).length > 0 && (
            <div className="border border-destructive rounded-lg p-4 bg-destructive/5 print:hidden">
              <div className="flex items-center space-x-2 mb-3">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <Label className="text-lg font-semibold text-destructive">Alertas de Validação</Label>
              </div>
              <div className="space-y-2">
                {Object.entries(alertas).map(([key, mensagem]) => {
                  const isError = mensagem.includes('ERRO');
                  return (
                    <div key={key} className={`p-3 rounded border ${
                      isError 
                        ? 'border-destructive bg-destructive/10 text-destructive' 
                        : 'border-orange-400 bg-orange-50 text-orange-700'
                    }`}>
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className={`h-4 w-4 ${isError ? 'text-destructive' : 'text-orange-500'}`} />
                        <span className="text-sm font-medium">{mensagem}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Informações de Pagamento */}
          <div>
            <Label className="text-lg font-semibold">Informações de Pagamento</Label>
            <Button onClick={adicionarEntrada} className="mt-2 mb-4" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Entrada
            </Button>
            <div className="overflow-x-auto">
              <table className="w-full border border-border">
                <thead>
                  <tr className="bg-muted">
                    <th className="border border-border p-3 text-left">Tipo</th>
                    <th className="border border-border p-3 text-left">Total *</th>
                    <th className="border border-border p-3 text-left">Qtd. Parcelas *</th>
                    <th className="border border-border p-3 text-left">Valor Parcela *</th>
                    <th className="border border-border p-3 text-left">Forma de Pag. *</th>
                    <th className="border border-border p-3 text-left">1º Vencimento *</th>
                    <th className="border border-border p-3 text-left">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {informacoesPagamento.map((info, index) => (
                    <tr key={info.id}>
                          <td className="border border-border p-3">
                            {info.tipo === 'Restante da Entrada' ? (
                              <span className="text-muted-foreground bg-muted p-2 rounded block text-center">
                                {info.tipo}
                              </span>
                            ) : (
                              <Input
                                value={info.tipo}
                                onChange={(e) => {
                                  const newInfos = [...informacoesPagamento];
                                  newInfos[index].tipo = e.target.value;
                                  setInformacoesPagamento(newInfos);
                                }}
                                placeholder="Tipo"
                                disabled={['1ª Entrada', '2ª Entrada', 'Sinal', 'Saldo'].includes(info.tipo)}
                              />
                            )}
                          </td>
                       <td className="border border-border p-3">
                         <Input
                           value={info.total}
                            onChange={(e) => {
                              const valor = parseFloat(e.target.value) || 0;
                              
                              // Validação específica para 1ª Entrada - não pode ser menor que R$ 1.000
                              if (info.tipo === '1ª Entrada' && valor > 0 && valor < 1000) {
                                return; // Bloqueia valores menores que R$ 1.000 para primeira entrada
                              }

                              const newInfos = [...informacoesPagamento];
                              newInfos[index].total = e.target.value;
                              
                              // Recalcular valor da parcela automaticamente quando alterar total
                              if (newInfos[index].qtdParcelas && parseInt(newInfos[index].qtdParcelas) > 0) {
                                const total = parseFloat(e.target.value) || 0;
                                const qtdParcelas = parseInt(newInfos[index].qtdParcelas);
                                newInfos[index].valorParcela = (total / qtdParcelas).toFixed(2);
                              }
                              
                               // Se for uma entrada (1ª, 2ª, 3ª, etc.), recalcular Restante da Entrada
                                if (info.tipo.includes('ª Entrada')) {
                                  const informacoesAtualizadas = recalcularRestanteEntrada(newInfos);
                                  setInformacoesPagamento(informacoesAtualizadas);
                                } else {
                                  setInformacoesPagamento(newInfos);
                                }
                            }}
                           placeholder="Total"
                           type="number"
                           min={info.tipo === '1ª Entrada' ? 1000 : undefined}
                           className={`bg-background ${
                             info.tipo === '1ª Entrada' && parseFloat(info.total) > 0 && parseFloat(info.total) < 1000 
                               ? 'border-destructive' 
                               : ''
                           }`}
                         />
                       </td>
                       <td className="border border-border p-3">
                         {(() => {
                           // Encontrar o primeiro contrato com empreendimento e categoria preenchidos para validação
                           const contratoAtivo = contratos.find(c => c.empreendimentoId && c.categoriaPreco);
                           const dados = contratoAtivo ? calcularDadosCategoria(contratoAtivo.empreendimentoId, contratoAtivo.categoriaPreco) : null;
                           let maxParcelas = dados ? (info.tipo === 'Sinal' ? dados.maxParcelasSinal : dados.maxParcelasSaldo) : null;
                           
                           // Limitaç��o específica para Restante da Entrada: máximo 5 parcelas
                           if (info.tipo === 'Restante da Entrada') {
                             maxParcelas = 5;
                           }
                           
                           return (
                             <div className="space-y-1">
                               <Input
                                 value={info.qtdParcelas}
                                   onChange={(e) => {
                                     const valor = parseInt(e.target.value) || 0;
                                     if (maxParcelas && valor > maxParcelas) {
                                       return; // Bloqueia entrada superior ao máximo
                                     }
                                     const newInfos = [...informacoesPagamento];
                                     newInfos[index].qtdParcelas = e.target.value;
                                     
                                     // Recalcular valor da parcela automaticamente
                                     if (newInfos[index].total && valor > 0) {
                                       const total = parseFloat(newInfos[index].total);
                                       newInfos[index].valorParcela = (total / valor).toFixed(2);
                                     }
                                     
                                     // Se for Restante da Entrada ou Sinal, recalcular datas inteligentes
                                     if (info.tipo === 'Restante da Entrada' || info.tipo === 'Sinal') {
                                       const restanteEntrada = newInfos.find(inf => inf.tipo === 'Restante da Entrada');
                                       if (restanteEntrada?.primeiroVencimento) {
                                         const qtdParcelasEntrada = info.tipo === 'Restante da Entrada' ? valor : parseInt(restanteEntrada.qtdParcelas) || 1;
                                         const sinalInfo = newInfos.find(inf => inf.tipo === 'Sinal');
                                         const qtdParcelasSinal = info.tipo === 'Sinal' ? valor : parseInt(sinalInfo?.qtdParcelas || '1');
                                         
                                         setTimeout(() => {
                                           atualizarDatasInteligentes(restanteEntrada.primeiroVencimento, qtdParcelasEntrada, qtdParcelasSinal);
                                         }, 0);
                                       }
                                     }
                                     
                                     // Se alterou quantidade de parcelas do Restante da Entrada, recalcular valor da parcela
                                     if (info.tipo === 'Restante da Entrada' && newInfos[index].total) {
                                       const total = parseFloat(newInfos[index].total);
                                       if (total > 0 && valor > 0) {
                                         newInfos[index].valorParcela = (total / valor).toFixed(2);
                                       }
                                     }
                                     
                                     setInformacoesPagamento(newInfos);
                                   }}
                                 placeholder="Qtd"
                                 type="number"
                                 max={maxParcelas || undefined}
                                 className={`${
                                   maxParcelas && parseInt(info.qtdParcelas) > maxParcelas 
                                     ? 'border-destructive' 
                                     : ''
                                 }`}
                               />
                               {maxParcelas && (info.tipo === 'Sinal' || info.tipo === 'Saldo') && (
                                 <div className="text-xs text-muted-foreground">
                                   Máx: {maxParcelas} parcelas
                                 </div>
                               )}
                               {info.tipo === 'Restante da Entrada' && (
                                 <div className="text-xs text-muted-foreground">
                                   Máx: 5 parcelas
                                 </div>
                               )}
                               {maxParcelas && parseInt(info.qtdParcelas) > maxParcelas && (
                                 <div className="text-xs text-destructive">
                                   Limite excedido!
                                 </div>
                               )}
                             </div>
                           );
                         })()}
                      </td>
                      <td className="border border-border p-3">
                        <Input
                          value={info.valorParcela}
                          onChange={(e) => {
                            const newInfos = [...informacoesPagamento];
                            newInfos[index].valorParcela = e.target.value;
                            setInformacoesPagamento(newInfos);
                          }}
                          placeholder="Valor"
                          type="number"
                        />
                      </td>
                      <td className="border border-border p-3">
                        <Select
                          value={info.formaPagamento}
                          onValueChange={(value) => {
                            const newInfos = [...informacoesPagamento];
                            newInfos[index].formaPagamento = value;
                            setInformacoesPagamento(newInfos);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="dinheiro">Dinheiro</SelectItem>
                            <SelectItem value="cartao-credito">Cartão de Crédito</SelectItem>
                            <SelectItem value="cartao-debito">Cartão de Débito</SelectItem>
                            <SelectItem value="pix">PIX</SelectItem>
                            <SelectItem value="transferencia">Transferência</SelectItem>
                            <SelectItem value="boleto">Boleto</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                       <td className="border border-border p-3">
                         <Input
                           value={info.primeiroVencimento}
                           onChange={(e) => {
                             const newInfos = [...informacoesPagamento];
                             newInfos[index].primeiroVencimento = e.target.value;
                             
                             // Se for Restante da Entrada, ativar calendário inteligente
                             if (info.tipo === 'Restante da Entrada' && e.target.value) {
                               const qtdParcelasEntrada = parseInt(info.qtdParcelas) || 1;
                               const sinalInfo = informacoesPagamento.find(inf => inf.tipo === 'Sinal');
                               const qtdParcelasSinal = parseInt(sinalInfo?.qtdParcelas || '1');
                               
                               // Usar setTimeout para garantir que o state seja atualizado primeiro
                               setTimeout(() => {
                                 atualizarDatasInteligentes(e.target.value, qtdParcelasEntrada, qtdParcelasSinal);
                               }, 0);
                             }
                             
                             setInformacoesPagamento(newInfos);
                           }}
                           type="date"
                           className={`${
                             (info.tipo === 'Sinal' || info.tipo === 'Saldo') && info.primeiroVencimento 
                               ? (() => {
                                   const data = new Date(info.primeiroVencimento);
                                   const dia = data.getDate();
                                   return (dia !== 5 && dia !== 15) ? 'border-destructive' : '';
                                 })()
                               : ''
                           }`}
                         />
                         {(info.tipo === 'Sinal' || info.tipo === 'Saldo') && (
                           <div className="text-xs text-muted-foreground mt-1">
                             Apenas dias 05 ou 15
                           </div>
                         )}
                         {info.tipo === 'Restante da Entrada' && (
                           <div className="text-xs text-blue-600 mt-1">
                             Atualiza automaticamente Sinal e Saldo
                           </div>
                         )}
                       </td>
                       <td className="border border-border p-3">
                         <Button
                           variant="destructive"
                           size="sm"
                           onClick={() => removerInformacaoPagamento(info.id)}
                           disabled={informacoesPagamento.length <= 5 || ['1ª Entrada', 'Restante da Entrada', '2ª Entrada', 'Sinal', 'Saldo'].includes(info.tipo)}
                         >
                           <Trash2 className="h-4 w-4" />
                         </Button>
                       </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-center space-x-3 pt-6 flex-wrap gap-2">
            <Button variant="outline" onClick={limparFicha}>
              Limpar
            </Button>

            <Button
              onClick={salvarFicha}
              className="flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10,9 9,9 8,9"/>
              </svg>
              Salvar Ficha
            </Button>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export default FichaNegociacao;
