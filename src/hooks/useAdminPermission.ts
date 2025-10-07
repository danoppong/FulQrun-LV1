/**
 * useAdminPermission Hook
 * 
 * Checks if the current user has a specific admin permission
 * Uses Supabase RPC to call the has_admin_permission function
 */

'use client';

import { useState, useEffect } from 'react'
import { getSupabaseClient } from '@/lib/supabase-client';

interface UseAdminPermissionResult {
  hasPermission: boolean;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook to check admin permissions
 * @param permission - Permission key to check (e.g., 'admin.modules.view')
 * @returns Object with hasPermission, loading, and error states
 */
export function useAdminPermission(permission: string): UseAdminPermissionResult {
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function checkPermission() {
      try {
        setLoading(true);
        setError(null);

        const supabase = getSupabaseClient();
        
        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          setHasPermission(false);
          setLoading(false);
          return;
        }

        // Check permission via RPC
        const { data, error: rpcError } = await supabase.rpc('has_admin_permission', {
          p_user_id: user.id,
          p_permission_key: permission
        });

        if (rpcError) {
          console.error('Error checking permission:', rpcError);
          setError(new Error(rpcError.message));
          setHasPermission(false);
        } else {
          setHasPermission(data === true);
        }
      } catch (err) {
        console.error('Error in useAdminPermission:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setHasPermission(false);
      } finally {
        setLoading(false);
      }
    }

    checkPermission();
  }, [permission]);

  return { hasPermission, loading, error };
}

/**
 * Admin permission keys
 * Centralized list of all available permissions
 */
export const ADMIN_PERMISSIONS = {
  // Module Management
  MODULES_VIEW: 'admin.modules.view',
  MODULES_TOGGLE: 'admin.modules.toggle',
  MODULES_CONFIGURE: 'admin.modules.configure',
  
  // Organization Management
  ORG_VIEW: 'admin.organization.view',
  ORG_EDIT: 'admin.organization.edit',
  ORG_DELETE: 'admin.organization.delete',
  
  // User Management
  USERS_VIEW: 'admin.users.view',
  USERS_CREATE: 'admin.users.create',
  USERS_EDIT: 'admin.users.edit',
  USERS_DELETE: 'admin.users.delete',
  
  // Role Management
  ROLES_VIEW: 'admin.roles.view',
  ROLES_CREATE: 'admin.roles.create',
  ROLES_EDIT: 'admin.roles.edit',
  ROLES_DELETE: 'admin.roles.delete',
  
  // System Administration
  SYSTEM_VIEW: 'admin.system.view',
  SYSTEM_EDIT: 'admin.system.edit',
  SYSTEM_MAINTENANCE: 'admin.system.maintenance',
  
  // Customization
  CUSTOM_FIELDS: 'admin.customization.fields',
  CUSTOM_FORMS: 'admin.customization.forms',
  CUSTOM_WORKFLOWS: 'admin.customization.workflows',
  
  // Security & Compliance
  SECURITY_VIEW: 'admin.security.view',
  SECURITY_CONFIGURE: 'admin.security.configure',
  AUDIT_LOGS: 'admin.audit.view',
} as const;

/**
 * Helper function to check multiple permissions
 * Returns true if user has ALL specified permissions
 */
export async function checkPermissions(permissions: string[]): Promise<boolean> {
  const supabase = getSupabaseClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const checks = await Promise.all(
    permissions.map(async (permission) => {
      const { data } = await supabase.rpc('has_admin_permission', {
        p_user_id: user.id,
        p_permission_key: permission
      });
      return data === true;
    })
  );

  return checks.every(check => check === true);
}

/**
 * Helper function to check if user has ANY of the specified permissions
 * Returns true if user has AT LEAST ONE of the specified permissions
 */
export async function checkAnyPermission(permissions: string[]): Promise<boolean> {
  const supabase = getSupabaseClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const checks = await Promise.all(
    permissions.map(async (permission) => {
      const { data } = await supabase.rpc('has_admin_permission', {
        p_user_id: user.id,
        p_permission_key: permission
      });
      return data === true;
    })
  );

  return checks.some(check => check === true);
}

