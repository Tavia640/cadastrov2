import { supabase } from '@/integrations/supabase/client';

export interface Configuracao {
  id: string;
  chave: string;
  valor: string;
  descricao?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export class ConfigService {
  private static cache: Map<string, string> = new Map();
  private static cacheExpiry: Map<string, number> = new Map();
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

  /**
   * Busca uma configuração por chave
   */
  static async getConfig(chave: string): Promise<string | null> {
    try {
      // Verificar cache primeiro
      const cached = this.getCachedValue(chave);
      if (cached !== null) {
        return cached;
      }

      console.log(`🔍 Buscando configuração: ${chave}`);

      const { data, error } = await supabase
        .from('configuracoes')
        .select('valor')
        .eq('chave', chave)
        .eq('ativo', true)
        .single();

      if (error) {
        // Se a tabela não existe, retornar null sem erro
        if (error.message?.includes('does not exist')) {
          console.warn(`⚠️ Tabela de configurações não existe para ${chave}`);
          return null;
        }
        console.error(`❌ Erro ao buscar configuração ${chave}:`, error.message || JSON.stringify(error));
        return null;
      }

      if (!data) {
        console.warn(`⚠️ Configuração não encontrada: ${chave}`);
        return null;
      }

      // Armazenar no cache
      this.setCachedValue(chave, data.valor);
      
      console.log(`✅ Configuração encontrada: ${chave}`);
      return data.valor;

    } catch (error) {
      console.error(`❌ Erro inesperado ao buscar configuração ${chave}:`, error);
      return null;
    }
  }

  /**
   * Busca múltiplas configurações de uma vez
   */
  static async getConfigs(chaves: string[]): Promise<Record<string, string>> {
    try {
      const result: Record<string, string> = {};
      const chavesParaBuscar: string[] = [];

      // Verificar cache primeiro
      for (const chave of chaves) {
        const cached = this.getCachedValue(chave);
        if (cached !== null) {
          result[chave] = cached;
        } else {
          chavesParaBuscar.push(chave);
        }
      }

      // Buscar apenas as chaves que não estão em cache
      if (chavesParaBuscar.length > 0) {
        console.log(`🔍 Buscando configurações: ${chavesParaBuscar.join(', ')}`);

        const { data, error } = await supabase
          .from('configuracoes')
          .select('chave, valor')
          .in('chave', chavesParaBuscar)
          .eq('ativo', true);

        if (error) {
          // Se a tabela não existe, retornar resultado vazio sem erro
          if (error.message?.includes('does not exist')) {
            console.warn('⚠️ Tabela de configurações não existe, retornando valores vazios');
            return result;
          }
          console.error('❌ Erro ao buscar configurações:', error.message || JSON.stringify(error));
          return result;
        }

        // Processar resultados e armazenar no cache
        data?.forEach(config => {
          result[config.chave] = config.valor;
          this.setCachedValue(config.chave, config.valor);
        });

        console.log(`✅ Configurações encontradas: ${data?.length || 0}`);
      }

      return result;

    } catch (error: any) {
      console.warn('⚠️ Erro ao buscar configurações (usando valores padrão):', error.message || JSON.stringify(error));
      return {};
    }
  }

  /**
   * Atualiza uma configuração
   */
  static async updateConfig(chave: string, valor: string): Promise<boolean> {
    try {
      console.log(`🔄 Atualizando configuração: ${chave}`);

      const { error } = await supabase
        .from('configuracoes')
        .update({ 
          valor, 
          updated_at: new Date().toISOString() 
        })
        .eq('chave', chave);

      if (error) {
        console.error(`❌ Erro ao atualizar configuração ${chave}:`, error);
        return false;
      }

      // Limpar cache para esta chave
      this.clearCachedValue(chave);
      
      console.log(`✅ Configuração atualizada: ${chave}`);
      return true;

    } catch (error) {
      console.error(`❌ Erro inesperado ao atualizar configuração ${chave}:`, error);
      return false;
    }
  }

  /**
   * Lista todas as configurações ativas
   */
  static async listConfigs(): Promise<Configuracao[]> {
    try {
      console.log('🔍 Listando todas as configurações');

      const { data, error } = await supabase
        .from('configuracoes')
        .select('*')
        .eq('ativo', true)
        .order('chave');

      if (error) {
        console.error('❌ Erro ao listar configurações:', error);
        return [];
      }

      console.log(`✅ Configurações listadas: ${data?.length || 0}`);
      return data || [];

    } catch (error) {
      console.error('❌ Erro inesperado ao listar configurações:', error);
      return [];
    }
  }

  /**
   * Limpa todo o cache
   */
  static clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
    console.log('🧹 Cache de configurações limpo');
  }

  // Métodos privados para gerenciamento de cache
  private static getCachedValue(chave: string): string | null {
    const expiry = this.cacheExpiry.get(chave);
    if (!expiry || Date.now() > expiry) {
      this.clearCachedValue(chave);
      return null;
    }
    return this.cache.get(chave) || null;
  }

  private static setCachedValue(chave: string, valor: string): void {
    this.cache.set(chave, valor);
    this.cacheExpiry.set(chave, Date.now() + this.CACHE_DURATION);
  }

  private static clearCachedValue(chave: string): void {
    this.cache.delete(chave);
    this.cacheExpiry.delete(chave);
  }
}
