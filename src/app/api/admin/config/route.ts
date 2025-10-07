// Administration Module - Configuration API Endpoints
// API routes for configuration management

import { NextRequest, NextResponse } from 'next/server'
import { ConfigurationService } from '@/lib/admin/services/ConfigurationService'
import { getSupabaseClient } from '@/lib/supabase-client'
import { z } from 'zod';

const supabase = getSupabaseClient();

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const ConfigValueSchema = z.object({
  value: z.unknown(),
  reason: z.string().optional(),
  description: z.string().optional(),
  isPublic: z.boolean().optional(),
  requiresRestart: z.boolean().optional(),
  validationRules: z.array(z.object({
    type: z.enum(['required', 'min', 'max', 'pattern', 'custom']),
    value: z.unknown().optional(),
    message: z.string()
  })).optional()
});

const BulkConfigSchema = z.object({
  configs: z.array(z.object({
    key: z.string(),
    value: z.unknown(),
    category: z.enum(['organization', 'crm', 'sales_performance', 'kpi', 'learning', 'integrations', 'ai', 'mobile', 'security', 'workflow', 'ui']),
    dataType: z.enum(['string', 'number', 'boolean', 'json', 'array']),
    reason: z.string().optional()
  }))
});

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

const RollbackSchema = z.object({
  historyId: z.string().uuid()
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

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

// =============================================================================
// CONFIGURATION ENDPOINTS
// =============================================================================

// GET /api/admin/config
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const organizationId = await getOrganizationId(user.id);

    // Check permission
    const hasPermission = await checkAdminPermission(user.id, 'admin.modules.view');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    const module = url.searchParams.get('module');
    const environment = url.searchParams.get('environment') || 'production';

    const configService = new ConfigurationService(organizationId, user.id);

    if (category) {
      const configs = await configService.getConfigurationsByCategory(
        category as unknown,
        environment as unknown
      );
      return NextResponse.json({ configs });
    }

    if (module) {
      const parameters = await configService.getModuleParameters(module as unknown);
      return NextResponse.json({ parameters });
    }

    // Return all configurations
    const allConfigs = await configService.getConfigurationsByCategory('organization');
    return NextResponse.json({ configs: allConfigs });

  } catch (error) {
    console.error('Error getting configurations:', error);
    return NextResponse.json(
      { error: 'Failed to get configurations' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/config/:key
export async function PUT(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const user = await getAuthenticatedUser(request);
    const organizationId = await getOrganizationId(user.id);

    // Check permission
    const hasPermission = await checkAdminPermission(user.id, 'admin.modules.edit');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = ConfigValueSchema.parse(body);

    const configService = new ConfigurationService(organizationId, user.id);

    // Determine category and data type from config key
    const configKey = params.key;
    const category = configKey.split('.')[0] as unknown;
    const dataType = typeof validatedData.value === 'string' ? 'string' :
                    typeof validatedData.value === 'number' ? 'number' :
                    typeof validatedData.value === 'boolean' ? 'boolean' :
                    Array.isArray(validatedData.value) ? 'array' : 'json';

    const config = await configService.setConfigValue(
      configKey,
      validatedData.value,
      category,
      dataType,
      {
        description: validatedData.description,
        isPublic: validatedData.isPublic,
        requiresRestart: validatedData.requiresRestart,
        validationRules: validatedData.validationRules,
        reason: validatedData.reason
      }
    );

    return NextResponse.json({ config });

  } catch (error) {
    console.error('Error updating configuration:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update configuration' },
      { status: 500 }
    );
  }
}

// POST /api/admin/config/bulk
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const organizationId = await getOrganizationId(user.id);

    // Check permission
    const hasPermission = await checkAdminPermission(user.id, 'admin.modules.edit');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = BulkConfigSchema.parse(body);

    const configService = new ConfigurationService(organizationId, user.id);
    const results = [];

    for (const config of validatedData.configs) {
      try {
        const result = await configService.setConfigValue(
          config.key,
          config.value,
          config.category,
          config.dataType,
          { reason: config.reason }
        );
        results.push({ key: config.key, success: true, config: result });
      } catch (error) {
        results.push({ key: config.key, success: false, error: error.message });
      }
    }

    return NextResponse.json({ results });

  } catch (error) {
    console.error('Error bulk updating configurations:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to bulk update configurations' },
      { status: 500 }
    );
  }
}

// GET /api/admin/config/:key/history
export async function GET_HISTORY(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const user = await getAuthenticatedUser(request);
    const organizationId = await getOrganizationId(user.id);

    // Check permission
    const hasPermission = await checkAdminPermission(user.id, 'admin.modules.view');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');

    const configService = new ConfigurationService(organizationId, user.id);
    const history = await configService.getConfigurationHistory(params.key, limit);

    return NextResponse.json({ history });

  } catch (error) {
    console.error('Error getting configuration history:', error);
    return NextResponse.json(
      { error: 'Failed to get configuration history' },
      { status: 500 }
    );
  }
}

// POST /api/admin/config/:key/rollback
export async function POST_ROLLBACK(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const user = await getAuthenticatedUser(request);
    const organizationId = await getOrganizationId(user.id);

    // Check permission
    const hasPermission = await checkAdminPermission(user.id, 'admin.modules.edit');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = RollbackSchema.parse(body);

    const configService = new ConfigurationService(organizationId, user.id);
    const config = await configService.rollbackConfiguration(params.key, validatedData.historyId);

    return NextResponse.json({ config });

  } catch (error) {
    console.error('Error rolling back configuration:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to rollback configuration' },
      { status: 500 }
    );
  }
}

