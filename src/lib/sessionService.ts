export interface UserSession {
  nome: string;
  perfil: 'consultor' | 'admin';
  timestamp: number;
  expiresAt: number;
}

export class SessionService {
  private static readonly SESSION_KEY = 'gav_user_session';
  private static readonly SESSION_DURATION = 12 * 60 * 60 * 1000; // 12 horas em ms

  static createSession(nome: string, perfil: 'consultor' | 'admin'): UserSession {
    const now = Date.now();
    const session: UserSession = {
      nome: nome.trim(),
      perfil,
      timestamp: now,
      expiresAt: now + this.SESSION_DURATION
    };

    localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    console.log(`✅ Sessão criada para ${nome} como ${perfil} - expira em 12h`);
    
    return session;
  }

  static getSession(): UserSession | null {
    try {
      const sessionData = localStorage.getItem(this.SESSION_KEY);
      if (!sessionData) return null;

      const session: UserSession = JSON.parse(sessionData);
      
      // Verificar se a sessão expirou
      if (Date.now() > session.expiresAt) {
        this.clearSession();
        console.warn('⚠️ Sessão expirada, removendo...');
        return null;
      }

      return session;
    } catch (error) {
      console.error('❌ Erro ao recuperar sessão:', error);
      this.clearSession();
      return null;
    }
  }

  static clearSession(): void {
    localStorage.removeItem(this.SESSION_KEY);
    console.log('🧹 Sessão removida');
  }

  static isSessionValid(): boolean {
    return this.getSession() !== null;
  }

  static hasPermission(requiredProfile: 'consultor' | 'admin' | 'master'): boolean {
    const session = this.getSession();
    if (!session) return false;

    // Master tem acesso a tudo; Admin tem acesso a tudo;
    if (session.perfil === 'master' || session.perfil === 'admin') return true;
    return session.perfil === requiredProfile;
  }

  static getRemainingTime(): string {
    const session = this.getSession();
    if (!session) return '0h 0m';

    const remaining = session.expiresAt - Date.now();
    if (remaining <= 0) return '0h 0m';

    const hours = Math.floor(remaining / (60 * 60 * 1000));
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
    
    return `${hours}h ${minutes}m`;
  }

  static extendSession(): boolean {
    const session = this.getSession();
    if (!session) return false;

    session.expiresAt = Date.now() + this.SESSION_DURATION;
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    
    console.log('🔄 Sessão estendida por mais 12h');
    return true;
  }
}
