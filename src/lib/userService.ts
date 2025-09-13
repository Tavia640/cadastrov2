export type Perfil = 'master' | 'admin' | 'consultor';

export interface Usuario {
  id: string;
  nome: string;
  perfil: Perfil;
  senha: string; // armazenado como "salt:hash"
  criadoEm: number;
}

export class UserService {
  private static readonly KEY = 'gav_users';

  static hasUsers(): boolean {
    try {
      const data = localStorage.getItem(this.KEY);
      if (!data) return false;
      const arr = JSON.parse(data);
      return Array.isArray(arr) && arr.length > 0;
    } catch {
      return false;
    }
  }

  static list(): Usuario[] {
    try {
      const data = localStorage.getItem(this.KEY);
      const arr = data ? JSON.parse(data) : [];
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }

  private static save(users: Usuario[]) {
    localStorage.setItem(this.KEY, JSON.stringify(users));
  }

  private static randomId(): string {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  private static async sha256(text: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  }

  private static async hashPassword(password: string, salt: string): Promise<string> {
    const h = await this.sha256(password + ':' + salt);
    return `${salt}:${h}`;
  }

  private static async verifyPassword(password: string, stored: string): Promise<boolean> {
    const [salt, hash] = stored.split(':');
    if (!salt || !hash) return false;
    const calc = await this.sha256(password + ':' + salt);
    return calc === hash;
  }

  static async createMaster(nome: string, senha: string): Promise<Usuario> {
    const users = this.list();
    const existsMaster = users.some((u) => u.perfil === 'master');
    if (existsMaster) throw new Error('Já existe um usuário master');
    const salt = this.randomId();
    const hashed = await this.hashPassword(senha, salt);
    const user: Usuario = {
      id: this.randomId(),
      nome: nome.trim(),
      perfil: 'master',
      senha: hashed,
      criadoEm: Date.now(),
    };
    users.push(user);
    this.save(users);
    return user;
  }

  static async createUser(requester: { perfil: Perfil }, nome: string, senha: string, perfil: Exclude<Perfil, 'master'>): Promise<Usuario> {
    if (!requester || requester.perfil !== 'master') throw new Error('Sem permissão');
    const users = this.list();
    if (users.some((u) => u.nome.toLowerCase() === nome.trim().toLowerCase())) {
      throw new Error('Usuário já existe');
    }
    const salt = this.randomId();
    const hashed = await this.hashPassword(senha, salt);
    const user: Usuario = {
      id: this.randomId(),
      nome: nome.trim(),
      perfil,
      senha: hashed,
      criadoEm: Date.now(),
    };
    users.push(user);
    this.save(users);
    return user;
  }

  static async deleteUser(requester: { perfil: Perfil }, id: string): Promise<boolean> {
    if (!requester || requester.perfil !== 'master') throw new Error('Sem permissão');
    const users = this.list();
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) return false;
    if (users[idx].perfil === 'master') throw new Error('Não é possível remover o master');
    users.splice(idx, 1);
    this.save(users);
    return true;
  }

  static async authenticate(nome: string, senha: string): Promise<Usuario | null> {
    const users = this.list();
    const user = users.find((u) => u.nome.toLowerCase() === nome.trim().toLowerCase());
    if (!user) return null;
    const ok = await this.verifyPassword(senha, user.senha);
    return ok ? user : null;
  }
}
