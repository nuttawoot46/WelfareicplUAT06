import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

export function useNavContext() {
  const { user, profile, signOut } = useAuth();
  const userRole = profile?.role?.toLowerCase() || '';
  const isAdmin = userRole === 'admin';
  const isSuperAdmin = userRole === 'superadmin';
  const [isExecutive, setIsExecutive] = useState(false);
  const [hasSalesZone, setHasSalesZone] = useState(false);

  // Check if user is an executive (has employees with executive_id pointing to them)
  useEffect(() => {
    const checkExecutiveStatus = async () => {
      if (!profile?.employee_id) return;
      try {
        const { data, error } = await (supabase
          .from('Employee')
          .select('id') as any)
          .eq('executive_id', profile.employee_id)
          .limit(1);

        if (!error && data && data.length > 0) {
          setIsExecutive(true);
        } else {
          setIsExecutive(false);
        }
      } catch {
        setIsExecutive(false);
      }
    };
    checkExecutiveStatus();
  }, [profile?.employee_id]);

  // Check if user has sales_zone (sales team)
  useEffect(() => {
    const checkSalesZone = async () => {
      if (!profile?.employee_id) return;
      try {
        const { data, error } = await (supabase
          .from('Employee')
          .select('sales_zone') as any)
          .eq('id', profile.employee_id)
          .single();

        if (!error && data && data.sales_zone) {
          setHasSalesZone(true);
        } else {
          setHasSalesZone(false);
        }
      } catch {
        setHasSalesZone(false);
      }
    };
    checkSalesZone();
  }, [profile?.employee_id]);

  const displayName = profile?.display_name ||
    `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() ||
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    "User";

  return {
    user,
    profile,
    signOut,
    userRole,
    isAdmin,
    isSuperAdmin,
    isExecutive,
    hasSalesZone,
    userEmail: user?.email || '',
    displayName,
    email: user?.email || '',
    department: profile?.department || '',
    position: profile?.position || '',
  };
}
