
-- Create a helper function to get activity logs with profiles
CREATE OR REPLACE FUNCTION public.get_activity_logs_with_profiles()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  dossier_id UUID,
  action VARCHAR(100),
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  profiles JSONB,
  dossier JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    al.id,
    al.user_id,
    al.dossier_id,
    al.action,
    al.details,
    al.ip_address,
    al.user_agent,
    al.created_at,
    jsonb_build_object(
      'first_name', p.first_name,
      'last_name', p.last_name,
      'email', p.email
    ) as profiles,
    CASE 
      WHEN d.compagnie_assurance IS NOT NULL THEN
        jsonb_build_object('compagnie_assurance', d.compagnie_assurance)
      ELSE
        NULL
    END as dossier
  FROM public.activity_logs al
  LEFT JOIN public.profiles p ON al.user_id = p.id
  LEFT JOIN public.dossiers d ON al.dossier_id = d.id
  ORDER BY al.created_at DESC
  LIMIT 200;
END;
$$;

-- Grant execute permission to authenticated users (will be filtered by RLS)
GRANT EXECUTE ON FUNCTION public.get_activity_logs_with_profiles() TO authenticated;
