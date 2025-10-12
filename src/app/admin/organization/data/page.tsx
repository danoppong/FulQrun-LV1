'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  GlobeAmericasIcon,
} from '@heroicons/react/24/outline'

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface OrganizationDataItem {
  id: string
  type: 'department' | 'region' | 'country'
  name: string
  code?: string | null
  description?: string | null
  is_active: boolean
  parent_id?: string | null
  organization_id: string
  created_at: string
  updated_at: string
}

interface FormData {
  type: 'department' | 'region' | 'country'
  name: string
  code: string
  description: string
  isActive: boolean
  parentId: string
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function OrganizationDataPage() {
  const [items, setItems] = useState<OrganizationDataItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'department' | 'region' | 'country'>('all')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<OrganizationDataItem | null>(null)
  const [formData, setFormData] = useState<FormData>({
    type: 'department',
    name: '',
    code: '',
    description: '',
    isActive: true,
    parentId: '',
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [showMigrationNeeded, setShowMigrationNeeded] = useState(false)
  const [migrationRunning, setMigrationRunning] = useState(false)

  // Auto-generate code from name
  const generateCode = (name: string, type: string): string => {
    if (!name.trim()) return ''
    
    const cleanName = name.trim().toUpperCase()
    
    // Generate code based on type
    switch (type) {
      case 'department':
        // Take first letter of each word, max 4 chars
        return cleanName
          .split(/\s+/)
          .map(word => word.charAt(0))
          .join('')
          .substring(0, 4)
      
      case 'region':
        // Take first 3 letters if single word, otherwise first letter of each word
        const regionWords = cleanName.split(/\s+/)
        if (regionWords.length === 1) {
          return cleanName.substring(0, 3)
        }
        return regionWords
          .map(word => word.charAt(0))
          .join('')
          .substring(0, 3)
      
      case 'country':
        // Use standard 2-letter country codes or first 2 letters
        const countryWords = cleanName.split(/\s+/)
        if (countryWords.length === 1) {
          return cleanName.substring(0, 2)
        }
        return countryWords
          .map(word => word.charAt(0))
          .join('')
          .substring(0, 2)
      
      default:
        return cleanName.substring(0, 3)
    }
  }

  // Load data
  const fetchItems = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filter !== 'all') params.set('type', filter)
      
      const response = await fetch(`/api/admin/organization/data?${params}`)
      if (!response.ok) {
        const errorData = await response.json()
        if (errorData.migrationNeeded || errorData.fallback) {
          setShowMigrationNeeded(true)
        }
        throw new Error(errorData.details || 'Failed to fetch data')
      }
      
      const result = await response.json()
      setItems(result.data || [])
    } catch (error) {
      console.error('Error fetching organization data:', error)
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    fetchItems()
  }, [filter, fetchItems])

