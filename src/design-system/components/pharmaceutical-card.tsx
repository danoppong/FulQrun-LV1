// src/design-system/components/pharmaceutical-card.tsx
// Phase 3.0: Enhanced Pharmaceutical Card Component
// Advanced card component with pharmaceutical-specific features

'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface PharmaceuticalCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'clinical' | 'regulatory' | 'therapeutic' | 'elevated';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  pharmaceutical?: 'hcp' | 'territory' | 'opportunity' | 'kpi' | 'compliance';
  interactive?: boolean;
  loading?: boolean;
  status?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  badge?: string;
  children: React.ReactNode;
}

const PharmaceuticalCard = React.forwardRef<HTMLDivElement, PharmaceuticalCardProps>(
  ({ 
    className, 
    variant = 'default', 
    size = 'md', 
    pharmaceutical,
    interactive = false,
    loading = false,
    status,
    badge,
    children, 
    ...props 
  }, ref) => {
    
    const baseClasses = [
      // Base styling
      'relative',
      'rounded-lg',
      'border',
      'bg-white',
      'transition-all',
      'duration-300',
      
      // Interactive states
      interactive && [
        'cursor-pointer',
        'hover:shadow-lg',
        'hover:-translate-y-1',
        'focus:outline-none',
        'focus:ring-2',
        'focus:ring-blue-500',
        'focus:ring-offset-2'
      ],
      
      // Loading state
      loading && 'animate-pulse',
      
      // Size variants
      size === 'sm' && 'p-4',
      size === 'md' && 'p-6',
      size === 'lg' && 'p-8',
      size === 'xl' && 'p-10',
      
      // Color variants
      variant === 'default' && [
        'border-gray-200',
        'shadow-sm',
        'hover:shadow-md'
      ],
      variant === 'clinical' && [
        'border-green-200',
        'bg-green-50',
        'shadow-sm',
        'shadow-green-100'
      ],
      variant === 'regulatory' && [
        'border-red-200',
        'bg-red-50',
        'shadow-sm',
        'shadow-red-100'
      ],
      variant === 'therapeutic' && [
        'border-purple-200',
        'bg-purple-50',
        'shadow-sm',
        'shadow-purple-100'
      ],
      variant === 'elevated' && [
        'border-gray-200',
        'shadow-lg',
        'shadow-gray-100'
      ],
      
      // Pharmaceutical context styling
      pharmaceutical === 'hcp' && 'border-l-4 border-l-indigo-500',
      pharmaceutical === 'territory' && 'border-l-4 border-l-cyan-500',
      pharmaceutical === 'opportunity' && 'border-l-4 border-l-emerald-500',
      pharmaceutical === 'kpi' && 'border-l-4 border-l-blue-500',
      pharmaceutical === 'compliance' && 'border-l-4 border-l-amber-500',
      
      // Status styling
      status === 'success' && 'ring-1 ring-green-200',
      status === 'warning' && 'ring-1 ring-amber-200',
      status === 'error' && 'ring-1 ring-red-200',
      status === 'info' && 'ring-1 ring-blue-200',
    ].filter(Boolean).flat();

    return (
      <div
        ref={ref}
        className={cn(baseClasses, className)}
        role={interactive ? 'button' : undefined}
        tabIndex={interactive ? 0 : undefined}
        {...props}
      >
        {/* Status badge */}
        {badge && (
          <div className="absolute -top-2 -right-2 z-10">
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
              {badge}
            </span>
          </div>
        )}
        
        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-50 rounded-lg flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}
        
        {/* Content */}
        <div className={cn('relative', loading && 'opacity-50')}>
          {children}
        </div>
      </div>
    );
  }
);

PharmaceuticalCard.displayName = 'PharmaceuticalCard';

// Card Header Component
export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}

export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, title, subtitle, icon, actions, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-start justify-between space-y-0 pb-4', className)}
      {...props}
    >
      <div className="flex items-start space-x-3">
        {icon && (
          <div className="flex-shrink-0 mt-1">
            {icon}
          </div>
        )}
        <div className="space-y-1">
          {title && (
            <h3 className="text-lg font-semibold leading-none tracking-tight text-gray-900">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm text-gray-500">
              {subtitle}
            </p>
          )}
          {children}
        </div>
      </div>
      {actions && (
        <div className="flex-shrink-0">
          {actions}
        </div>
      )}
    </div>
  )
);

CardHeader.displayName = 'CardHeader';

// Card Content Component
export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  spacing?: 'none' | 'sm' | 'md' | 'lg';
}

export const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('pt-0', className)}
      {...props}
    />
  )
);

CardContent.displayName = 'CardContent';

// Card Footer Component
export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'left' | 'center' | 'right' | 'between';
}

export const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center pt-4', className)}
      {...props}
    />
  )
);

