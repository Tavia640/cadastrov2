import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SessionService } from '@/lib/sessionService';
import { UserService } from '@/lib/userService';

const Login = () => {
  const navigate = useNavigate();
  const [bootstrap, setBootstrap] = useState(false);
  const [nome, setNome] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const session = SessionService.getSession();
    if (session) {
      if (session.perfil === 'consultor') {
        navigate('/cadastro-cliente');
      } else {
        navigate('/admin-dashboard');
      }
      return;
    }
    setBootstrap(!UserService.hasUsers());
  }, [navigate]);

  const handleLogin = async () => {
    if (!nome.trim() || !senha.trim()) {
      alert('Preencha nome e senha');
      return;
    }
    setLoading(true);
    try {
      const user = await UserService.authenticate(nome, senha);
      if (!user) {
        alert('Credenciais inválidas');
        return;
      }
      SessionService.createSession(user.nome, user.perfil);
      if (user.perfil === 'consultor') navigate('/cadastro-cliente');
      else navigate('/admin-dashboard');
    } catch (e) {
      alert('Erro ao autenticar');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMaster = async () => {
    if (!senha.trim()) {
      alert('Defina a senha do master');
      return;
    }
    setLoading(true);
    try {
      const master = await UserService.createMaster('Master', senha);
      SessionService.createSession(master.nome, master.perfil);
      navigate('/admin-dashboard');
    } catch (e: any) {
      alert(e.message || 'Erro ao criar master');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      bootstrap ? handleCreateMaster() : handleLogin();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-2xl font-bold">GAV</span>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800">
            Sistema GAV Resorts
          </CardTitle>
          <p className="text-gray-600">
            Acesso temporário por 12 horas
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="nome" className="text-sm font-medium">
              {bootstrap ? 'Nome do Master' : 'Seu Nome'}
            </Label>
            <Input
              id="nome"
              type="text"
              placeholder={bootstrap ? 'Defina o nome do usuário master' : 'Digite seu nome'}
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full"
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="senha" className="text-sm font-medium">
              Senha
            </Label>
            <Input
              id="senha"
              type="password"
              placeholder={bootstrap ? 'Defina a senha do master' : 'Digite sua senha'}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full"
            />
          </div>

          <Button
            onClick={bootstrap ? handleCreateMaster : handleLogin}
            disabled={loading || !nome.trim() || !senha.trim()}
            className="w-full h-12 text-lg"
          >
            {loading ? (bootstrap ? 'Criando...' : 'Entrando...') : (bootstrap ? 'Criar Master' : 'Entrar no Sistema')}
          </Button>

          <div className="text-center text-sm text-gray-500">
            {bootstrap ? (
              <p>Primeiro acesso: crie o usuário master para gerenciar logins.</p>
            ) : (
              <>
                <p>🕒 Sua sessão será válida por 12 horas</p>
                <p>🔒 Acesso restrito a usuários cadastrados</p>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
