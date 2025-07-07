
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ActivityLog } from "@/types/activity-logs";

export const useActivityLogs = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchActivityLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select(`
          *,
          profiles (
            first_name,
            last_name,
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      toast.error("Erreur lors du chargement des logs d'activité");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivityLogs();
  }, []);

  return {
    logs,
    isLoading,
    refetch: fetchActivityLogs
  };
};
