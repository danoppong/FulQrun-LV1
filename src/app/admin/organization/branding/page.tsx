// Administration Module - Organization Branding Management
// Comprehensive branding and appearance customization interface

'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image'
import {
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

  const [uploading, setUploading] = useState<{ logo: boolean; favicon: boolean; emailHeaderLogo: boolean }>({ logo: false, favicon: false, emailHeaderLogo: false })
  const [error, setError] = useState<string | null>(null)
  const [policyStatus, setPolicyStatus] = useState<'unknown' | 'ok' | 'blocked' | 'missing-bucket' | 'error'>('unknown')
  const [checking, setChecking] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // Load existing settings
    let active = true
    fetch('/api/admin/organization/branding/settings')
      .then(async (r) => ({ ok: r.ok, status: r.status, data: await r.json().catch(() => ({})) }))
      .then(({ ok, data }) => {
        if (!active) return
        if (ok && data?.settings) {
          setBrandingSettings((prev) => ({ ...prev, ...data.settings }))
        }
      })
      .catch(() => {/* ignore */})
    return () => { active = false }
  }, [])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'favicon' | 'emailHeaderLogo') {
    try {
      setError(null)
      setUploading(prev => ({ ...prev, [type]: true }))
      const files = e.target.files
      if (!files || files.length === 0) return
      const file = files[0]
      const form = new FormData()
      form.append('file', file)
      form.append('type', type)
      const res = await fetch('/api/admin/organization/branding/upload', {
        method: 'POST',
        body: form,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Upload failed')
      const url: string = data.url
      if (type === 'logo') setBrandingSettings(prev => ({ ...prev, logoUrl: url }))
      if (type === 'favicon') setBrandingSettings(prev => ({ ...prev, faviconUrl: url }))
      if (type === 'emailHeaderLogo') setBrandingSettings(prev => ({ ...prev, emailHeaderLogo: url }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(prev => ({ ...prev, [type]: false }))
      // Reset the input so same file can be re-selected if needed
      e.target.value = ''
    }
  }

  async function checkPolicy() {
    try {
      setChecking(true)
      setError(null)
      const res = await fetch('/api/admin/organization/branding/status')
      const data = await res.json()
      if (!res.ok) {
        const msg: string = data?.error || 'Policy check failed'
        if (res.status === 424) setPolicyStatus('missing-bucket')
        else if (res.status === 403) setPolicyStatus('blocked')
        else setPolicyStatus('error')
        setError(msg)
        return
      }
      setPolicyStatus('ok')
    } catch (err) {
      setPolicyStatus('error')
      setError(err instanceof Error ? err.message : 'Policy check failed')
    } finally {
      setChecking(false)
    }
  }

  async function saveSettings() {
    try {
      setSaving(true)
      setError(null)
      const res = await fetch('/api/admin/organization/branding/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(brandingSettings),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Failed to save settings')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

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

      {/* Storage Policy Status */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PhotoIcon className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-900">Branding Storage Policy</span>
          </div>
          <button
            onClick={checkPolicy}
            disabled={checking}
            className="px-3 py-1.5 text-sm rounded-md border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-60"
          >
            {checking ? 'Checking…' : 'Check storage policy'}
          </button>
        </div>
        <div className="mt-2 text-sm">
          {policyStatus === 'unknown' && (
            <p className="text-gray-500">Status not checked yet.</p>
          )}
          {policyStatus === 'ok' && (
            <p className="text-green-700">Write access confirmed. Uploads should work.</p>
          )}
          {policyStatus === 'blocked' && (
            <p className="text-amber-700">Write blocked by RLS. Ensure policies allow writes under your org folder (e.g., <code>{`<orgId>/...`}</code>).</p>
          )}
          {policyStatus === 'missing-bucket' && (
            <p className="text-red-700">Bucket &quot;branding&quot; not found. Create a public bucket named &quot;branding&quot; in Supabase Storage.</p>
          )}
          {policyStatus === 'error' && (
            <p className="text-red-700">Could not verify policies. See error below for details.</p>
          )}
        </div>
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
              Organization Logo
            </label>
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept="image/png,image/svg+xml,image/jpeg,image/webp"
                onChange={(e) => handleUpload(e, 'logo')}
                className="block w-full text-sm text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {uploading.logo && <span className="text-xs text-gray-500">Uploading…</span>}
            </div>
            {brandingSettings.logoUrl && (
              <div className="mt-3 relative w-auto">
                <Image
                  src={brandingSettings.logoUrl}
                  alt="Organization logo preview"
                  width={256}
                  height={48}
                  className="w-auto object-contain"
                  // Ensure aspect ratio is maintained when CSS adjusts only one dimension
                  style={{ height: 'auto', width: 'auto', maxHeight: '3rem' }}
                />
              </div>
            )}
            <p className="mt-1 text-xs text-gray-500">Recommended width up to 256px. PNG or SVG.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Favicon</label>
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml, image/x-icon, .ico"
                onChange={(e) => handleUpload(e, 'favicon')}
                className="block w-full text-sm text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {uploading.favicon && <span className="text-xs text-gray-500">Uploading…</span>}
            </div>
            {brandingSettings.faviconUrl && (
              <div className="mt-3 h-8 w-8 relative">
                <Image src={brandingSettings.faviconUrl} alt="Favicon preview" width={32} height={32} className="h-8 w-8" />
              </div>
            )}
            <p className="mt-1 text-xs text-gray-500">We generate a 32x32 PNG automatically.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Header Logo</label>
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept="image/png,image/svg+xml,image/jpeg,image/webp"
                onChange={(e) => handleUpload(e, 'emailHeaderLogo')}
                className="block w-full text-sm text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {uploading.emailHeaderLogo && <span className="text-xs text-gray-500">Uploading…</span>}
            </div>
            {brandingSettings.emailHeaderLogo && (
              <div className="mt-3 relative w-auto">
                <Image
                  src={brandingSettings.emailHeaderLogo}
                  alt="Email header logo preview"
                  width={600}
                  height={120}
                  className="w-auto object-contain"
                  // Ensure aspect ratio is maintained when CSS adjusts only one dimension
                  style={{ height: 'auto', width: 'auto', maxHeight: '3rem' }}
                />
              </div>
            )}
            <p className="mt-1 text-xs text-gray-500">We scale to max width 600px for email.</p>
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

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md p-3">{error}</div>
      )}

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
          onClick={saveSettings}
          className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

