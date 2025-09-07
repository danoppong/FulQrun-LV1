'use client'

import { useState, useEffect } from 'react'
import { companyAPI, CompanyWithStats } from '@/lib/api/companies'
import Link from 'next/link'
import { PlusIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline'

interface CompanyListProps {
  searchQuery?: string
}

export default function CompanyList({ searchQuery = '' }: CompanyListProps) {
  const [companies, setCompanies] = useState<CompanyWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState(searchQuery)

  const loadCompanies = async (query: string = '') => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = query 
        ? await companyAPI.searchCompanies(query)
        : await companyAPI.getCompanies()
      
      if (error) {
        setError(error.message || 'Failed to load companies')
      } else {
        setCompanies(data || [])
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCompanies(searchTerm)
  }, [searchTerm])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this company?')) return

    try {
      const { error } = await companyAPI.deleteCompany(id)
      if (error) {
        setError(error.message || 'Failed to delete company')
      } else {
        setCompanies(companies.filter(company => company.id !== id))
      }
    } catch (err) {
      setError('Failed to delete company')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your company database
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            href="/companies/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Company
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search companies..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {/* Companies Grid */}
      {companies.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <BuildingOfficeIcon className="h-12 w-12" />
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No companies</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'No companies match your search.' : 'Get started by creating a new company.'}
          </p>
          {!searchTerm && (
            <div className="mt-6">
              <Link
                href="/companies/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Company
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {companies.map((company) => (
            <div key={company.id} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <BuildingOfficeIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Company Name
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {company.name}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Industry:</span>
                    <span className="font-medium text-gray-900">
                      {company.industry || 'Not specified'}
                    </span>
                  </div>
                  {company.domain && (
                    <div className="flex justify-between mt-1">
                      <span className="text-gray-500">Domain:</span>
                      <span className="font-medium text-gray-900">{company.domain}</span>
                    </div>
                  )}
                  <div className="flex justify-between mt-1">
                    <span className="text-gray-500">Size:</span>
                    <span className="font-medium text-gray-900">
                      {company.size || 'Not specified'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="flex justify-between items-center">
                  <div className="flex space-x-4 text-sm text-gray-500">
                    <span>{company.contact_count || 0} contacts</span>
                    <span>{company.opportunity_count || 0} opportunities</span>
                  </div>
                  <div className="flex space-x-2">
                    <Link
                      href={`/companies/${company.id}/edit`}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(company.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
