import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SessionHeader from '@/components/SessionHeader';
import { SessionService } from '@/lib/sessionService';
import { UserService, Usuario } from '@/lib/userService';
import { ArrowLeft, Trash2, UserPlus } from 'lucide-react';

const GerenciarUsuarios: React.FC = () => {
  const navigate = useNavigate();
  const session = SessionService.getSession();
  const [users, setUsers] = useState<Usuario[]>([]);
  const [nome, setNome] = useState('');
  const [senha, setSenha] = useState('');
  const [perfil, setPerfil] = useState<'admin'|'consultor'>('admin');
  const [loading, setLoading] = useState(false);

  const carregar = () => setUsers(UserService.list());

  useEffect(() => {
    carregar();
  }, []);

  const criar = async () => {
    if (!nome.trim() || !senha.trim()) return;
    setLoading(true);
    try {
      await UserService.createUser(session!, nome, senha, perfil);
      setNome('');
      setSenha('');
      carregar();
    } catch (e: any) {
      alert(e.message || 'Erro ao criar usuário');
    } finally {
      setLoading(false);
    }
  };

  const remover = async (id: string) => {
    if (!confirm('Remover este usuário?')) return;
    try {
      await UserService.deleteUser(session!, id);
      carregar();
    } catch (e: any) {
      alert(e.message || 'Erro ao remover usuário');
    }
  };

  const outros = useMemo(() => users.filter(u => u.perfil !== 'master'), [users]);

  return (
    <div className="min-h-screen bg-background">
      <SessionHeader />
      <div className="p-4">
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={() => navigate('/admin-dashboard')} className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" /> Voltar
              </Button>
              <CardTitle className="text-2xl font-bold">Gerenciar Usuários</CardTitle>
              <div className="w-20" />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <UserPlus className="h-4 w-4" />
                <span className="font-semibold">Novo usuário</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label>Nome</Label>
                  <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome completo" />
                </div>
                <div>
                  <Label>Senha</Label>
                  <Input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="Defina uma senha" />
                </div>
                <div>
                  <Label>Perfil</Label>
                  <Select value={perfil} onValueChange={(v: any) => setPerfil(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="consultor">Consultor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Button onClick={criar} disabled={loading || !nome.trim() || !senha.trim()}>Criar usuário</Button>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold">Usuários cadastrados</h3>
              {outros.length === 0 ? (
                <div className="text-sm text-muted-foreground">Nenhum usuário.</div>
              ) : (
                <div className="space-y-2">
                  {outros.map((u) => (
                    <div key={u.id} className="flex items-center justify-between border rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        <div className="text-sm">
                          <div className="font-medium">{u.nome}</div>
                          <div className="text-xs text-muted-foreground">{u.perfil}</div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => remover(u.id)} className="flex items-center gap-2">
                        <Trash2 className="h-4 w-4" /> Remover
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GerenciarUsuarios;
