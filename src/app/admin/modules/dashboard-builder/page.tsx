// Comprehensive Dashboard Builder
// Advanced drag-and-drop dashboard creation with full customization

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ChartBarIcon, 
  CalculatorIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  ArrowUpDownIcon,
  EyeIcon,
  DocumentTextIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
  Squares2X2Icon,
  CogIcon,
  PaintBrushIcon,
  ShareIcon,
  DownloadIcon,
  UploadIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  AdjustmentsHorizontalIcon,
  SparklesIcon,
  LightBulbIcon,
  PresentationChartLineIcon,
  TableCellsIcon,
  MapIcon,
  CalendarIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  GlobeAltIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  TvIcon
} from '@heroicons/react/24/outline';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface Dashboard {
  id: string;
  name: string;
  description?: string;
  widgets: Widget[];
  layout: DashboardLayout;
  theme: DashboardTheme;
  settings: DashboardSettings;
  isPublic: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  position: Position;
  size: Size;
  config: WidgetConfig;
  data: any;
  style: WidgetStyle;
}

interface Position {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

interface WidgetConfig {
  chartType?: ChartType;
  dataSource?: string;
  filters?: Filter[];
  timeRange?: string;
  aggregation?: string;
  refreshInterval?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  showTooltip?: boolean;
  customQuery?: string;
}

interface Filter {
  field: string;
  operator: string;
  value: any;
}

interface WidgetStyle {
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  padding?: number;
  fontSize?: number;
  fontFamily?: string;
  textColor?: string;
  chartColors?: string[];
}

interface DashboardLayout {
  columns: number;
  rows: number;
  gridSize: number;
  gap: number;
  padding: number;
}

interface DashboardTheme {
  name: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  fontFamily: string;
}

interface DashboardSettings {
  autoRefresh: boolean;
  refreshInterval: number;
  showGrid: boolean;
  showWidgetTitles: boolean;
  allowResize: boolean;
  allowDrag: boolean;
  responsive: boolean;
}

type WidgetType = 
  | 'chart' 
  | 'metric' 
  | 'table' 
  | 'text' 
  | 'image' 
  | 'map' 
  | 'calendar' 
  | 'gauge' 
  | 'progress' 
  | 'counter' 
  | 'sparkline' 
  | 'heatmap' 
  | 'treemap' 
  | 'scatter' 
  | 'funnel' 
  | 'sankey';

type ChartType = 
  | 'line' 
  | 'bar' 
  | 'pie' 
  | 'doughnut' 
  | 'area' 
  | 'scatter' 
  | 'bubble' 
  | 'radar' 
  | 'polar' 
  | 'candlestick' 
  | 'heatmap' 
  | 'treemap' 
  | 'sankey' 
  | 'funnel';

// =============================================================================
// WIDGET LIBRARY COMPONENT
// =============================================================================

function WidgetLibrary({ onAddWidget }: { onAddWidget: (widgetType: WidgetType) => void }) {
  const widgetTypes = [
    { type: 'chart', label: 'Chart', icon: ChartBarIcon, description: 'Data visualization charts' },
    { type: 'metric', label: 'Metric', icon: CalculatorIcon, description: 'Key performance indicators' },
    { type: 'table', label: 'Table', icon: TableCellsIcon, description: 'Data tables and lists' },
    { type: 'text', label: 'Text', icon: DocumentTextIcon, description: 'Rich text and markdown' },
    { type: 'image', label: 'Image', icon: DocumentTextIcon, description: 'Images and media' },
    { type: 'map', label: 'Map', icon: MapIcon, description: 'Geographic data visualization' },
    { type: 'calendar', label: 'Calendar', icon: CalendarIcon, description: 'Calendar and events' },
    { type: 'gauge', label: 'Gauge', icon: ChartBarIcon, description: 'Progress and gauge charts' },
    { type: 'progress', label: 'Progress', icon: ArrowTrendingUpIcon, description: 'Progress bars and indicators' },
    { type: 'counter', label: 'Counter', icon: CalculatorIcon, description: 'Animated counters' },
    { type: 'sparkline', label: 'Sparkline', icon: ArrowTrendingUpIcon, description: 'Mini trend charts' },
    { type: 'heatmap', label: 'Heatmap', icon: ChartBarIcon, description: 'Heat map visualizations' },
    { type: 'treemap', label: 'Treemap', icon: Squares2X2Icon, description: 'Hierarchical data visualization' },
    { type: 'scatter', label: 'Scatter', icon: ChartBarIcon, description: 'Scatter plot charts' },
    { type: 'funnel', label: 'Funnel', icon: ChartBarIcon, description: 'Funnel charts' },
    { type: 'sankey', label: 'Sankey', icon: ChartBarIcon, description: 'Flow diagrams' }
  ];

  return (
    <div className="bg-white border-r border-gray-200 w-80 h-full overflow-y-auto">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Widget Library</h3>
        <p className="text-sm text-gray-500">Drag widgets to your dashboard</p>
      </div>
      
      <div className="p-4 space-y-2">
        {widgetTypes.map((widget) => {
          const Icon = widget.icon;
          return (
            <div
              key={widget.type}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('widget-type', widget.type);
              }}
              className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-move transition-colors"
            >
              <Icon className="h-5 w-5 text-blue-600 mr-3" />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">{widget.label}</div>
                <div className="text-xs text-gray-500">{widget.description}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// DASHBOARD CANVAS COMPONENT
// =============================================================================

function DashboardCanvas({ 
  dashboard, 
  onUpdateDashboard, 
  selectedWidget, 
  onSelectWidget 
}: { 
  dashboard: Dashboard;
  onUpdateDashboard: (dashboard: Dashboard) => void;
  selectedWidget: string | null;
  onSelectWidget: (widgetId: string | null) => void;
}) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const widgetType = e.dataTransfer.getData('widget-type') as WidgetType;
    
    if (widgetType) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = Math.floor((e.clientX - rect.left) / dashboard.layout.gridSize);
      const y = Math.floor((e.clientY - rect.top) / dashboard.layout.gridSize);

      const newWidget: Widget = {
        id: Date.now().toString(),
        type: widgetType,
        title: `${widgetType.charAt(0).toUpperCase() + widgetType.slice(1)} Widget`,
        position: { x, y },
        size: { width: 2, height: 2 },
        config: {},
        data: null,
        style: {
          backgroundColor: '#ffffff',
          borderColor: '#e5e7eb',
          borderWidth: 1,
          borderRadius: 8,
          padding: 16,
          fontSize: 14,
          fontFamily: 'Inter',
          textColor: '#111827'
        }
      };

      const updatedDashboard = {
        ...dashboard,
        widgets: [...dashboard.widgets, newWidget],
        updatedAt: new Date()
      };

      onUpdateDashboard(updatedDashboard);
    }
  }, [dashboard, onUpdateDashboard]);

  const handleWidgetDragStart = useCallback((e: React.DragEvent, widgetId: string) => {
    setDraggedWidget(widgetId);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  }, []);

  const handleWidgetDragEnd = useCallback((e: React.DragEvent) => {
    if (!draggedWidget) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = Math.floor((e.clientX - rect.left - dragOffset.x) / dashboard.layout.gridSize);
    const y = Math.floor((e.clientY - rect.top - dragOffset.y) / dashboard.layout.gridSize);

    const updatedDashboard = {
      ...dashboard,
      widgets: dashboard.widgets.map(widget =>
        widget.id === draggedWidget
          ? { ...widget, position: { x, y } }
          : widget
      ),
      updatedAt: new Date()
    };

    onUpdateDashboard(updatedDashboard);
    setDraggedWidget(null);
  }, [draggedWidget, dragOffset, dashboard, onUpdateDashboard]);

  const handleWidgetResize = useCallback((widgetId: string, newSize: Size) => {
    const updatedDashboard = {
      ...dashboard,
      widgets: dashboard.widgets.map(widget =>
        widget.id === widgetId
          ? { ...widget, size: newSize }
          : widget
      ),
      updatedAt: new Date()
    };

    onUpdateDashboard(updatedDashboard);
  }, [dashboard, onUpdateDashboard]);

  const handleWidgetDelete = useCallback((widgetId: string) => {
    const updatedDashboard = {
      ...dashboard,
      widgets: dashboard.widgets.filter(widget => widget.id !== widgetId),
      updatedAt: new Date()
    };

    onUpdateDashboard(updatedDashboard);
    if (selectedWidget === widgetId) {
      onSelectWidget(null);
    }
  }, [dashboard, onUpdateDashboard, selectedWidget, onSelectWidget]);

  return (
    <div className="flex-1 bg-gray-100 p-4">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{dashboard.name}</h2>
              {dashboard.description && (
                <p className="text-sm text-gray-500 mt-1">{dashboard.description}</p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <EyeIcon className="h-5 w-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <ShareIcon className="h-5 w-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <DownloadIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <div
          ref={canvasRef}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="p-4 h-full overflow-auto"
          style={{
            backgroundImage: dashboard.settings.showGrid 
              ? `radial-gradient(circle, #e5e7eb 1px, transparent 1px)`
              : 'none',
            backgroundSize: `${dashboard.layout.gridSize}px ${dashboard.layout.gridSize}px`,
            minHeight: '600px'
          }}
        >
          <div
            className="relative"
            style={{
              width: `${dashboard.layout.columns * dashboard.layout.gridSize}px`,
              height: `${dashboard.layout.rows * dashboard.layout.gridSize}px`,
              minHeight: '600px'
            }}
          >
            {dashboard.widgets.map((widget) => (
              <WidgetComponent
                key={widget.id}
                widget={widget}
                isSelected={selectedWidget === widget.id}
                onSelect={() => onSelectWidget(widget.id)}
                onDragStart={(e) => handleWidgetDragStart(e, widget.id)}
                onDragEnd={handleWidgetDragEnd}
                onResize={(newSize) => handleWidgetResize(widget.id, newSize)}
                onDelete={() => handleWidgetDelete(widget.id)}
                gridSize={dashboard.layout.gridSize}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// WIDGET COMPONENT
// =============================================================================

function WidgetComponent({
  widget,
  isSelected,
  onSelect,
  onDragStart,
  onDragEnd,
  onResize,
  onDelete,
  gridSize
}: {
  widget: Widget;
  isSelected: boolean;
  onSelect: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onResize: (size: Size) => void;
  onDelete: () => void;
  gridSize: number;
}) {
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsResizing(true);
      setResizeStart({
        x: e.clientX,
        y: e.clientY,
        width: widget.size.width,
        height: widget.size.height
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isResizing) return;

    const deltaX = e.clientX - resizeStart.x;
    const deltaY = e.clientY - resizeStart.y;
    
    const newWidth = Math.max(1, Math.floor((resizeStart.width + deltaX) / gridSize));
    const newHeight = Math.max(1, Math.floor((resizeStart.height + deltaY) / gridSize));

    onResize({ width: newWidth, height: newHeight });
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing]);

  const getWidgetIcon = (type: WidgetType) => {
    const icons: Record<WidgetType, any> = {
      chart: ChartBarIcon,
      metric: CalculatorIcon,
      table: TableCellsIcon,
      text: DocumentTextIcon,
      image: DocumentTextIcon,
      map: MapIcon,
      calendar: CalendarIcon,
      gauge: ChartBarIcon,
      progress: ArrowTrendingUpIcon,
      counter: CalculatorIcon,
      sparkline: ArrowTrendingUpIcon,
      heatmap: ChartBarIcon,
      treemap: Squares2X2Icon,
      scatter: ChartBarIcon,
      funnel: ChartBarIcon,
      sankey: ChartBarIcon
    };
    return icons[type] || ChartBarIcon;
  };

  const WidgetIcon = getWidgetIcon(widget.type);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onSelect}
      className={`absolute border-2 rounded-lg cursor-move transition-all ${
        isSelected 
          ? 'border-blue-500 shadow-lg' 
          : 'border-gray-200 hover:border-gray-300'
      }`}
      style={{
        left: `${widget.position.x * gridSize}px`,
        top: `${widget.position.y * gridSize}px`,
        width: `${widget.size.width * gridSize}px`,
        height: `${widget.size.height * gridSize}px`,
        backgroundColor: widget.style.backgroundColor,
        borderColor: widget.style.borderColor,
        borderWidth: `${widget.style.borderWidth}px`,
        borderRadius: `${widget.style.borderRadius}px`,
        padding: `${widget.style.padding}px`,
        fontSize: `${widget.style.fontSize}px`,
        fontFamily: widget.style.fontFamily,
        color: widget.style.textColor
      }}
    >
      {/* Widget Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <WidgetIcon className="h-4 w-4 mr-2 text-blue-600" />
          <span className="text-sm font-medium">{widget.title}</span>
        </div>
        {isSelected && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="text-red-500 hover:text-red-700"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Widget Content */}
      <div className="flex-1 flex items-center justify-center">
        {widget.type === 'chart' && (
          <div className="text-center">
            <ChartBarIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-xs text-gray-500">Chart Widget</p>
          </div>
        )}
        {widget.type === 'metric' && (
          <div className="text-center">
            <CalculatorIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-xs text-gray-500">Metric Widget</p>
          </div>
        )}
        {widget.type === 'table' && (
          <div className="text-center">
            <TableCellsIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-xs text-gray-500">Table Widget</p>
          </div>
        )}
        {widget.type === 'text' && (
          <div className="text-center">
            <DocumentTextIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-xs text-gray-500">Text Widget</p>
          </div>
        )}
        {widget.type === 'gauge' && (
          <div className="text-center">
            <ChartBarIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-xs text-gray-500">Gauge Widget</p>
          </div>
        )}
        {/* Add more widget types as needed */}
      </div>

      {/* Resize Handle */}
      {isSelected && (
        <div
          className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 cursor-se-resize"
          onMouseDown={handleMouseDown}
        />
      )}
    </div>
  );
}

// =============================================================================
// PROPERTIES PANEL COMPONENT
// =============================================================================

function PropertiesPanel({ 
  selectedWidget, 
  dashboard, 
  onUpdateDashboard 
}: { 
  selectedWidget: Widget | null;
  dashboard: Dashboard;
  onUpdateDashboard: (dashboard: Dashboard) => void;
}) {
  const [activeTab, setActiveTab] = useState<'widget' | 'dashboard' | 'theme'>('widget');

  const handleWidgetUpdate = (updates: Partial<Widget>) => {
    if (!selectedWidget) return;

    const updatedDashboard = {
      ...dashboard,
      widgets: dashboard.widgets.map(widget =>
        widget.id === selectedWidget.id
          ? { ...widget, ...updates }
          : widget
      ),
      updatedAt: new Date()
    };

    onUpdateDashboard(updatedDashboard);
  };

  const handleDashboardUpdate = (updates: Partial<Dashboard>) => {
    const updatedDashboard = {
      ...dashboard,
      ...updates,
      updatedAt: new Date()
    };

    onUpdateDashboard(updatedDashboard);
  };

  const tabs = [
    { id: 'widget', name: 'Widget', icon: CogIcon },
    { id: 'dashboard', name: 'Dashboard', icon: Squares2X2Icon },
    { id: 'theme', name: 'Theme', icon: PaintBrushIcon }
  ];

  return (
    <div className="bg-white border-l border-gray-200 w-80 h-full overflow-y-auto">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Properties</h3>
        <p className="text-sm text-gray-500">Configure your dashboard and widgets</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="h-4 w-4 mr-1" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {activeTab === 'widget' && selectedWidget && (
          <WidgetProperties widget={selectedWidget} onUpdate={handleWidgetUpdate} />
        )}
        {activeTab === 'dashboard' && (
          <DashboardProperties dashboard={dashboard} onUpdate={handleDashboardUpdate} />
        )}
        {activeTab === 'theme' && (
          <ThemeProperties dashboard={dashboard} onUpdate={handleDashboardUpdate} />
        )}
        {activeTab === 'widget' && !selectedWidget && (
          <div className="text-center py-8">
            <CogIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Select a widget to configure its properties</p>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// WIDGET PROPERTIES COMPONENT
// =============================================================================

function WidgetProperties({ 
  widget, 
  onUpdate 
}: { 
  widget: Widget;
  onUpdate: (updates: Partial<Widget>) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Widget Title</label>
        <input
          type="text"
          value={widget.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Background Color</label>
        <div className="mt-1 flex items-center space-x-2">
          <input
            type="color"
            value={widget.style.backgroundColor}
            onChange={(e) => onUpdate({ 
              style: { ...widget.style, backgroundColor: e.target.value }
            })}
            className="h-8 w-12 rounded border-gray-300"
          />
          <input
            type="text"
            value={widget.style.backgroundColor}
            onChange={(e) => onUpdate({ 
              style: { ...widget.style, backgroundColor: e.target.value }
            })}
            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Border Radius</label>
        <input
          type="range"
          min="0"
          max="20"
          value={widget.style.borderRadius}
          onChange={(e) => onUpdate({ 
            style: { ...widget.style, borderRadius: parseInt(e.target.value) }
          })}
          className="mt-1 block w-full"
        />
        <div className="text-xs text-gray-500 mt-1">{widget.style.borderRadius}px</div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Padding</label>
        <input
          type="range"
          min="0"
          max="32"
          value={widget.style.padding}
          onChange={(e) => onUpdate({ 
            style: { ...widget.style, padding: parseInt(e.target.value) }
          })}
          className="mt-1 block w-full"
        />
        <div className="text-xs text-gray-500 mt-1">{widget.style.padding}px</div>
      </div>
    </div>
  );
}

// =============================================================================
// DASHBOARD PROPERTIES COMPONENT
// =============================================================================

function DashboardProperties({ 
  dashboard, 
  onUpdate 
}: { 
  dashboard: Dashboard;
  onUpdate: (updates: Partial<Dashboard>) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Dashboard Name</label>
        <input
          type="text"
          value={dashboard.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={dashboard.description || ''}
          onChange={(e) => onUpdate({ description: e.target.value })}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Grid Columns</label>
        <input
          type="number"
          min="1"
          max="12"
          value={dashboard.layout.columns}
          onChange={(e) => onUpdate({ 
            layout: { ...dashboard.layout, columns: parseInt(e.target.value) }
          })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Grid Rows</label>
        <input
          type="number"
          min="1"
          max="20"
          value={dashboard.layout.rows}
          onChange={(e) => onUpdate({ 
            layout: { ...dashboard.layout, rows: parseInt(e.target.value) }
          })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          checked={dashboard.settings.showGrid}
          onChange={(e) => onUpdate({ 
            settings: { ...dashboard.settings, showGrid: e.target.checked }
          })}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label className="ml-2 block text-sm text-gray-900">Show Grid</label>
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          checked={dashboard.isPublic}
          onChange={(e) => onUpdate({ isPublic: e.target.checked })}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label className="ml-2 block text-sm text-gray-900">Public Dashboard</label>
      </div>
    </div>
  );
}

// =============================================================================
// THEME PROPERTIES COMPONENT
// =============================================================================

function ThemeProperties({ 
  dashboard, 
  onUpdate 
}: { 
  dashboard: Dashboard;
  onUpdate: (updates: Partial<Dashboard>) => void;
}) {
  const themes = [
    { name: 'Light', primaryColor: '#3B82F6', secondaryColor: '#6B7280', backgroundColor: '#FFFFFF', textColor: '#111827' },
    { name: 'Dark', primaryColor: '#60A5FA', secondaryColor: '#9CA3AF', backgroundColor: '#1F2937', textColor: '#F9FAFB' },
    { name: 'Blue', primaryColor: '#1E40AF', secondaryColor: '#3B82F6', backgroundColor: '#F8FAFC', textColor: '#1E293B' },
    { name: 'Green', primaryColor: '#059669', secondaryColor: '#10B981', backgroundColor: '#F0FDF4', textColor: '#064E3B' },
    { name: 'Purple', primaryColor: '#7C3AED', secondaryColor: '#A855F7', backgroundColor: '#FAF5FF', textColor: '#581C87' }
  ];

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Theme</label>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {themes.map((theme) => (
            <button
              key={theme.name}
              onClick={() => onUpdate({ 
                theme: { 
                  ...dashboard.theme, 
                  name: theme.name,
                  primaryColor: theme.primaryColor,
                  secondaryColor: theme.secondaryColor,
                  backgroundColor: theme.backgroundColor,
                  textColor: theme.textColor
                }
              })}
              className={`p-3 rounded-lg border text-sm font-medium ${
                dashboard.theme.name === theme.name
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {theme.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Primary Color</label>
        <div className="mt-1 flex items-center space-x-2">
          <input
            type="color"
            value={dashboard.theme.primaryColor}
            onChange={(e) => onUpdate({ 
              theme: { ...dashboard.theme, primaryColor: e.target.value }
            })}
            className="h-8 w-12 rounded border-gray-300"
          />
          <input
            type="text"
            value={dashboard.theme.primaryColor}
            onChange={(e) => onUpdate({ 
              theme: { ...dashboard.theme, primaryColor: e.target.value }
            })}
            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Background Color</label>
        <div className="mt-1 flex items-center space-x-2">
          <input
            type="color"
            value={dashboard.theme.backgroundColor}
            onChange={(e) => onUpdate({ 
              theme: { ...dashboard.theme, backgroundColor: e.target.value }
            })}
            className="h-8 w-12 rounded border-gray-300"
          />
          <input
            type="text"
            value={dashboard.theme.backgroundColor}
            onChange={(e) => onUpdate({ 
              theme: { ...dashboard.theme, backgroundColor: e.target.value }
            })}
            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN DASHBOARD BUILDER COMPONENT
// =============================================================================

export default function DashboardBuilder() {
  const [dashboard, setDashboard] = useState<Dashboard>({
    id: '1',
    name: 'My Dashboard',
    description: 'A comprehensive dashboard built with the dashboard builder',
    widgets: [],
    layout: {
      columns: 12,
      rows: 8,
      gridSize: 20,
      gap: 4,
      padding: 16
    },
    theme: {
      name: 'Light',
      primaryColor: '#3B82F6',
      secondaryColor: '#6B7280',
      backgroundColor: '#FFFFFF',
      textColor: '#111827',
      accentColor: '#F59E0B',
      fontFamily: 'Inter'
    },
    settings: {
      autoRefresh: false,
      refreshInterval: 30000,
      showGrid: true,
      showWidgetTitles: true,
      allowResize: true,
      allowDrag: true,
      responsive: true
    },
    isPublic: false,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  const [selectedWidget, setSelectedWidget] = useState<string | null>(null);

  const selectedWidgetData = dashboard.widgets.find(w => w.id === selectedWidget) || null;

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Builder</h1>
            <p className="text-sm text-gray-500">Create and customize interactive dashboards</p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              <UploadIcon className="h-4 w-4 mr-2" />
              Import
            </button>
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              <DownloadIcon className="h-4 w-4 mr-2" />
              Export
            </button>
            <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
              <CheckCircleIcon className="h-4 w-4 mr-2" />
              Save Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        <WidgetLibrary onAddWidget={() => {}} />
        <DashboardCanvas
          dashboard={dashboard}
          onUpdateDashboard={setDashboard}
          selectedWidget={selectedWidget}
          onSelectWidget={setSelectedWidget}
        />
        <PropertiesPanel
          selectedWidget={selectedWidgetData}
          dashboard={dashboard}
          onUpdateDashboard={setDashboard}
        />
      </div>
    </div>
  );
}
