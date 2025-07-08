
export type UserRole = 'user' | 'admin' | 'super_admin';

export interface UserRoleInfo {
  id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
}
