// Administration Module - Email Templates Management
// Comprehensive email template management

'use client';

import React, { useState, useEffect } from 'react';
import { ;
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  ArrowUpIcon,
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
                    Use variables like {`{{first_name}}`}, {`{{last_name}}`}, {`{{company_name}}`} in your template. 
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
// EMAIL VARIABLES COMPONENT
// =============================================================================

function EmailVariables({ config, onUpdate }: { config: EmailTemplatesConfiguration; onUpdate: (config: EmailTemplatesConfiguration) => void }) {
  const [showForm, setShowForm] = useState(false);
  const [editingVariable, setEditingVariable] = useState<EmailVariable | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'type' | 'createdAt'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const variables = config.variables;
  const filteredVariables = variables
    .filter(variable => 
      variable.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      variable.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      variable.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      
      if (sortBy === 'createdAt') {
        return sortOrder === 'asc' 
          ? new Date(aValue as Date).getTime() - new Date(bValue as Date).getTime()
          : new Date(bValue as Date).getTime() - new Date(aValue as Date).getTime();
      }
      
      const comparison = String(aValue).localeCompare(String(bValue));
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const handleSaveVariable = (variableData: Partial<EmailVariable>) => {
    const updatedVariables = editingVariable
      ? variables.map(v => v.id === editingVariable.id ? { ...v, ...variableData, updatedAt: new Date() } : v)
      : [...variables, {
          id: Date.now().toString(),
          ...variableData,
          createdAt: new Date(),
          updatedAt: new Date()
        } as EmailVariable];

    onUpdate({
      ...config,
      variables: updatedVariables
    });

    setShowForm(false);
    setEditingVariable(undefined);
  };

  const handleDeleteVariable = (variableId: string) => {
    if (confirm('Are you sure you want to delete this variable? This action cannot be undone.')) {
      const updatedVariables = variables.filter(v => v.id !== variableId);
      onUpdate({
        ...config,
        variables: updatedVariables
      });
    }
  };

  const handleToggleVariable = (variableId: string) => {
    const updatedVariables = variables.map(v => 
      v.id === variableId ? { ...v, isActive: !v.isActive, updatedAt: new Date() } : v
    );
    onUpdate({
      ...config,
      variables: updatedVariables
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'text': return <DocumentTextIcon className="h-4 w-4" />;
      case 'number': return <CircleStackIcon className="h-4 w-4" />;
      case 'date': return <ClockIcon className="h-4 w-4" />;
      case 'boolean': return <CheckCircleIcon className="h-4 w-4" />;
      case 'url': return <CloudIcon className="h-4 w-4" />;
      case 'email': return <EnvelopeIcon className="h-4 w-4" />;
      case 'phone': return <BellIcon className="h-4 w-4" />;
      default: return <DocumentTextIcon className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'text': return 'text-blue-600 bg-blue-100';
      case 'number': return 'text-green-600 bg-green-100';
      case 'date': return 'text-purple-600 bg-purple-100';
      case 'boolean': return 'text-orange-600 bg-orange-100';
      case 'url': return 'text-cyan-600 bg-cyan-100';
      case 'email': return 'text-red-600 bg-red-100';
      case 'phone': return 'text-indigo-600 bg-indigo-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Email Variables</h3>
          <p className="text-sm text-gray-500">Manage dynamic variables for email templates</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Variable
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search variables..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 w-full"
            />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm"
          >
            <option value="name">Name</option>
            <option value="type">Type</option>
            <option value="createdAt">Created</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <ArrowUpIcon className={`h-4 w-4 transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Variables Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variable</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Default Value</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredVariables.map((variable) => {
              const usageCount = config.templates.filter(t => t.variables.includes(variable.name)).length;
              
              return (
                <tr key={variable.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{`{{${variable.name}}}`}</div>
                      <div className="text-sm text-gray-500">{variable.label}</div>
                      {variable.description && (
                        <div className="text-xs text-gray-400 mt-1">{variable.description}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(variable.type)}`}>
                      {getTypeIcon(variable.type)}
                      <span className="ml-1 capitalize">{variable.type}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {variable.defaultValue !== undefined ? String(variable.defaultValue) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      variable.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {variable.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {usageCount} template{usageCount !== 1 ? 's' : ''}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleToggleVariable(variable.id)}
                        className={variable.isActive ? "text-red-600 hover:text-red-900" : "text-green-600 hover:text-green-900"}
                        title={variable.isActive ? "Deactivate variable" : "Activate variable"}
                      >
                        {variable.isActive ? <XCircleIcon className="h-4 w-4" /> : <CheckCircleIcon className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => {
                          setEditingVariable(variable);
                          setShowForm(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteVariable(variable.id)}
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

      {/* Variable Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-4/5 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingVariable ? 'Edit Email Variable' : 'Create Email Variable'}
              </h3>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleSaveVariable({
                  name: formData.get('name') as string,
                  label: formData.get('label') as string,
                  description: formData.get('description') as string,
                  type: formData.get('type') as any,
                  defaultValue: formData.get('defaultValue') as string,
                  isRequired: formData.get('isRequired') === 'on',
                  isActive: formData.get('isActive') === 'on'
                });
              }} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Variable Name</label>
                    <input
                      type="text"
                      name="name"
                      defaultValue={editingVariable?.name}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="e.g., first_name"
                    />
                    <p className="mt-1 text-xs text-gray-500">Used as {`{{first_name}}`} in templates</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Display Label</label>
                    <input
                      type="text"
                      name="label"
                      defaultValue={editingVariable?.label}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="e.g., First Name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    name="description"
                    defaultValue={editingVariable?.description}
                    rows={2}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="Optional description of this variable"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Data Type</label>
                    <select
                      name="type"
                      defaultValue={editingVariable?.type}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                      <option value="text">Text</option>
                      <option value="number">Number</option>
                      <option value="date">Date</option>
                      <option value="boolean">Boolean</option>
                      <option value="url">URL</option>
                      <option value="email">Email</option>
                      <option value="phone">Phone</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Default Value</label>
                    <input
                      type="text"
                      name="defaultValue"
                      defaultValue={editingVariable?.defaultValue}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="Optional default value"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="isRequired"
                      defaultChecked={editingVariable?.isRequired}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700">Required variable</label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="isActive"
                      defaultChecked={editingVariable?.isActive}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700">Active variable</label>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-md">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">Variable Usage</h4>
                  <p className="text-sm text-blue-700">
                    Use this variable in templates as {`{{${editingVariable?.name || 'variable_name'}}}`}. 
                    The system will automatically replace it with the actual value when sending emails.
                  </p>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingVariable(undefined);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    {editingVariable ? 'Update Variable' : 'Create Variable'}
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
// EMAIL LAYOUTS COMPONENT
// =============================================================================

function EmailLayouts({ config, onUpdate }: { config: EmailTemplatesConfiguration; onUpdate: (config: EmailTemplatesConfiguration) => void }) {
  const [showForm, setShowForm] = useState(false);
  const [editingLayout, setEditingLayout] = useState<EmailLayout | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'createdAt'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

  const layouts = config.layouts;
  const filteredLayouts = layouts
    .filter(layout => 
      layout.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      layout.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      
      if (sortBy === 'createdAt') {
        return sortOrder === 'asc' 
          ? new Date(aValue as Date).getTime() - new Date(bValue as Date).getTime()
          : new Date(bValue as Date).getTime() - new Date(aValue as Date).getTime();
      }
      
      const comparison = String(aValue).localeCompare(String(bValue));
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const handleSaveLayout = (layoutData: Partial<EmailLayout>) => {
    const updatedLayouts = editingLayout
      ? layouts.map(l => l.id === editingLayout.id ? { ...l, ...layoutData, updatedAt: new Date() } : l)
      : [...layouts, {
          id: Date.now().toString(),
          ...layoutData,
          createdAt: new Date(),
          updatedAt: new Date()
        } as EmailLayout];

    onUpdate({
      ...config,
      layouts: updatedLayouts
    });

    setShowForm(false);
    setEditingLayout(undefined);
  };

  const handleDeleteLayout = (layoutId: string) => {
    if (confirm('Are you sure you want to delete this layout? This action cannot be undone.')) {
      const updatedLayouts = layouts.filter(l => l.id !== layoutId);
      onUpdate({
        ...config,
        layouts: updatedLayouts
      });
    }
  };

  const handleToggleLayout = (layoutId: string) => {
    const updatedLayouts = layouts.map(l => 
      l.id === layoutId ? { ...l, isActive: !l.isActive, updatedAt: new Date() } : l
    );
    onUpdate({
      ...config,
      layouts: updatedLayouts
    });
  };

  const handlePreviewLayout = (layout: EmailLayout) => {
    // In a real implementation, this would open a preview modal
    console.log('Preview layout:', layout);
  };

  const getLayoutPreview = (layout: EmailLayout) => {
    const htmlContent = layout.htmlStructure.replace('{{content}}', 
      '<div style="padding: 20px; background: #f8f9fa; border: 1px dashed #dee2e6; text-align: center; color: #6c757d;">Your email content will appear here</div>'
    );
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          ${layout.cssStyles}
          .preview-container {
            max-width: 600px;
            margin: 0 auto;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            overflow: hidden;
          }
        </style>
      </head>
      <body style="margin: 0; padding: 20px; background: #f3f4f6;">
        <div class="preview-container">
          ${htmlContent}
        </div>
      </body>
      </html>
    `;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Email Layouts</h3>
          <p className="text-sm text-gray-500">Create and manage reusable email layouts</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Layout
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search layouts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 w-full"
            />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm"
          >
            <option value="name">Name</option>
            <option value="createdAt">Created</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <ArrowUpIcon className={`h-4 w-4 transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Layouts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLayouts.map((layout) => {
          const usageCount = config.templates.filter(t => t.layout.id === layout.id).length;
          
          return (
            <div key={layout.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
              {/* Layout Preview */}
              <div className="h-48 bg-gray-50 relative overflow-hidden">
                <iframe
                  srcDoc={getLayoutPreview(layout)}
                  className="w-full h-full border-0 transform scale-50 origin-top-left"
                  style={{ width: '200%', height: '200%' }}
                  title={`Preview of ${layout.name}`}
                />
              </div>
              
              {/* Layout Info */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-900 truncate">{layout.name}</h4>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    layout.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {layout.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                {layout.description && (
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">{layout.description}</p>
                )}
                
                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                  <span>{usageCount} template{usageCount !== 1 ? 's' : ''}</span>
                  <span>{new Date(layout.createdAt).toLocaleDateString()}</span>
                </div>
                
                {/* Actions */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePreviewLayout(layout)}
                    className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <EyeIcon className="h-3 w-3 mr-1" />
                    Preview
                  </button>
                  <button
                    onClick={() => handleToggleLayout(layout.id)}
                    className={`p-2 rounded-md ${
                      layout.isActive 
                        ? 'text-red-600 hover:text-red-900 hover:bg-red-50' 
                        : 'text-green-600 hover:text-green-900 hover:bg-green-50'
                    }`}
                    title={layout.isActive ? "Deactivate layout" : "Activate layout"}
                  >
                    {layout.isActive ? <XCircleIcon className="h-4 w-4" /> : <CheckCircleIcon className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => {
                      setEditingLayout(layout);
                      setShowForm(true);
                    }}
                    className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-md"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteLayout(layout.id)}
                    className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-md"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Layout Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-5 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingLayout ? 'Edit Email Layout' : 'Create Email Layout'}
              </h3>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleSaveLayout({
                  name: formData.get('name') as string,
                  description: formData.get('description') as string,
                  htmlStructure: formData.get('htmlStructure') as string,
                  cssStyles: formData.get('cssStyles') as string,
                  isActive: formData.get('isActive') === 'on'
                });
              }} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Layout Name</label>
                    <input
                      type="text"
                      name="name"
                      defaultValue={editingLayout?.name}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="e.g., Modern Newsletter"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <div className="mt-2">
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          name="isActive"
                          defaultChecked={editingLayout?.isActive}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Active layout</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    name="description"
                    defaultValue={editingLayout?.description}
                    rows={2}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="Optional description of this layout"
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* HTML Structure */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">HTML Structure</label>
                    <div className="bg-gray-50 p-3 rounded-md mb-2">
                      <p className="text-xs text-gray-600">
                        Use <code className="bg-gray-200 px-1 rounded">{`{{content}}`}</code> placeholder where email content should appear
                      </p>
                    </div>
                    <textarea
                      name="htmlStructure"
                      defaultValue={editingLayout?.htmlStructure}
                      rows={12}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm font-mono text-xs"
                      placeholder="&lt;div class=&quot;email-container&quot;&gt;
  &lt;header class=&quot;header&quot;&gt;
    &lt;h1&gt;Your Company&lt;/h1&gt;
  &lt;/header&gt;
  &lt;main class=&quot;content&quot;&gt;
    {{content}}
  &lt;/main&gt;
  &lt;footer class=&quot;footer&quot;&gt;
    &lt;p&gt;&amp;copy; 2024 Your Company&lt;/p&gt;
  &lt;/footer&gt;
&lt;/div&gt;"
                    />
                  </div>

                  {/* CSS Styles */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">CSS Styles</label>
                    <div className="bg-gray-50 p-3 rounded-md mb-2">
                      <p className="text-xs text-gray-600">
                        Define styles for your layout. Use responsive design for mobile compatibility.
                      </p>
                    </div>
                    <textarea
                      name="cssStyles"
                      defaultValue={editingLayout?.cssStyles}
                      rows={12}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm font-mono text-xs"
                      placeholder=".email-container {
  max-width: 600px;
  margin: 0 auto;
  font-family: Arial, sans-serif;
}

.header {
  background: #3B82F6;
  color: white;
  padding: 20px;
  text-align: center;
}

.content {
  padding: 20px;
  background: white;
}

.footer {
  background: #F3F4F6;
  padding: 15px;
  text-align: center;
  font-size: 12px;
  color: #6B7280;
}

@media (max-width: 600px) {
  .email-container {
    width: 100% !important;
  }
}"
                    />
                  </div>
                </div>

                {/* Preview Section */}
                <div className="border-t pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-medium text-gray-900">Layout Preview</h4>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setPreviewMode('desktop')}
                        className={`px-3 py-1 text-xs rounded-md ${
                          previewMode === 'desktop' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        Desktop
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewMode('mobile')}
                        className={`px-3 py-1 text-xs rounded-md ${
                          previewMode === 'mobile' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        Mobile
                      </button>
                    </div>
                  </div>
                  
                  <div className={`bg-gray-50 p-4 rounded-md ${
                    previewMode === 'mobile' ? 'max-w-sm mx-auto' : ''
                  }`}>
                    <div className="bg-white rounded border overflow-hidden">
                      <iframe
                        srcDoc={editingLayout ? getLayoutPreview(editingLayout) : `
                          <div style="padding: 40px; text-align: center; color: #6B7280;">
                            Preview will appear here after entering HTML structure
                          </div>
                        `}
                        className="w-full h-64 border-0"
                        title="Layout Preview"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-md">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">Layout Usage</h4>
                  <p className="text-sm text-blue-700">
                    This layout can be selected when creating or editing email templates. 
                    The <code className="bg-blue-200 px-1 rounded">{`{{content}}`}</code> placeholder will be replaced with the template's HTML content.
                  </p>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingLayout(undefined);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    {editingLayout ? 'Update Layout' : 'Create Layout'}
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
// EMAIL CAMPAIGNS COMPONENT
// =============================================================================

function EmailCampaigns({ config, onUpdate }: { config: EmailTemplatesConfiguration; onUpdate: (config: EmailTemplatesConfiguration) => void }) {
  const [showForm, setShowForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<EmailCampaign | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'status' | 'createdAt'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'scheduled' | 'active' | 'paused' | 'completed'>('all');

  const campaigns = config.campaigns;
  const filteredCampaigns = campaigns
    .filter(campaign => {
      const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           campaign.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || campaign.status === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      
      if (sortBy === 'createdAt') {
        return sortOrder === 'asc' 
          ? new Date(aValue as Date).getTime() - new Date(bValue as Date).getTime()
          : new Date(bValue as Date).getTime() - new Date(aValue as Date).getTime();
      }
      
      const comparison = String(aValue).localeCompare(String(bValue));
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const handleSaveCampaign = (campaignData: Partial<EmailCampaign>) => {
    const updatedCampaigns = editingCampaign
      ? campaigns.map(c => c.id === editingCampaign.id ? { ...c, ...campaignData, updatedAt: new Date() } : c)
      : [...campaigns, {
          id: Date.now().toString(),
          ...campaignData,
          createdAt: new Date(),
          updatedAt: new Date()
        } as EmailCampaign];

    onUpdate({
      ...config,
      campaigns: updatedCampaigns
    });

    setShowForm(false);
    setEditingCampaign(undefined);
  };

  const handleDeleteCampaign = (campaignId: string) => {
    if (confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
      const updatedCampaigns = campaigns.filter(c => c.id !== campaignId);
      onUpdate({
        ...config,
        campaigns: updatedCampaigns
      });
    }
  };

  const handleToggleCampaign = (campaignId: string) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign) return;

    let newStatus: EmailCampaign['status'];
    switch (campaign.status) {
      case 'draft':
        newStatus = 'scheduled';
        break;
      case 'scheduled':
        newStatus = 'active';
        break;
      case 'active':
        newStatus = 'paused';
        break;
      case 'paused':
        newStatus = 'active';
        break;
      default:
        return;
    }

    const updatedCampaigns = campaigns.map(c => 
      c.id === campaignId ? { ...c, status: newStatus, updatedAt: new Date() } : c
    );
    onUpdate({
      ...config,
      campaigns: updatedCampaigns
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <DocumentTextIcon className="h-4 w-4" />;
      case 'scheduled': return <ClockIcon className="h-4 w-4" />;
      case 'active': return <PlayIcon className="h-4 w-4" />;
      case 'paused': return <PauseIcon className="h-4 w-4" />;
      case 'completed': return <CheckCircleIcon className="h-4 w-4" />;
      default: return <DocumentTextIcon className="h-4 w-4" />;
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Email Campaigns</h3>
          <p className="text-sm text-gray-500">Create and manage email marketing campaigns</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Campaign
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search campaigns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 w-full"
            />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm"
          >
            <option value="all">All</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm"
          >
            <option value="name">Name</option>
            <option value="status">Status</option>
            <option value="createdAt">Created</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <ArrowUpIcon className={`h-4 w-4 transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCampaigns.map((campaign) => {
          const template = config.templates.find(t => t.id === campaign.templateId);
          const layout = config.layouts.find(l => l.id === campaign.layoutId);
          
          return (
            <div key={campaign.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
              {/* Campaign Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-900 truncate">{campaign.name}</h4>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                    {getStatusIcon(campaign.status)}
                    <span className="ml-1 capitalize">{campaign.status}</span>
                  </span>
                </div>
                
                {campaign.description && (
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">{campaign.description}</p>
                )}
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Created: {formatDate(campaign.createdAt)}</span>
                  {campaign.scheduledAt && (
                    <span>Scheduled: {formatDate(campaign.scheduledAt)}</span>
                  )}
                </div>
              </div>
              
              {/* Campaign Details */}
              <div className="p-4">
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm">
                    <span className="text-gray-500 w-20">Template:</span>
                    <span className="text-gray-900">{template?.name || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="text-gray-500 w-20">Layout:</span>
                    <span className="text-gray-900">{layout?.name || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="text-gray-500 w-20">Audience:</span>
                    <span className="text-gray-900">{campaign.audienceSize?.toLocaleString() || '0'} contacts</span>
                  </div>
                </div>
                
                {/* Analytics */}
                {campaign.status !== 'draft' && (
                  <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-gray-50 rounded-md">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">{campaign.analytics?.sent || 0}</div>
                      <div className="text-xs text-gray-500">Sent</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">{campaign.analytics?.opened || 0}</div>
                      <div className="text-xs text-gray-500">Opened</div>
                    </div>
                  </div>
                )}
                
                {/* Actions */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleToggleCampaign(campaign.id)}
                    className={`flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-xs font-medium rounded-md ${
                      campaign.status === 'active' 
                        ? 'text-red-700 bg-red-50 hover:bg-red-100' 
                        : campaign.status === 'paused'
                        ? 'text-green-700 bg-green-50 hover:bg-green-100'
                        : 'text-blue-700 bg-blue-50 hover:bg-blue-100'
                    }`}
                  >
                    {campaign.status === 'active' ? (
                      <>
                        <PauseIcon className="h-3 w-3 mr-1" />
                        Pause
                      </>
                    ) : campaign.status === 'paused' ? (
                      <>
                        <PlayIcon className="h-3 w-3 mr-1" />
                        Resume
                      </>
                    ) : (
                      <>
                        <PlayIcon className="h-3 w-3 mr-1" />
                        Start
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setEditingCampaign(campaign);
                      setShowForm(true);
                    }}
                    className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-md"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCampaign(campaign.id)}
                    className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-md"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Campaign Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-5 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingCampaign ? 'Edit Email Campaign' : 'Create Email Campaign'}
              </h3>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleSaveCampaign({
                  name: formData.get('name') as string,
                  description: formData.get('description') as string,
                  templateId: formData.get('templateId') as string,
                  layoutId: formData.get('layoutId') as string,
                  audienceSize: parseInt(formData.get('audienceSize') as string) || 0,
                  scheduledAt: formData.get('scheduledAt') ? new Date(formData.get('scheduledAt') as string) : undefined,
                  status: formData.get('status') as any
                });
              }} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Campaign Name</label>
                    <input
                      type="text"
                      name="name"
                      defaultValue={editingCampaign?.name}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="e.g., Welcome Series Campaign"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                      name="status"
                      defaultValue={editingCampaign?.status || 'draft'}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                      <option value="draft">Draft</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="active">Active</option>
                      <option value="paused">Paused</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    name="description"
                    defaultValue={editingCampaign?.description}
                    rows={2}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="Optional description of this campaign"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email Template</label>
                    <select
                      name="templateId"
                      defaultValue={editingCampaign?.templateId}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                      <option value="">Select a template</option>
                      {config.templates.map(template => (
                        <option key={template.id} value={template.id}>{template.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email Layout</label>
                    <select
                      name="layoutId"
                      defaultValue={editingCampaign?.layoutId}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                      <option value="">Select a layout</option>
                      {config.layouts.map(layout => (
                        <option key={layout.id} value={layout.id}>{layout.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Audience Size</label>
                    <input
                      type="number"
                      name="audienceSize"
                      defaultValue={editingCampaign?.audienceSize || 0}
                      min="0"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="Number of contacts"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Schedule Date & Time</label>
                    <input
                      type="datetime-local"
                      name="scheduledAt"
                      defaultValue={editingCampaign?.scheduledAt ? new Date(editingCampaign.scheduledAt).toISOString().slice(0, 16) : ''}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                </div>

                {/* Campaign Preview */}
                {editingCampaign && (
                  <div className="border-t pt-6">
                    <h4 className="text-sm font-medium text-gray-900 mb-4">Campaign Preview</h4>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <div className="text-sm text-gray-600">
                        <p><strong>Template:</strong> {config.templates.find(t => t.id === editingCampaign.templateId)?.name || 'None'}</p>
                        <p><strong>Layout:</strong> {config.layouts.find(l => l.id === editingCampaign.layoutId)?.name || 'None'}</p>
                        <p><strong>Audience:</strong> {editingCampaign.audienceSize?.toLocaleString() || '0'} contacts</p>
                        {editingCampaign.scheduledAt && (
                          <p><strong>Scheduled:</strong> {formatDate(editingCampaign.scheduledAt)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-blue-50 p-4 rounded-md">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">Campaign Management</h4>
                  <p className="text-sm text-blue-700">
                    Campaigns can be scheduled for future delivery or started immediately. 
                    Use the status controls to manage campaign lifecycle: Draft → Scheduled → Active → Completed.
                  </p>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingCampaign(undefined);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    {editingCampaign ? 'Update Campaign' : 'Create Campaign'}
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

      // Mock variables data
      const mockVariables: EmailVariable[] = [
        {
          id: '1',
          name: 'first_name',
          label: 'First Name',
          description: 'The recipient\'s first name',
          type: 'text',
          defaultValue: 'Friend',
          isRequired: true,
          isActive: true,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-09-30')
        },
        {
          id: '2',
          name: 'last_name',
          label: 'Last Name',
          description: 'The recipient\'s last name',
          type: 'text',
          defaultValue: '',
          isRequired: false,
          isActive: true,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-09-30')
        },
        {
          id: '3',
          name: 'company_name',
          label: 'Company Name',
          description: 'The recipient\'s company name',
          type: 'text',
          defaultValue: 'Your Company',
          isRequired: false,
          isActive: true,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-09-30')
        },
        {
          id: '4',
          name: 'email_address',
          label: 'Email Address',
          description: 'The recipient\'s email address',
          type: 'email',
          defaultValue: '',
          isRequired: true,
          isActive: true,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-09-30')
        },
        {
          id: '5',
          name: 'phone_number',
          label: 'Phone Number',
          description: 'The recipient\'s phone number',
          type: 'phone',
          defaultValue: '',
          isRequired: false,
          isActive: true,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-09-30')
        },
        {
          id: '6',
          name: 'signup_date',
          label: 'Signup Date',
          description: 'The date when the user signed up',
          type: 'date',
          defaultValue: '',
          isRequired: false,
          isActive: true,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-09-30')
        },
        {
          id: '7',
          name: 'account_status',
          label: 'Account Status',
          description: 'The current status of the user\'s account',
          type: 'text',
          defaultValue: 'Active',
          isRequired: false,
          isActive: true,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-09-30')
        },
        {
          id: '8',
          name: 'website_url',
          label: 'Website URL',
          description: 'The company\'s website URL',
          type: 'url',
          defaultValue: '',
          isRequired: false,
          isActive: true,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-09-30')
        },
        {
          id: '9',
          name: 'is_premium',
          label: 'Premium User',
          description: 'Whether the user has a premium account',
          type: 'boolean',
          defaultValue: false,
          isRequired: false,
          isActive: true,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-09-30')
        },
        {
          id: '10',
          name: 'user_id',
          label: 'User ID',
          description: 'The unique identifier for the user',
          type: 'number',
          defaultValue: '',
          isRequired: false,
          isActive: true,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-09-30')
        }
      ];

      // Mock layouts data
      const mockLayouts: EmailLayout[] = [
        {
          id: '1',
          name: 'Default Layout',
          description: 'Simple and clean default layout for all email types',
          htmlStructure: `<div class="email-container">
  <header class="header">
    <h1>Your Company</h1>
  </header>
  <main class="content">
    {{content}}
  </main>
  <footer class="footer">
    <p>&copy; 2024 Your Company. All rights reserved.</p>
  </footer>
</div>`,
          cssStyles: `.email-container {
  max-width: 600px;
  margin: 0 auto;
  font-family: Arial, sans-serif;
  background: white;
}

.header {
  background: #3B82F6;
  color: white;
  padding: 20px;
  text-align: center;
}

.header h1 {
  margin: 0;
  font-size: 24px;
}

.content {
  padding: 20px;
  background: white;
  line-height: 1.6;
}

.footer {
  background: #F3F4F6;
  padding: 15px;
  text-align: center;
  font-size: 12px;
  color: #6B7280;
}

@media (max-width: 600px) {
  .email-container {
    width: 100% !important;
  }
  
  .header, .content, .footer {
    padding: 15px !important;
  }
}`,
          isActive: true,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-09-30')
        },
        {
          id: '2',
          name: 'Newsletter Layout',
          description: 'Professional newsletter layout with sidebar and multiple sections',
          htmlStructure: `<div class="newsletter-container">
  <header class="newsletter-header">
    <div class="logo-section">
      <h1>Newsletter</h1>
      <p class="tagline">Stay updated with our latest news</p>
    </div>
  </header>
  <div class="newsletter-body">
    <main class="main-content">
      {{content}}
    </main>
    <aside class="sidebar">
      <div class="sidebar-section">
        <h3>Quick Links</h3>
        <ul>
          <li><a href="#">About Us</a></li>
          <li><a href="#">Contact</a></li>
          <li><a href="#">Support</a></li>
        </ul>
      </div>
    </aside>
  </div>
  <footer class="newsletter-footer">
    <div class="footer-content">
      <p>&copy; 2024 Your Company</p>
      <div class="social-links">
        <a href="#">Facebook</a> | <a href="#">Twitter</a> | <a href="#">LinkedIn</a>
      </div>
    </div>
  </footer>
</div>`,
          cssStyles: `.newsletter-container {
  max-width: 800px;
  margin: 0 auto;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: white;
}

.newsletter-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 30px 20px;
  text-align: center;
}

.logo-section h1 {
  margin: 0 0 10px 0;
  font-size: 28px;
  font-weight: 300;
}

.tagline {
  margin: 0;
  font-size: 14px;
  opacity: 0.9;
}

.newsletter-body {
  display: flex;
  min-height: 400px;
}

.main-content {
  flex: 2;
  padding: 30px;
  background: white;
}

.sidebar {
  flex: 1;
  background: #F8F9FA;
  padding: 30px 20px;
  border-left: 1px solid #E9ECEF;
}

.sidebar-section h3 {
  margin: 0 0 15px 0;
  font-size: 16px;
  color: #495057;
}

.sidebar-section ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.sidebar-section li {
  margin-bottom: 8px;
}

.sidebar-section a {
  color: #007BFF;
  text-decoration: none;
  font-size: 14px;
}

.sidebar-section a:hover {
  text-decoration: underline;
}

.newsletter-footer {
  background: #343A40;
  color: white;
  padding: 20px;
}

.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.social-links a {
  color: #ADB5BD;
  text-decoration: none;
  margin: 0 5px;
}

@media (max-width: 768px) {
  .newsletter-body {
    flex-direction: column;
  }
  
  .sidebar {
    border-left: none;
    border-top: 1px solid #E9ECEF;
  }
  
  .footer-content {
    flex-direction: column;
    text-align: center;
    gap: 10px;
  }
}`,
          isActive: true,
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-09-30')
        },
        {
          id: '3',
          name: 'Minimal Layout',
          description: 'Clean and minimal layout for transactional emails',
          htmlStructure: `<div class="minimal-container">
  <div class="minimal-content">
    {{content}}
  </div>
  <div class="minimal-footer">
    <p>This email was sent by Your Company</p>
  </div>
</div>`,
          cssStyles: `.minimal-container {
  max-width: 500px;
  margin: 0 auto;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: white;
}

.minimal-content {
  padding: 40px 30px;
  background: white;
  line-height: 1.6;
  color: #333;
}

.minimal-footer {
  padding: 20px 30px;
  background: #FAFAFA;
  text-align: center;
  font-size: 12px;
  color: #666;
  border-top: 1px solid #EEE;
}

@media (max-width: 500px) {
  .minimal-container {
    width: 100%;
  }
  
  .minimal-content, .minimal-footer {
    padding: 20px 15px;
  }
}`,
          isActive: true,
          createdAt: new Date('2024-02-01'),
          updatedAt: new Date('2024-09-30')
        },
        {
          id: '4',
          name: 'Corporate Layout',
          description: 'Professional corporate layout with branding elements',
          htmlStructure: `<div class="corporate-container">
  <header class="corporate-header">
    <div class="brand-section">
      <div class="logo">LOGO</div>
      <div class="company-info">
        <h1>Your Company Name</h1>
        <p class="company-tagline">Professional Solutions</p>
      </div>
    </div>
  </header>
  <main class="corporate-content">
    {{content}}
  </main>
  <footer class="corporate-footer">
    <div class="footer-section">
      <div class="contact-info">
        <h4>Contact Information</h4>
        <p>Email: info@yourcompany.com</p>
        <p>Phone: (555) 123-4567</p>
        <p>Address: 123 Business St, City, State 12345</p>
      </div>
      <div class="legal-info">
        <p>&copy; 2024 Your Company Name. All rights reserved.</p>
        <p><a href="#">Privacy Policy</a> | <a href="#">Terms of Service</a></p>
      </div>
    </div>
  </footer>
</div>`,
          cssStyles: `.corporate-container {
  max-width: 700px;
  margin: 0 auto;
  font-family: 'Times New Roman', serif;
  background: white;
  border: 1px solid #DDD;
}

.corporate-header {
  background: #1A365D;
  color: white;
  padding: 25px;
}

.brand-section {
  display: flex;
  align-items: center;
  gap: 20px;
}

.logo {
  width: 60px;
  height: 60px;
  background: white;
  color: #1A365D;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 18px;
}

.company-info h1 {
  margin: 0 0 5px 0;
  font-size: 24px;
  font-weight: normal;
}

.company-tagline {
  margin: 0;
  font-size: 14px;
  opacity: 0.8;
}

.corporate-content {
  padding: 35px 25px;
  background: white;
  line-height: 1.7;
  color: #2D3748;
}

.corporate-footer {
  background: #F7FAFC;
  padding: 25px;
  border-top: 2px solid #E2E8F0;
}

.footer-section {
  display: flex;
  justify-content: space-between;
  gap: 30px;
}

.contact-info h4 {
  margin: 0 0 15px 0;
  font-size: 16px;
  color: #2D3748;
}

.contact-info p {
  margin: 5px 0;
  font-size: 14px;
  color: #4A5568;
}

.legal-info {
  text-align: right;
}

.legal-info p {
  margin: 5px 0;
  font-size: 12px;
  color: #718096;
}

.legal-info a {
  color: #3182CE;
  text-decoration: none;
}

@media (max-width: 600px) {
  .brand-section {
    flex-direction: column;
    text-align: center;
  }
  
  .footer-section {
    flex-direction: column;
    text-align: center;
  }
  
  .legal-info {
    text-align: center;
  }
}`,
          isActive: true,
          createdAt: new Date('2024-02-15'),
          updatedAt: new Date('2024-09-30')
        }
      ];

      // Mock campaigns data
      const mockCampaigns: EmailCampaign[] = [
        {
          id: '1',
          name: 'Welcome Series Campaign',
          description: 'Automated welcome email sequence for new users',
          templateId: '1',
          layoutId: '1',
          audienceSize: 1250,
          scheduledAt: new Date('2024-10-01T09:00:00'),
          status: 'scheduled',
          analytics: {
            sent: 0,
            delivered: 0,
            opened: 0,
            clicked: 0,
            bounced: 0,
            unsubscribed: 0
          },
          createdAt: new Date('2024-09-25'),
          updatedAt: new Date('2024-09-30')
        },
        {
          id: '2',
          name: 'Monthly Newsletter',
          description: 'Monthly product updates and company news',
          templateId: '2',
          layoutId: '2',
          audienceSize: 3400,
          scheduledAt: new Date('2024-10-15T10:00:00'),
          status: 'active',
          analytics: {
            sent: 3400,
            delivered: 3380,
            opened: 1020,
            clicked: 204,
            bounced: 20,
            unsubscribed: 5
          },
          createdAt: new Date('2024-09-01'),
          updatedAt: new Date('2024-09-30')
        },
        {
          id: '3',
          name: 'Product Launch Announcement',
          description: 'Exciting new product launch announcement',
          templateId: '1',
          layoutId: '4',
          audienceSize: 5000,
          scheduledAt: new Date('2024-10-05T14:00:00'),
          status: 'draft',
          analytics: {
            sent: 0,
            delivered: 0,
            opened: 0,
            clicked: 0,
            bounced: 0,
            unsubscribed: 0
          },
          createdAt: new Date('2024-09-28'),
          updatedAt: new Date('2024-09-30')
        },
        {
          id: '4',
          name: 'Holiday Sale Campaign',
          description: 'Black Friday and holiday season promotion',
          templateId: '2',
          layoutId: '3',
          audienceSize: 2800,
          scheduledAt: new Date('2024-11-24T08:00:00'),
          status: 'paused',
          analytics: {
            sent: 1500,
            delivered: 1485,
            opened: 445,
            clicked: 89,
            bounced: 15,
            unsubscribed: 2
          },
          createdAt: new Date('2024-09-15'),
          updatedAt: new Date('2024-09-30')
        },
        {
          id: '5',
          name: 'Customer Feedback Survey',
          description: 'Request feedback from recent customers',
          templateId: '1',
          layoutId: '3',
          audienceSize: 750,
          scheduledAt: new Date('2024-09-20T11:00:00'),
          status: 'completed',
          analytics: {
            sent: 750,
            delivered: 745,
            opened: 298,
            clicked: 149,
            bounced: 5,
            unsubscribed: 1
          },
          createdAt: new Date('2024-09-10'),
          updatedAt: new Date('2024-09-25')
        },
        {
          id: '6',
          name: 'Re-engagement Campaign',
          description: 'Win back inactive subscribers',
          templateId: '2',
          layoutId: '1',
          audienceSize: 1200,
          scheduledAt: new Date('2024-10-10T16:00:00'),
          status: 'active',
          analytics: {
            sent: 1200,
            delivered: 1180,
            opened: 236,
            clicked: 47,
            bounced: 20,
            unsubscribed: 8
          },
          createdAt: new Date('2024-09-20'),
          updatedAt: new Date('2024-09-30')
        }
      ];
      
      setConfig({
        ...config,
        templates: mockTemplates,
        categories: mockCategories,
        variables: mockVariables,
        layouts: mockLayouts,
        campaigns: mockCampaigns
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
          <EmailVariables config={config} onUpdate={handleConfigUpdate} />
        )}
        {activeTab === 'layouts' && (
          <EmailLayouts config={config} onUpdate={handleConfigUpdate} />
        )}
        {activeTab === 'campaigns' && (
          <EmailCampaigns config={config} onUpdate={handleConfigUpdate} />
        )}
      </div>
    </div>
  );
}
