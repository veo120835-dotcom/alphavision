import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface Organization {
  id: string;
  name: string;
}

interface PermissionContract {
  id: string;
  organization_id: string;
  risk_posture_personal: string;
  risk_posture_business: string;
  risk_posture_marketing: string;
  runway_minimum: number;
  monthly_cap_ads: number;
  monthly_cap_experiments: number;
  monthly_cap_tool_actions: number;
}

export function useOrganization() {
  const { user } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [permissionContract, setPermissionContract] = useState<PermissionContract | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setOrganization(null);
      setPermissionContract(null);
      setLoading(false);
      return;
    }

    const fetchOrganization = async () => {
      try {
        // Get user's membership
        const { data: membership, error: membershipError } = await supabase
          .from('memberships')
          .select('organization_id')
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle();

        if (membershipError) {
          console.error('Error fetching membership:', membershipError);
          setLoading(false);
          return;
        }

        if (!membership) {
          setLoading(false);
          return;
        }

        // Get organization
        const { data: org, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', membership.organization_id)
          .maybeSingle();

        if (orgError) {
          console.error('Error fetching organization:', orgError);
        } else {
          setOrganization(org);
        }

        // Get permission contract
        const { data: contract, error: contractError } = await supabase
          .from('permission_contracts')
          .select('*')
          .eq('organization_id', membership.organization_id)
          .order('version', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (contractError) {
          console.error('Error fetching permission contract:', contractError);
        } else {
          setPermissionContract(contract);
        }
      } catch (error) {
        console.error('Error in fetchOrganization:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrganization();
  }, [user]);

  const updatePermissionContract = async (updates: Partial<PermissionContract>) => {
    if (!permissionContract) return { error: new Error('No permission contract found') };

    const { data, error } = await supabase
      .from('permission_contracts')
      .update(updates)
      .eq('id', permissionContract.id)
      .select()
      .single();

    if (!error && data) {
      setPermissionContract(data);
    }

    return { data, error };
  };

  return { organization, permissionContract, loading, updatePermissionContract };
}
