// Administration Module - Form Designer Interface
// Visual form builder and designer

'use client';

import React, { useState, useEffect } from 'react';
import { ;
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
  PaintBrushIcon
} from '@heroicons/react/24/outline';
import { getSupabaseClient } from '@/lib/supabase-client';
import { z } from 'zod';

const supabase = getSupabaseClient();

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface FormDesignerConfiguration {
  forms: CustomForm[];
  templates: FormTemplate[];
  components: FormComponent[];
  layouts: FormLayout[];
}

interface CustomForm {
  id: string;
  name: string;
  description?: string;
  entityType: 'lead' | 'contact' | 'company' | 'opportunity' | 'activity' | 'user' | 'organization';
  layout: FormLayout;
  sections: FormSection[];
  validation: FormValidation;
  styling: FormStyling;
  isActive: boolean;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface FormTemplate {
  id: string;
  name: string;
  description?: string;
  category: 'lead_capture' | 'contact_form' | 'survey' | 'registration' | 'feedback' | 'custom';
  entityType: string;
  sections: FormSection[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface FormSection {
  id: string;
  name: string;
  title?: string;
  description?: string;
  fields: FormField[];
  layout: SectionLayout;
  styling: SectionStyling;
  isCollapsible: boolean;
  isRequired: boolean;
  displayOrder: number;
}

interface FormField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'phone' | 'date' | 'datetime' | 'boolean' | 'select' | 'multiselect' | 'textarea' | 'file' | 'url' | 'currency' | 'percentage';
  placeholder?: string;
  helpText?: string;
  isRequired: boolean;
  isReadOnly: boolean;
  defaultValue?: any;
  options?: FieldOption[];
  validation: FieldValidationRule[];
  styling: FieldStyling;
  displayOrder: number;
}

interface FormLayout {
  id: string;
  name: string;
  type: 'single_column' | 'two_column' | 'three_column' | 'mixed' | 'custom';
  columns: number;
  spacing: 'compact' | 'normal' | 'spacious';
  alignment: 'left' | 'center' | 'right';
}

interface SectionLayout {
  columns: number;
  spacing: 'compact' | 'normal' | 'spacious';
  alignment: 'left' | 'center' | 'right';
}

interface FormStyling {
  theme: 'default' | 'modern' | 'minimal' | 'corporate' | 'custom';
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  borderRadius: number;
  fontFamily: string;
  fontSize: 'small' | 'medium' | 'large';
  customCSS?: string;
}

interface SectionStyling {
  backgroundColor?: string;
  borderColor?: string;
  borderRadius?: number;
  padding?: number;
  margin?: number;
}

interface FieldStyling {
  width?: 'full' | 'half' | 'third' | 'quarter';
  height?: number;
  backgroundColor?: string;
  borderColor?: string;
  borderRadius?: number;
  customCSS?: string;
}

interface FormValidation {
  rules: ValidationRule[];
  errorMessages: Record<string, string>;
  showErrorsInline: boolean;
}

interface ValidationRule {
  fieldId: string;
  type: 'required' | 'min_length' | 'max_length' | 'min_value' | 'max_value' | 'pattern' | 'custom';
  value?: any;
  message: string;
}

interface FieldOption {
  value: string;
  label: string;
  description?: string;
  isDefault?: boolean;
  color?: string;
}

interface FieldValidationRule {
  type: 'required' | 'min_length' | 'max_length' | 'min_value' | 'max_value' | 'pattern' | 'custom';
  value?: any;
  message: string;
  isActive: boolean;
}

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const CustomFormSchema = z.object({
  name: z.string().min(1, 'Form name is required'),
  description: z.string().optional(),
  entityType: z.enum(['lead', 'contact', 'company', 'opportunity', 'activity', 'user', 'organization']),
  isActive: z.boolean(),
  isPublic: z.boolean()
});

const FormTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  description: z.string().optional(),
  category: z.enum(['lead_capture', 'contact_form', 'survey', 'registration', 'feedback', 'custom']),
  entityType: z.string().min(1, 'Entity type is required'),
  isActive: z.boolean()
});

// =============================================================================
// FORM DESIGNER COMPONENT
// =============================================================================