CardFooter.displayName = 'CardFooter';

// KPI Card - Specialized for pharmaceutical KPIs
export interface KPICardProps extends Omit<PharmaceuticalCardProps, 'children'> {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
    period: string;
  };
  target?: {
    value: number;
    progress: number;
  };
  trend?: Array<{ period: string; value: number }>;
  unit?: string;
  format?: 'number' | 'currency' | 'percentage';
  icon?: React.ReactNode;
}

export const KPICard = React.forwardRef<HTMLDivElement, KPICardProps>(
  ({ 
    title, 
    value, 
    change, 
    target, 
    unit, 
    format = 'number',
    icon,
    className,
    ...props 
  }, ref) => {
    
    const formatValue = (val: string | number) => {
      const numVal = typeof val === 'string' ? parseFloat(val) : val;
      
      switch (format) {
        case 'currency':
          return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
          }).format(numVal);
        case 'percentage':
          return `${numVal}%`;
        default:
          return new Intl.NumberFormat('en-US').format(numVal);
      }
    };

    return (
      <PharmaceuticalCard
        ref={ref}
        pharmaceutical="kpi"
        className={cn('min-h-[160px]', className)}
        {...props}
      >
        <CardHeader
          title={title}
          icon={icon}
        />
        
        <CardContent className="space-y-4">
          {/* Main KPI Value */}
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-gray-900">
              {formatValue(value)}
            </span>
            {unit && (
              <span className="text-sm text-gray-500 font-medium">
                {unit}
              </span>
            )}
          </div>
          
          {/* Change Indicator */}
          {change && (
            <div className="flex items-center space-x-2">
              <div className={cn(
                'flex items-center space-x-1 text-sm font-medium',
                change.type === 'increase' ? 'text-green-600' : 'text-red-600'
              )}>
                <span>
                  {change.type === 'increase' ? '↗' : '↘'}
                </span>
                <span>
                  {Math.abs(change.value)}%
                </span>
              </div>
              <span className="text-sm text-gray-500">
                vs {change.period}
              </span>
            </div>
          )}
          
          {/* Target Progress */}
          {target && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Target Progress</span>
                <span className="font-medium">
                  {target.progress}% of {formatValue(target.value)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(target.progress, 100)}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </PharmaceuticalCard>
    );
  }
);

KPICard.displayName = 'KPICard';

// Territory Card - For territory management
export interface TerritoryCardProps extends Omit<PharmaceuticalCardProps, 'children' | 'status'> {
  territoryName: string;
  coverage: number;
  hcpCount: number;
  performance: {
    current: number;
    target: number;
  };
  lastActivity?: string;
  status: 'on-track' | 'behind' | 'ahead';
}

export const TerritoryCard = React.forwardRef<HTMLDivElement, TerritoryCardProps>(
  ({ 
    territoryName, 
    coverage, 
    hcpCount, 
    performance, 
    lastActivity, 
    status,
    className,
    ...props 
  }, ref) => {
    
    const statusConfig = {
      'on-track': { color: 'text-green-600', bg: 'bg-green-100', label: 'On Track' },
      'behind': { color: 'text-red-600', bg: 'bg-red-100', label: 'Behind Target' },
      'ahead': { color: 'text-blue-600', bg: 'bg-blue-100', label: 'Ahead of Target' }
    };

    return (
      <PharmaceuticalCard
        ref={ref}
        pharmaceutical="territory"
        interactive
        status={status === 'on-track' ? 'success' : status === 'behind' ? 'error' : 'info'}
        className={className}
        {...props}
      >
        <CardHeader
          title={territoryName}
          actions={
            <span className={cn(
              'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
              statusConfig[status].bg,
              statusConfig[status].color
            )}>
              {statusConfig[status].label}
            </span>
          }
        />
        
        <CardContent className="space-y-4">
          {/* Performance Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Coverage</p>
              <p className="text-2xl font-semibold">{coverage}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">HCPs</p>
              <p className="text-2xl font-semibold">{hcpCount}</p>
            </div>
          </div>
          
          {/* Performance Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Performance</span>
              <span className="font-medium">
                {((performance.current / performance.target) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={cn(
                  'h-2 rounded-full transition-all duration-300',
                  status === 'on-track' ? 'bg-green-600' :
                  status === 'behind' ? 'bg-red-600' : 'bg-blue-600'
                )}
                style={{ 
                  width: `${Math.min((performance.current / performance.target) * 100, 100)}%` 
                }}
              />
            </div>
          </div>
          
          {/* Last Activity */}
          {lastActivity && (
            <p className="text-sm text-gray-500">
              Last activity: {lastActivity}
            </p>
          )}
        </CardContent>
      </PharmaceuticalCard>
    );
  }
);

TerritoryCard.displayName = 'TerritoryCard';

export {
  PharmaceuticalCard
};