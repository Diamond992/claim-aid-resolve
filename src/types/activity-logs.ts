
export interface ActivityLog {
  id: string;
  action: string;
  admin_user_id: string | null;
  target_user_id: string | null;
  created_at: string | null;
  details: any; // Json type
  profiles?: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  } | null;
}
