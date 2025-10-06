# Admin Features Implementation Plan
## Comprehensive Roadmap for Module Features System

**Status:** Ready for Implementation  
**Priority:** High  
**Estimated Time:** 4-6 hours

---

## Phase 1: Database Schema Setup (1-2 hours)

### 1.1 Verify Existing Schema
**File:** `supabase/migrations/027_administration_module_schema.sql`

**Tasks:**
- ✅ Verify `module_features` table exists
- ✅ Verify `module_parameters` table exists
- ✅ Verify RLS policies are defined
- ✅ Verify indexes for performance

**Check:**
```sql
-- Run this to verify tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('module_features', 'module_parameters', 'system_configurations');
```

### 1.2 Add Missing Database Functions

**File:** `supabase/migrations/028_admin_rbac_functions.sql` (NEW)

**Functions to Create:**

```sql
-- Function to check admin permissions
CREATE OR REPLACE FUNCTION has_admin_permission(
  p_user_id UUID,
  p_permission_key TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_has_permission BOOLEAN := FALSE;
  v_is_super_admin BOOLEAN := FALSE;
BEGIN
  -- Check if user is super admin
  SELECT EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = p_user_id
    AND r.name = 'super_admin'
  ) INTO v_is_super_admin;
  
  IF v_is_super_admin THEN
    RETURN TRUE;
  END IF;
  
  -- Check specific permission
  SELECT EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN role_permissions rp ON ur.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = p_user_id
    AND p.permission_key = p_permission_key
    AND p.is_active = TRUE
  ) INTO v_has_permission;
  
  RETURN v_has_permission;
END;
$$;

-- Function to toggle module feature
CREATE OR REPLACE FUNCTION toggle_module_feature(
  p_organization_id UUID,
  p_module_name TEXT,
  p_feature_key TEXT,
  p_enabled BOOLEAN,
  p_user_id UUID
)
RETURNS TABLE (
  id UUID,
  feature_name TEXT,
  is_enabled BOOLEAN,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the feature
  UPDATE module_features
  SET 
    is_enabled = p_enabled,
    updated_by = p_user_id,
    updated_at = NOW()
  WHERE 
    organization_id = p_organization_id
    AND module_name = p_module_name
    AND feature_key = p_feature_key;
  
  -- Return the updated feature
  RETURN QUERY
  SELECT 
    mf.id,
    mf.feature_name,
    mf.is_enabled,
    mf.updated_at
  FROM module_features mf
  WHERE 
    mf.organization_id = p_organization_id
    AND mf.module_name = p_module_name
    AND mf.feature_key = p_feature_key;
END;
$$;
```

### 1.3 Seed Initial Module Features Data

**File:** `supabase/migrations/029_seed_module_features.sql` (NEW)

