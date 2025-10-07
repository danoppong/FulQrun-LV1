'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Play, RefreshCw, Eye, Filter, Search, TrendingUp, Users, Building, Mail } from 'lucide-react';

interface GeneratedLead {
  id: string
  first_name: string
  last_name: string
  company_name: string
  title?: string
  email?: string
  phone?: string
  status: string
  score: number
  geography: string
  industry?: string
  revenue_band?: string
  employee_band?: string
  entity_type?: string
  sources: string[]
  created_at: string
  ai_accounts?: unknown[]
  ai_contacts?: unknown[]
}

interface GenerationStats {
  total_generated: number
  qualified_count: number
  converted_count: number
  avg_score: number
  by_geography: Record<string, number>
  by_industry: Record<string, number>
  by_status: Record<string, number>
}

export function AIGenerationDashboard() {
  const [leads, setLeads] = useState<GeneratedLead[]>([])
  const [stats, setStats] = useState<GenerationStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [geographyFilter, setGeographyFilter] = useState<string>('all')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)

  useEffect(() => {
    fetchLeads()
    fetchStats()
  }, [])

  const fetchLeads = async () => {
    try {
      const response = await fetch('/api/leads?source=AI_GENERATED')
      if (response.ok) {
        const data = await response.json()
        setLeads(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching leads:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/leads/stats?source=AI_GENERATED')
      if (response.ok) {
        const data = await response.json()
        setStats(data.data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleBulkEnrichment = async () => {
    const selectedLeads = leads.filter(lead => lead.status === 'GENERATED')
    if (selectedLeads.length === 0) return

    setIsGenerating(true)
    try {
      const response = await fetch('/api/leads/enrich-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'enrich',
          lead_ids: selectedLeads.map(lead => lead.id),
          enrichment_level: 'ENHANCED'
        })
      })

      if (response.ok) {
        await fetchLeads()
        await fetchStats()
      }
    } catch (error) {
      console.error('Error enriching leads:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleBulkScoring = async () => {
    const selectedLeads = leads.filter(lead => lead.status === 'ENRICHED')
    if (selectedLeads.length === 0) return

    setIsGenerating(true)
    try {
      const response = await fetch('/api/leads/enrich-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'score',
          lead_ids: selectedLeads.map(lead => lead.id),
          weights: {
            fit: 0.3,
            intent: 0.25,
            engagement: 0.2,
            viability: 0.15,
            recency: 0.1
          }
        })
      })

      if (response.ok) {
        await fetchLeads()
        await fetchStats()
      }
    } catch (error) {
      console.error('Error scoring leads:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'GENERATED': { variant: 'default' as const, label: 'Generated' },
      'ENRICHED': { variant: 'secondary' as const, label: 'Enriched' },
      'QUALIFIED': { variant: 'success' as const, label: 'Qualified' },
      'CONVERTED': { variant: 'destructive' as const, label: 'Converted' },
      'REJECTED': { variant: 'outline' as const, label: 'Rejected' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['GENERATED']
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    if (score >= 40) return 'text-orange-600'
    return 'text-red-600'
  }

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.title?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter
    const matchesGeography = geographyFilter === 'all' || lead.geography === geographyFilter
    
    return matchesSearch && matchesStatus && matchesGeography
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Lead Generation</h1>
          <p className="text-muted-foreground">
            Manage and analyze AI-generated leads
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={handleBulkEnrichment}
            disabled={isGenerating || leads.filter(lead => lead.status === 'GENERATED').length === 0}
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Enrich Leads
          </Button>
          
          <Button
            onClick={handleBulkScoring}
            disabled={isGenerating || leads.filter(lead => lead.status === 'ENRICHED').length === 0}
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <TrendingUp className="h-4 w-4 mr-2" />
            )}
            Score Leads
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Generated</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_generated}</div>
              <p className="text-xs text-muted-foreground">
                AI-generated leads
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Qualified</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.qualified_count}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total_generated > 0 ? Math.round((stats.qualified_count / stats.total_generated) * 100) : 0}% qualification rate
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Converted</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.converted_count}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total_generated > 0 ? Math.round((stats.converted_count / stats.total_generated) * 100) : 0}% conversion rate
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Score</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(stats.avg_score)}</div>
              <p className="text-xs text-muted-foreground">
                Average lead score
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search leads..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="GENERATED">Generated</SelectItem>
                <SelectItem value="ENRICHED">Enriched</SelectItem>
                <SelectItem value="QUALIFIED">Qualified</SelectItem>
                <SelectItem value="CONVERTED">Converted</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={geographyFilter} onValueChange={setGeographyFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by geography" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Geographies</SelectItem>
                <SelectItem value="US">US</SelectItem>
                <SelectItem value="EU">EU</SelectItem>
                <SelectItem value="UK">UK</SelectItem>
                <SelectItem value="APAC">APAC</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle>Generated Leads</CardTitle>
          <CardDescription>
            {filteredLeads.length} of {leads.length} leads
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredLeads.map((lead) => (
              <div
                key={lead.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium truncate">
                        {lead.first_name} {lead.last_name}
                      </p>
                      {getStatusBadge(lead.status)}
                    </div>
                    
                    <div className="flex items-center space-x-4 mt-1">
                      <p className="text-sm text-muted-foreground truncate">
                        {lead.company_name}
                      </p>
                      {lead.title && (
                        <p className="text-sm text-muted-foreground truncate">
                          {lead.title}
                        </p>
                      )}
                      <Badge variant="outline">{lead.geography}</Badge>
                      {lead.industry && (
                        <Badge variant="outline">{lead.industry}</Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className={`text-sm font-medium ${getScoreColor(lead.score)}`}>
                      Score: {lead.score}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          {filteredLeads.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No leads found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generation Progress */}
      {isGenerating && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Processing leads...</span>
                <span className="text-sm text-muted-foreground">{generationProgress}%</span>
              </div>
              <Progress value={generationProgress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
