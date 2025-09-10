import { supabase } from '@/integrations/supabase/client';
import { DadosCliente, DadosNegociacao } from './pdfGenerator';

export interface FichaCompleta {
  id: string;
  dadosCliente: DadosCliente;
  dadosNegociacao: DadosNegociacao;
  nomeConsultor: string;
  timestamp: number;
  status: 'pendente' | 'visualizada' | 'impressa' | 'em_andamento' | 'concluida' | 'arquivada';
  adminResponsavel?: string;
  timestampInicio?: number;
  timestampConclusao?: number;
}

export interface FichaSupabase {
  id: string;
  cliente_id: string;
  liner?: string;
  closer?: string;
  lider_sala?: string;
  nome_sala?: string;
  tipo_venda?: string;
  nome_consultor: string;
  status: string;
  admin_responsavel?: string;
  timestamp_inicio?: string;
  timestamp_conclusao?: string;
  created_at: string;
  updated_at: string;
  clientes: {
    id: string;
    nome: string;
    cpf: string;
    rg?: string;
    orgao_emissor?: string;
    estado_emissor?: string;
    profissao?: string;
    data_nascimento?: string;
    estado_civil?: string;
    email?: string;
    telefone?: string;
    logradouro?: string;
    numero?: string;
    bairro?: string;
    complemento?: string;
    cep?: string;
    cidade?: string;
    estado?: string;
    nome_conjuge?: string;
    cpf_conjuge?: string;
    rg_conjuge?: string;
    orgao_emissor_conjuge?: string;
    estado_emissor_conjuge?: string;
    profissao_conjuge?: string;
    data_nascimento_conjuge?: string;
    estado_civil_conjuge?: string;
    email_conjuge?: string;
    telefone_conjuge?: string;
  };
  contratos: Array<{
    id: string;
    empreendimento: string;
    categoria_preco?: string;
    torre?: string;
    apartamento?: string;
    cota: string;
    valor: number;
    tipo_contrato: string;
  }>;
  pagamentos: Array<{
    id: string;
    tipo: string;
    total?: number;
    qtd_parcelas?: number;
    valor_parcela?: number;
    forma_pagamento?: string;
    primeiro_vencimento?: string;
  }>;
  formas_pagamento_sala: Array<{
    id: string;
    forma_pagamento?: string;
    valor_total?: number;
    valor_distribuido?: number;
    quantidade_cotas?: number;
  }>;
}

export class SupabaseFichaService {
  
