'use client'

import { useState, useEffect } from 'react'

export default function TestTemplatesAPI() {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const testAPI = async () => {
      try {
        console.log('Testing metric templates API...')
        const response = await fetch('/api/sales-performance/metric-templates')
        console.log('Response status:', response.status)
        console.log('Response headers:', response.headers)
        
        if (response.ok) {
          const data = await response.json()
          console.log('Templates data:', data)
          setTemplates(data)
        } else {
          const errorData = await response.json()
          console.error('API Error:', errorData)
          setError(errorData.error || 'API call failed')
        }
      } catch (err) {
        console.error('Fetch error:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    testAPI()
  }, [])

  if (loading) {
    return <div>Loading...</div>
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
        <h3 className="font-bold">API Error:</h3>
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded">
      <h3 className="font-bold">Templates Loaded Successfully!</h3>
      <p>Found {templates.length} templates:</p>
      <ul className="list-disc list-inside mt-2">
        {templates.map((template: any) => (
          <li key={template.id}>
            {template.name} ({template.category}) - {template.metric_type}
          </li>
        ))}
      </ul>
    </div>
  )
}
