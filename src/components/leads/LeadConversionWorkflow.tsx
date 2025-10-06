'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, ArrowRight, Building, Users, DollarSign, Calendar, Eye, CheckCircle, XCircle } from 'lucide-react'

interface QualifiedLead {
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
  ai_accounts?: any[]
  ai_contacts?: any[]
  enhanced_lead_scores?: any[]
}

interface ConversionJob {
  id: string
  lead_id: string
  status: 'PENDING' | 'IN_PROGRESS' | 'SUCCEEDED' | 'FAILED' | 'ROLLED_BACK'
  idempotency_key: string
  request_payload: any
  response_payload?: any
  created_at: string
  updated_at: string
}

interface OpportunityData {
  name?: string
  stage: 'prospecting' | 'qualifying' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost'
  value?: number
  probability: number
  close_date?: string
  description?: string
  meddpicc_data?: any
}

export function LeadConversionWorkflow() {
  const [leads, setLeads] = useState<QualifiedLead[]>([])
  const [conversionJobs, setConversionJobs] = useState<ConversionJob[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLeads, setSelectedLeads] = useState<string[]>([])
  const [isConverting, setIsConverting] = useState(false)
  const [opportunityData, setOpportunityData] = useState<OpportunityData>({
    stage: 'prospecting',
    probability: 0
  })
  const [showConversionDialog, setShowConversionDialog] = useState(false)

  useEffect(() => {
    fetchLeads()
    fetchConversionJobs()
  }, [])

  const fetchLeads = async () => {
    try {
      const response = await fetch('/api/leads?status=QUALIFIED')
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

  const fetchConversionJobs = async () => {
    try {
      const response = await fetch('/api/leads/conversion-jobs')
      if (response.ok) {
        const data = await response.json()
        setConversionJobs(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching conversion jobs:', error)
    }
  }

  const handleConvertLeads = async () => {
    if (selectedLeads.length === 0) return

    setIsConverting(true)
    try {
      const response = await fetch('/api/leads/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lead_ids: selectedLeads,
          opportunity_data: opportunityData
        })
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Conversion successful:', data)
        
        // Poll for conversion job status
        if (data.data.conversions.length > 0) {
          const jobIds = data.data.conversions.map((conv: any) => conv.job_id)
          pollConversionJobs(jobIds)
        }
        
        setShowConversionDialog(false)
        setSelectedLeads([])
        await fetchLeads()
        await fetchConversionJobs()
      }
    } catch (error) {
      console.error('Error converting leads:', error)
    } finally {
      setIsConverting(false)
    }
  }

  const pollConversionJobs = async (jobIds: string[]) => {
    const pollInterval = setInterval(async () => {
      try {
        const allCompleted = await Promise.all(
          jobIds.map(async (jobId) => {
            const response = await fetch(`/api/leads/conversion-jobs/${jobId}`)
            if (response.ok) {
              const data = await response.json()
              return data.data.status === 'SUCCEEDED' || data.data.status === 'FAILED'
            }
            return false
          })
        )

        if (allCompleted.every(completed => completed)) {
          clearInterval(pollInterval)
          await fetchConversionJobs()
        }
      } catch (error) {
        console.error('Error polling conversion jobs:', error)
        clearInterval(pollInterval)
      }
    }, 2000)

    // Clear interval after 5 minutes
    setTimeout(() => clearInterval(pollInterval), 300000)
  }

  const getConversionStatus = (leadId: string) => {
    const job = conversionJobs.find(job => job.lead_id === leadId)
    return job?.status || null
  }

  const getConversionStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCEEDED':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'IN_PROGRESS':
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
      case 'PENDING':
        return <div className="h-4 w-4 rounded-full border-2 border-yellow-600" />
      default:
        return null
    }
  }

  const handleSelectLead = (leadId: string) => {
    setSelectedLeads(prev => 
      prev.includes(leadId) 
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    )
  }

  const handleSelectAll = () => {
    if (selectedLeads.length === leads.length) {
      setSelectedLeads([])
    } else {
      setSelectedLeads(leads.map(lead => lead.id))
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
          <h1 className="text-3xl font-bold">Lead Conversion</h1>
          <p className="text-muted-foreground">
            Convert qualified leads to opportunities
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => setShowConversionDialog(true)}
            disabled={selectedLeads.length === 0}
          >
            <ArrowRight className="h-4 w-4 mr-2" />
            Convert Selected ({selectedLeads.length})
          </Button>
        </div>
      </div>

      {/* Conversion Dialog */}
      {showConversionDialog && (
        <Card className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <CardContent className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full mx-4">
            <CardHeader>
              <CardTitle>Convert Leads to Opportunities</CardTitle>
              <CardDescription>
                Configure opportunity details for {selectedLeads.length} selected leads
              </CardDescription>
            </CardHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="opportunity-name">Opportunity Name Template</Label>
                <Input
                  id="opportunity-name"
                  value={opportunityData.name || ''}
                  onChange={(e) => setOpportunityData({ ...opportunityData, name: e.target.value })}
                  placeholder="e.g., {company_name} - {contact_title}"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Use {`{company_name}`}, {`{contact_title}`}, {`{contact_name}`} as placeholders
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="stage">Initial Stage</Label>
                  <Select
                    value={opportunityData.stage}
                    onValueChange={(value: any) => setOpportunityData({ ...opportunityData, stage: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prospecting">Prospecting</SelectItem>
                      <SelectItem value="qualifying">Qualifying</SelectItem>
                      <SelectItem value="proposal">Proposal</SelectItem>
                      <SelectItem value="negotiation">Negotiation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="probability">Initial Probability (%)</Label>
                  <Input
                    id="probability"
                    type="number"
                    min="0"
                    max="100"
                    value={opportunityData.probability}
                    onChange={(e) => setOpportunityData({ ...opportunityData, probability: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="value">Estimated Value</Label>
                  <Input
                    id="value"
                    type="number"
                    min="0"
                    value={opportunityData.value || ''}
                    onChange={(e) => setOpportunityData({ ...opportunityData, value: parseFloat(e.target.value) || undefined })}
                    placeholder="Optional"
                  />
                </div>
                
                <div>
                  <Label htmlFor="close-date">Expected Close Date</Label>
                  <Input
                    id="close-date"
                    type="date"
                    value={opportunityData.close_date || ''}
                    onChange={(e) => setOpportunityData({ ...opportunityData, close_date: e.target.value })}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description Template</Label>
                <Textarea
                  id="description"
                  value={opportunityData.description || ''}
                  onChange={(e) => setOpportunityData({ ...opportunityData, description: e.target.value })}
                  placeholder="e.g., Converted from AI-generated lead: {contact_name} at {company_name}"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowConversionDialog(false)}
                disabled={isConverting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConvertLeads}
                disabled={isConverting}
              >
                {isConverting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4 mr-2" />
                )}
                Convert Leads
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conversion Jobs Status */}
      {conversionJobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Conversions</CardTitle>
            <CardDescription>
              Track the status of recent lead conversions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {conversionJobs.slice(0, 5).map((job) => (
                <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getConversionStatusIcon(job.status)}
                    <div>
                      <p className="text-sm font-medium">Lead Conversion Job</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(job.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant={
                    job.status === 'SUCCEEDED' ? 'success' :
                    job.status === 'FAILED' ? 'destructive' :
                    job.status === 'IN_PROGRESS' ? 'secondary' :
                    'outline'
                  }>
                    {job.status.replace('_', ' ')}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Qualified Leads */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Qualified Leads</CardTitle>
              <CardDescription>
                {leads.length} qualified leads ready for conversion
              </CardDescription>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
              >
                {selectedLeads.length === leads.length ? 'Deselect All' : 'Select All'}
              </Button>
              <span className="text-sm text-muted-foreground">
                {selectedLeads.length} selected
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {leads.map((lead) => {
              const conversionStatus = getConversionStatus(lead.id)
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
                      disabled={!!conversionStatus}
                    />
                    
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Building className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium truncate">
                          {lead.first_name} {lead.last_name}
                        </p>
                        <Badge variant="outline">{lead.company_name}</Badge>
                        <Badge variant="success">Qualified</Badge>
                        {conversionStatus && getConversionStatusIcon(conversionStatus)}
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
                        <Badge variant="outline">Score: {lead.score}</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {lead.revenue_band || 'Unknown Revenue'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {lead.employee_band || 'Unknown Size'}
                      </div>
                    </div>
                    
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
          
          {leads.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No qualified leads found</p>
              <p className="text-sm text-muted-foreground mt-2">
                Leads need to be qualified before they can be converted to opportunities
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Conversion Tips */}
      <Alert>
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-medium">Conversion Tips:</p>
            <ul className="text-sm space-y-1 list-disc list-inside">
              <li>Ensure leads are properly qualified before conversion</li>
              <li>Set realistic probability percentages based on qualification scores</li>
              <li>Use opportunity name templates to maintain consistency</li>
              <li>Include relevant MEDDPICC data if available</li>
              <li>Set appropriate close dates based on sales cycle length</li>
            </ul>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  )
}
