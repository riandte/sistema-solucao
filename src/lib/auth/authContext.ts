import { RoleName } from '@/lib/types';
import { SystemConfig } from '@/lib/config/systemConfig';
import { UserParameters } from '@/lib/config/systemParameters';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  roles: RoleName[];
}

export interface AuthContext {
  user: UserSession;
}

/**
 * Entidade Completa de Usuário (Persistência)
 */
export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // Opcional, apenas para mock auth simples
  roles: RoleName[];
  active: boolean;

  // Configurações e Parâmetros
  configuracoes?: SystemConfig; // Opcional pois pode herdar global, mas no mock vamos preencher
  parametros: UserParameters;

  createdAt: string;
  updatedAt?: string;
}