function FormDesigner({ config, onUpdate }: { config: FormDesignerConfiguration; onUpdate: (config: FormDesignerConfiguration) => void }) {
  const [forms, setForms] = useState<CustomForm[]>(config.forms);
  const [showForm, setShowForm] = useState(false);
  const [editingForm, setEditingForm] = useState<CustomForm | undefined>();

  const entityTypes = [
    { value: 'lead', label: 'Lead', color: 'bg-blue-100 text-blue-800' },
    { value: 'contact', label: 'Contact', color: 'bg-green-100 text-green-800' },
    { value: 'company', label: 'Company', color: 'bg-purple-100 text-purple-800' },
    { value: 'opportunity', label: 'Opportunity', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'activity', label: 'Activity', color: 'bg-red-100 text-red-800' },
    { value: 'user', label: 'User', color: 'bg-indigo-100 text-indigo-800' },
    { value: 'organization', label: 'Organization', color: 'bg-gray-100 text-gray-800' }
  ];

  const handleSaveForm = (formData: Partial<CustomForm>) => {
    try {
      const validatedData = CustomFormSchema.parse(formData);
      
      if (editingForm) {
        const updatedForms = forms.map(f => 
          f.id === editingForm.id 
            ? { ...f, ...validatedData, id: editingForm.id, updatedAt: new Date() }
            : f
        );
        setForms(updatedForms);
      } else {
        const newForm: CustomForm = {
          id: Date.now().toString(),
          ...validatedData,
          layout: {
            id: '1',
            name: 'Default Layout',
            type: 'single_column',
            columns: 1,
            spacing: 'normal',
            alignment: 'left'
          },
          sections: [],
          validation: {
            rules: [],
            errorMessages: {},
            showErrorsInline: true
          },
          styling: {
            theme: 'default',
            primaryColor: '#3B82F6',
            secondaryColor: '#6B7280',
            backgroundColor: '#FFFFFF',
            textColor: '#111827',
            borderColor: '#D1D5DB',
            borderRadius: 6,
            fontFamily: 'Inter',
            fontSize: 'medium'
          },
          createdAt: new Date(),
          updatedAt: new Date()
        };
        setForms([...forms, newForm]);
      }
      
      setShowForm(false);
      setEditingForm(undefined);
      
      onUpdate({
        ...config,
        forms,
        templates: config.templates,
        components: config.components,
        layouts: config.layouts
      });
    } catch (error) {
      console.error('Error saving form:', error);
    }
  };

  const handleDeleteForm = (formId: string) => {
    setForms(forms.filter(f => f.id !== formId));
    onUpdate({
      ...config,
      forms: forms.filter(f => f.id !== formId),
      templates: config.templates,
      components: config.components,
      layouts: config.layouts
    });
  };

  const handleToggleForm = (formId: string) => {
    const updatedForms = forms.map(f => 
      f.id === formId ? { ...f, isActive: !f.isActive, updatedAt: new Date() } : f
    );
    setForms(updatedForms);
    onUpdate({
      ...config,
      forms: updatedForms,
      templates: config.templates,
      components: config.components,
      layouts: config.layouts
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Form Designer</h3>
          <p className="text-sm text-gray-500">Create and customize forms with drag-and-drop interface</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Form
        </button>
      </div>

      {/* Forms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {forms.map((form) => {
          const entityType = entityTypes.find(e => e.value === form.entityType);
          
          return (
            <div key={form.id} className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{form.name}</h4>
                  {form.description && (
                    <p className="text-xs text-gray-500 mt-1">{form.description}</p>
                  )}
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => {
                      setEditingForm(form);
                      setShowForm(true);
                    }}
                    className="text-blue-600 hover:text-blue-900"
                    title="Edit form"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleToggleForm(form.id)}
                    className={form.isActive ? "text-red-600 hover:text-red-900" : "text-green-600 hover:text-green-900"}
                    title={form.isActive ? "Deactivate form" : "Activate form"}
                  >
                    {form.isActive ? <XCircleIcon className="h-4 w-4" /> : <CheckCircleIcon className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => handleDeleteForm(form.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Entity Type</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${entityType?.color}`}>
                    {entityType?.label}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Sections</span>
                  <span className="text-xs text-gray-900">{form.sections.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Layout</span>
                  <span className="text-xs text-gray-900">{form.layout.type}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Status</span>
                  <span className={`text-xs ${form.isActive ? 'text-green-600' : 'text-red-600'}`}>
                    {form.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Public</span>
                  <span className={`text-xs ${form.isPublic ? 'text-green-600' : 'text-gray-600'}`}>
                    {form.isPublic ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Form Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-4/5 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingForm ? 'Edit Form' : 'Create Form'}
              </h3>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleSaveForm({
                  name: formData.get('name') as string,
                  description: formData.get('description') as string,
                  entityType: formData.get('entityType') as any,
                  isActive: formData.get('isActive') === 'on',
                  isPublic: formData.get('isPublic') === 'on'
                });
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Form Name</label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingForm?.name}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    name="description"
                    defaultValue={editingForm?.description}
                    rows={2}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Entity Type</label>
                  <select
                    name="entityType"
                    defaultValue={editingForm?.entityType}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    {entityTypes.map(entity => (
                      <option key={entity.value} value={entity.value}>{entity.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="isActive"
                      defaultChecked={editingForm?.isActive}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700">Active form</label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="isPublic"
                      defaultChecked={editingForm?.isPublic}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700">Public form</label>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-md">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">Form Designer</h4>
                  <p className="text-sm text-blue-700">
                    After creating the form, you'll be able to use the visual form designer to add sections, 
                    fields, and customize the layout and styling.
                  </p>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingForm(undefined);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    {editingForm ? 'Update Form' : 'Create Form'}
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
// FORM TEMPLATES COMPONENT
// =============================================================================

function FormTemplates({ config, onUpdate }: { config: FormDesignerConfiguration; onUpdate: (config: FormDesignerConfiguration) => void }) {
  const [templates, setTemplates] = useState<FormTemplate[]>(config.templates);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<FormTemplate | undefined>();

  const categories = [
    { value: 'lead_capture', label: 'Lead Capture', color: 'bg-blue-100 text-blue-800' },
    { value: 'contact_form', label: 'Contact Form', color: 'bg-green-100 text-green-800' },
    { value: 'survey', label: 'Survey', color: 'bg-purple-100 text-purple-800' },
    { value: 'registration', label: 'Registration', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'feedback', label: 'Feedback', color: 'bg-red-100 text-red-800' },
    { value: 'custom', label: 'Custom', color: 'bg-gray-100 text-gray-800' }
  ];

  const handleSaveTemplate = (templateData: Partial<FormTemplate>) => {
    try {
      const validatedData = FormTemplateSchema.parse(templateData);
      
      if (editingTemplate) {
        const updatedTemplates = templates.map(t => 
          t.id === editingTemplate.id 
            ? { ...t, ...validatedData, id: editingTemplate.id, updatedAt: new Date() }
            : t
        );
        setTemplates(updatedTemplates);
      } else {
        const newTemplate: FormTemplate = {
          id: Date.now().toString(),
          ...validatedData,
          sections: [],
          createdAt: new Date(),
          updatedAt: new Date()
        };
        setTemplates([...templates, newTemplate]);
      }
      
      setShowForm(false);
      setEditingTemplate(undefined);
      
      onUpdate({
        ...config,
        forms: config.forms,
        templates,
        components: config.components,
        layouts: config.layouts
      });
    } catch (error) {
      console.error('Error saving form template:', error);
    }
  };

  const handleDeleteTemplate = (templateId: string) => {
    setTemplates(templates.filter(t => t.id !== templateId));
    onUpdate({
      ...config,
      forms: config.forms,
      templates: templates.filter(t => t.id !== templateId),
      components: config.components,
      layouts: config.layouts
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Form Templates</h3>
          <p className="text-sm text-gray-500">Pre-built form templates for common use cases</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Template
        </button>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => {
          const category = categories.find(c => c.value === template.category);
          
          return (
            <div key={template.id} className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{template.name}</h4>
                  {template.description && (
                    <p className="text-xs text-gray-500 mt-1">{template.description}</p>
                  )}
                </div>
                <div className="flex items-center space-x-1">
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
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Category</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${category?.color}`}>
                    {category?.label}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Entity Type</span>
                  <span className="text-xs text-gray-900">{template.entityType}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Sections</span>
                  <span className="text-xs text-gray-900">{template.sections.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Status</span>
                  <span className={`text-xs ${template.isActive ? 'text-green-600' : 'text-red-600'}`}>
                    {template.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Template Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingTemplate ? 'Edit Form Template' : 'Create Form Template'}
              </h3>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleSaveTemplate({
                  name: formData.get('name') as string,
                  description: formData.get('description') as string,
                  category: formData.get('category') as any,
                  entityType: formData.get('entityType') as string,
                  isActive: true
                });
              }} className="space-y-4">
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
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    name="description"
                    defaultValue={editingTemplate?.description}
                    rows={2}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Entity Type</label>
                    <input
                      type="text"
                      name="entityType"
                      defaultValue={editingTemplate?.entityType}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
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
// MAIN FORM DESIGNER COMPONENT
// =============================================================================

export default function FormDesignerManagement() {
  const [config, setConfig] = useState<FormDesignerConfiguration>({
    forms: [],
    templates: [],
    components: [],
    layouts: []
  });

  const [activeTab, setActiveTab] = useState('forms');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Mock forms data
      const mockForms: CustomForm[] = [
        {
          id: '1',
          name: 'Lead Capture Form',
          description: 'Standard lead capture form with contact information',
          entityType: 'lead',
          layout: {
            id: '1',
            name: 'Single Column',
            type: 'single_column',
            columns: 1,
            spacing: 'normal',
            alignment: 'left'
          },
          sections: [],
          validation: {
            rules: [],
            errorMessages: {},
            showErrorsInline: true
          },
          styling: {
            theme: 'modern',
            primaryColor: '#3B82F6',
            secondaryColor: '#6B7280',
            backgroundColor: '#FFFFFF',
            textColor: '#111827',
            borderColor: '#D1D5DB',
            borderRadius: 8,
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
          name: 'Contact Information Form',
          description: 'Detailed contact information form',
          entityType: 'contact',
          layout: {
            id: '2',
            name: 'Two Column',
            type: 'two_column',
            columns: 2,
            spacing: 'normal',
            alignment: 'left'
          },
          sections: [],
          validation: {
            rules: [],
            errorMessages: {},
            showErrorsInline: true
          },
          styling: {
            theme: 'corporate',
            primaryColor: '#059669',
            secondaryColor: '#6B7280',
            backgroundColor: '#FFFFFF',
            textColor: '#111827',
            borderColor: '#D1D5DB',
            borderRadius: 6,
            fontFamily: 'Inter',
            fontSize: 'medium'
          },
          isActive: true,
          isPublic: false,
          createdAt: new Date('2024-02-01'),
          updatedAt: new Date('2024-09-30')
        }
      ];

      // Mock templates data
      const mockTemplates: FormTemplate[] = [
        {
          id: '1',
          name: 'Basic Lead Form',
          description: 'Simple lead capture form with essential fields',
          category: 'lead_capture',
          entityType: 'lead',
          sections: [],
          isActive: true,
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-09-30')
        },
        {
          id: '2',
          name: 'Customer Survey',
          description: 'Comprehensive customer satisfaction survey',
          category: 'survey',
          entityType: 'contact',
          sections: [],
          isActive: true,
          createdAt: new Date('2024-02-01'),
          updatedAt: new Date('2024-09-30')
        }
      ];
      
      setConfig({
        ...config,
        forms: mockForms,
        templates: mockTemplates
      });
    } catch (error) {
      console.error('Error loading form designer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigUpdate = (updatedConfig: FormDesignerConfiguration) => {
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
    { id: 'forms', name: 'Forms', icon: RectangleStackIcon },
    { id: 'templates', name: 'Templates', icon: DocumentTextIcon },
    { id: 'components', name: 'Components', icon: Squares2X2Icon },
    { id: 'layouts', name: 'Layouts', icon: AdjustmentsHorizontalIcon },
    { id: 'styling', name: 'Styling', icon: PaintBrushIcon }
  ];

  const activeForms = config.forms.filter(f => f.isActive).length;
  const totalForms = config.forms.length;
  const activeTemplates = config.templates.filter(t => t.isActive).length;
  const totalTemplates = config.templates.length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Form Designer</h1>
        <p className="mt-1 text-sm text-gray-500">
          Create and customize forms with drag-and-drop interface and templates
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <RectangleStackIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Active Forms</p>
              <p className="text-2xl font-semibold text-gray-900">{activeForms}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <DocumentTextIcon className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Forms</p>
              <p className="text-2xl font-semibold text-gray-900">{totalForms}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <DocumentTextIcon className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Templates</p>
              <p className="text-2xl font-semibold text-gray-900">{activeTemplates}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <Squares2X2Icon className="h-8 w-8 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Components</p>
              <p className="text-2xl font-semibold text-gray-900">{config.components.length}</p>
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
        {activeTab === 'forms' && (
          <FormDesigner config={config} onUpdate={handleConfigUpdate} />
        )}
        {activeTab === 'templates' && (
          <FormTemplates config={config} onUpdate={handleConfigUpdate} />
        )}
        {activeTab === 'components' && (
          <div className="text-center py-12">
            <Squares2X2Icon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Form Components</h3>
            <p className="text-gray-500">Component library management coming soon...</p>
          </div>
        )}
        {activeTab === 'layouts' && (
          <div className="text-center py-12">
            <AdjustmentsHorizontalIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Form Layouts</h3>
            <p className="text-gray-500">Layout management coming soon...</p>
          </div>
        )}
        {activeTab === 'styling' && (
          <div className="text-center py-12">
            <PaintBrushIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Form Styling</h3>
            <p className="text-gray-500">Styling customization coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
}
