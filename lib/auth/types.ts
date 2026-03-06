export type AuthRole = 'student' | 'admin';

export interface AuthUser {
  id: string;
  identifier: string;
  name: string;
  email: string;
  role: AuthRole;
}
