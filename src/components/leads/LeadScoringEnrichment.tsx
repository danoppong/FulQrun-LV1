'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, TrendingUp, RefreshCw, Eye, Filter, Search, BarChart3, Target, Zap } from 'lucide-react';

interface LeadScore {
  id: string
  lead_id: string
  fit: number
  intent: number
  engagement: number
  viability: number
  recency: number
  composite: number
  weights: {
    fit: number
    intent: number
    engagement: number
    viability: number
    recency: number
  }
  segment: string
  created_at: string
}

interface Lead {
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
  technographics: string[]
  installed_tools_hints: string[]
  intent_keywords: string[]
  sources: string[]
  risk_flags: string[]
  compliance: Record<string, unknown>
  created_at: string
  ai_accounts?: unknown[]
  ai_contacts?: unknown[]
}

interface ScoringWeights {
  fit: number
  intent: number
  engagement: number
  viability: number
  recency: number
}

export function LeadScoringEnrichment() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [scores, setScores] = useState<LeadScore[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [segmentFilter, setSegmentFilter] = useState<string>('all')
  const [selectedLeads, setSelectedLeads] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [customWeights, setCustomWeights] = useState<ScoringWeights>({
    fit: 0.3,
    intent: 0.25,
    engagement: 0.2,
    viability: 0.15,
    recency: 0.1
  })

  useEffect(() => {
    fetchLeads()
    fetchScores()
  }, [])

  const fetchLeads = async () => {
    try {
      const response = await fetch('/api/leads?status=GENERATED,ENRICHED')
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

  const fetchScores = async () => {
    try {
      const response = await fetch('/api/leads/scores')
      if (response.ok) {
        const data = await response.json()
        setScores(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching scores:', error)
    }
  }

  const handleEnrichment = async (enrichmentLevel: string) => {
    if (selectedLeads.length === 0) return

    setIsProcessing(true)
    try {
      const response = await fetch('/api/leads/enrich-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'enrich',
          lead_ids: selectedLeads,
          enrichment_level: enrichmentLevel
        })
      })

      if (response.ok) {
        await fetchLeads()
        setSelectedLeads([])
      }
    } catch (error) {
      console.error('Error enriching leads:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleScoring = async () => {
    if (selectedLeads.length === 0) return

    setIsProcessing(true)
    try {
      const response = await fetch('/api/leads/enrich-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'score',
          lead_ids: selectedLeads,
          weights: customWeights
        })
      })

      if (response.ok) {
        await fetchLeads()
        await fetchScores()
        setSelectedLeads([])
      }
    } catch (error) {
      console.error('Error scoring leads:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const getScoreForLead = (leadId: string): LeadScore | undefined => {
    return scores.find(score => score.lead_id === leadId)
  }

  const getSegmentColor = (segment: string) => {
    switch (segment) {
      case 'HOT':
        return 'text-red-600 bg-red-50'
      case 'WARM':
        return 'text-orange-600 bg-orange-50'
      case 'LUKEWARM':
        return 'text-yellow-600 bg-yellow-50'
      case 'COLD':
        return 'text-blue-600 bg-blue-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
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
    
    const leadScore = getScoreForLead(lead.id)
    const matchesSegment = segmentFilter === 'all' || leadScore?.segment === segmentFilter
    
    return matchesSearch && matchesStatus && matchesSegment
  })

  const handleSelectLead = (leadId: string) => {
    setSelectedLeads(prev => 
      prev.includes(leadId) 
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    )
  }

  const handleSelectAll = () => {
    if (selectedLeads.length === filteredLeads.length) {
      setSelectedLeads([])
    } else {
      setSelectedLeads(filteredLeads.map(lead => lead.id))
    }
  }

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
          <h1 className="text-3xl font-bold">Lead Scoring & Enrichment</h1>
          <p className="text-muted-foreground">
            Enhance and score AI-generated leads
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => handleEnrichment('ENHANCED')}
            disabled={isProcessing || selectedLeads.length === 0}
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Enrich Selected
          </Button>
          
          <Button
            onClick={handleScoring}
            disabled={isProcessing || selectedLeads.length === 0}
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <TrendingUp className="h-4 w-4 mr-2" />
            )}
            Score Selected
          </Button>
        </div>
      </div>

      {/* Scoring Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Scoring Configuration</CardTitle>
          <CardDescription>
            Configure the weights for lead scoring
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="space-y-2">
              <Label>Fit Score ({Math.round(customWeights.fit * 100)}%)</Label>
              <Slider
                value={[customWeights.fit]}
                onValueChange={(value) => setCustomWeights({ ...customWeights, fit: value[0] })}
                max={1}
                min={0}
                step={0.05}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Intent Score ({Math.round(customWeights.intent * 100)}%)</Label>
              <Slider
                value={[customWeights.intent]}
                onValueChange={(value) => setCustomWeights({ ...customWeights, intent: value[0] })}
                max={1}
                min={0}
                step={0.05}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Engagement ({Math.round(customWeights.engagement * 100)}%)</Label>
              <Slider
                value={[customWeights.engagement]}
                onValueChange={(value) => setCustomWeights({ ...customWeights, engagement: value[0] })}
                max={1}
                min={0}
                step={0.05}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Viability ({Math.round(customWeights.viability * 100)}%)</Label>
              <Slider
                value={[customWeights.viability]}
                onValueChange={(value) => setCustomWeights({ ...customWeights, viability: value[0] })}
                max={1}
                min={0}
                step={0.05}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Recency ({Math.round(customWeights.recency * 100)}%)</Label>
              <Slider
                value={[customWeights.recency]}
                onValueChange={(value) => setCustomWeights({ ...customWeights, recency: value[0] })}
                max={1}
                min={0}
                step={0.05}
                className="w-full"
              />
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total Weight:</span>
              <span className={`text-sm font-bold ${
                Math.abs(1 - (customWeights.fit + customWeights.intent + customWeights.engagement + customWeights.viability + customWeights.recency)) < 0.01 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}>
                {Math.round((customWeights.fit + customWeights.intent + customWeights.engagement + customWeights.viability + customWeights.recency) * 100)}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

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
              </SelectContent>
            </Select>
            
            <Select value={segmentFilter} onValueChange={setSegmentFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by segment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Segments</SelectItem>
                <SelectItem value="HOT">Hot</SelectItem>
                <SelectItem value="WARM">Warm</SelectItem>
                <SelectItem value="LUKEWARM">Lukewarm</SelectItem>
                <SelectItem value="COLD">Cold</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Leads</CardTitle>
              <CardDescription>
                {filteredLeads.length} of {leads.length} leads
              </CardDescription>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
              >
                {selectedLeads.length === filteredLeads.length ? 'Deselect All' : 'Select All'}
              </Button>
              <span className="text-sm text-muted-foreground">
                {selectedLeads.length} selected
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredLeads.map((lead) => {
              const leadScore = getScoreForLead(lead.id)
              const isSelected = selectedLeads.includes(lead.id)
              
              return (
                <div
                  key={lead.id}
                  className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                    isSelected ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleSelectLead(lead.id)}
                      className="rounded"
                    />
                    
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Target className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium truncate">
                          {lead.first_name} {lead.last_name}
                        </p>
                        <Badge variant="outline">{lead.company_name}</Badge>
                        <Badge variant="outline">{lead.status}</Badge>
                      </div>
                      
                      <div className="flex items-center space-x-4 mt-1">
                        {lead.title && (
                          <p className="text-sm text-muted-foreground truncate">
                            {lead.title}
                          </p>
                        )}
                        <Badge variant="outline">{lead.geography}</Badge>
                        {lead.industry && (
                          <Badge variant="outline">{lead.industry}</Badge>
                        )}
                        {leadScore && (
                          <Badge className={getSegmentColor(leadScore.segment)}>
                            {leadScore.segment}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    {leadScore ? (
                      <div className="text-right">
                        <div className={`text-sm font-medium ${getScoreColor(leadScore.composite)}`}>
                          Score: {Math.round(leadScore.composite)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Fit: {Math.round(leadScore.fit * 100)}% | Intent: {Math.round(leadScore.intent * 100)}%
                        </div>
                      </div>
                    ) : (
                      <div className="text-right">
                        <div className="text-sm font-medium text-muted-foreground">
                          Not Scored
                        </div>
                      </div>
                    )}
                    
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
          
          {filteredLeads.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No leads found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Processing Status */}
      {isProcessing && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Processing leads...</span>
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
              <Progress value={66} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
