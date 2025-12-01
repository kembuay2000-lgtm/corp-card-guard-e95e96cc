import { supabase } from "@/integrations/supabase/client";

export const useAuditLog = () => {
  const logAction = async (action: string, table_name: string, record_id?: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.warn('No session available for audit log');
        return;
      }

      await supabase.functions.invoke('log-audit', {
        body: {
          action,
          table_name,
          record_id,
        },
      });
    } catch (error) {
      console.error('Error logging audit action:', error);
    }
  };

  return { logAction };
};