```sql
-- Insert default module features for all organizations
-- This will be a template that organizations can customize

-- CRM Module Features
INSERT INTO module_features (
  organization_id, module_name, feature_key, feature_name, 
  is_enabled, is_beta, requires_license, depends_on, 
  rollout_percentage, created_by
)
SELECT 
  o.id,
  'crm',
  'leads',
  'Lead Management',
  TRUE,
  FALSE,
  'standard',
  '{}',
  100,
  (SELECT id FROM users WHERE organization_id = o.id LIMIT 1)
FROM organizations o
ON CONFLICT (organization_id, module_name, feature_key) DO NOTHING;

INSERT INTO module_features (
  organization_id, module_name, feature_key, feature_name, 
  is_enabled, is_beta, requires_license, depends_on, 
  rollout_percentage, created_by
)
SELECT 
  o.id,
  'crm',
  'opportunities',
  'Opportunity Tracking',
  TRUE,
  FALSE,
  'standard',
  ARRAY['leads']::TEXT[],
  100,
  (SELECT id FROM users WHERE organization_id = o.id LIMIT 1)
FROM organizations o
ON CONFLICT (organization_id, module_name, feature_key) DO NOTHING;

INSERT INTO module_features (
  organization_id, module_name, feature_key, feature_name, 
  is_enabled, is_beta, requires_license, depends_on, 
  rollout_percentage, created_by
)
SELECT 
  o.id,
  'crm',
  'ai_scoring',
  'AI Lead Scoring',
  FALSE,
  TRUE,
  'enterprise',
  ARRAY['leads']::TEXT[],
  50,
  (SELECT id FROM users WHERE organization_id = o.id LIMIT 1)
FROM organizations o
ON CONFLICT (organization_id, module_name, feature_key) DO NOTHING;

-- Sales Performance Module Features
INSERT INTO module_features (
  organization_id, module_name, feature_key, feature_name, 
  is_enabled, is_beta, requires_license, depends_on, 
  rollout_percentage, created_by
)
SELECT 
  o.id,
  'sales_performance',
  'forecasting',
  'Sales Forecasting',
  TRUE,
  FALSE,
  'professional',
  '{}',
  100,
  (SELECT id FROM users WHERE organization_id = o.id LIMIT 1)
FROM organizations o
ON CONFLICT (organization_id, module_name, feature_key) DO NOTHING;

INSERT INTO module_features (
  organization_id, module_name, feature_key, feature_name, 
  is_enabled, is_beta, requires_license, depends_on, 
  rollout_percentage, created_by
)
SELECT 
  o.id,
  'sales_performance',
  'metrics',
  'Performance Metrics',
  TRUE,
  FALSE,
  'professional',
  '{}',
  100,
  (SELECT id FROM users WHERE organization_id = o.id LIMIT 1)
FROM organizations o
ON CONFLICT (organization_id, module_name, feature_key) DO NOTHING;

-- Add more features for other modules...
```

---

## Phase 2: RBAC Implementation (1-2 hours)

### 2.1 Update API Routes to Use RBAC

**File:** `src/app/api/admin/modules/route.ts`

**Changes:**
```typescript
async function checkAdminPermission(supabase: any, userId: string, permission: string) {
  // Uncomment the RPC call
  const { data, error } = await supabase.rpc('has_admin_permission', {
    p_user_id: userId,
    p_permission_key: permission
  });

  if (error) {
    console.error('Error checking admin permission:', error);
    return false;
  }

  return data || false;
}
```

### 2.2 Define Permission Keys

**File:** `src/lib/admin/types/admin-types.ts`

**Add:**
```typescript
export const ADMIN_PERMISSIONS = {
  // Module Management
  MODULES_VIEW: 'admin.modules.view',
  MODULES_TOGGLE: 'admin.modules.toggle',
  MODULES_CONFIGURE: 'admin.modules.configure',
  
  // Organization Management
  ORG_VIEW: 'admin.organization.view',
  ORG_EDIT: 'admin.organization.edit',
  
  // User Management
  USERS_VIEW: 'admin.users.view',
  USERS_EDIT: 'admin.users.edit',
  USERS_DELETE: 'admin.users.delete',
  
  // Role Management
  ROLES_VIEW: 'admin.roles.view',
  ROLES_EDIT: 'admin.roles.edit',
  
  // System Administration
  SYSTEM_VIEW: 'admin.system.view',
  SYSTEM_EDIT: 'admin.system.edit',
} as const;
```

### 2.3 Create Permission Check Hook

**File:** `src/hooks/useAdminPermission.ts` (NEW)

```typescript
'use client';

import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase-client';

export function useAdminPermission(permission: string) {
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabase = getSupabaseClient();

  useEffect(() => {
    async function checkPermission() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setHasPermission(false);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.rpc('has_admin_permission', {
          p_user_id: user.id,
          p_permission_key: permission
        });

        if (error) {
          console.error('Error checking permission:', error);
          setHasPermission(false);
        } else {
          setHasPermission(data || false);
        }
      } catch (error) {
        console.error('Error checking permission:', error);
        setHasPermission(false);
      } finally {
        setLoading(false);
      }
    }

    checkPermission();
  }, [permission, supabase]);

  return { hasPermission, loading };
}
```

---

## Phase 3: Feature Toggle API (1 hour)

### 3.1 Create Feature Toggle Endpoint

