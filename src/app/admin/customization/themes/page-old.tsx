// Administration Module - Theme Customizer Interface
// Simple and effective theme switching

'use client';

import React from 'react';
import ThemeSelector from '@/components/admin/ThemeSelector';

export default function ThemesPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Theme Customization</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Customize the appearance of your FulQrun platform
        </p>
      </div>

      {/* Theme Selector */}
      <div className="bg-card rounded-lg border border-border p-6">
        <ThemeSelector />
      </div>

      {/* Theme Information */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h2 className="text-lg font-semibold text-foreground mb-3">Theme Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h3 className="font-medium text-foreground mb-2">✨ Available Themes</h3>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Light - Clean and bright interface</li>
              <li>• Dark - Easy on the eyes</li>
              <li>• Ocean Blue - Professional blue tones</li>
              <li>• Royal Purple - Elegant purple scheme</li>
              <li>• Forest Green - Nature-inspired colors</li>
              <li>• Sunset Orange - Warm and energetic</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-foreground mb-2">🎯 Features</h3>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Instant theme switching</li>
              <li>• Automatic persistence</li>
              <li>• Responsive design support</li>
              <li>• Accessible color contrast</li>
              <li>• Consistent across all pages</li>
              <li>• Mobile-optimized themes</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

const supabase = getSupabaseClient();

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface ThemeCustomizerConfiguration {
  themes: Theme[];
  colorSchemes: ColorScheme[];
  typography: TypographySettings[];
  layouts: LayoutSettings[];
  components: ComponentSettings[];
}

interface Theme {
  id: string;
  name: string;
  description?: string;
  category: 'light' | 'dark' | 'auto' | 'custom';
  colorScheme: ColorScheme;
  typography: TypographySettings;
  layout: LayoutSettings;
  components: ComponentSettings;
  isActive: boolean;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ColorScheme {
  id: string;
  name: string;
  description?: string;
  primary: ColorPalette;
  secondary: ColorPalette;
  neutral: ColorPalette;
  semantic: SemanticColors;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ColorPalette {
  base: string;
  light: string;
  lighter: string;
  dark: string;
  darker: string;
}

interface SemanticColors {
  success: string;
  warning: string;
  error: string;
  info: string;
}

interface TypographySettings {
  id: string;
  name: string;
  description?: string;
  fontFamily: FontFamily;
  fontSize: FontSize;
  fontWeight: FontWeight;
  lineHeight: LineHeight;
  letterSpacing: LetterSpacing;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface FontFamily {
  primary: string;
  secondary: string;
  mono: string;
}

interface FontSize {
  xs: string;
  sm: string;
  base: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
}

interface FontWeight {
  light: number;
  normal: number;
  medium: number;
  semibold: number;
  bold: number;
}

interface LineHeight {
  tight: number;
  normal: number;
  relaxed: number;
}

interface LetterSpacing {
  tight: string;
  normal: string;
  wide: string;
}

interface LayoutSettings {
  id: string;
  name: string;
  description?: string;
  spacing: SpacingSettings;
  borders: BorderSettings;
  shadows: ShadowSettings;
  animations: AnimationSettings;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface SpacingSettings {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
}

interface BorderSettings {
  radius: BorderRadius;
  width: BorderWidth;
  style: BorderStyle;
}

interface BorderRadius {
  none: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  full: string;
}

interface BorderWidth {
  none: string;
  thin: string;
  medium: string;
  thick: string;
}

interface BorderStyle {
  solid: string;
  dashed: string;
  dotted: string;
}

interface ShadowSettings {
  sm: string;
  md: string;
  lg: string;
  xl: string;
}

interface AnimationSettings {
  duration: AnimationDuration;
  easing: AnimationEasing;
  enabled: boolean;
}

interface AnimationDuration {
  fast: string;
  normal: string;
  slow: string;
}

interface AnimationEasing {
  linear: string;
  easeIn: string;
  easeOut: string;
  easeInOut: string;
}

interface ComponentSettings {
  id: string;
  name: string;
  description?: string;
  button: ButtonSettings;
  input: InputSettings;
  card: CardSettings;
  modal: ModalSettings;
  navigation: NavigationSettings;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ButtonSettings {
  variant: 'primary' | 'secondary' | 'outline' | 'ghost';
  size: 'sm' | 'md' | 'lg';
  borderRadius: string;
  padding: string;
  fontSize: string;
  fontWeight: string;
}

interface InputSettings {
  variant: 'default' | 'filled' | 'outlined';
  size: 'sm' | 'md' | 'lg';
  borderRadius: string;
  padding: string;
  fontSize: string;
  borderColor: string;
  focusColor: string;
}

interface CardSettings {
  variant: 'default' | 'elevated' | 'outlined';
  borderRadius: string;
  padding: string;
  shadow: string;
  backgroundColor: string;
  borderColor: string;
}

interface ModalSettings {
  variant: 'default' | 'centered' | 'fullscreen';
  borderRadius: string;
  padding: string;
  shadow: string;
  backgroundColor: string;
  backdropBlur: boolean;
}

interface NavigationSettings {
  variant: 'horizontal' | 'vertical' | 'sidebar';
  height: string;
  backgroundColor: string;
  textColor: string;
  activeColor: string;
  hoverColor: string;
}

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const ThemeSchema = z.object({
  name: z.string().min(1, 'Theme name is required'),
  description: z.string().optional(),
  category: z.enum(['light', 'dark', 'auto', 'custom']),
  isActive: z.boolean(),
  isDefault: z.boolean()
});

const ColorSchemeSchema = z.object({
  name: z.string().min(1, 'Color scheme name is required'),
  description: z.string().optional(),
  isActive: z.boolean()
});

// =============================================================================
// THEME CUSTOMIZER COMPONENT
// =============================================================================

function ThemeCustomizer({ config, onUpdate }: { config: ThemeCustomizerConfiguration; onUpdate: (config: ThemeCustomizerConfiguration) => void }) {
  const [themes, setThemes] = useState<Theme[]>(config.themes);
  const [showForm, setShowForm] = useState(false);
  const [editingTheme, setEditingTheme] = useState<Theme | undefined>();

  const categories = [
    { value: 'light', label: 'Light Theme', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'dark', label: 'Dark Theme', color: 'bg-gray-100 text-gray-800' },
    { value: 'auto', label: 'Auto Theme', color: 'bg-blue-100 text-blue-800' },
    { value: 'custom', label: 'Custom Theme', color: 'bg-purple-100 text-purple-800' }
  ];

  const handleSaveTheme = (themeData: Partial<Theme>) => {
    try {
      const validatedData = ThemeSchema.parse(themeData);
      
      if (editingTheme) {
        const updatedThemes = themes.map(t => 
          t.id === editingTheme.id 
            ? { ...t, ...validatedData, id: editingTheme.id, updatedAt: new Date() }
            : t
        );
        setThemes(updatedThemes);
      } else {
        const newTheme: Theme = {
          id: Date.now().toString(),
          ...validatedData,
          colorScheme: {
            id: '1',
            name: 'Default Colors',
            primary: {
              base: '#3B82F6',
              light: '#60A5FA',
              lighter: '#93C5FD',
              dark: '#2563EB',
              darker: '#1D4ED8'
            },
            secondary: {
              base: '#6B7280',
              light: '#9CA3AF',
              lighter: '#D1D5DB',
              dark: '#4B5563',
              darker: '#374151'
            },
            neutral: {
              base: '#FFFFFF',
              light: '#F9FAFB',
              lighter: '#F3F4F6',
              dark: '#111827',
              darker: '#000000'
            },
            semantic: {
              success: '#10B981',
              warning: '#F59E0B',
              error: '#EF4444',
              info: '#3B82F6'
            },
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          typography: {
            id: '1',
            name: 'Default Typography',
            fontFamily: {
              primary: 'Inter',
              secondary: 'Inter',
              mono: 'JetBrains Mono'
            },
            fontSize: {
              xs: '0.75rem',
              sm: '0.875rem',
              base: '1rem',
              lg: '1.125rem',
              xl: '1.25rem',
              '2xl': '1.5rem',
              '3xl': '1.875rem'
            },
            fontWeight: {
              light: 300,
              normal: 400,
              medium: 500,
              semibold: 600,
              bold: 700
            },
            lineHeight: {
              tight: 1.25,
              normal: 1.5,
              relaxed: 1.75
            },
            letterSpacing: {
              tight: '-0.025em',
              normal: '0em',
              wide: '0.025em'
            },
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          layout: {
            id: '1',
            name: 'Default Layout',
            spacing: {
              xs: '0.25rem',
              sm: '0.5rem',
              md: '1rem',
              lg: '1.5rem',
              xl: '2rem',
              '2xl': '3rem'
            },
            borders: {
              radius: {
                none: '0px',
                sm: '0.125rem',
                md: '0.375rem',
                lg: '0.5rem',
                xl: '0.75rem',
                full: '9999px'
              },
              width: {
                none: '0px',
                thin: '1px',
                medium: '2px',
                thick: '4px'
              },
              style: {
                solid: 'solid',
                dashed: 'dashed',
                dotted: 'dotted'
              }
            },
            shadows: {
              sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
              md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
              xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
            },
            animations: {
              duration: {
                fast: '150ms',
                normal: '300ms',
                slow: '500ms'
              },
              easing: {
                linear: 'linear',
                easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
                easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
                easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)'
              },
              enabled: true
            },
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          components: {
            id: '1',
            name: 'Default Components',
            button: {
              variant: 'primary',
              size: 'md',
              borderRadius: '0.375rem',
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              fontWeight: '500'
            },
            input: {
              variant: 'default',
              size: 'md',
              borderRadius: '0.375rem',
              padding: '0.5rem 0.75rem',
              fontSize: '0.875rem',
              borderColor: '#D1D5DB',
              focusColor: '#3B82F6'
            },
            card: {
              variant: 'default',
              borderRadius: '0.5rem',
              padding: '1.5rem',
              shadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
              backgroundColor: '#FFFFFF',
              borderColor: '#E5E7EB'
            },
            modal: {
              variant: 'default',
              borderRadius: '0.5rem',
              padding: '1.5rem',
              shadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
              backgroundColor: '#FFFFFF',
              backdropBlur: true
            },
            navigation: {
              variant: 'horizontal',
              height: '4rem',
              backgroundColor: '#FFFFFF',
              textColor: '#374151',
              activeColor: '#3B82F6',
              hoverColor: '#F3F4F6'
            },
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          createdAt: new Date(),
          updatedAt: new Date()
        };
        setThemes([...themes, newTheme]);
      }
      
      setShowForm(false);
      setEditingTheme(undefined);
      
      onUpdate({
        ...config,
        themes,
        colorSchemes: config.colorSchemes,
        typography: config.typography,
        layouts: config.layouts,
        components: config.components
      });
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const handleDeleteTheme = (themeId: string) => {
    setThemes(themes.filter(t => t.id !== themeId));
    onUpdate({
      ...config,
      themes: themes.filter(t => t.id !== themeId),
      colorSchemes: config.colorSchemes,
      typography: config.typography,
      layouts: config.layouts,
      components: config.components
    });
  };

  const handleToggleTheme = (themeId: string) => {
    const updatedThemes = themes.map(t => 
      t.id === themeId ? { ...t, isActive: !t.isActive, updatedAt: new Date() } : t
    );
    setThemes(updatedThemes);
    onUpdate({
      ...config,
      themes: updatedThemes,
      colorSchemes: config.colorSchemes,
      typography: config.typography,
      layouts: config.layouts,
      components: config.components
    });
  };

  const handleSetDefaultTheme = (themeId: string) => {
    const updatedThemes = themes.map(t => ({
      ...t,
      isDefault: t.id === themeId,
      updatedAt: new Date()
    }));
    setThemes(updatedThemes);
    onUpdate({
      ...config,
      themes: updatedThemes,
      colorSchemes: config.colorSchemes,
      typography: config.typography,
      layouts: config.layouts,
      components: config.components
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Theme Customizer</h3>
          <p className="text-sm text-gray-500">Create and customize themes for your application</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Theme
        </button>
      </div>

      {/* Themes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {themes.map((theme) => {
          const category = categories.find(c => c.value === theme.category);
          
          return (
            <div key={theme.id} className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{theme.name}</h4>
                  {theme.description && (
                    <p className="text-xs text-gray-500 mt-1">{theme.description}</p>
                  )}
                </div>
                <div className="flex items-center space-x-1">
                  {theme.isDefault && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      Default
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setEditingTheme(theme);
                      setShowForm(true);
                    }}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleToggleTheme(theme.id)}
                    className={theme.isActive ? "text-red-600 hover:text-red-900" : "text-green-600 hover:text-green-900"}
                    title={theme.isActive ? "Deactivate theme" : "Activate theme"}
                  >
                    {theme.isActive ? <XCircleIcon className="h-4 w-4" /> : <CheckCircleIcon className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => handleDeleteTheme(theme.id)}
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
                  <span className="text-xs text-gray-500">Color Scheme</span>
                  <span className="text-xs text-gray-900">{theme.colorScheme.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Typography</span>
                  <span className="text-xs text-gray-900">{theme.typography.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Status</span>
                  <span className={`text-xs ${theme.isActive ? 'text-green-600' : 'text-red-600'}`}>
                    {theme.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t">
                <button
                  onClick={() => handleSetDefaultTheme(theme.id)}
                  disabled={theme.isDefault}
                  className={`w-full text-xs py-1 px-2 rounded ${
                    theme.isDefault 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                  }`}
                >
                  {theme.isDefault ? 'Default Theme' : 'Set as Default'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Theme Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-4/5 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingTheme ? 'Edit Theme' : 'Create Theme'}
              </h3>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleSaveTheme({
                  name: formData.get('name') as string,
                  description: formData.get('description') as string,
                  category: formData.get('category') as unknown,
                  isActive: formData.get('isActive') === 'on',
                  isDefault: formData.get('isDefault') === 'on'
                });
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Theme Name</label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingTheme?.name}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    name="description"
                    defaultValue={editingTheme?.description}
                    rows={2}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <select
                    name="category"
                    defaultValue={editingTheme?.category}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    {categories.map(category => (
                      <option key={category.value} value={category.value}>{category.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="isActive"
                      defaultChecked={editingTheme?.isActive}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700">Active theme</label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="isDefault"
                      defaultChecked={editingTheme?.isDefault}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700">Default theme</label>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-md">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">Theme Customization</h4>
                  <p className="text-sm text-blue-700">
                    After creating the theme, you'll be able to customize colors, typography, 
                    layouts, and component styles using the visual theme editor.
                  </p>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingTheme(undefined);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    {editingTheme ? 'Update Theme' : 'Create Theme'}
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
// MAIN THEME CUSTOMIZER COMPONENT
// =============================================================================

export default function ThemeCustomizerManagement() {
  const [config, setConfig] = useState<ThemeCustomizerConfiguration>({
    themes: [],
    colorSchemes: [],
    typography: [],
    layouts: [],
    components: []
  });

  const [activeTab, setActiveTab] = useState('themes');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Mock themes data
      const mockThemes: Theme[] = [
        {
          id: '1',
          name: 'Default Light Theme',
          description: 'Clean and modern light theme',
          category: 'light',
          colorScheme: {
            id: '1',
            name: 'Light Colors',
            primary: {
              base: '#3B82F6',
              light: '#60A5FA',
              lighter: '#93C5FD',
              dark: '#2563EB',
              darker: '#1D4ED8'
            },
            secondary: {
              base: '#6B7280',
              light: '#9CA3AF',
              lighter: '#D1D5DB',
              dark: '#4B5563',
              darker: '#374151'
            },
            neutral: {
              base: '#FFFFFF',
              light: '#F9FAFB',
              lighter: '#F3F4F6',
              dark: '#111827',
              darker: '#000000'
            },
            semantic: {
              success: '#10B981',
              warning: '#F59E0B',
              error: '#EF4444',
              info: '#3B82F6'
            },
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          typography: {
            id: '1',
            name: 'Inter Typography',
            fontFamily: {
              primary: 'Inter',
              secondary: 'Inter',
              mono: 'JetBrains Mono'
            },
            fontSize: {
              xs: '0.75rem',
              sm: '0.875rem',
              base: '1rem',
              lg: '1.125rem',
              xl: '1.25rem',
              '2xl': '1.5rem',
              '3xl': '1.875rem'
            },
            fontWeight: {
              light: 300,
              normal: 400,
              medium: 500,
              semibold: 600,
              bold: 700
            },
            lineHeight: {
              tight: 1.25,
              normal: 1.5,
              relaxed: 1.75
            },
            letterSpacing: {
              tight: '-0.025em',
              normal: '0em',
              wide: '0.025em'
            },
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          layout: {
            id: '1',
            name: 'Default Layout',
            spacing: {
              xs: '0.25rem',
              sm: '0.5rem',
              md: '1rem',
              lg: '1.5rem',
              xl: '2rem',
              '2xl': '3rem'
            },
            borders: {
              radius: {
                none: '0px',
                sm: '0.125rem',
                md: '0.375rem',
                lg: '0.5rem',
                xl: '0.75rem',
                full: '9999px'
              },
              width: {
                none: '0px',
                thin: '1px',
                medium: '2px',
                thick: '4px'
              },
              style: {
                solid: 'solid',
                dashed: 'dashed',
                dotted: 'dotted'
              }
            },
            shadows: {
              sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
              md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
              xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
            },
            animations: {
              duration: {
                fast: '150ms',
                normal: '300ms',
                slow: '500ms'
              },
              easing: {
                linear: 'linear',
                easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
                easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
                easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)'
              },
              enabled: true
            },
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          components: {
            id: '1',
            name: 'Default Components',
            button: {
              variant: 'primary',
              size: 'md',
              borderRadius: '0.375rem',
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              fontWeight: '500'
            },
            input: {
              variant: 'default',
              size: 'md',
              borderRadius: '0.375rem',
              padding: '0.5rem 0.75rem',
              fontSize: '0.875rem',
              borderColor: '#D1D5DB',
              focusColor: '#3B82F6'
            },
            card: {
              variant: 'default',
              borderRadius: '0.5rem',
              padding: '1.5rem',
              shadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
              backgroundColor: '#FFFFFF',
              borderColor: '#E5E7EB'
            },
            modal: {
              variant: 'default',
              borderRadius: '0.5rem',
              padding: '1.5rem',
              shadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
              backgroundColor: '#FFFFFF',
              backdropBlur: true
            },
            navigation: {
              variant: 'horizontal',
              height: '4rem',
              backgroundColor: '#FFFFFF',
              textColor: '#374151',
              activeColor: '#3B82F6',
              hoverColor: '#F3F4F6'
            },
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          isActive: true,
          isDefault: true,
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-09-30')
        }
      ];
      
      setConfig({
        ...config,
        themes: mockThemes
      });
    } catch (error) {
      console.error('Error loading theme customizer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigUpdate = (updatedConfig: ThemeCustomizerConfiguration) => {
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
    { id: 'themes', name: 'Themes', icon: SwatchIcon },
    { id: 'colors', name: 'Color Schemes', icon: PaintBrushIcon },
    { id: 'typography', name: 'Typography', icon: DocumentTextIcon },
    { id: 'layouts', name: 'Layouts', icon: RectangleStackIcon },
    { id: 'components', name: 'Components', icon: Squares2X2Icon }
  ];

  const activeThemes = config.themes.filter(t => t.isActive).length;
  const totalThemes = config.themes.length;
  const defaultTheme = config.themes.find(t => t.isDefault);
  const customThemes = config.themes.filter(t => t.category === 'custom').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Theme Customizer</h1>
        <p className="mt-1 text-sm text-gray-500">
          Create and customize themes, colors, typography, and component styles
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <SwatchIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Active Themes</p>
              <p className="text-2xl font-semibold text-gray-900">{activeThemes}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <PaintBrushIcon className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Themes</p>
              <p className="text-2xl font-semibold text-gray-900">{totalThemes}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <SparklesIcon className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Custom Themes</p>
              <p className="text-2xl font-semibold text-gray-900">{customThemes}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Default Theme</p>
              <p className="text-2xl font-semibold text-gray-900">{defaultTheme?.name || 'None'}</p>
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
        {activeTab === 'themes' && (
          <ThemeCustomizer config={config} onUpdate={handleConfigUpdate} />
        )}
        {activeTab === 'colors' && (
          <div className="text-center py-12">
            <PaintBrushIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Color Schemes</h3>
            <p className="text-gray-500">Color scheme management coming soon...</p>
          </div>
        )}
        {activeTab === 'typography' && (
          <div className="text-center py-12">
            <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Typography Settings</h3>
            <p className="text-gray-500">Typography customization coming soon...</p>
          </div>
        )}
        {activeTab === 'layouts' && (
          <div className="text-center py-12">
            <RectangleStackIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Layout Settings</h3>
            <p className="text-gray-500">Layout customization coming soon...</p>
          </div>
        )}
        {activeTab === 'components' && (
          <div className="text-center py-12">
            <Squares2X2Icon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Component Settings</h3>
            <p className="text-gray-500">Component customization coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
}
