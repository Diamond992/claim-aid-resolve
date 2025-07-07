
export interface ActivityLog {
  id: string;
  admin_user_id: string | null;
  action: string;
  target_user_id: string | null;
  details: any;
  created_at: string | null;
  profiles: {
    first_name: string;
    last_name: string;
    email: string;
  } | null;
}
