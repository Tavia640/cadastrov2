import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { SessionService } from '@/lib/sessionService';

const Login = () => {
  const navigate = useNavigate();
  const [nome, setNome] = useState('');
  const [perfil, setPerfil] = useState<'consultor' | 'admin'>('consultor');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Verificar se já existe uma sessão válida
    const session = SessionService.getSession();
    if (session) {
      // Redirecionar baseado no perfil
      if (session.perfil === 'consultor') {
        navigate('/cadastro-cliente');
      } else {
        navigate('/admin-dashboard');
      }
    }
  }, [navigate]);

  const handleLogin = () => {
    if (!nome.trim()) {
      alert('Por favor, digite seu nome');
      return;
    }

    setLoading(true);
    
    try {
      // Criar sessão
      SessionService.createSession(nome, perfil);
      
      // Redirecionar baseado no perfil
      if (perfil === 'consultor') {
        navigate('/cadastro-cliente');
      } else {
        navigate('/admin-dashboard');
      }
    } catch (error) {
      console.error('Erro ao criar sessão:', error);
      alert('Erro ao fazer login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
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
              Seu Nome
            </Label>
            <Input
              id="nome"
              type="text"
              placeholder="Digite seu nome completo"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full"
              maxLength={100}
            />
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Selecione seu perfil
            </Label>
            <RadioGroup 
              value={perfil} 
              onValueChange={(value: 'consultor' | 'admin') => setPerfil(value)}
              className="space-y-3"
            >
              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="consultor" id="consultor" />
                <div className="flex-1">
                  <Label htmlFor="consultor" className="font-medium cursor-pointer">
                    Consultor
                  </Label>
                  <p className="text-sm text-gray-500">
                    Acesso às páginas de cadastro e negociação
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="admin" id="admin" />
                <div className="flex-1">
                  <Label htmlFor="admin" className="font-medium cursor-pointer">
                    Administrador
                  </Label>
                  <p className="text-sm text-gray-500">
                    Acesso às fichas preenchidas para impressão
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          <Button 
            onClick={handleLogin}
            disabled={loading || !nome.trim()}
            className="w-full h-12 text-lg"
          >
            {loading ? 'Entrando...' : 'Entrar no Sistema'}
          </Button>

          <div className="text-center text-sm text-gray-500">
            <p>🕒 Sua sessão será válida por 12 horas</p>
            <p>🔒 Acesso seguro e temporário</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
