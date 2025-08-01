import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SessionService } from '@/lib/sessionService';
import { LogOut, Clock, User } from 'lucide-react';

const SessionHeader = () => {
  const navigate = useNavigate();
  const session = SessionService.getSession();

  const handleLogout = () => {
    SessionService.clearSession();
    navigate('/login');
  };

  if (!session) return null;

  return (
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">GAV</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">GAV Resorts</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm">
              <User className="h-4 w-4 text-gray-500" />
              <span className="text-gray-700 font-medium">{session.nome}</span>
              <span className="text-gray-500">({session.perfil})</span>
            </div>
            
            <div className="flex items-center space-x-2 text-sm">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-gray-700">Expira em: {SessionService.getRemainingTime()}</span>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="flex items-center space-x-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Sair</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionHeader;