  static async salvarFicha(
    dadosCliente: DadosCliente, 
    dadosNegociacao: DadosNegociacao, 
    nomeConsultor: string
  ): Promise<string> {
    try {
      console.log('🚀 Salvando ficha no Supabase...');
      console.log('📊 Dados do cliente:', dadosCliente);
      console.log('📊 Dados da negociação:', dadosNegociacao);

      // 1. Inserir cliente
      const { data: cliente, error: clienteError } = await supabase
        .from('clientes')
        .insert({
          nome: dadosCliente.nome,
          cpf: dadosCliente.cpf,
          rg: dadosCliente.rg,
          orgao_emissor: dadosCliente.orgaoEmissor,
          estado_emissor: dadosCliente.estadoEmissor,
          profissao: dadosCliente.profissao,
          data_nascimento: dadosCliente.dataNascimento,
          estado_civil: dadosCliente.estadoCivil,
          email: dadosCliente.email,
          telefone: dadosCliente.telefone,
          logradouro: dadosCliente.logradouro,
          numero: dadosCliente.numero,
          bairro: dadosCliente.bairro,
          complemento: dadosCliente.complemento,
          cep: dadosCliente.cep,
          cidade: dadosCliente.cidade,
          estado: dadosCliente.estado,
          nome_conjuge: dadosCliente.nomeConjuge,
          cpf_conjuge: dadosCliente.cpfConjuge,
          rg_conjuge: dadosCliente.rgConjuge,
          orgao_emissor_conjuge: dadosCliente.orgaoEmissorConjuge,
          estado_emissor_conjuge: dadosCliente.estadoEmissorConjuge,
          profissao_conjuge: dadosCliente.profissaoConjuge,
          data_nascimento_conjuge: dadosCliente.dataNascimentoConjuge,
          estado_civil_conjuge: dadosCliente.estadoCivilConjuge,
          email_conjuge: dadosCliente.emailConjuge,
          telefone_conjuge: dadosCliente.telefoneConjuge,
        })
        .select()
        .single();

      if (clienteError) {
        console.error('❌ Erro ao inserir cliente:', clienteError);
        throw new Error(`Erro ao salvar cliente: ${clienteError.message}`);
      }

      console.log('✅ Cliente salvo:', cliente.id);

      // 2. Inserir ficha de negociação
      const { data: ficha, error: fichaError } = await supabase
        .from('fichas_negociacao')
        .insert({
          cliente_id: cliente.id,
          liner: dadosNegociacao.liner,
          closer: dadosNegociacao.closer,
          lider_sala: dadosNegociacao.liderSala,
          nome_sala: dadosNegociacao.nomeSala,
          tipo_venda: dadosNegociacao.tipoVenda,
          nome_consultor: nomeConsultor,
          status: 'pendente'
        })
        .select()
        .single();

      if (fichaError) {
        console.error('❌ Erro ao inserir ficha:', fichaError);
        throw new Error(`Erro ao salvar ficha: ${fichaError.message}`);
      }

      console.log('✅ Ficha salva:', ficha.id);

      // 3. Inserir contratos
      if (dadosNegociacao.contratos && dadosNegociacao.contratos.length > 0) {
        const contratosData = dadosNegociacao.contratos.map(contrato => ({
          ficha_id: ficha.id,
          empreendimento: contrato.empreendimento,
          categoria_preco: contrato.categoriaPreco,
          torre: contrato.torre,
          apartamento: contrato.apartamento,
          cota: contrato.cota,
          valor: parseFloat(contrato.valor) || 0,
          tipo_contrato: contrato.tipoContrato || 'digital'
        }));

        const { error: contratosError } = await supabase
          .from('contratos')
          .insert(contratosData);

        if (contratosError) {
          console.error('❌ Erro ao inserir contratos:', contratosError);
          throw new Error(`Erro ao salvar contratos: ${contratosError.message}`);
        }

        console.log('✅ Contratos salvos:', contratosData.length);
      }

      // 4. Inserir informações de pagamento
      if (dadosNegociacao.informacoesPagamento && dadosNegociacao.informacoesPagamento.length > 0) {
        const pagamentosData = dadosNegociacao.informacoesPagamento
          .filter(info => info.total && parseFloat(info.total) > 0)
          .map(info => ({
            ficha_id: ficha.id,
            tipo: info.tipo,
            total: parseFloat(info.total) || 0,
            qtd_parcelas: parseInt(info.qtdParcelas) || 0,
            valor_parcela: parseFloat(info.valorParcela) || 0,
            forma_pagamento: info.formaPagamento,
            primeiro_vencimento: info.primeiroVencimento || null
          }));

        if (pagamentosData.length > 0) {
          const { error: pagamentosError } = await supabase
            .from('pagamentos')
            .insert(pagamentosData);

          if (pagamentosError) {
            console.error('❌ Erro ao inserir pagamentos:', pagamentosError);
            throw new Error(`Erro ao salvar pagamentos: ${pagamentosError.message}`);
          }

          console.log('✅ Pagamentos salvos:', pagamentosData.length);
        }
      }

      // 5. Inserir parcelas pagas em sala
      if (dadosNegociacao.parcelasPagasSala && dadosNegociacao.parcelasPagasSala.length > 0) {
        const parcelasSalaData = dadosNegociacao.parcelasPagasSala
          .filter(parcela => parcela.valorTotal && parseFloat(parcela.valorTotal) > 0)
          .map(parcela => ({
            ficha_id: ficha.id,
            forma_pagamento: parcela.tipo,
            valor_total: parseFloat(parcela.valorTotal) || 0,
            valor_distribuido: parseFloat(parcela.valorDistribuido) || 0,
            quantidade_cotas: parseInt(parcela.quantidadeCotas) || 0
          }));

        if (parcelasSalaData.length > 0) {
          const { error: parcelasSalaError } = await supabase
            .from('formas_pagamento_sala')
            .insert(parcelasSalaData);

          if (parcelasSalaError) {
            console.error('❌ Erro ao inserir parcelas sala:', parcelasSalaError);
            throw new Error(`Erro ao salvar parcelas sala: ${parcelasSalaError.message}`);
          }

          console.log('✅ Parcelas sala salvas:', parcelasSalaData.length);
        }
      }

      console.log('🎉 Ficha completa salva no Supabase com sucesso!');
      return ficha.id;

    } catch (error: any) {
      console.error('❌ Erro ao salvar ficha no Supabase:', error);
      throw new Error(`Falha ao salvar ficha: ${error.message}`);
    }
  }

