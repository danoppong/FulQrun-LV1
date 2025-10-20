'use client'

import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, TooltipProps } from 'recharts'
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent'

export interface BarChartData {
  name: string
  [key: string]: string | number
}

interface PremiumBarChartProps {
  data: BarChartData[]
  dataKeys: Array<{ key: string; color: string; name: string }>
  height?: number
  darkMode?: boolean
  stacked?: boolean
}

export function PremiumBarChart({ data, dataKeys, height = 300, darkMode = false, stacked = false }: PremiumBarChartProps) {
  const theme = darkMode ? {
    grid: '#374151',
    text: '#9CA3AF',
    tooltip: {
      bg: '#1F2937',
      border: '#374151',
      text: '#F3F4F6'
    }
  } : {
    grid: '#E5E7EB',
    text: '#6B7280',
    tooltip: {
      bg: '#FFFFFF',
      border: '#E5E7EB',
      text: '#111827'
    }
  }

  const CustomTooltip = ({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
    if (!active || !payload || !Array.isArray(payload)) return null

    type TooltipEntry = { color?: string; name?: NameType; value?: ValueType }
    const entries = payload as unknown as TooltipEntry[]

    const formatValue = (val: ValueType) => {
      if (Array.isArray(val)) return val.join(', ')
      return typeof val === 'number' ? val.toLocaleString() : String(val)
    }
    
    return (
      <div 
        className="rounded-lg shadow-lg border p-3"
        style={{ 
          backgroundColor: theme.tooltip.bg, 
          borderColor: theme.tooltip.border,
          color: theme.tooltip.text
        }}
      >
        <p className="font-semibold mb-2">{label}</p>
        {entries.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div 
              className="w-3 h-3 rounded" 
              style={{ backgroundColor: entry.color || '#999' }}
            />
            <span>{String(entry.name)}:</span>
            <span className="font-semibold">{formatValue(entry.value ?? '')}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} opacity={0.3} />
        <XAxis 
          dataKey="name" 
          stroke={theme.text}
          style={{ fontSize: '12px' }}
        />
        <YAxis 
          stroke={theme.text}
          style={{ fontSize: '12px' }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          wrapperStyle={{ fontSize: '12px', color: theme.text }}
        />
        {dataKeys.map((dk) => (
          <Bar
            key={dk.key}
            dataKey={dk.key}
            fill={dk.color}
            radius={[4, 4, 0, 0]}
            name={dk.name}
            stackId={stacked ? 'stack' : undefined}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}