  // Filter and search items
  const filteredItems = items.filter(item => {
    const matchesSearch = search === '' || 
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.code && item.code.toLowerCase().includes(search.toLowerCase()))
    
    return matchesSearch
  })

  // Group by type for display
  const groupedItems = {
    department: filteredItems.filter(item => item.type === 'department'),
    region: filteredItems.filter(item => item.type === 'region'),
    country: filteredItems.filter(item => item.type === 'country'),
  }

  const handleCreate = () => {
    setEditingItem(null)
    setFormData({
      type: 'department',
      name: '',
      code: '',
      description: '',
      isActive: true,
      parentId: '',
    })
    setFormErrors({})
    setShowModal(true)
  }

  const handleEdit = (item: OrganizationDataItem) => {
    setEditingItem(item)
    setFormData({
      type: item.type,
      name: item.name,
      code: item.code || '',
      description: item.description || '',
      isActive: item.is_active,
      parentId: item.parent_id || '',
    })
    setFormErrors({})
    setShowModal(true)
  }

  const handleDelete = async (item: OrganizationDataItem) => {
    if (deleting === item.id) return // Prevent double deletion
    if (!confirm(`Are you sure you want to delete ${item.type} "${item.name}"?`)) return

    try {
      setDeleting(item.id)
      const response = await fetch(`/api/admin/organization/data/${item.id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const error = await response.json()
        alert(error.details || 'Failed to delete item')
        return
      }
      
      await fetchItems()
    } catch (error) {
      console.error('Error deleting item:', error)
      alert('Failed to delete item')
    } finally {
      setDeleting(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setFormErrors({})

    try {
      const payload = {
        type: formData.type,
        name: formData.name.trim(),
        code: formData.code.trim() || undefined,
        description: formData.description.trim() || undefined,
        isActive: formData.isActive,
        parentId: formData.parentId.trim() || undefined,
      }

      const url = editingItem 
        ? `/api/admin/organization/data/${editingItem.id}`
        : '/api/admin/organization/data'
      
      const method = editingItem ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        if (error.migrationNeeded) {
          setShowMigrationNeeded(true)
          alert('Database migration needed. Please run the migration first.')
          return
        }
        if (error.issues) {
          const fieldErrors: Record<string, string> = {}
          error.issues.forEach((issue: { path?: string[]; message: string }) => {
            if (issue.path && issue.path[0]) {
              fieldErrors[issue.path[0]] = issue.message
            }
          })
          setFormErrors(fieldErrors)
        } else {
          alert(error.details || `Failed to ${editingItem ? 'update' : 'create'} item`)
        }
        return
      }

      setShowModal(false)
      await fetchItems()
    } catch (error) {
      console.error('Error submitting form:', error)
      alert(`Failed to ${editingItem ? 'update' : 'create'} item`)
    } finally {
      setSubmitting(false)
    }
  }

  const runMigration = async () => {
    try {
      setMigrationRunning(true)
      const response = await fetch('/api/admin/migrate-organization-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        const error = await response.json()
        alert(`Migration failed: ${error.details || 'Unknown error'}`)
        return
      }

      const result = await response.json()
      alert(`Migration successful: ${result.message}`)
      setShowMigrationNeeded(false)
      await fetchItems() // Refresh data
    } catch (error) {
      console.error('Migration error:', error)
      alert('Migration failed: Network or server error')
    } finally {
      setMigrationRunning(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Organization Data</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage departments, regions, countries and other organizational data
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={handleCreate}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add New Item
          </button>
        </div>
      </div>

      {/* Migration Notice */}
      {showMigrationNeeded && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-yellow-800">Database Migration Required</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>The organization_data table hasn&apos;t been created yet. You need to run the database migration to use this feature.</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={runMigration}
                  disabled={migrationRunning}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-yellow-800 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
                >
                  {migrationRunning ? 'Running Migration...' : 'Run Migration Now'}
                </button>
                <button
                  onClick={() => setShowMigrationNeeded(false)}
                  className="ml-3 inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 sm:space-x-4">
            {/* Search */}
            <div className="flex-1 min-w-0">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Search by name or code..."
                />
              </div>
            </div>

            {/* Type Filter */}
            <div className="flex items-center space-x-2">
              <FunnelIcon className="h-5 w-5 text-gray-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as 'all' | 'department' | 'region' | 'country')}
                className="rounded-md border border-gray-300 py-2 pl-3 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="department">Departments</option>
                <option value="region">Regions</option>
                <option value="country">Countries</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Loading organization data...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No data found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {search ? 'No items match your search criteria.' : 'Get started by creating your first organizational data item.'}
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Departments */}
              {(filter === 'all' || filter === 'department') && groupedItems.department.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <BuildingOfficeIcon className="h-5 w-5 mr-2 text-blue-600" />
                    Departments ({groupedItems.department.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groupedItems.department.map((item) => (
                      <ItemCard key={item.id} item={item} onEdit={handleEdit} onDelete={handleDelete} isDeleting={deleting === item.id} />
                    ))}
                  </div>
                </div>
              )}

              {/* Regions */}
              {(filter === 'all' || filter === 'region') && groupedItems.region.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <MapPinIcon className="h-5 w-5 mr-2 text-green-600" />
                    Regions ({groupedItems.region.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groupedItems.region.map((item) => (
                      <ItemCard key={item.id} item={item} onEdit={handleEdit} onDelete={handleDelete} isDeleting={deleting === item.id} />
                    ))}
                  </div>
                </div>
              )}

              {/* Countries */}
              {(filter === 'all' || filter === 'country') && groupedItems.country.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <GlobeAmericasIcon className="h-5 w-5 mr-2 text-purple-600" />
                    Countries ({groupedItems.country.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groupedItems.country.map((item) => (
                      <ItemCard key={item.id} item={item} onEdit={handleEdit} onDelete={handleDelete} isDeleting={deleting === item.id} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowModal(false)} />
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                        {editingItem ? 'Edit Item' : 'Create New Item'}
                      </h3>
                      
                      <div className="space-y-4">
                        {/* Type */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Type</label>
                          <select
                            value={formData.type}
                            onChange={(e) => {
                              const newType = e.target.value as 'department' | 'region' | 'country'
                              const autoCode = generateCode(formData.name, newType)
                              setFormData({ 
                                ...formData, 
                                type: newType,
                                code: autoCode
                              })
                            }}
                            disabled={!!editingItem}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-100"
                          >
                            <option value="department">Department</option>
                            <option value="region">Region</option>
                            <option value="country">Country</option>
                          </select>
                          {formErrors.type && <p className="mt-1 text-sm text-red-600">{formErrors.type}</p>}
                        </div>

                        {/* Name */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Name *</label>
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => {
                              const newName = e.target.value
                              const autoCode = generateCode(newName, formData.type)
                              setFormData({ 
                                ...formData, 
                                name: newName,
                                code: autoCode
                              })
                            }}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            placeholder="Enter name..."
                          />
                          {formErrors.name && <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>}
                        </div>

                        {/* Code */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Code
                            <span className="text-xs text-gray-500 ml-1">(auto-generated)</span>
                          </label>
                          <input
                            type="text"
                            value={formData.code}
                            readOnly
                            className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm sm:text-sm cursor-not-allowed"
                            placeholder="Auto-generated from name..."
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            {formData.type === 'department' && 'Format: First letter of each word (max 4 chars)'}
                            {formData.type === 'region' && 'Format: First 3 letters or first letter of each word'}
                            {formData.type === 'country' && 'Format: First 2 letters or first letter of each word'}
                          </p>
                          {formErrors.code && <p className="mt-1 text-sm text-red-600">{formErrors.code}</p>}
                        </div>

                        {/* Description */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Description</label>
                          <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            placeholder="Enter description..."
                          />
                          {formErrors.description && <p className="mt-1 text-sm text-red-600">{formErrors.description}</p>}
                        </div>

                        {/* Active Status */}
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.isActive}
                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label className="ml-2 block text-sm text-gray-900">Active</label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : (editingItem ? 'Update' : 'Create')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// ITEM CARD COMPONENT
// =============================================================================

interface ItemCardProps {
  item: OrganizationDataItem
  onEdit: (item: OrganizationDataItem) => void
  onDelete: (item: OrganizationDataItem) => void
  isDeleting?: boolean
}

function ItemCard({ item, onEdit, onDelete, isDeleting = false }: ItemCardProps) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'department': return <BuildingOfficeIcon className="h-5 w-5" />
      case 'region': return <MapPinIcon className="h-5 w-5" />
      case 'country': return <GlobeAmericasIcon className="h-5 w-5" />
      default: return <BuildingOfficeIcon className="h-5 w-5" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'department': return 'text-blue-600 bg-blue-100'
      case 'region': return 'text-green-600 bg-green-100'
      case 'country': return 'text-purple-600 bg-purple-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(item.type)}`}>
              {getTypeIcon(item.type)}
              <span className="ml-1 capitalize">{item.type}</span>
            </div>
            {!item.is_active && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-red-600 bg-red-100">
                Inactive
              </span>
            )}
          </div>
          
          <h4 className="text-sm font-medium text-gray-900 truncate">{item.name}</h4>
          
          {item.code && (
            <p className="text-xs text-gray-500 mt-1">Code: {item.code}</p>
          )}
          
          {item.description && (
            <p className="text-xs text-gray-600 mt-2 line-clamp-2">{item.description}</p>
          )}
        </div>
        
        <div className="flex items-center space-x-1 ml-2">
          <button
            onClick={() => onEdit(item)}
            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
            title="Edit"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(item)}
            disabled={isDeleting}
            className={`p-1 transition-colors ${
              isDeleting 
                ? 'text-gray-300 cursor-not-allowed' 
                : 'text-gray-400 hover:text-red-600'
            }`}
            title={isDeleting ? 'Deleting...' : 'Delete'}
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}