  static async getFichas(): Promise<FichaCompleta[]> {
    try {
      console.log('🔍 Buscando fichas no Supabase...');

      // Buscar fichas sem relacionamentos (evita necessidade de FKs cadastradas no schema cache)
      const { data: fichas, error: fichasError } = await supabase
        .from('fichas_negociacao')
        .select('*')
        .order('created_at', { ascending: false });

      if (fichasError) {
        console.error('❌ Erro ao buscar fichas:', fichasError);
        throw new Error(`Erro ao buscar fichas: ${fichasError.message}`);
      }

      const allFichas = fichas || [];
      console.log('✅ Fichas encontradas:', allFichas.length);

      if (allFichas.length === 0) return [];

      const fichaIds = allFichas.map(f => f.id);
      const clienteIds = Array.from(new Set(allFichas.map(f => f.cliente_id).filter(Boolean)));

      const [clientesRes, contratosRes, pagamentosRes, formasSalaRes] = await Promise.all([
        supabase.from('clientes').select('*').in('id', clienteIds),
        supabase.from('contratos').select('*').in('ficha_id', fichaIds),
        supabase.from('pagamentos').select('*').in('ficha_id', fichaIds),
        supabase.from('formas_pagamento_sala').select('*').in('ficha_id', fichaIds),
      ]);

      const clientes = clientesRes.data || [];
      const contratos = contratosRes.data || [];
      const pagamentos = pagamentosRes.data || [];
      const formasSala = formasSalaRes.data || [];

      const clienteById = new Map((clientes as any[]).map((c: any) => [c.id, c]));
      const contratosByFicha = new Map<string, any[]>();
      const pagamentosByFicha = new Map<string, any[]>();
      const formasSalaByFicha = new Map<string, any[]>();

      for (const c of contratos as any[]) {
        const arr = contratosByFicha.get(c.ficha_id) || [];
        arr.push(c);
        contratosByFicha.set(c.ficha_id, arr);
      }
      for (const p of pagamentos as any[]) {
        const arr = pagamentosByFicha.get(p.ficha_id) || [];
        arr.push(p);
        pagamentosByFicha.set(p.ficha_id, arr);
      }
      for (const fs of formasSala as any[]) {
        const arr = formasSalaByFicha.get(fs.ficha_id) || [];
        arr.push(fs);
        formasSalaByFicha.set(fs.ficha_id, arr);
      }

      const montadas = allFichas.map((f: any) => {
        const fichaSupabase: FichaSupabase = {
          ...f,
          clientes: clienteById.get(f.cliente_id) as any,
          contratos: contratosByFicha.get(f.id) || [],
          pagamentos: pagamentosByFicha.get(f.id) || [],
          formas_pagamento_sala: formasSalaByFicha.get(f.id) || [],
        } as FichaSupabase;
        return this.convertSupabaseToFicha(fichaSupabase);
      });

      return montadas;

    } catch (error: any) {
      console.error('❌ Erro ao buscar fichas:', error);
      throw new Error(`Falha ao buscar fichas: ${error.message}`);
    }
  }

  static async getFicha(id: string): Promise<FichaCompleta | null> {
    try {
      const { data: ficha, error: fichaError } = await supabase
        .from('fichas_negociacao')
        .select('*')
        .eq('id', id)
        .single();

      if (fichaError) {
        if ((fichaError as any).code === 'PGRST116') return null;
        throw new Error(`Erro ao buscar ficha: ${fichaError.message}`);
      }

      if (!ficha) return null;

      const [clienteRes, contratosRes, pagamentosRes, formasSalaRes] = await Promise.all([
        supabase.from('clientes').select('*').eq('id', (ficha as any).cliente_id).maybeSingle(),
        supabase.from('contratos').select('*').eq('ficha_id', (ficha as any).id),
        supabase.from('pagamentos').select('*').eq('ficha_id', (ficha as any).id),
        supabase.from('formas_pagamento_sala').select('*').eq('ficha_id', (ficha as any).id),
      ]);

      const fichaSupabase: FichaSupabase = {
        ...(ficha as any),
        clientes: clienteRes.data as any,
        contratos: contratosRes.data || [],
        pagamentos: pagamentosRes.data || [],
        formas_pagamento_sala: formasSalaRes.data || [],
      } as FichaSupabase;

      return this.convertSupabaseToFicha(fichaSupabase);

    } catch (error: any) {
      console.error('❌ Erro ao buscar ficha:', error);
      return null;
    }
  }

