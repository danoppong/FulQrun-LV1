'use client'
import React, { useState } from 'react'
import { UserRole } from '@/lib/roles'

interface RoleSelectorProps {
  currentRole: UserRole
  onRoleChange: (role: UserRole) => void
}

const RoleSelector = ({ currentRole, onRoleChange }: RoleSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false)

  const roles = [
    { value: UserRole.SALESMAN, label: 'Salesman', description: 'Individual contributor' },
    { value: UserRole.SALES_MANAGER, label: 'Sales Manager', description: 'Manages sales team' },
    { value: UserRole.REGIONAL_SALES_DIRECTOR, label: 'Regional Sales Director', description: 'Oversees regional operations' },
    { value: UserRole.GLOBAL_SALES_LEAD, label: 'Global Sales Lead', description: 'Global sales strategy' },
    { value: UserRole.BUSINESS_UNIT_HEAD, label: 'Business Unit Head', description: 'Executive leadership' }
  ]

  const currentRoleInfo = roles.find(role => role.value === currentRole)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <span className="text-sm font-medium text-gray-700">
          {currentRoleInfo?.label}
        </span>
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-50 border border-gray-200">
          <div className="py-1">
            <div className="px-4 py-2 border-b border-gray-100">
              <h3 className="text-sm font-medium text-gray-900">Switch Role (Demo)</h3>
              <p className="text-xs text-gray-500">This is for demonstration purposes only</p>
            </div>
            {roles.map((role) => (
              <button
                key={role.value}
                onClick={() => {
                  onRoleChange(role.value)
                  setIsOpen(false)
                }}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 ${
                  currentRole === role.value ? 'bg-indigo-50 border-r-2 border-indigo-500' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{role.label}</div>
                    <div className="text-xs text-gray-500">{role.description}</div>
                  </div>
                  {currentRole === role.value && (
                    <svg className="w-4 h-4 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default RoleSelector
