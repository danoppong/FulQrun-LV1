// API Route: Organization Data Management - Individual Item Operations
// Handles updating and deleting specific organization data items

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { AuthService } from '@/lib/auth-unified'
import { checkRateLimit } from '@/lib/validation'

function getIp(request: NextRequest) {
  const xf = request.headers.get('x-forwarded-for') || ''
  return xf.split(',')[0]?.trim() || 'unknown'
}

class HttpError extends Error { constructor(public status: number, message: string) { super(message) } }

async function getOrgIfAdmin(userId: string) {
  const supa = await AuthService.getServerClient()
  const { data, error } = await supa
    .from('users' as const)
    .select('organization_id, role')
    .eq('id', userId)
    .maybeSingle()
  if (error || !data) throw new HttpError(404, 'User not found')
  const role = (data as { role?: string }).role || ''
  if (!['admin', 'super_admin'].includes(role)) throw new HttpError(403, 'Insufficient permissions')
  return (data as { organization_id: string }).organization_id
}

const updateDataSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less').optional(),
  code: z.string().min(1, 'Code is required').max(20, 'Code must be 20 characters or less').optional(),
  description: z.string().max(500, 'Description must be 500 characters or less').optional(),
  isActive: z.boolean().optional(),
  parentId: z.string().uuid().optional(),
})

// PUT /api/admin/organization/data/[id] - Update organization data item
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!checkRateLimit(getIp(request))) return NextResponse.json({ error: 'Rate limit' }, { status: 429 })

    const supa = await AuthService.getServerClient()
    const { data: { user } } = await supa.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const organizationId = await getOrgIfAdmin(user.id)
    const { id } = await params
    
    const body = await request.json()
    const parsed = updateDataSchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation error', issues: parsed.error.issues }, { status: 400 })
    }

    const { name, code, description, isActive, parentId } = parsed.data

    // Verify the item exists and belongs to this organization
    const { data: existingRaw, error: checkError } = await supa
      .from('organization_data' as const)
      .select('id, type, name, organization_id')
      .eq('id', id)
      .single()

    if (checkError || !existingRaw) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    const existing = existingRaw as { id: string; type: string; name: string; organization_id: string }

    if (existing.organization_id !== organizationId) {
      return NextResponse.json({ error: 'Cannot modify items from other organizations' }, { status: 403 })
    }

    // Check for duplicate name if name is being changed
    if (name && name !== existing.name) {
      const { data: duplicate } = await supa
        .from('organization_data' as const)
        .select('id')
        .eq('organization_id', organizationId)
        .eq('type', existing.type)
        .eq('name', name)
        .neq('id', id)
        .maybeSingle()

      if (duplicate) {
        return NextResponse.json({ 
          error: 'Duplicate name', 
          details: `${existing.type} with name "${name}" already exists` 
        }, { status: 409 })
      }
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    }

    if (name !== undefined) updateData.name = name
    if (code !== undefined) updateData.code = code
    if (description !== undefined) updateData.description = description
    if (isActive !== undefined) updateData.is_active = isActive
    if (parentId !== undefined) updateData.parent_id = parentId

    // Update the item
    type UpdateClient = {
      from: (table: string) => {
        update: (val: Record<string, unknown>) => {
          eq: (column: string, value: string) => {
            select: () => { single: () => Promise<{ data: Record<string, unknown> | null; error: unknown }> }
          }
        }
      }
    }
    const { data: updated, error: updateError } = await (supa as unknown as UpdateClient)
      .from('organization_data' as const)
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating organization data:', updateError)
      return NextResponse.json({ error: 'Failed to update item', details: String((updateError as Error).message || updateError) }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500
    return NextResponse.json({ error: 'Failed to update organization data', details: (error as Error).message }, { status })
  }
}

// DELETE /api/admin/organization/data/[id] - Delete organization data item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!checkRateLimit(getIp(request))) return NextResponse.json({ error: 'Rate limit' }, { status: 429 })

    const supa = await AuthService.getServerClient()
    const { data: { user } } = await supa.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const organizationId = await getOrgIfAdmin(user.id)
    const { id } = await params

    // Verify the item exists and belongs to this organization
    const { data: existingRaw, error: checkError } = await supa
      .from('organization_data' as const)
      .select('id, organization_id, type, name')
      .eq('id', id)
      .single()

    if (checkError || !existingRaw) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    const existing = existingRaw as { id: string; organization_id: string; type: string; name: string }

    if (existing.organization_id !== organizationId) {
      return NextResponse.json({ error: 'Cannot delete items from other organizations' }, { status: 403 })
    }

    // Check if item is referenced by users (optional safety check)
    let isReferenced = false
    try {
      if (existing.type === 'department') {
        const { count } = await supa
          .from('users' as const)
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organizationId)
          .eq('department', existing.name)
        isReferenced = (count || 0) > 0
      } else if (existing.type === 'region') {
        const { count } = await supa
          .from('user_profiles' as const)
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organizationId)
          .eq('region', existing.name)
        isReferenced = (count || 0) > 0
      } else if (existing.type === 'country') {
        const { count } = await supa
          .from('user_profiles' as const)
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organizationId)
          .eq('country', existing.name)
        isReferenced = (count || 0) > 0
      }
    } catch (e) {
      console.warn('Failed to check references, proceeding with deletion:', e)
    }

    if (isReferenced) {
      return NextResponse.json({ 
        error: 'Cannot delete referenced item', 
        details: `This ${existing.type} is currently being used by users and cannot be deleted` 
      }, { status: 409 })
    }

    // Delete the item
    const { error: deleteError } = await supa
      .from('organization_data' as const)
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting organization data:', deleteError)
      return NextResponse.json({ error: 'Failed to delete item', details: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500
    return NextResponse.json({ error: 'Failed to delete organization data', details: (error as Error).message }, { status })
  }
}