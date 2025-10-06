// Administration Module - Organization Settings Management
// Comprehensive organization settings management interface

'use client';

import React, { useState, useEffect } from 'react';
import { 
  BuildingOfficeIcon, 
  GlobeAltIcon, 
  CurrencyDollarIcon,
  ClockIcon,
  ShieldCheckIcon,
  PaintBrushIcon,
  CreditCardIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { ConfigurationService } from '@/lib/admin/services/ConfigurationService';
import { getSupabaseClient } from '@/lib/supabase-client';
import { z } from 'zod';

const supabase = getSupabaseClient();

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface OrganizationSettings {
  basic: {
    name: string;
    domain: string;
    timezone: string;
    currency: string;
    dateFormat: string;
    timeFormat: string;
    fiscalYearStart: string;
    language: string;
    region: string;
  };
  licensing: {
    tier: 'standard' | 'professional' | 'enterprise' | 'enterprise_plus';
    maxUsers: number;
    maxStorage: number;
    modules: string[];
    expiresAt: Date;
    isTrialActive: boolean;
    trialEndsAt: Date;
  };
  features: {
    enabledModules: string[];
    betaFeatures: string[];
    experimentalFeatures: string[];
    disabledFeatures: string[];
  };
  compliance: {
    complianceLevel: 'standard' | 'soc2' | 'gdpr' | 'hipaa' | 'fedramp';
    dataResidency: string;
    retentionPolicyDays: number;
    enableAuditLogging: boolean;
    enableDataEncryption: boolean;
    gdprCompliant: boolean;
    hipaaCompliant: boolean;
  };
  branding: {
    logoUrl: string;
    faviconUrl: string;
    primaryColor: string;
    secondaryColor: string;
    customCSS: string;
    emailHeaderLogo: string;
    emailFooterText: string;
  };
}

interface SettingsSection {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  component: React.ComponentType<{ settings: OrganizationSettings; onUpdate: (settings: OrganizationSettings) => void }>;
}

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const BasicSettingsSchema = z.object({
  name: z.string().min(1, 'Organization name is required'),
  domain: z.string().optional(),
  timezone: z.string().min(1, 'Timezone is required'),
  currency: z.string().min(3, 'Currency code must be 3 characters'),
  dateFormat: z.string().min(1, 'Date format is required'),
  timeFormat: z.string().min(1, 'Time format is required'),
  fiscalYearStart: z.string().regex(/^\d{2}-\d{2}$/, 'Format must be MM-DD'),
  language: z.string().min(2, 'Language code must be at least 2 characters'),
  region: z.string().min(2, 'Region code must be at least 2 characters')
});

const ComplianceSettingsSchema = z.object({
  complianceLevel: z.enum(['standard', 'soc2', 'gdpr', 'hipaa', 'fedramp']),
  dataResidency: z.string().min(2, 'Data residency is required'),
  retentionPolicyDays: z.number().min(30, 'Minimum retention is 30 days'),
  enableAuditLogging: z.boolean(),
  enableDataEncryption: z.boolean(),
  gdprCompliant: z.boolean(),
  hipaaCompliant: z.boolean()
});

const BrandingSettingsSchema = z.object({
  logoUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  faviconUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Must be a valid hex color'),
  secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Must be a valid hex color'),
  customCSS: z.string().optional(),
  emailHeaderLogo: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  emailFooterText: z.string().max(500, 'Footer text must be less than 500 characters')
});

// =============================================================================
// BASIC SETTINGS COMPONENT
// =============================================================================

function BasicSettings({ settings, onUpdate }: { settings: OrganizationSettings; onUpdate: (settings: OrganizationSettings) => void }) {
  const [formData, setFormData] = useState(settings.basic);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState(false);

  const timezones = [
    'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
    'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo', 'Asia/Shanghai',
    'Australia/Sydney', 'Pacific/Auckland'
  ];

  const currencies = [
    'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'BRL'
  ];

  const languages = [
    'en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'ar'
  ];

  const regions = [
    'US', 'CA', 'GB', 'DE', 'FR', 'IT', 'ES', 'AU', 'JP', 'CN', 'IN', 'BR'
  ];

  const handleSave = async () => {
    try {
      const validatedData = BasicSettingsSchema.parse(formData);
      
      const updatedSettings = {
        ...settings,
        basic: validatedData
      };
      
      onUpdate(updatedSettings);
      setIsEditing(false);
      setErrors({});
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
    }
  };

  const handleCancel = () => {
    setFormData(settings.basic);
    setIsEditing(false);
    setErrors({});
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
          <p className="text-sm text-gray-500">Configure your organization's basic settings</p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <PencilIcon className="h-4 w-4 mr-2" />
            Edit
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Organization Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            disabled={!isEditing}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
              !isEditing ? 'bg-gray-50' : ''
            } ${errors.name ? 'border-red-300' : ''}`}
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Domain</label>
          <input
            type="text"
            value={formData.domain}
            onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
            disabled={!isEditing}
            placeholder="example.com"
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
              !isEditing ? 'bg-gray-50' : ''
            } ${errors.domain ? 'border-red-300' : ''}`}
          />
          {errors.domain && <p className="mt-1 text-sm text-red-600">{errors.domain}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Timezone</label>
          <select
            value={formData.timezone}
            onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
            disabled={!isEditing}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
              !isEditing ? 'bg-gray-50' : ''
            } ${errors.timezone ? 'border-red-300' : ''}`}
          >
            {timezones.map(tz => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
          {errors.timezone && <p className="mt-1 text-sm text-red-600">{errors.timezone}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Currency</label>
          <select
            value={formData.currency}
            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
            disabled={!isEditing}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
              !isEditing ? 'bg-gray-50' : ''
            } ${errors.currency ? 'border-red-300' : ''}`}
          >
            {currencies.map(currency => (
              <option key={currency} value={currency}>{currency}</option>
            ))}
          </select>
          {errors.currency && <p className="mt-1 text-sm text-red-600">{errors.currency}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Date Format</label>
          <select
            value={formData.dateFormat}
            onChange={(e) => setFormData({ ...formData, dateFormat: e.target.value })}
            disabled={!isEditing}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
              !isEditing ? 'bg-gray-50' : ''
            } ${errors.dateFormat ? 'border-red-300' : ''}`}
          >
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
          {errors.dateFormat && <p className="mt-1 text-sm text-red-600">{errors.dateFormat}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Time Format</label>
          <select
            value={formData.timeFormat}
            onChange={(e) => setFormData({ ...formData, timeFormat: e.target.value })}
            disabled={!isEditing}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
              !isEditing ? 'bg-gray-50' : ''
            } ${errors.timeFormat ? 'border-red-300' : ''}`}
          >
            <option value="12">12 Hour (AM/PM)</option>
            <option value="24">24 Hour</option>
          </select>
          {errors.timeFormat && <p className="mt-1 text-sm text-red-600">{errors.timeFormat}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Fiscal Year Start</label>
          <input
            type="text"
            value={formData.fiscalYearStart}
            onChange={(e) => setFormData({ ...formData, fiscalYearStart: e.target.value })}
            disabled={!isEditing}
            placeholder="MM-DD"
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
              !isEditing ? 'bg-gray-50' : ''
            } ${errors.fiscalYearStart ? 'border-red-300' : ''}`}
          />
          {errors.fiscalYearStart && <p className="mt-1 text-sm text-red-600">{errors.fiscalYearStart}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Language</label>
          <select
            value={formData.language}
            onChange={(e) => setFormData({ ...formData, language: e.target.value })}
            disabled={!isEditing}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
              !isEditing ? 'bg-gray-50' : ''
            } ${errors.language ? 'border-red-300' : ''}`}
          >
            {languages.map(lang => (
              <option key={lang} value={lang}>{lang.toUpperCase()}</option>
            ))}
          </select>
          {errors.language && <p className="mt-1 text-sm text-red-600">{errors.language}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Region</label>
          <select
            value={formData.region}
            onChange={(e) => setFormData({ ...formData, region: e.target.value })}
            disabled={!isEditing}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
              !isEditing ? 'bg-gray-50' : ''
            } ${errors.region ? 'border-red-300' : ''}`}
          >
            {regions.map(region => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>
          {errors.region && <p className="mt-1 text-sm text-red-600">{errors.region}</p>}
        </div>
      </div>

      {isEditing && (
        <div className="flex justify-end space-x-3">
          <button
            onClick={handleCancel}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <XMarkIcon className="h-4 w-4 mr-2" />
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
                <CheckIcon className="h-4 w-4 mr-2" />
            Save Changes
          </button>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// COMPLIANCE SETTINGS COMPONENT
// =============================================================================

function ComplianceSettings({ settings, onUpdate }: { settings: OrganizationSettings; onUpdate: (settings: OrganizationSettings) => void }) {
  const [formData, setFormData] = useState(settings.compliance);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState(false);

  const complianceLevels = [
    { value: 'standard', label: 'Standard', description: 'Basic compliance requirements' },
    { value: 'soc2', label: 'SOC 2', description: 'Security and availability controls' },
    { value: 'gdpr', label: 'GDPR', description: 'European data protection regulation' },
    { value: 'hipaa', label: 'HIPAA', description: 'Healthcare information protection' },
    { value: 'fedramp', label: 'FedRAMP', description: 'US government cloud security' }
  ];

  const dataResidencyOptions = [
    'US', 'EU', 'CA', 'AU', 'JP', 'SG', 'IN', 'BR'
  ];

  const handleSave = async () => {
    try {
      const validatedData = ComplianceSettingsSchema.parse(formData);
      
      const updatedSettings = {
        ...settings,
        compliance: validatedData
      };
      
      onUpdate(updatedSettings);
      setIsEditing(false);
      setErrors({});
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
    }
  };

  const handleCancel = () => {
    setFormData(settings.compliance);
    setIsEditing(false);
    setErrors({});
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Compliance & Security</h3>
          <p className="text-sm text-gray-500">Configure compliance requirements and security settings</p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <PencilIcon className="h-4 w-4 mr-2" />
            Edit
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Compliance Level</label>
          <select
            value={formData.complianceLevel}
            onChange={(e) => setFormData({ ...formData, complianceLevel: e.target.value as any })}
            disabled={!isEditing}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
              !isEditing ? 'bg-gray-50' : ''
            } ${errors.complianceLevel ? 'border-red-300' : ''}`}
          >
            {complianceLevels.map(level => (
              <option key={level.value} value={level.value}>
                {level.label} - {level.description}
              </option>
            ))}
          </select>
          {errors.complianceLevel && <p className="mt-1 text-sm text-red-600">{errors.complianceLevel}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Data Residency</label>
          <select
            value={formData.dataResidency}
            onChange={(e) => setFormData({ ...formData, dataResidency: e.target.value })}
            disabled={!isEditing}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
              !isEditing ? 'bg-gray-50' : ''
            } ${errors.dataResidency ? 'border-red-300' : ''}`}
          >
            {dataResidencyOptions.map(region => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>
          {errors.dataResidency && <p className="mt-1 text-sm text-red-600">{errors.dataResidency}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Data Retention (Days)</label>
          <input
            type="number"
            value={formData.retentionPolicyDays}
            onChange={(e) => setFormData({ ...formData, retentionPolicyDays: parseInt(e.target.value) })}
            disabled={!isEditing}
            min="30"
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
              !isEditing ? 'bg-gray-50' : ''
            } ${errors.retentionPolicyDays ? 'border-red-300' : ''}`}
          />
          {errors.retentionPolicyDays && <p className="mt-1 text-sm text-red-600">{errors.retentionPolicyDays}</p>}
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-900">Security Features</h4>
        
        <div className="space-y-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.enableAuditLogging}
              onChange={(e) => setFormData({ ...formData, enableAuditLogging: e.target.checked })}
              disabled={!isEditing}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 text-sm text-gray-700">Enable Audit Logging</label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.enableDataEncryption}
              onChange={(e) => setFormData({ ...formData, enableDataEncryption: e.target.checked })}
              disabled={!isEditing}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 text-sm text-gray-700">Enable Data Encryption</label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.gdprCompliant}
              onChange={(e) => setFormData({ ...formData, gdprCompliant: e.target.checked })}
              disabled={!isEditing}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 text-sm text-gray-700">GDPR Compliant</label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.hipaaCompliant}
              onChange={(e) => setFormData({ ...formData, hipaaCompliant: e.target.checked })}
              disabled={!isEditing}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 text-sm text-gray-700">HIPAA Compliant</label>
          </div>
        </div>
      </div>

      {isEditing && (
        <div className="flex justify-end space-x-3">
          <button
            onClick={handleCancel}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <XMarkIcon className="h-4 w-4 mr-2" />
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
                <CheckIcon className="h-4 w-4 mr-2" />
            Save Changes
          </button>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// BRANDING SETTINGS COMPONENT
// =============================================================================

function BrandingSettings({ settings, onUpdate }: { settings: OrganizationSettings; onUpdate: (settings: OrganizationSettings) => void }) {
  const [formData, setFormData] = useState(settings.branding);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = async () => {
    try {
      const validatedData = BrandingSettingsSchema.parse(formData);
      
      const updatedSettings = {
        ...settings,
        branding: validatedData
      };
      
      onUpdate(updatedSettings);
      setIsEditing(false);
      setErrors({});
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
    }
  };

  const handleCancel = () => {
    setFormData(settings.branding);
    setIsEditing(false);
    setErrors({});
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Branding & Appearance</h3>
          <p className="text-sm text-gray-500">Customize your organization's visual identity</p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <PencilIcon className="h-4 w-4 mr-2" />
            Edit
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Logo URL</label>
          <input
            type="url"
            value={formData.logoUrl}
            onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
            disabled={!isEditing}
            placeholder="https://example.com/logo.png"
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
              !isEditing ? 'bg-gray-50' : ''
            } ${errors.logoUrl ? 'border-red-300' : ''}`}
          />
          {errors.logoUrl && <p className="mt-1 text-sm text-red-600">{errors.logoUrl}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Favicon URL</label>
          <input
            type="url"
            value={formData.faviconUrl}
            onChange={(e) => setFormData({ ...formData, faviconUrl: e.target.value })}
            disabled={!isEditing}
            placeholder="https://example.com/favicon.ico"
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
              !isEditing ? 'bg-gray-50' : ''
            } ${errors.faviconUrl ? 'border-red-300' : ''}`}
          />
          {errors.faviconUrl && <p className="mt-1 text-sm text-red-600">{errors.faviconUrl}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Primary Color</label>
          <div className="mt-1 flex items-center space-x-2">
            <input
              type="color"
              value={formData.primaryColor}
              onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
              disabled={!isEditing}
              className={`h-10 w-16 rounded border-gray-300 ${!isEditing ? 'opacity-50' : ''}`}
            />
            <input
              type="text"
              value={formData.primaryColor}
              onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
              disabled={!isEditing}
              placeholder="#3B82F6"
              className={`flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                !isEditing ? 'bg-gray-50' : ''
              } ${errors.primaryColor ? 'border-red-300' : ''}`}
            />
          </div>
          {errors.primaryColor && <p className="mt-1 text-sm text-red-600">{errors.primaryColor}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Secondary Color</label>
          <div className="mt-1 flex items-center space-x-2">
            <input
              type="color"
              value={formData.secondaryColor}
              onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
              disabled={!isEditing}
              className={`h-10 w-16 rounded border-gray-300 ${!isEditing ? 'opacity-50' : ''}`}
            />
            <input
              type="text"
              value={formData.secondaryColor}
              onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
              disabled={!isEditing}
              placeholder="#10B981"
              className={`flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                !isEditing ? 'bg-gray-50' : ''
              } ${errors.secondaryColor ? 'border-red-300' : ''}`}
            />
          </div>
          {errors.secondaryColor && <p className="mt-1 text-sm text-red-600">{errors.secondaryColor}</p>}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Email Header Logo</label>
          <input
            type="url"
            value={formData.emailHeaderLogo}
            onChange={(e) => setFormData({ ...formData, emailHeaderLogo: e.target.value })}
            disabled={!isEditing}
            placeholder="https://example.com/email-logo.png"
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
              !isEditing ? 'bg-gray-50' : ''
            } ${errors.emailHeaderLogo ? 'border-red-300' : ''}`}
          />
          {errors.emailHeaderLogo && <p className="mt-1 text-sm text-red-600">{errors.emailHeaderLogo}</p>}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Email Footer Text</label>
          <textarea
            value={formData.emailFooterText}
            onChange={(e) => setFormData({ ...formData, emailFooterText: e.target.value })}
            disabled={!isEditing}
            rows={3}
            placeholder="Thank you for using our service..."
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
              !isEditing ? 'bg-gray-50' : ''
            } ${errors.emailFooterText ? 'border-red-300' : ''}`}
          />
          {errors.emailFooterText && <p className="mt-1 text-sm text-red-600">{errors.emailFooterText}</p>}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Custom CSS</label>
          <textarea
            value={formData.customCSS}
            onChange={(e) => setFormData({ ...formData, customCSS: e.target.value })}
            disabled={!isEditing}
            rows={6}
            placeholder="/* Custom CSS styles */"
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm font-mono ${
              !isEditing ? 'bg-gray-50' : ''
            } ${errors.customCSS ? 'border-red-300' : ''}`}
          />
          {errors.customCSS && <p className="mt-1 text-sm text-red-600">{errors.customCSS}</p>}
        </div>
      </div>

      {isEditing && (
        <div className="flex justify-end space-x-3">
          <button
            onClick={handleCancel}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <XMarkIcon className="h-4 w-4 mr-2" />
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
                <CheckIcon className="h-4 w-4 mr-2" />
            Save Changes
          </button>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// MAIN ORGANIZATION SETTINGS COMPONENT
// =============================================================================

export default function OrganizationSettings() {
  const [settings, setSettings] = useState<OrganizationSettings>({
    basic: {
      name: '',
      domain: '',
      timezone: 'UTC',
      currency: 'USD',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12',
      fiscalYearStart: '01-01',
      language: 'en',
      region: 'US'
    },
    licensing: {
      tier: 'standard',
      maxUsers: 50,
      maxStorage: 100,
      modules: [],
      expiresAt: new Date(),
      isTrialActive: false,
      trialEndsAt: new Date()
    },
    features: {
      enabledModules: [],
      betaFeatures: [],
      experimentalFeatures: [],
      disabledFeatures: []
    },
    compliance: {
      complianceLevel: 'standard',
      dataResidency: 'US',
      retentionPolicyDays: 365,
      enableAuditLogging: true,
      enableDataEncryption: false,
      gdprCompliant: false,
      hipaaCompliant: false
    },
    branding: {
      logoUrl: '',
      faviconUrl: '',
      primaryColor: '#3B82F6',
      secondaryColor: '#10B981',
      customCSS: '',
      emailHeaderLogo: '',
      emailFooterText: ''
    }
  });

  const [activeSection, setActiveSection] = useState('basic');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const sections: SettingsSection[] = [
    {
      id: 'basic',
      title: 'Basic Information',
      description: 'Organization name, timezone, currency, and regional settings',
      icon: BuildingOfficeIcon,
      component: BasicSettings
    },
    {
      id: 'compliance',
      title: 'Compliance & Security',
      description: 'Data protection, compliance requirements, and security settings',
      icon: ShieldCheckIcon,
      component: ComplianceSettings
    },
    {
      id: 'branding',
      title: 'Branding & Appearance',
      description: 'Logo, colors, themes, and visual customization',
      icon: PaintBrushIcon,
      component: BrandingSettings
    }
  ];

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      // Get current user and organization
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data: userData } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!userData?.organization_id) {
        throw new Error('Organization not found');
      }

      // Load organization basic info
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', userData.organization_id)
        .single();

      if (orgError) throw orgError;

      // Load organization settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('organization_settings')
        .select('settings')
        .eq('organization_id', userData.organization_id)
        .maybeSingle();

      // Merge organization data with settings, using defaults if not found
      const loadedSettings: OrganizationSettings = {
        basic: {
          name: orgData?.name || 'Default Organization',
          domain: settingsData?.settings?.basic?.domain || '',
          timezone: settingsData?.settings?.basic?.timezone || 'UTC',
          currency: settingsData?.settings?.basic?.currency || 'USD',
          dateFormat: settingsData?.settings?.basic?.dateFormat || 'MM/DD/YYYY',
          timeFormat: settingsData?.settings?.basic?.timeFormat || '12',
          fiscalYearStart: settingsData?.settings?.basic?.fiscalYearStart || '01-01',
          language: settingsData?.settings?.basic?.language || 'en',
          region: settingsData?.settings?.basic?.region || 'US'
        },
        licensing: settingsData?.settings?.licensing || {
          tier: 'standard',
          maxUsers: 50,
          maxStorage: 100,
          modules: [],
          expiresAt: new Date(),
          isTrialActive: false,
          trialEndsAt: new Date()
        },
        features: settingsData?.settings?.features || {
          enabledModules: [],
          betaFeatures: [],
          experimentalFeatures: [],
          disabledFeatures: []
        },
        compliance: settingsData?.settings?.compliance || {
          complianceLevel: 'standard',
          dataResidency: 'US',
          retentionPolicyDays: 365,
          enableAuditLogging: true,
          enableDataEncryption: false,
          gdprCompliant: false,
          hipaaCompliant: false
        },
        branding: settingsData?.settings?.branding || {
          logoUrl: '',
          faviconUrl: '',
          primaryColor: '#3B82F6',
          secondaryColor: '#10B981',
          customCSS: '',
          emailHeaderLogo: '',
          emailFooterText: ''
        }
      };
      
      setSettings(loadedSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
      // Set default settings on error
      setSettings(settings);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsUpdate = async (updatedSettings: OrganizationSettings) => {
    try {
      setSaving(true);
      
      // Get current user and organization
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data: userData } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!userData?.organization_id) {
        throw new Error('Organization not found');
      }

      // Update organization basic info
      const { error: orgError } = await supabase
        .from('organizations')
        .update({
          name: updatedSettings.basic.name,
          updated_at: new Date().toISOString()
        })
        .eq('id', userData.organization_id);

      if (orgError) throw orgError;

      // Update organization settings JSON
      const { error: settingsError } = await supabase
        .from('organization_settings')
        .upsert({
          organization_id: userData.organization_id,
          settings: {
            basic: updatedSettings.basic,
            licensing: updatedSettings.licensing,
            features: updatedSettings.features,
            compliance: updatedSettings.compliance,
            branding: updatedSettings.branding
          },
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'organization_id'  // Use organization_id for conflict resolution
        });

      if (settingsError) throw settingsError;
      
      setSettings(updatedSettings);
      
      // Show success message
      console.log('Settings saved successfully to database');
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert(`Error saving settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const activeSectionData = sections.find(section => section.id === activeSection);
  const ActiveComponent = activeSectionData?.component;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Organization Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your organization's configuration and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  activeSection === section.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <section.icon className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <div>{section.title}</div>
                  <div className="text-xs text-gray-500">{section.description}</div>
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <div className="bg-white shadow rounded-lg p-6">
            {ActiveComponent && (
              <ActiveComponent 
                settings={settings} 
                onUpdate={handleSettingsUpdate}
              />
            )}
          </div>
        </div>
      </div>

      {/* Saving Indicator */}
      {saving && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-md shadow-lg">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Saving changes...
          </div>
        </div>
      )}
    </div>
  );
}
