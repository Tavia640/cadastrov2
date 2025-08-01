import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ArrowLeft, Save, RefreshCw, Settings, Mail, Key } from 'lucide-react';
import { ConfigService, Configuracao } from '@/lib/configService';

const ConfiguracaoSistema = () => {
  const navigate = useNavigate();
  const [configs, setConfigs] = useState<Configuracao[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});

  useEffect(() => {
    carregarConfiguracoes();
  }, []);

  const carregarConfiguracoes = async () => {
    try {
      setLoading(true);
      const configuracoes = await ConfigService.listConfigs();
      setConfigs(configuracoes);
      
      // Inicializar valores editados
      const initialValues: Record<string, string> = {};
      configuracoes.forEach(config => {
        initialValues[config.chave] = config.valor;
      });
      setEditedValues(initialValues);
      
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast.error('Erro ao carregar configurações do sistema');
    } finally {
      setLoading(false);
    }
  };

  const salvarConfiguracoes = async () => {
    try {
      setSaving(true);
      
      const promises = Object.entries(editedValues).map(async ([chave, valor]) => {
        const configOriginal = configs.find(c => c.chave === chave);
        if (configOriginal && configOriginal.valor !== valor) {
          return ConfigService.updateConfig(chave, valor);
        }
        return true;
      });

      const results = await Promise.all(promises);
      const sucessos = results.filter(Boolean).length;
      
      if (sucessos > 0) {
        toast.success(`${sucessos} configuração(ões) atualizada(s) com sucesso!`);
        await carregarConfiguracoes(); // Recarregar para mostrar valores atualizados
        ConfigService.clearCache(); // Limpar cache
      } else {
        toast.info('Nenhuma alteração foi detectada');
      }
      
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const handleValueChange = (chave: string, valor: string) => {
    setEditedValues(prev => ({
      ...prev,
      [chave]: valor
    }));
  };

  const getIconForConfig = (chave: string) => {
    if (chave.includes('EMAIL')) return <Mail className="h-4 w-4" />;
    if (chave.includes('API_KEY')) return <Key className="h-4 w-4" />;
    return <Settings className="h-4 w-4" />;
  };

  const isValueChanged = (chave: string) => {
    const original = configs.find(c => c.chave === chave)?.valor;
    return original !== editedValues[chave];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <Card className="max-w-4xl mx-auto">
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 animate-spin" />
              <span>Carregando configurações...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Settings className="h-6 w-6" />
              Configurações do Sistema
            </CardTitle>
            <div className="w-20" />
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Settings className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-blue-800">Informações Importantes</h3>
            </div>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• As configurações são carregadas dinamicamente do banco de dados</li>
              <li>• Alterações entram em vigor imediatamente após salvar</li>
              <li>• A chave API do Resend é necessária para o envio de emails</li>
              <li>• O email de destino define onde as fichas serão enviadas</li>
            </ul>
          </div>

          <div className="grid gap-6">
            {configs.map((config) => (
              <Card key={config.id} className={`transition-all ${isValueChanged(config.chave) ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    {getIconForConfig(config.chave)}
                    <CardTitle className="text-lg">{config.chave}</CardTitle>
                    {isValueChanged(config.chave) && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        Modificado
                      </span>
                    )}
                  </div>
                  {config.descricao && (
                    <p className="text-sm text-muted-foreground">{config.descricao}</p>
                  )}
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor={config.chave}>Valor</Label>
                    {config.chave.includes('API_KEY') ? (
                      <Input
                        id={config.chave}
                        type="password"
                        value={editedValues[config.chave] || ''}
                        onChange={(e) => handleValueChange(config.chave, e.target.value)}
                        placeholder="Digite a chave API..."
                        className={isValueChanged(config.chave) ? 'border-blue-500' : ''}
                      />
                    ) : config.valor.length > 50 ? (
                      <Textarea
                        id={config.chave}
                        value={editedValues[config.chave] || ''}
                        onChange={(e) => handleValueChange(config.chave, e.target.value)}
                        rows={3}
                        className={isValueChanged(config.chave) ? 'border-blue-500' : ''}
                      />
                    ) : (
                      <Input
                        id={config.chave}
                        value={editedValues[config.chave] || ''}
                        onChange={(e) => handleValueChange(config.chave, e.target.value)}
                        className={isValueChanged(config.chave) ? 'border-blue-500' : ''}
                      />
                    )}
                    
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Criado: {new Date(config.created_at).toLocaleString('pt-BR')}</span>
                      <span>Atualizado: {new Date(config.updated_at).toLocaleString('pt-BR')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-center gap-4 pt-6 border-t">
            <Button
              variant="outline"
              onClick={carregarConfiguracoes}
              disabled={loading || saving}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Recarregar
            </Button>
            
            <Button
              onClick={salvarConfiguracoes}
              disabled={saving || Object.keys(editedValues).length === 0}
              className="flex items-center gap-2 px-8"
            >
              {saving ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConfiguracaoSistema;