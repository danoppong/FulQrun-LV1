'use client'

import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

export interface DonutChartData {
  name: string
  value: number
  color: string
}

interface PremiumDonutChartProps {
  data: DonutChartData[]
  height?: number
  darkMode?: boolean
}

export function PremiumDonutChart({ data, height = 300, darkMode = false }: PremiumDonutChartProps) {
  const theme = darkMode ? {
    text: '#9CA3AF',
    tooltip: {
      bg: '#1F2937',
      border: '#374151',
      text: '#F3F4F6'
    }
  } : {
    text: '#6B7280',
    tooltip: {
      bg: '#FFFFFF',
      border: '#E5E7EB',
      text: '#111827'
    }
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload[0]) return null
    
    const data = payload[0]
    const total = payload[0].payload.total || 100
    const percentage = ((data.value / total) * 100).toFixed(1)
    
    return (
      <div 
        className="rounded-lg shadow-lg border p-3"
        style={{ 
          backgroundColor: theme.tooltip.bg, 
          borderColor: theme.tooltip.border,
          color: theme.tooltip.text
        }}
      >
        <p className="font-semibold mb-1">{data.name}</p>
        <div className="flex items-center gap-2 text-sm">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: data.payload.color }}
          />
          <span>Value:</span>
          <span className="font-semibold">{data.value?.toLocaleString()}</span>
        </div>
        <div className="text-sm text-gray-400 mt-1">{percentage}% of total</div>
      </div>
    )
  }

  const total = data.reduce((sum, item) => sum + item.value, 0)
  const dataWithTotal = data.map(item => ({ ...item, total }))

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={dataWithTotal}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={2}
          dataKey="value"
        >
          {dataWithTotal.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          wrapperStyle={{ fontSize: '12px', color: theme.text }}
          iconType="circle"
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
