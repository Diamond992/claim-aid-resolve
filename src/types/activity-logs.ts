
export interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  table_name: string;
  record_id?: string;
  old_values?: any;
  new_values?: any;
  created_at: string;
  profiles: {
    first_name: string;
    last_name: string;
    email: string;
  };
}