**File:** `src/app/api/admin/modules/[moduleName]/features/[featureKey]/toggle/route.ts` (NEW)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { supabaseConfig } from '@/lib/config';

export async function POST(
  request: NextRequest,
  { params }: { params: { moduleName: string; featureKey: string } }
) {
  try {
    // Create supabase client
    const supabase = createServerClient(
      supabaseConfig.url!,
      supabaseConfig.anonKey!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set() {},
          remove() {},
        },
      }
    );

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check permission
    const { data: hasPermission } = await supabase.rpc('has_admin_permission', {
      p_user_id: user.id,
      p_permission_key: 'admin.modules.toggle'
    });

    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get organization ID
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Parse request body
    const body = await request.json();
    const { enabled } = body;

    if (typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // Toggle the feature
    const { data, error } = await supabase.rpc('toggle_module_feature', {
      p_organization_id: userData.organization_id,
      p_module_name: params.moduleName,
      p_feature_key: params.featureKey,
      p_enabled: enabled,
      p_user_id: user.id
    });

    if (error) {
      console.error('Error toggling feature:', error);
      return NextResponse.json({ error: 'Failed to toggle feature' }, { status: 500 });
    }

    // Log the action
    await supabase.from('admin_action_logs').insert({
      organization_id: userData.organization_id,
      admin_user_id: user.id,
      action_type: enabled ? 'module_enable' : 'module_disable',
      action_category: 'module_management',
      action_description: `${enabled ? 'Enabled' : 'Disabled'} feature ${params.featureKey} in module ${params.moduleName}`,
      previous_state: { enabled: !enabled },
      new_state: { enabled },
      risk_level: 'low'
    });

    return NextResponse.json({ 
      success: true, 
      feature: data?.[0] || { enabled }
    });

  } catch (error) {
    console.error('Error in feature toggle:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 3.2 Update Features Page to Call Toggle API

**File:** `src/app/admin/organization/features/page.tsx`

**Update `handleToggleFeature` function:**

```typescript
const handleToggleFeature = async (
  moduleName: string,
  featureKey: string, 
  currentState: boolean
) => {
  setIsToggling({ ...isToggling, [featureKey]: true });
  
  try {
    const response = await fetch(
      `/api/admin/modules/${moduleName}/features/${featureKey}/toggle`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ enabled: !currentState }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to toggle feature');
    }

    const result = await response.json();
    
    // Update local state
    setModules(modules.map(module => {
      if (module.name === moduleName) {
        return {
          ...module,
          features: module.features.map(f => 
            f.featureKey === featureKey 
              ? { ...f, isEnabled: !currentState }
              : f
          ),
          enabledFeatures: !currentState 
            ? module.enabledFeatures + 1 
            : module.enabledFeatures - 1
        };
      }
      return module;
    }));

    // Show success message
    console.log('Feature toggled successfully:', result);
    
  } catch (error) {
    console.error('Error toggling feature:', error);
    alert('Failed to toggle feature. Please try again.');
  } finally {
    setIsToggling({ ...isToggling, [featureKey]: false });
  }
};
```

---

## Phase 4: Loading States & UI Improvements (30 minutes)

### 4.1 Update ModuleCard Component

**File:** `src/app/admin/organization/features/page.tsx`

**Add loading indicators:**

```typescript
function ModuleCard({ 
  module, 
  onToggleFeature,
  isToggling 
}: { 
  module: Module; 
  onToggleFeature: (moduleName: string, featureKey: string, currentState: boolean) => Promise<void>;
  isToggling: Record<string, boolean>;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* ... existing header code ... */}

      {isExpanded && (
        <div className="border-t border-gray-200 bg-gray-50 p-6">
          <div className="space-y-3">
            {module.features.map((feature) => (
              <div
                key={feature.id}
                className="flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200"
              >
                {/* ... existing feature info ... */}

                <div className="ml-4 flex items-center space-x-3">
                  {/* Loading spinner */}
                  {isToggling[feature.featureKey] && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  )}
                  
                  {/* Toggle button */}
                  <button
                    onClick={() => onToggleFeature(module.name, feature.featureKey, feature.isEnabled)}
                    disabled={isToggling[feature.featureKey]}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      feature.isEnabled ? 'bg-blue-600' : 'bg-gray-200'
                    } ${isToggling[feature.featureKey] ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    aria-label={`Toggle ${feature.featureName}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        feature.isEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

### 4.2 Add Toast Notifications

**File:** `src/components/Toast.tsx` (NEW)

```typescript
'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircleIcon, XCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

type ToastType = 'success' | 'error';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  showToast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).substring(7);
    setToasts(prev => [...prev, { id, type, message }]);
    
    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center p-4 rounded-lg shadow-lg ${
              toast.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircleIcon className="h-5 w-5 text-green-600 mr-3" />
            ) : (
              <XCircleIcon className="h-5 w-5 text-red-600 mr-3" />
            )}
            <p className={`text-sm font-medium ${
              toast.type === 'success' ? 'text-green-800' : 'text-red-800'
            }`}>
              {toast.message}
            </p>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-4 text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
```

---

## Phase 5: Testing & Validation (30 minutes)

### 5.1 Manual Testing Checklist

- [ ] Run database migrations
- [ ] Verify module_features table has data
- [ ] Test feature toggle API endpoint
- [ ] Verify RBAC permissions work correctly
- [ ] Test toggle with insufficient permissions (should fail)
- [ ] Test toggle with valid permissions (should succeed)
- [ ] Verify UI updates after toggle
- [ ] Test loading states during toggle
- [ ] Verify audit log entries are created
- [ ] Test with multiple users simultaneously

### 5.2 SQL Validation Queries

```sql
-- Check if features exist
SELECT COUNT(*) as feature_count 
FROM module_features;

-- Verify RLS is working
SELECT * FROM module_features 
WHERE organization_id = 'YOUR_ORG_ID';

-- Check audit logs
SELECT * FROM admin_action_logs 
WHERE action_type IN ('module_enable', 'module_disable')
ORDER BY created_at DESC 
LIMIT 10;
```

---

## Implementation Order

### Step 1: Database Setup (Start Here)
```bash
# Run migrations
cd supabase
psql -h YOUR_HOST -U postgres -d postgres -f migrations/028_admin_rbac_functions.sql
psql -h YOUR_HOST -U postgres -d postgres -f migrations/029_seed_module_features.sql
```

### Step 2: Backend APIs
1. Update `/api/admin/modules/route.ts` with RBAC
2. Create feature toggle API route
3. Test with Postman/curl

### Step 3: Frontend Integration
1. Create `useAdminPermission` hook
2. Update features page with real API calls
3. Add toast notifications
4. Add loading states

### Step 4: Testing
1. Manual testing
2. SQL validation
3. Edge case testing

---

## Rollback Plan

If issues occur:

1. **Disable new features:**
   ```typescript
   // In features page, comment out API call
   // return; // Fallback to mock data
   ```

2. **Revert database changes:**
   ```sql
   DROP FUNCTION IF EXISTS toggle_module_feature;
   DROP FUNCTION IF EXISTS has_admin_permission;
   ```

3. **Emergency bypass:**
   ```typescript
   // In API route, temporarily return true
   async function checkAdminPermission() {
     return true; // TEMPORARY BYPASS
   }
   ```

---

## Success Metrics

✅ Module features load from database  
✅ Feature toggles work in real-time  
✅ RBAC prevents unauthorized access  
✅ Audit logs track all changes  
✅ UI provides clear feedback  
✅ No performance degradation  
✅ Zero data loss during migration  

---

## Notes

- Keep mock data as fallback during development
- Test thoroughly before deploying to production
- Monitor API response times
- Consider caching for frequently accessed data
- Plan for multi-tenant scenarios
- Document permission requirements for each endpoint

---

**Next Actions:**
1. Review this plan with team
2. Set up development environment
3. Begin with Phase 1 (Database Setup)
4. Proceed sequentially through phases
5. Test after each phase
6. Deploy to staging first

