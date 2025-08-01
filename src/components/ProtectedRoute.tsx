import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SessionService } from '@/lib/sessionService';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredProfile?: 'consultor' | 'admin';
  allowAll?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredProfile,
  allowAll = false 
}) => {
  const navigate = useNavigate();

  useEffect(() => {
    const session = SessionService.getSession();
    
    // Se não há sessão válida, redirecionar para login
    if (!session) {
      navigate('/login');
      return;
    }

    // Se allowAll é true, permitir acesso independente do perfil
    if (allowAll) {
      return;
    }

    // Se um perfil específico é necessário, verificar permissão
    if (requiredProfile && !SessionService.hasPermission(requiredProfile)) {
      // Redirecionar para a página apropriada baseada no perfil do usuário
      if (session.perfil === 'admin') {
        navigate('/admin-dashboard');
      } else {
        navigate('/cadastro-cliente');
      }
      return;
    }
  }, [navigate, requiredProfile, allowAll]);

  // Verificar se a sessão ainda é válida
  const session = SessionService.getSession();
  if (!session) {
    return null; // O useEffect vai redirecionar
  }

  // Se allowAll é true ou se tem a permissão necessária, renderizar children
  if (allowAll || !requiredProfile || SessionService.hasPermission(requiredProfile)) {
    return <>{children}</>;
  }

  return null;
};

export default ProtectedRoute;