  static async atualizarStatus(
    id: string, 
    status: FichaCompleta['status'],
    adminResponsavel?: string
  ): Promise<boolean> {
    try {
      const updateData: any = { 
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'em_andamento' && adminResponsavel) {
        updateData.admin_responsavel = adminResponsavel;
        updateData.timestamp_inicio = new Date().toISOString();
      } else if (status === 'concluida') {
        updateData.timestamp_conclusao = new Date().toISOString();
      } else if (status === 'pendente') {
        updateData.admin_responsavel = null;
        updateData.timestamp_inicio = null;
        updateData.timestamp_conclusao = null;
      }

      const { error } = await supabase
        .from('fichas_negociacao')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('❌ Erro ao atualizar status:', error);
        return false;
      }

      console.log(`✅ Status da ficha ${id} atualizado para: ${status}`);
      return true;

    } catch (error: any) {
      console.error('❌ Erro ao atualizar status:', error);
      return false;
    }
  }

  static async pegarFichaParaFazer(id: string, nomeAdmin: string): Promise<boolean> {
    try {
      // Verificar se a ficha está disponível
      const { data: ficha, error: selectError } = await supabase
        .from('fichas_negociacao')
        .select('status, admin_responsavel')
        .eq('id', id)
        .single();

      if (selectError || !ficha) {
        console.error('❌ Ficha não encontrada:', selectError);
        return false;
      }

      if (ficha.status !== 'pendente') {
        console.warn('⚠️ Ficha não está pendente:', ficha.status);
        return false;
      }

      // Atualizar para em andamento
      return await this.atualizarStatus(id, 'em_andamento', nomeAdmin);

    } catch (error: any) {
      console.error('❌ Erro ao pegar ficha:', error);
      return false;
    }
  }

  static async encerrarAtendimento(id: string, nomeAdmin: string): Promise<boolean> {
    try {
      // Verificar se o admin é responsável
      const { data: ficha, error: selectError } = await supabase
        .from('fichas_negociacao')
        .select('status, admin_responsavel')
        .eq('id', id)
        .single();

      if (selectError || !ficha) {
        console.error('❌ Ficha não encontrada:', selectError);
        return false;
      }

      if (ficha.admin_responsavel !== nomeAdmin) {
        console.warn('⚠️ Admin não é responsável pela ficha');
        return false;
      }

      if (ficha.status !== 'em_andamento') {
        console.warn('⚠️ Ficha não está em andamento');
        return false;
      }

      return await this.atualizarStatus(id, 'concluida');

    } catch (error: any) {
      console.error('❌ Erro ao encerrar atendimento:', error);
      return false;
    }
  }

  static async liberarFicha(id: string, nomeAdmin: string): Promise<boolean> {
    try {
      // Verificar se o admin é responsável
      const { data: ficha, error: selectError } = await supabase
        .from('fichas_negociacao')
        .select('admin_responsavel')
        .eq('id', id)
        .single();

      if (selectError || !ficha) {
        return false;
      }

      if (ficha.admin_responsavel !== nomeAdmin) {
        return false;
      }

      return await this.atualizarStatus(id, 'pendente');

    } catch (error: any) {
      console.error('❌ Erro ao liberar ficha:', error);
      return false;
    }
  }

  static async arquivarFicha(id: string): Promise<boolean> {
    return await this.atualizarStatus(id, 'arquivada');
  }

  static async desarquivarFicha(id: string): Promise<boolean> {
    return await this.atualizarStatus(id, 'concluida');
  }

  static async devolverParaConsultor(id: string, _nomeAdmin: string, _motivo: string): Promise<boolean> {
    // Sem suporte a motivo no schema atual; apenas volta para pendente
    return await this.atualizarStatus(id, 'pendente');
  }

  static async getEstatisticas() {
    try {
      const { data: fichas, error } = await supabase
        .from('fichas_negociacao')
        .select('status, created_at');

      if (error) {
        console.error('❌ Erro ao buscar estatísticas:', error);
        return {
          total: 0,
          pendentes: 0,
          visualizadas: 0,
          impressas: 0,
          emAndamento: 0,
          concluidas: 0,
          arquivadas: 0,
          ultimaFicha: null
        };
      }

      const stats = {
        total: fichas.length,
        pendentes: fichas.filter(f => f.status === 'pendente').length,
        visualizadas: fichas.filter(f => f.status === 'visualizada').length,
        impressas: fichas.filter(f => f.status === 'impressa').length,
        emAndamento: fichas.filter(f => f.status === 'em_andamento').length,
        concluidas: fichas.filter(f => f.status === 'concluida').length,
        arquivadas: fichas.filter(f => f.status === 'arquivada').length,
        ultimaFicha: fichas.length > 0 ? new Date(fichas[0].created_at).getTime() : null
      };

      return stats;

    } catch (error: any) {
      console.error('❌ Erro ao calcular estatísticas:', error);
      return {
        total: 0,
        pendentes: 0,
        visualizadas: 0,
        impressas: 0,
        emAndamento: 0,
        concluidas: 0,
        arquivadas: 0,
        ultimaFicha: null
      };
    }
  }

  private static convertSupabaseToFicha(fichaSupabase: FichaSupabase): FichaCompleta {
    const cliente: any = (fichaSupabase as any).clientes || {};

    return {
      id: fichaSupabase.id,
      nomeConsultor: (fichaSupabase as any).nome_consultor || '',
      timestamp: fichaSupabase.created_at ? new Date((fichaSupabase as any).created_at).getTime() : Date.now(),
      status: (fichaSupabase.status as FichaCompleta['status']) || 'pendente',
      adminResponsavel: (fichaSupabase as any).admin_responsavel || undefined,
      timestampInicio: (fichaSupabase as any).timestamp_inicio ? new Date((fichaSupabase as any).timestamp_inicio as any).getTime() : undefined,
      timestampConclusao: (fichaSupabase as any).timestamp_conclusao ? new Date((fichaSupabase as any).timestamp_conclusao as any).getTime() : undefined,

      dadosCliente: {
        nome: cliente.nome || '',
        cpf: cliente.cpf || '',
        rg: cliente.rg || '',
        orgaoEmissor: cliente.orgao_emissor || '',
        estadoEmissor: cliente.estado_emissor || '',
        profissao: cliente.profissao || '',
        dataNascimento: cliente.data_nascimento || '',
        estadoCivil: cliente.estado_civil || '',
        email: cliente.email || '',
        telefone: cliente.telefone || '',
        logradouro: cliente.logradouro || '',
        numero: cliente.numero || '',
        bairro: cliente.bairro || '',
        complemento: cliente.complemento || '',
        cep: cliente.cep || '',
        cidade: cliente.cidade || '',
        estado: cliente.estado || '',
        nomeConjuge: cliente.nome_conjuge || '',
        cpfConjuge: cliente.cpf_conjuge || '',
        rgConjuge: cliente.rg_conjuge || '',
        orgaoEmissorConjuge: cliente.orgao_emissor_conjuge || '',
        estadoEmissorConjuge: cliente.estado_emissor_conjuge || '',
        profissaoConjuge: cliente.profissao_conjuge || '',
        dataNascimentoConjuge: cliente.data_nascimento_conjuge || '',
        estadoCivilConjuge: cliente.estado_civil_conjuge || '',
        emailConjuge: cliente.email_conjuge || '',
        telefoneConjuge: cliente.telefone_conjuge || '',
      },

      dadosNegociacao: {
        liner: (fichaSupabase as any).liner || '',
        closer: (fichaSupabase as any).closer || '',
        liderSala: (fichaSupabase as any).lider_sala || '',
        nomeSala: (fichaSupabase as any).nome_sala || '',
        tipoVenda: (fichaSupabase as any).tipo_venda || '',

        contratos: ((fichaSupabase as any).contratos || []).map((contrato: any) => ({
          empreendimento: contrato.empreendimento || '',
          categoriaPreco: contrato.categoria_preco || '',
          torre: contrato.torre || '',
          apartamento: contrato.apartamento || '',
          cota: contrato.cota || '',
          valor: (Number(contrato.valor || 0)).toString(),
          tipoContrato: contrato.tipo_contrato || 'digital'
        })),

        informacoesPagamento: ((fichaSupabase as any).pagamentos || []).map((pagamento: any) => ({
          tipo: pagamento.tipo || '',
          total: pagamento.total != null ? String(pagamento.total) : '',
          qtdParcelas: pagamento.qtd_parcelas != null ? String(pagamento.qtd_parcelas) : '',
          valorParcela: pagamento.valor_parcela != null ? String(pagamento.valor_parcela) : '',
          formaPagamento: pagamento.forma_pagamento || '',
          primeiroVencimento: pagamento.primeiro_vencimento || ''
        })),

        parcelasPagasSala: ((fichaSupabase as any).formas_pagamento_sala || []).map((parcela: any) => ({
          tipo: parcela.forma_pagamento || '',
          valorTotal: parcela.valor_total != null ? String(parcela.valor_total) : '',
          valorDistribuido: parcela.valor_distribuido != null ? String(parcela.valor_distribuido) : '',
          quantidadeCotas: parcela.quantidade_cotas != null ? String(parcela.quantidade_cotas) : '',
          formasPagamento: [parcela.forma_pagamento || '']
        }))
      }
    };
  }
}
