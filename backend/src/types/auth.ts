export type UserRole = 'USER' | 'ADMIN';

export interface AuthUser {
  userId: string;
  email: string;
  role: UserRole;
}

