// Administration Module - Email Templates Management
// Comprehensive email template management

'use client';

import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  ArrowUpDownIcon,
  EyeIcon,
  EyeSlashIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  LockClosedIcon,
  KeyIcon,
  UserGroupIcon,
  CloudIcon,
  CircleStackIcon,
  CogIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  ServerIcon,
  ShieldCheckIcon,
  BellIcon,
  UserIcon,
  TagIcon,
  AdjustmentsHorizontalIcon,
  Squares2X2Icon,
  RectangleStackIcon,
  CursorArrowRaysIcon,
  PaintBrushIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  ArrowRightIcon,
  ArrowDownIcon,
  EnvelopeIcon,
  PaperAirplaneIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';
import { getSupabaseClient } from '@/lib/supabase-client';
import { z } from 'zod';

const supabase = getSupabaseClient();

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface EmailTemplatesConfiguration {
  templates: EmailTemplate[];
  categories: EmailCategory[];
  variables: EmailVariable[];
  layouts: EmailLayout[];
  campaigns: EmailCampaign[];
}

interface EmailTemplate {
  id: string;
  name: string;
  description?: string;
  category: 'welcome' | 'follow_up' | 'notification' | 'marketing' | 'transactional' | 'reminder' | 'custom';
  subject: string;
  htmlContent: string;
  textContent?: string;
  variables: string[];
  layout: EmailLayout;
  styling: EmailStyling;
  isActive: boolean;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface EmailCategory {
  id: string;
  name: string;
  description?: string;
  color: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface EmailVariable {
  id: string;
  name: string;
  label: string;
  description?: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'url' | 'email' | 'phone';
  defaultValue?: any;
  isRequired: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface EmailLayout {
  id: string;
  name: string;
  description?: string;
  htmlStructure: string;
  cssStyles: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface EmailStyling {
  theme: 'default' | 'modern' | 'minimal' | 'corporate' | 'custom';
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  linkColor: string;
  fontFamily: string;
  fontSize: 'small' | 'medium' | 'large';
  customCSS?: string;
}

interface EmailCampaign {
  id: string;
  name: string;
  description?: string;
  templateId: string;
  recipients: CampaignRecipients;
  schedule: CampaignSchedule;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'cancelled';
  metrics: CampaignMetrics;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface CampaignRecipients {
  type: 'all' | 'role' | 'group' | 'custom';
  roles?: string[];
  groups?: string[];
  customList?: string[];
  filters?: RecipientFilter[];
}

interface RecipientFilter {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than';
  value: any;
}

interface CampaignSchedule {
  type: 'immediate' | 'scheduled' | 'recurring';
  sendAt?: Date;
  frequency?: 'daily' | 'weekly' | 'monthly';
  timezone: string;
}

interface CampaignMetrics {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
  lastSent?: Date;
}

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const EmailTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  description: z.string().optional(),
  category: z.enum(['welcome', 'follow_up', 'notification', 'marketing', 'transactional', 'reminder', 'custom']),
  subject: z.string().min(1, 'Subject is required'),
  htmlContent: z.string().min(1, 'HTML content is required'),
  isActive: z.boolean(),
  isPublic: z.boolean()
});

const EmailCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Must be a valid hex color'),
  isActive: z.boolean()
});

// =============================================================================
// EMAIL TEMPLATES COMPONENT
// =============================================================================

function EmailTemplates({ config, onUpdate }: { config: EmailTemplatesConfiguration; onUpdate: (config: EmailTemplatesConfiguration) => void }) {
  const [templates, setTemplates] = useState<EmailTemplate[]>(config.templates);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | undefined>();

  const categories = [
    { value: 'welcome', label: 'Welcome', color: 'bg-blue-100 text-blue-800' },
    { value: 'follow_up', label: 'Follow Up', color: 'bg-green-100 text-green-800' },
    { value: 'notification', label: 'Notification', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'marketing', label: 'Marketing', color: 'bg-purple-100 text-purple-800' },
    { value: 'transactional', label: 'Transactional', color: 'bg-red-100 text-red-800' },
    { value: 'reminder', label: 'Reminder', color: 'bg-indigo-100 text-indigo-800' },
    { value: 'custom', label: 'Custom', color: 'bg-gray-100 text-gray-800' }
  ];

  const handleSaveTemplate = (templateData: Partial<EmailTemplate>) => {
    try {
      const validatedData = EmailTemplateSchema.parse(templateData);
      
      if (editingTemplate) {
        const updatedTemplates = templates.map(t => 
          t.id === editingTemplate.id 
            ? { ...t, ...validatedData, id: editingTemplate.id, updatedAt: new Date() }
            : t
        );
        setTemplates(updatedTemplates);
      } else {
        const newTemplate: EmailTemplate = {
          id: Date.now().toString(),
          ...validatedData,
          variables: [],
          layout: {
            id: '1',
            name: 'Default Layout',
            htmlStructure: '<div class="email-container">{{content}}</div>',
            cssStyles: '.email-container { max-width: 600px; margin: 0 auto; }',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          styling: {
            theme: 'default',
            primaryColor: '#3B82F6',
            secondaryColor: '#6B7280',
            backgroundColor: '#FFFFFF',
            textColor: '#111827',
            linkColor: '#3B82F6',
            fontFamily: 'Inter',
            fontSize: 'medium'
          },
          createdAt: new Date(),
          updatedAt: new Date()
        };
        setTemplates([...templates, newTemplate]);
      }
      
      setShowForm(false);
      setEditingTemplate(undefined);
      
      onUpdate({
        ...config,
        templates,
        categories: config.categories,
        variables: config.variables,
        layouts: config.layouts,
        campaigns: config.campaigns
      });
    } catch (error) {
      console.error('Error saving email template:', error);
    }
  };

  const handleDeleteTemplate = (templateId: string) => {
    setTemplates(templates.filter(t => t.id !== templateId));
    onUpdate({
      ...config,
      templates: templates.filter(t => t.id !== templateId),
      categories: config.categories,
      variables: config.variables,
      layouts: config.layouts,
      campaigns: config.campaigns
    });
  };

  const handleToggleTemplate = (templateId: string) => {
    const updatedTemplates = templates.map(t => 
      t.id === templateId ? { ...t, isActive: !t.isActive, updatedAt: new Date() } : t
    );
    setTemplates(updatedTemplates);
    onUpdate({
      ...config,
      templates: updatedTemplates,
      categories: config.categories,
      variables: config.variables,
      layouts: config.layouts,
      campaigns: config.campaigns
    });
  };

  const handlePreviewTemplate = (templateId: string) => {
    // In real implementation, this would open a preview modal
    console.log('Preview template:', templateId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Email Templates</h3>
          <p className="text-sm text-gray-500">Create and manage email templates for campaigns and notifications</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Template
        </button>
      </div>

      {/* Templates Table */}
      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Template Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variables</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {templates.map((template) => {
              const category = categories.find(c => c.value === template.category);
              
              return (
                <tr key={template.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{template.name}</div>
                      {template.description && (
                        <div className="text-sm text-gray-500">{template.description}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${category?.color}`}>
                      {category?.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {template.subject}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {template.variables.length} variables
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      template.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {template.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handlePreviewTemplate(template.id)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Preview template"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleToggleTemplate(template.id)}
                        className={template.isActive ? "text-red-600 hover:text-red-900" : "text-green-600 hover:text-green-900"}
                        title={template.isActive ? "Deactivate template" : "Activate template"}
                      >
                        {template.isActive ? <XCircleIcon className="h-4 w-4" /> : <CheckCircleIcon className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => {
                          setEditingTemplate(template);
                          setShowForm(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Template Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-4/5 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingTemplate ? 'Edit Email Template' : 'Create Email Template'}
              </h3>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleSaveTemplate({
                  name: formData.get('name') as string,
                  description: formData.get('description') as string,
                  category: formData.get('category') as any,
                  subject: formData.get('subject') as string,
                  htmlContent: formData.get('htmlContent') as string,
                  isActive: formData.get('isActive') === 'on',
                  isPublic: formData.get('isPublic') === 'on'
                });
              }} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Template Name</label>
                    <input
                      type="text"
                      name="name"
                      defaultValue={editingTemplate?.name}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Category</label>
                    <select
                      name="category"
                      defaultValue={editingTemplate?.category}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                      {categories.map(category => (
                        <option key={category.value} value={category.value}>{category.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    name="description"
                    defaultValue={editingTemplate?.description}
                    rows={2}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Subject Line</label>
                  <input
                    type="text"
                    name="subject"
                    defaultValue={editingTemplate?.subject}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="e.g., Welcome to {{company_name}}!"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">HTML Content</label>
                  <textarea
                    name="htmlContent"
                    defaultValue={editingTemplate?.htmlContent}
                    rows={10}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm font-mono"
                    placeholder="<html><body><h1>Hello {{first_name}}!</h1><p>Welcome to our platform.</p></body></html>"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="isActive"
                      defaultChecked={editingTemplate?.isActive}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700">Active template</label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="isPublic"
                      defaultChecked={editingTemplate?.isPublic}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700">Public template</label>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-md">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">Template Variables</h4>
                  <p className="text-sm text-blue-700">
                    Use variables like {{first_name}}, {{last_name}}, {{company_name}} in your template. 
                    These will be replaced with actual values when the email is sent.
                  </p>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingTemplate(undefined);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    {editingTemplate ? 'Update Template' : 'Create Template'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// EMAIL CATEGORIES COMPONENT
// =============================================================================

function EmailCategories({ config, onUpdate }: { config: EmailTemplatesConfiguration; onUpdate: (config: EmailTemplatesConfiguration) => void }) {
  const [categories, setCategories] = useState<EmailCategory[]>(config.categories);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<EmailCategory | undefined>();

  const handleSaveCategory = (categoryData: Partial<EmailCategory>) => {
    try {
      const validatedData = EmailCategorySchema.parse(categoryData);
      
      if (editingCategory) {
        const updatedCategories = categories.map(c => 
          c.id === editingCategory.id 
            ? { ...c, ...validatedData, id: editingCategory.id, updatedAt: new Date() }
            : c
        );
        setCategories(updatedCategories);
      } else {
        const newCategory: EmailCategory = {
          id: Date.now().toString(),
          ...validatedData,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        setCategories([...categories, newCategory]);
      }
      
      setShowForm(false);
      setEditingCategory(undefined);
      
      onUpdate({
        ...config,
        templates: config.templates,
        categories,
        variables: config.variables,
        layouts: config.layouts,
        campaigns: config.campaigns
      });
    } catch (error) {
      console.error('Error saving email category:', error);
    }
  };

  const handleDeleteCategory = (categoryId: string) => {
    setCategories(categories.filter(c => c.id !== categoryId));
    onUpdate({
      ...config,
      templates: config.templates,
      categories: categories.filter(c => c.id !== categoryId),
      variables: config.variables,
      layouts: config.layouts,
      campaigns: config.campaigns
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Email Categories</h3>
          <p className="text-sm text-gray-500">Organize email templates into categories</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Category
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => {
          const categoryTemplates = config.templates.filter(t => t.category === category.name.toLowerCase().replace(' ', '_'));
          
          return (
            <div key={category.id} className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <div 
                    className="w-4 h-4 rounded-full mr-2"
                    style={{ backgroundColor: category.color }}
                  ></div>
                  <h4 className="text-sm font-medium text-gray-900">{category.name}</h4>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => {
                      setEditingCategory(category);
                      setShowForm(true);
                    }}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                {category.description && (
                  <div className="text-xs text-gray-500 mb-2">{category.description}</div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Templates</span>
                  <span className="text-xs text-gray-900">{categoryTemplates.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Status</span>
                  <span className={`text-xs ${category.isActive ? 'text-green-600' : 'text-red-600'}`}>
                    {category.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Category Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingCategory ? 'Edit Email Category' : 'Create Email Category'}
              </h3>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleSaveCategory({
                  name: formData.get('name') as string,
                  description: formData.get('description') as string,
                  color: formData.get('color') as string,
                  isActive: true
                });
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category Name</label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingCategory?.name}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    name="description"
                    defaultValue={editingCategory?.description}
                    rows={2}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Color</label>
                  <input
                    type="color"
                    name="color"
                    defaultValue={editingCategory?.color || '#3B82F6'}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingCategory(undefined);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    {editingCategory ? 'Update Category' : 'Create Category'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// MAIN EMAIL TEMPLATES COMPONENT
// =============================================================================

export default function EmailTemplatesManagement() {
  const [config, setConfig] = useState<EmailTemplatesConfiguration>({
    templates: [],
    categories: [],
    variables: [],
    layouts: [],
    campaigns: []
  });

  const [activeTab, setActiveTab] = useState('templates');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Mock email templates data
      const mockTemplates: EmailTemplate[] = [
        {
          id: '1',
          name: 'Welcome Email',
          description: 'Welcome new users to the platform',
          category: 'welcome',
          subject: 'Welcome to {{company_name}}!',
          htmlContent: '<html><body><h1>Welcome {{first_name}}!</h1><p>Thank you for joining {{company_name}}.</p></body></html>',
          textContent: 'Welcome {{first_name}}! Thank you for joining {{company_name}}.',
          variables: ['first_name', 'last_name', 'company_name'],
          layout: {
            id: '1',
            name: 'Default Layout',
            htmlStructure: '<div class="email-container">{{content}}</div>',
            cssStyles: '.email-container { max-width: 600px; margin: 0 auto; }',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          styling: {
            theme: 'modern',
            primaryColor: '#3B82F6',
            secondaryColor: '#6B7280',
            backgroundColor: '#FFFFFF',
            textColor: '#111827',
            linkColor: '#3B82F6',
            fontFamily: 'Inter',
            fontSize: 'medium'
          },
          isActive: true,
          isPublic: true,
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-09-30')
        },
        {
          id: '2',
          name: 'Follow-up Email',
          description: 'Follow up with leads after initial contact',
          category: 'follow_up',
          subject: 'Following up on {{company_name}}',
          htmlContent: '<html><body><h1>Hi {{first_name}},</h1><p>I wanted to follow up on our conversation about {{company_name}}.</p></body></html>',
          textContent: 'Hi {{first_name}}, I wanted to follow up on our conversation about {{company_name}}.',
          variables: ['first_name', 'last_name', 'company_name'],
          layout: {
            id: '1',
            name: 'Default Layout',
            htmlStructure: '<div class="email-container">{{content}}</div>',
            cssStyles: '.email-container { max-width: 600px; margin: 0 auto; }',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          styling: {
            theme: 'corporate',
            primaryColor: '#059669',
            secondaryColor: '#6B7280',
            backgroundColor: '#FFFFFF',
            textColor: '#111827',
            linkColor: '#059669',
            fontFamily: 'Inter',
            fontSize: 'medium'
          },
          isActive: true,
          isPublic: false,
          createdAt: new Date('2024-02-01'),
          updatedAt: new Date('2024-09-30')
        }
      ];

      // Mock categories data
      const mockCategories: EmailCategory[] = [
        {
          id: '1',
          name: 'Welcome',
          description: 'Welcome and onboarding emails',
          color: '#3B82F6',
          isActive: true,
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-09-30')
        },
        {
          id: '2',
          name: 'Follow Up',
          description: 'Follow-up and nurturing emails',
          color: '#059669',
          isActive: true,
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-09-30')
        },
        {
          id: '3',
          name: 'Marketing',
          description: 'Marketing and promotional emails',
          color: '#DC2626',
          isActive: true,
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-09-30')
        }
      ];
      
      setConfig({
        ...config,
        templates: mockTemplates,
        categories: mockCategories
      });
    } catch (error) {
      console.error('Error loading email templates data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigUpdate = (updatedConfig: EmailTemplatesConfiguration) => {
    setConfig(updatedConfig);
    // In real implementation, this would save to the API
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'templates', name: 'Email Templates', icon: EnvelopeIcon },
    { id: 'categories', name: 'Categories', icon: TagIcon },
    { id: 'variables', name: 'Variables', icon: AdjustmentsHorizontalIcon },
    { id: 'layouts', name: 'Layouts', icon: RectangleStackIcon },
    { id: 'campaigns', name: 'Campaigns', icon: PaperAirplaneIcon }
  ];

  const activeTemplates = config.templates.filter(t => t.isActive).length;
  const totalTemplates = config.templates.length;
  const activeCategories = config.categories.filter(c => c.isActive).length;
  const totalCategories = config.categories.length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Email Templates Management</h1>
        <p className="mt-1 text-sm text-gray-500">
          Create and manage email templates, categories, and campaigns
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <EnvelopeIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Active Templates</p>
              <p className="text-2xl font-semibold text-gray-900">{activeTemplates}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <DocumentTextIcon className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Templates</p>
              <p className="text-2xl font-semibold text-gray-900">{totalTemplates}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <TagIcon className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Categories</p>
              <p className="text-2xl font-semibold text-gray-900">{activeCategories}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <PaperAirplaneIcon className="h-8 w-8 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Campaigns</p>
              <p className="text-2xl font-semibold text-gray-900">{config.campaigns.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4 mr-2 inline" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white p-6 rounded-lg shadow">
        {activeTab === 'templates' && (
          <EmailTemplates config={config} onUpdate={handleConfigUpdate} />
        )}
        {activeTab === 'categories' && (
          <EmailCategories config={config} onUpdate={handleConfigUpdate} />
        )}
        {activeTab === 'variables' && (
          <div className="text-center py-12">
            <AdjustmentsHorizontalIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Email Variables</h3>
            <p className="text-gray-500">Variable management coming soon...</p>
          </div>
        )}
        {activeTab === 'layouts' && (
          <div className="text-center py-12">
            <RectangleStackIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Email Layouts</h3>
            <p className="text-gray-500">Layout management coming soon...</p>
          </div>
        )}
        {activeTab === 'campaigns' && (
          <div className="text-center py-12">
            <PaperAirplaneIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Email Campaigns</h3>
            <p className="text-gray-500">Campaign management coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
}
