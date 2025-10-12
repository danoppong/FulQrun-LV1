// Administration Module - Organization Branding Management
// Comprehensive branding and appearance customization interface

'use client';

import React, { useState } from 'react';
import {
  CameraIcon,
  DocumentArrowUpIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  PhotoIcon,
  SwatchIcon,
  EnvelopeIcon,
  CodeBracketIcon,
  EyeIcon
} from '@heroicons/react/24/outline'

export default function OrganizationBranding() {
  const [brandingSettings, setBrandingSettings] = useState({
    logoUrl: '',
    faviconUrl: '',
    primaryColor: '#3B82F6',
    secondaryColor: '#10B981',
    customCSS: '',
    emailHeaderLogo: '',
    emailFooterText: ''
  });

  const presetColors = [
    { name: 'Blue', primary: '#3B82F6', secondary: '#60A5FA' },
    { name: 'Green', primary: '#10B981', secondary: '#34D399' },
    { name: 'Purple', primary: '#8B5CF6', secondary: '#A78BFA' },
    { name: 'Red', primary: '#EF4444', secondary: '#F87171' },
    { name: 'Orange', primary: '#F97316', secondary: '#FB923C' },
    { name: 'Indigo', primary: '#6366F1', secondary: '#818CF8' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
  <h1 className="text-2xl font-bold text-gray-900">Branding &amp; Appearance</h1>
        <p className="mt-1 text-sm text-gray-500">
          Customize your organization&apos;s visual identity and branding
        </p>
      </div>

      {/* Logo & Images */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center mb-6">
          <PhotoIcon className="h-6 w-6 text-blue-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Logo & Images</h2>
        </div>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Organization Logo URL
            </label>
            <input
              type="url"
              value={brandingSettings.logoUrl}
              onChange={(e) => setBrandingSettings({ ...brandingSettings, logoUrl: e.target.value })}
              placeholder="https://example.com/logo.png"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">
              Recommended size: 200x60px, PNG or SVG format
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Favicon URL
            </label>
            <input
              type="url"
              value={brandingSettings.faviconUrl}
              onChange={(e) => setBrandingSettings({ ...brandingSettings, faviconUrl: e.target.value })}
              placeholder="https://example.com/favicon.ico"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">
              Recommended size: 32x32px or 16x16px, ICO or PNG format
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Header Logo URL
            </label>
            <input
              type="url"
              value={brandingSettings.emailHeaderLogo}
              onChange={(e) => setBrandingSettings({ ...brandingSettings, emailHeaderLogo: e.target.value })}
              placeholder="https://example.com/email-logo.png"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">
              Logo for email communications
            </p>
          </div>
        </div>
      </div>

      {/* Color Scheme */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center mb-6">
          <SwatchIcon className="h-6 w-6 text-blue-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Color Scheme</h2>
        </div>
        
        <div className="space-y-6">
          {/* Preset Colors */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Color Presets
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {presetColors.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => setBrandingSettings({
                    ...brandingSettings,
                    primaryColor: preset.primary,
                    secondaryColor: preset.secondary
                  })}
                  className="flex flex-col items-center p-3 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors"
                >
                  <div className="flex space-x-1 mb-2">
                    <div
                      className="w-8 h-8 rounded"
                      style={{ backgroundColor: preset.primary }}
                    />
                    <div
                      className="w-8 h-8 rounded"
                      style={{ backgroundColor: preset.secondary }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-700">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Colors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Primary Color
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  value={brandingSettings.primaryColor}
                  onChange={(e) => setBrandingSettings({ ...brandingSettings, primaryColor: e.target.value })}
                  className="h-10 w-16 rounded border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={brandingSettings.primaryColor}
                  onChange={(e) => setBrandingSettings({ ...brandingSettings, primaryColor: e.target.value })}
                  placeholder="#3B82F6"
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Secondary Color
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  value={brandingSettings.secondaryColor}
                  onChange={(e) => setBrandingSettings({ ...brandingSettings, secondaryColor: e.target.value })}
                  className="h-10 w-16 rounded border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={brandingSettings.secondaryColor}
                  onChange={(e) => setBrandingSettings({ ...brandingSettings, secondaryColor: e.target.value })}
                  placeholder="#10B981"
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* Color Preview */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-3">Preview</p>
            <div className="flex space-x-3">
              <button
                style={{ backgroundColor: brandingSettings.primaryColor }}
                className="px-4 py-2 rounded-md text-white font-medium"
              >
                Primary Button
              </button>
              <button
                style={{ backgroundColor: brandingSettings.secondaryColor }}
                className="px-4 py-2 rounded-md text-white font-medium"
              >
                Secondary Button
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Email Branding */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center mb-6">
          <EnvelopeIcon className="h-6 w-6 text-blue-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Email Branding</h2>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Footer Text
          </label>
          <textarea
            value={brandingSettings.emailFooterText}
            onChange={(e) => setBrandingSettings({ ...brandingSettings, emailFooterText: e.target.value })}
            rows={4}
            placeholder="Thank you for using our service..."
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
          <p className="mt-1 text-xs text-gray-500">
            This text will appear at the bottom of all system emails
          </p>
        </div>
      </div>

      {/* Custom CSS */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <CodeBracketIcon className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Custom CSS</h2>
          </div>
          <span className="text-xs text-yellow-600 font-medium">Advanced</span>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Custom Styles
          </label>
          <textarea
            value={brandingSettings.customCSS}
            onChange={(e) => setBrandingSettings({ ...brandingSettings, customCSS: e.target.value })}
            rows={8}
            placeholder="/* Add your custom CSS here */&#10;.custom-class {&#10;  color: #000;&#10;}"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm font-mono text-xs"
          />
          <p className="mt-1 text-xs text-gray-500">
            Advanced: Add custom CSS to override default styles
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        <button
          onClick={() => console.log('Previewing branding:', brandingSettings)}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <EyeIcon className="h-4 w-4 mr-2" />
          Preview
        </button>
        <button
          onClick={() => console.log('Saving branding settings:', brandingSettings)}
          className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}

