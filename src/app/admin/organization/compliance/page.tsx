// Administration Module - Organization Compliance Management
// Comprehensive compliance and security configuration interface

'use client';

import React, { useState } from 'react';
import {
  ShieldCheckIcon,
  LockClosedIcon,
  ClockIcon,
  DocumentCheckIcon
} from '@heroicons/react/24/outline'

export default function OrganizationCompliance() {
  const [complianceSettings, setComplianceSettings] = useState({
    complianceLevel: 'standard',
    dataResidency: 'US',
    retentionPolicyDays: 365,
    enableAuditLogging: true,
    enableDataEncryption: false,
    gdprCompliant: false,
    hipaaCompliant: false
  });

  const complianceLevels = [
    { value: 'standard', label: 'Standard', description: 'Basic compliance requirements' },
    { value: 'soc2', label: 'SOC 2', description: 'Security and availability controls' },
    { value: 'gdpr', label: 'GDPR', description: 'European data protection regulation' },
    { value: 'hipaa', label: 'HIPAA', description: 'Healthcare information protection' },
    { value: 'fedramp', label: 'FedRAMP', description: 'US government cloud security' }
  ];

  const dataResidencyOptions = [
    { code: 'US', name: 'United States' },
    { code: 'EU', name: 'European Union' },
    { code: 'CA', name: 'Canada' },
    { code: 'AU', name: 'Australia' },
    { code: 'JP', name: 'Japan' },
    { code: 'SG', name: 'Singapore' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Compliance & Security</h1>
        <p className="mt-1 text-sm text-gray-500">
          Configure compliance requirements and security settings for your organization
        </p>
      </div>

      {/* Compliance Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ShieldCheckIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Compliance Level</p>
              <p className="text-xl font-semibold text-gray-900">
                {complianceLevels.find(l => l.value === complianceSettings.complianceLevel)?.label}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <LockClosedIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Data Encryption</p>
              <p className="text-xl font-semibold text-gray-900">
                {complianceSettings.enableDataEncryption ? 'Enabled' : 'Disabled'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Data Retention</p>
              <p className="text-xl font-semibold text-gray-900">
                {complianceSettings.retentionPolicyDays} days
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Compliance Settings */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Compliance Configuration</h2>
        
        <div className="space-y-6">
          {/* Compliance Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Compliance Level
            </label>
            <select
              value={complianceSettings.complianceLevel}
              onChange={(e) => setComplianceSettings({ ...complianceSettings, complianceLevel: e.target.value })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              {complianceLevels.map(level => (
                <option key={level.value} value={level.value}>
                  {level.label} - {level.description}
                </option>
              ))}
            </select>
          </div>

          {/* Data Residency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Residency
            </label>
            <select
              value={complianceSettings.dataResidency}
              onChange={(e) => setComplianceSettings({ ...complianceSettings, dataResidency: e.target.value })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              {dataResidencyOptions.map(option => (
                <option key={option.code} value={option.code}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>

          {/* Data Retention */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Retention Period (Days)
            </label>
            <input
              type="number"
              min="30"
              value={complianceSettings.retentionPolicyDays}
              onChange={(e) => setComplianceSettings({ ...complianceSettings, retentionPolicyDays: parseInt(e.target.value) })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">Minimum 30 days required</p>
          </div>
        </div>
      </div>

      {/* Security Features */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Security Features</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <DocumentCheckIcon className="h-6 w-6 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">Audit Logging</p>
                <p className="text-xs text-gray-500">Track all system changes and user actions</p>
              </div>
            </div>
            <button
              onClick={() => setComplianceSettings({ ...complianceSettings, enableAuditLogging: !complianceSettings.enableAuditLogging })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                complianceSettings.enableAuditLogging ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  complianceSettings.enableAuditLogging ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <LockClosedIcon className="h-6 w-6 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">Data Encryption</p>
                <p className="text-xs text-gray-500">Encrypt sensitive data at rest</p>
              </div>
            </div>
            <button
              onClick={() => setComplianceSettings({ ...complianceSettings, enableDataEncryption: !complianceSettings.enableDataEncryption })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                complianceSettings.enableDataEncryption ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  complianceSettings.enableDataEncryption ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <ShieldCheckIcon className="h-6 w-6 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">GDPR Compliant</p>
                <p className="text-xs text-gray-500">Enable GDPR compliance features</p>
              </div>
            </div>
            <button
              onClick={() => setComplianceSettings({ ...complianceSettings, gdprCompliant: !complianceSettings.gdprCompliant })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                complianceSettings.gdprCompliant ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  complianceSettings.gdprCompliant ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <ShieldCheckIcon className="h-6 w-6 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">HIPAA Compliant</p>
                <p className="text-xs text-gray-500">Enable HIPAA compliance features</p>
              </div>
            </div>
            <button
              onClick={() => setComplianceSettings({ ...complianceSettings, hipaaCompliant: !complianceSettings.hipaaCompliant })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                complianceSettings.hipaaCompliant ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  complianceSettings.hipaaCompliant ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={() => console.log('Saving compliance settings:', complianceSettings)}
          className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}

