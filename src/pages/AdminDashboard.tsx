import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { ArrowLeft, Eye, RefreshCw, CheckCircle2, XCircle, Archive, Inbox, UserCheck, Search } from 'lucide-react';
import SessionHeader from '@/components/SessionHeader';
import FichaVisualizationModal from '@/components/FichaVisualizationModal';
import { FichaCompleta, FichaStorageService } from '@/lib/fichaStorageService';
import { SessionService } from '@/lib/sessionService';

const statusLabels: Record<FichaCompleta['status'], string> = {
  pendente: 'Pendente',
  visualizada: 'Visualizada',
  impressa: 'Impressa',
  em_andamento: 'Em andamento',
  concluida: 'Concluída',
  arquivada: 'Arquivada',
};

const statusBadgeVariant: Record<FichaCompleta['status'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pendente: 'secondary',
  visualizada: 'outline',
  impressa: 'outline',
  em_andamento: 'default',
  concluida: 'secondary',
  arquivada: 'outline',
};

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const session = SessionService.getSession();
  const nomeAdmin = session?.nome || 'Admin';

  const [fichas, setFichas] = useState<FichaCompleta[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFicha, setSelectedFicha] = useState<FichaCompleta | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [statusFiltro, setStatusFiltro] = useState<"todas" | FichaCompleta['status']>('todas');
  const [search, setSearch] = useState('');

  const carregarFichas = async () => {
    try {
      setLoading(true);
      const result = await Promise.resolve(FichaStorageService.getFichas() as any);
      setFichas(result || []);
    } catch (error) {
      console.error('Erro ao carregar fichas:', error);
      toast.error('Erro ao carregar fichas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarFichas();
    const interval = setInterval(() => carregarFichas(), 15000);
    return () => clearInterval(interval);
  }, []);

  const fichasFiltradas = useMemo(() => {
    let data = [...fichas];
    if (statusFiltro !== 'todas') {
      data = data.filter(f => f.status === statusFiltro);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(f =>
        f.dadosCliente.nome.toLowerCase().includes(q) ||
        f.nomeConsultor.toLowerCase().includes(q) ||
        f.dadosCliente.cpf?.toLowerCase().includes(q)
      );
    }
    return data;
  }, [fichas, statusFiltro, search]);

  const abrirVisualizacao = (ficha: FichaCompleta) => {
    setSelectedFicha(ficha);
    setModalOpen(true);
  };

  const pegarFicha = async (id: string) => {
    const ok = await Promise.resolve(FichaStorageService.pegarFichaParaFazer(id, nomeAdmin) as any);
    if (ok) {
      toast.success('Ficha atribuída a você');
      carregarFichas();
    } else {
      toast.error('Não foi possível pegar a ficha');
    }
  };

  const liberarFicha = async (id: string) => {
    const ok = await Promise.resolve(FichaStorageService.liberarFicha(id, nomeAdmin) as any);
    if (ok) {
      toast.success('Ficha liberada');
      carregarFichas();
    } else {
      toast.error('Você não é o responsável por esta ficha');
    }
  };

  const encerrarAtendimento = async (id: string) => {
    const ok = await Promise.resolve(FichaStorageService.encerrarAtendimento(id, nomeAdmin) as any);
    if (ok) {
      toast.success('Atendimento encerrado');
      carregarFichas();
    } else {
      toast.error('Não foi possível encerrar. Verifique se você é o responsável.');
    }
  };

  const arquivar = async (id: string) => {
    const ok = await Promise.resolve(FichaStorageService.arquivarFicha(id, nomeAdmin) as any);
    if (ok) {
      toast.success('Ficha arquivada');
      carregarFichas();
    } else {
      toast.error('Só é possível arquivar fichas concluídas');
    }
  };

  const desarquivar = async (id: string) => {
    const ok = await Promise.resolve(FichaStorageService.desarquivarFicha(id, nomeAdmin) as any);
    if (ok) {
      toast.success('Ficha desarquivada');
      carregarFichas();
    } else {
      toast.error('Não foi possível desarquivar');
    }
  };

  const formatarData = (ts: number) => new Date(ts).toLocaleString('pt-BR');

  return (
    <div className="min-h-screen bg-background">
      <SessionHeader />
      <div className="p-4">
        <Card className="max-w-7xl mx-auto">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <Button variant="ghost" onClick={() => navigate('/')} className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              <CardTitle className="text-2xl font-bold">Painel do Administrador</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" onClick={carregarFichas} disabled={loading} className="flex items-center gap-2">
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex flex-wrap gap-2">
                {(['todas','pendente','em_andamento','concluida','arquivada'] as const).map(key => (
                  <Button
                    key={key}
                    variant={statusFiltro === key ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFiltro(key as any)}
                    className="capitalize"
                  >
                    {key === 'todas' ? 'Todas' : statusLabels[key as FichaCompleta['status']]}
                  </Button>
                ))}
              </div>
              <div className="md:col-span-2 flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por cliente, consultor ou CPF..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <Separator />

            {fichasFiltradas.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-10">
                Nenhuma ficha encontrada.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left p-2 border">Data</th>
                      <th className="text-left p-2 border">Cliente</th>
                      <th className="text-left p-2 border">Consultor</th>
                      <th className="text-left p-2 border">Status</th>
                      <th className="text-left p-2 border">Responsável</th>
                      <th className="text-left p-2 border w-[380px]">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fichasFiltradas.map((ficha) => (
                      <tr key={ficha.id} className="hover:bg-muted/30">
                        <td className="p-2 border whitespace-nowrap">{formatarData(ficha.timestamp)}</td>
                        <td className="p-2 border">{ficha.dadosCliente.nome}</td>
                        <td className="p-2 border">{ficha.nomeConsultor}</td>
                        <td className="p-2 border">
                          <Badge variant={statusBadgeVariant[ficha.status]}>{statusLabels[ficha.status]}</Badge>
                        </td>
                        <td className="p-2 border">{ficha.adminResponsavel || '-'}</td>
                        <td className="p-2 border">
                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" variant="outline" onClick={() => abrirVisualizacao(ficha)} className="flex items-center gap-2">
                              <Eye className="h-4 w-4" /> Visualizar
                            </Button>

                            {ficha.status === 'pendente' && (
                              <Button size="sm" onClick={() => pegarFicha(ficha.id)} className="flex items-center gap-2">
                                <UserCheck className="h-4 w-4" /> Pegar
                              </Button>
                            )}

                            {ficha.status === 'em_andamento' && ficha.adminResponsavel === nomeAdmin && (
                              <>
                                <Button size="sm" variant="secondary" onClick={() => encerrarAtendimento(ficha.id)} className="flex items-center gap-2">
                                  <CheckCircle2 className="h-4 w-4" /> Encerrar
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => liberarFicha(ficha.id)} className="flex items-center gap-2">
                                  <XCircle className="h-4 w-4" /> Liberar
                                </Button>
                              </>
                            )}

                            {ficha.status === 'concluida' && (
                              <Button size="sm" variant="outline" onClick={() => arquivar(ficha.id)} className="flex items-center gap-2">
                                <Archive className="h-4 w-4" /> Arquivar
                              </Button>
                            )}

                            {ficha.status === 'arquivada' && (
                              <Button size="sm" variant="outline" onClick={() => desarquivar(ficha.id)} className="flex items-center gap-2">
                                <Inbox className="h-4 w-4" /> Desarquivar
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <FichaVisualizationModal
        ficha={selectedFicha}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
};

export default AdminDashboard;
