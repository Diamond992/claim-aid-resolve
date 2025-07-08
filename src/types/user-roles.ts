
export type UserRole = 'user' | 'admin';

export interface UserRoleInfo {
  id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
}
