// Administration Module - User Management Overview
// Main user management dashboard with navigation to sub-pages

'use client';

import React from 'react';
import Link from 'next/link';
import {
  UsersIcon, 
  ShieldCheckIcon, 
  UserGroupIcon,
  KeyIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

// =============================================================================
// USER MANAGEMENT OVERVIEW COMPONENT
// =============================================================================

export default function UserManagementOverview() {
  const managementCards = [
    {
      title: 'User Management',
      description: 'Manage users, roles, and basic permissions',
      href: '/admin/users/list',
      icon: UsersIcon,
      color: 'blue',
      features: [
        'Create and edit user accounts',
        'Assign basic roles (Rep, Manager, Admin)',
        'Manage user status and passwords',
        'View user activity and login history'
      ]
    },
    {
      title: 'Enterprise Roles',
      description: 'Advanced enterprise-level role management',
      href: '/admin/users/enterprise-roles',
      icon: ShieldCheckIcon,
      color: 'purple',
      features: [
        'Grant enterprise roles (User, Manager, Admin, Super Admin)',
        'Manage enterprise permissions',
        'Control access to advanced features',
        'Audit enterprise role assignments'
      ]
    },
    {
      title: 'Roles & Permissions',
      description: 'Configure custom roles and permissions',
      href: '/admin/users/roles',
      icon: KeyIcon,
      color: 'green',
      features: [
        'Create custom role templates',
        'Define granular permissions',
        'Manage role hierarchies',
        'Configure access policies'
      ]
    },
    {
      title: 'Teams & Hierarchy',
      description: 'Organize users into teams and hierarchies',
      href: '/admin/users/teams',
      icon: UserGroupIcon,
      color: 'yellow',
      features: [
        'Create and manage teams',
        'Set up reporting hierarchies',
        'Configure team-based permissions',
        'Manage team assignments'
      ]
    }
  ];

  const quickStats = [
    {
      title: 'Total Users',
      value: '1',
      icon: UsersIcon,
      color: 'blue',
      description: 'Active users in your organization'
    },
    {
      title: 'Enterprise Roles',
      value: '1',
      icon: ShieldCheckIcon,
      color: 'purple',
      description: 'Users with enterprise-level access'
    },
    {
      title: 'Admin Users',
      value: '1',
      icon: Cog6ToothIcon,
      color: 'red',
      description: 'Users with administrative privileges'
    },
    {
      title: 'Recent Activity',
      value: '0',
      icon: ChartBarIcon,
      color: 'green',
      description: 'User actions in the last 24 hours'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-50 border-blue-200 text-blue-800',
      purple: 'bg-purple-50 border-purple-200 text-purple-800',
      green: 'bg-green-50 border-green-200 text-green-800',
      yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      red: 'bg-red-50 border-red-200 text-red-800'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const getIconColorClasses = (color: string) => {
    const colors = {
      blue: 'text-blue-600',
      purple: 'text-purple-600',
      green: 'text-green-600',
      yellow: 'text-yellow-600',
      red: 'text-red-600'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Comprehensive user and role management system
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
          <span className="text-sm text-gray-600">Super Admin Required</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div key={index} className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center">
                <IconComponent className={`h-8 w-8 ${getIconColorClasses(stat.color)}`} />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-400">{stat.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Management Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {managementCards.map((card, index) => {
          const IconComponent = card.icon;
          return (
            <Link
              key={index}
              href={card.href}
              className="block bg-white rounded-lg shadow border hover:shadow-md transition-shadow duration-200"
            >
              <div className="p-6">
                <div className="flex items-start">
                  <div className={`p-3 rounded-lg ${getColorClasses(card.color)}`}>
                    <IconComponent className="h-6 w-6" />
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {card.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      {card.description}
                    </p>
                    <ul className="space-y-1">
                      {card.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="text-xs text-gray-500 flex items-center">
                          <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Additional Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <ExclamationTriangleIcon className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Enterprise Role Management
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                To manage enterprise roles, you need Super Admin privileges. Enterprise roles provide 
                access to advanced features and system-wide permissions beyond basic user roles.
              </p>
            </div>
            <div className="mt-3">
              <Link
                href="/admin/users/enterprise-roles"
                className="text-sm font-medium text-blue-800 hover:text-blue-900"
              >
                Manage Enterprise Roles →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/admin/users/list"
            className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <UsersIcon className="h-5 w-5 text-gray-400 mr-3" />
            <span className="text-sm font-medium text-gray-700">View All Users</span>
          </Link>
          <Link
            href="/admin/users/enterprise-roles"
            className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ShieldCheckIcon className="h-5 w-5 text-gray-400 mr-3" />
            <span className="text-sm font-medium text-gray-700">Enterprise Roles</span>
          </Link>
          <Link
            href="/admin/users/list"
            className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <UserGroupIcon className="h-5 w-5 text-gray-400 mr-3" />
            <span className="text-sm font-medium text-gray-700">Add New User</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
