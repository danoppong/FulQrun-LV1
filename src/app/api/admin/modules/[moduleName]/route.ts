// Administration Module - Module Configuration API Routes
// API routes for individual module configuration

import { NextRequest, NextResponse } from 'next/server';
import { ConfigurationService } from '@/lib/admin/services/ConfigurationService';
import { getSupabaseClient } from '@/lib/supabase-client';
import { z } from 'zod';

const supabase = getSupabaseClient();

// Validation schemas
const ModuleParameterSchema = z.object({
  parameterKey: z.string(),
  value: z.unknown(),
  parameterName: z.string().optional(),
  parameterType: z.enum(['string', 'number', 'boolean', 'json', 'array', 'select', 'multiselect']).optional(),
  parameterCategory: z.string().optional(),
  helpText: z.string().optional(),
  adminOnly: z.boolean().optional(),
  reason: z.string().optional()
});

const ModuleUpdateSchema = z.object({
  parameters: z.array(ModuleParameterSchema).optional(),
  features: z.array(z.object({
    featureKey: z.string(),
    isEnabled: z.boolean(),
    reason: z.string().optional()
  })).optional()
});

// Helper functions
async function getAuthenticatedUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    throw new Error('No authorization header');
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    throw new Error('Invalid token');
  }

  return user;
}

async function getOrganizationId(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', userId)
    .single();

  if (error || !data) {
    throw new Error('User not found');
  }

  return data.organization_id;
}

async function checkAdminPermission(userId: string, permission: string) {
  const { data, error } = await supabase.rpc('has_admin_permission', {
    p_user_id: userId,
    p_permission_key: permission
  });

  if (error || !data) {
    return false;
  }

  return data;
}

// GET /api/admin/modules/[moduleName]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ moduleName: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request);
    const organizationId = await getOrganizationId(user.id);

    // Check permission
    const hasPermission = await checkAdminPermission(user.id, 'admin.modules.view');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { moduleName } = await params;
    const configService = new ConfigurationService(organizationId, user.id);
    const [features, parameters] = await Promise.all([
      configService.getModuleFeatures(moduleName as any),
      configService.getModuleParameters(moduleName as any)
    ]);

    return NextResponse.json({ 
      module: {
        name: moduleName,
        features,
        parameters
      }
    });

  } catch (error) {
    console.error('Error getting module:', error);
    return NextResponse.json(
      { error: 'Failed to get module' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/modules/[moduleName]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ moduleName: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request);
    const organizationId = await getOrganizationId(user.id);

    // Check permission
    const hasPermission = await checkAdminPermission(user.id, 'admin.modules.edit');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { moduleName } = await params;
    const body = await request.json();
    const validatedData = ModuleUpdateSchema.parse(body);

    const configService = new ConfigurationService(organizationId, user.id);

    // Update module parameters
    if (validatedData.parameters) {
      for (const param of validatedData.parameters) {
        await configService.setModuleParameter(
          moduleName as any,
          param.parameterKey,
          param.value,
          {
            parameterName: param.parameterName,
            parameterType: param.parameterType,
            parameterCategory: param.parameterCategory,
            helpText: param.helpText,
            adminOnly: param.adminOnly,
            reason: param.reason
          }
        );
      }
    }

    // Update module features
    if (validatedData.features) {
      for (const feature of validatedData.features) {
        await configService.toggleModuleFeature(
          moduleName as any,
          feature.featureKey,
          feature.isEnabled,
          feature.reason
        );
      }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error updating module:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update module' },
      { status: 500 }
    );
  }
}
