'use client'

import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export interface LineChartData {
  name: string
  [key: string]: string | number
}

interface PremiumLineChartProps {
  data: LineChartData[]
  dataKeys: Array<{ key: string; color: string; name: string }>
  height?: number
  darkMode?: boolean
}

export function PremiumLineChart({ data, dataKeys, height = 300, darkMode = false }: PremiumLineChartProps) {
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

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null
    
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
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span>{entry.name}:</span>
            <span className="font-semibold">{entry.value?.toLocaleString()}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
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
          <Line
            key={dk.key}
            type="monotone"
            dataKey={dk.key}
            stroke={dk.color}
            strokeWidth={2}
            dot={{ fill: dk.color, r: 4 }}
            activeDot={{ r: 6 }}
            name={dk.name}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
