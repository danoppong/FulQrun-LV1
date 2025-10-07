'use client'
import React from 'react';

import { useState, useEffect } from 'react'
import { companyAPI, CompanyWithStats } from '@/lib/api/companies';
import Link from 'next/link'
import { PlusIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';

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
    } catch (_err) {
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
    } catch (_err) {
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
    <div className="space-y-8">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Companies</h1>
          <p className="mt-2 text-muted-foreground">
            Manage your company database and track business relationships
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            href="/companies/new"
            className="inline-flex items-center px-6 py-3 border border-transparent rounded-xl shadow-lg text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 transform hover:scale-105 transition-all duration-200"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Company
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search companies..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl leading-5 bg-white/80 backdrop-blur-sm placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm transition-all duration-200"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 animate-fade-in">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {/* Companies Grid */}
      {companies.length === 0 ? (
        <div className="text-center py-16">
          <div className="mx-auto h-16 w-16 text-gray-300 mb-4">
            <BuildingOfficeIcon className="h-16 w-16" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No companies found</h3>
          <p className="text-gray-500 mb-8">
            {searchTerm ? 'No companies match your search criteria.' : 'Get started by creating your first company.'}
          </p>
          {!searchTerm && (
            <Link
              href="/companies/new"
              className="inline-flex items-center px-6 py-3 border border-transparent shadow-lg text-sm font-medium rounded-xl text-white bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 transform hover:scale-105 transition-all duration-200"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Company
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {companies.map((company, index) => (
            <div 
              key={company.id} 
              className="group bg-card/80 backdrop-blur-sm overflow-hidden shadow-lg rounded-2xl border border-border/50 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 transform hover:-translate-y-1"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
                      <BuildingOfficeIcon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-card-foreground truncate">
                        {company.name}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {company.industry || 'No industry specified'}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Link
                      href={`/companies/${company.id}/edit`}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(company.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="px-6 pb-4">
                <div className="space-y-3">
                  {company.domain && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Website</span>
                      <span className="font-medium text-foreground truncate max-w-32">
                        {company.domain}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Company Size</span>
                    <span className="font-medium text-foreground">
                      {company.size || 'Not specified'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100/50 border-t border-gray-200/50">
                <div className="flex items-center justify-between">
                  <div className="flex space-x-6 text-sm">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span className="text-muted-foreground">
                        {(typeof company.contact_count === 'number' 
                          ? company.contact_count 
                          : (company.contact_count as { count: number })?.count || 0)
                        } contacts
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                      <span className="text-muted-foreground">
                        {(typeof company.opportunity_count === 'number' 
                          ? company.opportunity_count 
                          : (company.opportunity_count as { count: number })?.count || 0)
                        } opportunities
                      </span>
                    </div>
                  </div>
                  {company.total_deal_value && company.total_deal_value > 0 && (
                    <div className="text-sm font-semibold text-green-600">
                      ${company.total_deal_value.toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
