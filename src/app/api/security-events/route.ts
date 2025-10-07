// Security Events API Route
// API endpoint for fetching security events from database

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

// =============================================================================
// GET /api/security-events
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get URL parameters for filtering
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const severity = searchParams.get('severity');
    const eventType = searchParams.get('eventType');
    const resolved = searchParams.get('resolved');

    // First get the active password policy for the organization
    const { data: activePolicy, error: policyError } = await supabase
      .from('password_policies')
      .select('id')
      .eq('organization_id', userData.organization_id)
      .eq('is_active', true)
      .single();

    if (policyError || !activePolicy) {
      // No active policy found, return empty events
      return NextResponse.json({ 
        events: [],
        total: 0,
        timestamp: new Date().toISOString(),
        message: 'No active password policy found'
      });
    }

    // Build query for password policy audit log
    let auditQuery = supabase
      .from('password_policy_audit_log')
      .select(`
        id,
        user_id,
        action_type,
        action_details,
        ip_address,
        user_agent,
        created_at,
        users!inner(email, full_name)
      `)
      .eq('policy_id', activePolicy.id)
      .order('created_at', { ascending: false })
      .limit(limit)
      .range(offset, offset + limit - 1);

    // Apply filters
    if (severity) {
      // Map severity to action types
      const severityMap: Record<string, string[]> = {
        'critical': ['account_locked', 'policy_deleted'],
        'high': ['violation_recorded', 'password_change_forced'],
        'medium': ['password_changed', 'policy_updated'],
        'low': ['policy_applied', 'password_validated']
      };
      
      if (severityMap[severity]) {
        auditQuery = auditQuery.in('action_type', severityMap[severity]);
      }
    }

    if (eventType) {
      const eventTypeMap: Record<string, string[]> = {
        'login': ['policy_applied'],
        'logout': ['policy_applied'],
        'password_change': ['password_changed', 'password_change_forced'],
        'failed_login': ['violation_recorded'],
        'account_locked': ['account_locked'],
        'suspicious_activity': ['violation_recorded']
      };
      
      if (eventTypeMap[eventType]) {
        auditQuery = auditQuery.in('action_type', eventTypeMap[eventType]);
      }
    }

    const { data: auditEvents, error: auditError } = await auditQuery;

    if (auditError) {
      console.error('Error fetching audit events:', auditError);
      // If table doesn't exist, return empty events instead of error
      if (auditError.code === '42P01') {
        console.log('Password policy audit log table does not exist, returning empty events');
        return NextResponse.json({ 
          events: [],
          total: 0,
          timestamp: new Date().toISOString(),
          message: 'Password policy tables not yet created'
        });
      }
      return NextResponse.json({ error: 'Failed to fetch security events' }, { status: 500 });
    }

    // Get password policy violations
    let violationsQuery = supabase
      .from('password_policy_violations')
      .select(`
        id,
        user_id,
        violation_type,
        violation_details,
        ip_address,
        user_agent,
        created_at,
        users!inner(email, full_name)
      `)
      .eq('policy_id', activePolicy.id)
      .order('created_at', { ascending: false })
      .limit(limit)
      .range(offset, offset + limit - 1);

    if (severity) {
      const violationSeverityMap: Record<string, string[]> = {
        'critical': ['reuse_violation', 'age_exceeded'],
        'high': ['length_insufficient', 'common_password'],
        'medium': ['missing_uppercase', 'missing_lowercase', 'missing_numbers'],
        'low': ['missing_special_chars', 'email_similarity']
      };
      
      if (violationSeverityMap[severity]) {
        violationsQuery = violationsQuery.in('violation_type', violationSeverityMap[severity]);
      }
    }

    const { data: violations, error: violationsError } = await violationsQuery;

    if (violationsError) {
      console.error('Error fetching violations:', violationsError);
      // If table doesn't exist, just continue with empty violations
      if (violationsError.code === '42P01') {
        console.log('Password policy violations table does not exist, skipping violations');
      }
    }

    // Transform audit events to SecurityEvent format
    const transformedAuditEvents = (auditEvents || []).map(event => ({
      id: `audit-${event.id}`,
      userId: event.user_id,
      userName: event.users?.email || 'Unknown User',
      eventType: mapActionTypeToEventType(event.action_type),
      severity: mapActionTypeToSeverity(event.action_type),
      description: getEventDescription(event.action_type, event.action_details),
      ipAddress: event.ip_address || 'Unknown',
      userAgent: event.user_agent || 'Unknown',
      location: getLocationFromIP(event.ip_address),
      timestamp: new Date(event.created_at),
      resolved: isEventResolved(event.action_type)
    }));

    // Transform violations to SecurityEvent format
    const transformedViolations = (violations || []).map(violation => ({
      id: `violation-${violation.id}`,
      userId: violation.user_id,
      userName: violation.users?.email || 'Unknown User',
      eventType: 'failed_login',
      severity: mapViolationTypeToSeverity(violation.violation_type),
      description: getViolationDescription(violation.violation_type),
      ipAddress: violation.ip_address || 'Unknown',
      userAgent: violation.user_agent || 'Unknown',
      location: getLocationFromIP(violation.ip_address),
      timestamp: new Date(violation.created_at),
      resolved: false
    }));

    // Combine and sort events
    const allEvents = [...transformedAuditEvents, ...transformedViolations]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);

    return NextResponse.json({ 
      events: allEvents,
      total: allEvents.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching security events:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function mapActionTypeToEventType(actionType: string): string {
  const mapping: Record<string, string> = {
    'policy_created': 'login',
    'policy_updated': 'login',
    'policy_deleted': 'login',
    'policy_applied': 'login',
    'password_changed': 'password_change',
    'password_validated': 'login',
    'violation_recorded': 'failed_login',
    'account_locked': 'account_locked',
    'account_unlocked': 'login',
    'password_change_forced': 'password_change',
    'password_expired': 'failed_login'
  };
  
  return mapping[actionType] || 'login';
}

function mapActionTypeToSeverity(actionType: string): string {
  const mapping: Record<string, string> = {
    'policy_created': 'low',
    'policy_updated': 'medium',
    'policy_deleted': 'critical',
    'policy_applied': 'low',
    'password_changed': 'medium',
    'password_validated': 'low',
    'violation_recorded': 'high',
    'account_locked': 'critical',
    'account_unlocked': 'medium',
    'password_change_forced': 'high',
    'password_expired': 'high'
  };
  
  return mapping[actionType] || 'low';
}

function mapViolationTypeToSeverity(violationType: string): string {
  const mapping: Record<string, string> = {
    'length_insufficient': 'high',
    'missing_uppercase': 'medium',
    'missing_lowercase': 'medium',
    'missing_numbers': 'medium',
    'missing_special_chars': 'low',
    'common_password': 'high',
    'email_similarity': 'low',
    'reuse_violation': 'critical',
    'age_exceeded': 'critical',
    'complexity_insufficient': 'high'
  };
  
  return mapping[violationType] || 'medium';
}

function getEventDescription(actionType: string, actionDetails: any): string {
  const descriptions: Record<string, string> = {
    'policy_created': 'Password policy created',
    'policy_updated': 'Password policy updated',
    'policy_deleted': 'Password policy deleted',
    'policy_applied': 'Password policy applied to user',
    'password_changed': 'Password changed successfully',
    'password_validated': 'Password validated against policy',
    'violation_recorded': 'Password policy violation detected',
    'account_locked': 'Account locked due to policy violation',
    'account_unlocked': 'Account unlocked by administrator',
    'password_change_forced': 'Password change forced by administrator',
    'password_expired': 'Password expired and requires change'
  };
  
  return descriptions[actionType] || 'Security event occurred';
}

function getViolationDescription(violationType: string): string {
  const descriptions: Record<string, string> = {
    'length_insufficient': 'Password does not meet minimum length requirement',
    'missing_uppercase': 'Password missing uppercase letters',
    'missing_lowercase': 'Password missing lowercase letters',
    'missing_numbers': 'Password missing numbers',
    'missing_special_chars': 'Password missing special characters',
    'common_password': 'Password is too common and easily guessable',
    'email_similarity': 'Password too similar to email address',
    'reuse_violation': 'Password has been used recently',
    'age_exceeded': 'Password has expired',
    'complexity_insufficient': 'Password does not meet complexity requirements'
  };
  
  return descriptions[violationType] || 'Password policy violation';
}

function getLocationFromIP(ipAddress: string | null): string {
  if (!ipAddress || ipAddress === 'Unknown') {
    return 'Unknown';
  }
  
  // Simple IP-based location mapping (in real implementation, use a geolocation service)
  const ipRanges: Record<string, string> = {
    '192.168.': 'Local Network',
    '10.': 'Private Network',
    '172.': 'Private Network',
    '127.': 'Localhost',
    '203.0.113.': 'Test Network'
  };
  
  for (const [prefix, location] of Object.entries(ipRanges)) {
    if (ipAddress.startsWith(prefix)) {
      return location;
    }
  }
  
  return 'External Network';
}

function isEventResolved(actionType: string): boolean {
  const resolvedActions = [
    'password_changed',
    'password_validated',
    'account_unlocked',
    'policy_applied'
  ];
  
  return resolvedActions.includes(actionType);
}
