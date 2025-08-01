import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { SessionService } from '@/lib/sessionService';
import gavLogo from '@/assets/gav-logo.png';

const Welcome = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const session = SessionService.getSession();

    if (!session) {
      // Se não há sessão, redirecionar para login após 3 segundos
      const timerNavigate = setTimeout(() => {
        navigate('/login');
      }, 3000);
      return () => clearTimeout(timerNavigate);
    }

    // Se há sessão, redirecionar baseado no perfil após 3 segundos
    const timerNavigate = setTimeout(() => {
      if (session.perfil === "admin") {
        navigate('/admin-dashboard');
      } else {
        navigate('/cadastro-cliente');
      }
    }, 3000);

    return () => clearTimeout(timerNavigate);
  }, [navigate]);

  return (
    <div 
      className="fixed top-0 left-0 w-full h-full flex flex-col items-center justify-center text-white z-50 animate-fade-out"
      style={{
        background: 'linear-gradient(135deg, #0d1b2a, #1b263b, #415a77, #0d1b2a)',
        backgroundSize: '400% 400%',
        animation: 'gradient-bg 8s ease infinite, fade-out 1s ease-in-out 5s forwards'
      }}
    >
      {/* Botão de Configurações */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/configuracoes')}
        className="absolute top-4 right-4 text-white hover:bg-white/10 flex items-center gap-2"
      >
        <Settings className="h-4 w-4" />
        Configurações
      </Button>
      
      <img 
        src={gavLogo} 
        alt="Logo GAV Resorts" 
        className="w-32 h-32 animate-pulse-logo"
        style={{ 
          filter: 'drop-shadow(0 0 15px rgba(255, 255, 255, 0.3))',
          transition: 'all 0.3s ease'
        }}
      />
      
      <h1 
        className="mt-6 text-3xl font-light opacity-0 animate-fade-in-up tracking-wide"
        style={{ letterSpacing: '1px' }}
      >
        Parabéns, <span className="font-semibold text-[#58e1c1]" style={{ textShadow: '0 0 10px rgba(88, 225, 193, 0.6)' }}>300 do Sul!</span>
      </h1>
    </div>
  );
};

export default Welcome;