// =============================================================================
// MODULE CONFIGURATION ENDPOINTS
// =============================================================================

// GET /api/admin/modules
export async function GET_MODULES(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const organizationId = await getOrganizationId(user.id);

    // Check permission
    const hasPermission = await checkAdminPermission(user.id, 'admin.modules.view');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const configService = new ConfigurationService(organizationId, user.id);
    const features = await configService.getModuleFeatures();

    // Group features by module
    const modules = features.reduce((acc, feature) => {
      if (!acc[feature.moduleName]) {
        acc[feature.moduleName] = {
          name: feature.moduleName,
          features: [],
          enabledFeatures: 0,
          totalFeatures: 0
        };
      }
      acc[feature.moduleName].features.push(feature);
      acc[feature.moduleName].totalFeatures++;
      if (feature.isEnabled) {
        acc[feature.moduleName].enabledFeatures++;
      }
      return acc;
    }, {} as Record<string, unknown>);

    return NextResponse.json({ modules: Object.values(modules) });

  } catch (error) {
    console.error('Error getting modules:', error);
    return NextResponse.json(
      { error: 'Failed to get modules' },
      { status: 500 }
    );
  }
}

// GET /api/admin/modules/:moduleName
export async function GET_MODULE(
  request: NextRequest,
  { params }: { params: { moduleName: string } }
) {
  try {
    const user = await getAuthenticatedUser(request);
    const organizationId = await getOrganizationId(user.id);

    // Check permission
    const hasPermission = await checkAdminPermission(user.id, 'admin.modules.view');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const configService = new ConfigurationService(organizationId, user.id);
    const [features, parameters] = await Promise.all([
      configService.getModuleFeatures(params.moduleName as unknown),
      configService.getModuleParameters(params.moduleName as unknown)
    ]);

    return NextResponse.json({ 
      module: {
        name: params.moduleName,
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

// PUT /api/admin/modules/:moduleName
export async function PUT_MODULE(
  request: NextRequest,
  { params }: { params: { moduleName: string } }
) {
  try {
    const user = await getAuthenticatedUser(request);
    const organizationId = await getOrganizationId(user.id);

    // Check permission
    const hasPermission = await checkAdminPermission(user.id, 'admin.modules.edit');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const configService = new ConfigurationService(organizationId, user.id);

    // Update module parameters
    if (body.parameters) {
      for (const param of body.parameters) {
        await configService.setModuleParameter(
          params.moduleName as unknown,
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
    if (body.features) {
      for (const feature of body.features) {
        await configService.toggleModuleFeature(
          params.moduleName as unknown,
          feature.featureKey,
          feature.isEnabled,
          feature.reason
        );
      }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error updating module:', error);
    return NextResponse.json(
      { error: 'Failed to update module' },
      { status: 500 }
    );
  }
}

// POST /api/admin/modules/:moduleName/enable
export async function POST_ENABLE_MODULE(
  request: NextRequest,
  { params }: { params: { moduleName: string } }
) {
  try {
    const user = await getAuthenticatedUser(request);
    const organizationId = await getOrganizationId(user.id);

    // Check permission
    const hasPermission = await checkAdminPermission(user.id, 'admin.modules.toggle');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const configService = new ConfigurationService(organizationId, user.id);
    
    // Enable all features for the module
    const features = await configService.getModuleFeatures(params.moduleName as unknown);
    for (const feature of features) {
      if (!feature.isEnabled) {
        await configService.toggleModuleFeature(
          params.moduleName as unknown,
          feature.featureKey,
          true,
          'Module enabled via API'
        );
      }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error enabling module:', error);
    return NextResponse.json(
      { error: 'Failed to enable module' },
      { status: 500 }
    );
  }
}

// POST /api/admin/modules/:moduleName/disable
export async function POST_DISABLE_MODULE(
  request: NextRequest,
  { params }: { params: { moduleName: string } }
) {
  try {
    const user = await getAuthenticatedUser(request);
    const organizationId = await getOrganizationId(user.id);

    // Check permission
    const hasPermission = await checkAdminPermission(user.id, 'admin.modules.toggle');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const configService = new ConfigurationService(organizationId, user.id);
    
    // Disable all features for the module
    const features = await configService.getModuleFeatures(params.moduleName as unknown);
    for (const feature of features) {
      if (feature.isEnabled) {
        await configService.toggleModuleFeature(
          params.moduleName as unknown,
          feature.featureKey,
          false,
          'Module disabled via API'
        );
      }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error disabling module:', error);
    return NextResponse.json(
      { error: 'Failed to disable module' },
      { status: 500 }
    );
  }
}

// =============================================================================
// AUDIT LOG ENDPOINTS
// =============================================================================

// GET /api/admin/audit-logs
export async function GET_AUDIT_LOGS(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const organizationId = await getOrganizationId(user.id);

    // Check permission
    const hasPermission = await checkAdminPermission(user.id, 'admin.audit.view');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const url = new URL(request.url);
    const actionType = url.searchParams.get('actionType');
    const riskLevel = url.searchParams.get('riskLevel');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const limit = parseInt(url.searchParams.get('limit') || '50');

    const configService = new ConfigurationService(organizationId, user.id);
    const logs = await configService.getAdminActionLogs({
      actionType: actionType as unknown,
      riskLevel: riskLevel as unknown,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit
    });

    return NextResponse.json({ logs });

  } catch (error) {
    console.error('Error getting audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to get audit logs' },
      { status: 500 }
    );
  }
}
