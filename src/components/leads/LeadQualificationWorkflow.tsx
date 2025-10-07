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
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, CheckCircle, XCircle, AlertCircle, Eye, Plus, Save } from 'lucide-react';

interface QualificationFramework {
  id: string
  name: string
  description: string
  criteria: Record<string, any>
}

interface LeadQualification {
  id: string
  lead_id: string
  framework: string
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'QUALIFIED' | 'DISQUALIFIED'
  data: Record<string, any>
  created_at: string
  updated_at: string
}

interface FrameworkEvidence {
  id: string
  lead_id: string
  framework: string
  field: string
  value: any
  confidence: number
  source: string
  justification?: string
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
  ai_accounts?: unknown[]
  ai_contacts?: unknown[]
}

const FRAMEWORK_CONFIGS = {
  'BANT': {
    name: 'BANT',
    description: 'Budget, Authority, Need, Timeline',
    criteria: {
      budget: { label: 'Budget', description: 'Does the prospect have budget for this solution?' },
      authority: { label: 'Authority', description: 'Is the contact a decision maker or influencer?' },
      need: { label: 'Need', description: 'Does the prospect have a clear need for this solution?' },
      timeline: { label: 'Timeline', description: 'Is there a specific timeline for implementation?' }
    }
  },
  'CHAMP': {
    name: 'CHAMP',
    description: 'Challenges, Authority, Money, Prioritization',
    criteria: {
      challenges: { label: 'Challenges', description: 'What challenges is the prospect facing?' },
      authority: { label: 'Authority', description: 'Who has the authority to make decisions?' },
      money: { label: 'Money', description: 'What is the budget for solving these challenges?' },
      prioritization: { label: 'Prioritization', description: 'How high is this on their priority list?' }
    }
  },
  'GPCTBA/C&I': {
    name: 'GPCTBA/C&I',
    description: 'Goals, Plans, Challenges, Timeline, Budget, Authority, Consequences & Implications',
    criteria: {
      goals: { label: 'Goals', description: 'What are the prospect\'s business goals?' },
      plans: { label: 'Plans', description: 'What plans do they have to achieve these goals?' },
      challenges: { label: 'Challenges', description: 'What challenges are preventing goal achievement?' },
      timeline: { label: 'Timeline', description: 'What is the timeline for addressing challenges?' },
      budget: { label: 'Budget', description: 'What budget is allocated for solutions?' },
      authority: { label: 'Authority', description: 'Who has authority to approve solutions?' },
      consequences: { label: 'Consequences', description: 'What happens if challenges aren\'t addressed?' }
    }
  },
  'SPICED': {
    name: 'SPICED',
    description: 'Situation, Problem, Implication, Consequence, Evidence, Decision',
    criteria: {
      situation: { label: 'Situation', description: 'What is the current situation?' },
      problem: { label: 'Problem', description: 'What specific problem exists?' },
      implication: { label: 'Implication', description: 'What are the implications of this problem?' },
      consequence: { label: 'Consequence', description: 'What are the consequences of inaction?' },
      evidence: { label: 'Evidence', description: 'What evidence supports the problem?' },
      decision: { label: 'Decision', description: 'Who makes the decision to solve this?' }
    }
  },
  'ANUM': {
    name: 'ANUM',
    description: 'Authority, Need, Urgency, Money',
    criteria: {
      authority: { label: 'Authority', description: 'Does the contact have decision-making authority?' },
      need: { label: 'Need', description: 'Is there a clear need for the solution?' },
      urgency: { label: 'Urgency', description: 'How urgent is the need?' },
      money: { label: 'Money', description: 'Is there budget available?' }
    }
  },
  'FAINT': {
    name: 'FAINT',
    description: 'Funds, Authority, Interest, Need, Timeline',
    criteria: {
      funds: { label: 'Funds', description: 'Are funds available for this solution?' },
      authority: { label: 'Authority', description: 'Does the contact have authority to buy?' },
      interest: { label: 'Interest', description: 'Is there interest in the solution?' },
      need: { label: 'Need', description: 'Is there a clear need?' },
      timeline: { label: 'Timeline', description: 'What is the timeline for implementation?' }
    }
  },
  'NEAT': {
    name: 'NEAT',
    description: 'Need, Economic Impact, Access to Authority, Timeline',
    criteria: {
      need: { label: 'Need', description: 'What is the specific need?' },
      economic_impact: { label: 'Economic Impact', description: 'What is the economic impact of the need?' },
      access_to_authority: { label: 'Access to Authority', description: 'Do we have access to decision makers?' },
      timeline: { label: 'Timeline', description: 'What is the implementation timeline?' }
    }
  },
  'PACT': {
    name: 'PACT',
    description: 'Pain, Authority, Competition, Timescale',
    criteria: {
      pain: { label: 'Pain', description: 'What pain points exist?' },
      authority: { label: 'Authority', description: 'Who has authority to address pain points?' },
      competition: { label: 'Competition', description: 'What competition exists?' },
      timescale: { label: 'Timescale', description: 'What is the timescale for resolution?' }
    }
  },
  'JTBD_FIT': {
    name: 'Jobs-to-be-Done Fit',
    description: 'Job-to-be-Done, Fit',
    criteria: {
      job_to_be_done: { label: 'Job-to-be-Done', description: 'What job is the prospect trying to accomplish?' },
      fit: { label: 'Fit', description: 'How well does our solution fit the job?' }
    }
  },
  'FIVE_FIT': {
    name: '5-Fit',
    description: 'Fit, Interest, Timing, Budget, Authority',
    criteria: {
      fit: { label: 'Fit', description: 'Does the prospect fit our ideal customer profile?' },
      interest: { label: 'Interest', description: 'Is there interest in our solution?' },
      timing: { label: 'Timing', description: 'Is the timing right for implementation?' },
      budget: { label: 'Budget', description: 'Is there budget available?' },
      authority: { label: 'Authority', description: 'Does the contact have authority?' }
    }
  },
  'ABM': {
    name: 'Account-Based Marketing',
    description: 'Account Fit, Buying Committee, Engagement',
    criteria: {
      account_fit: { label: 'Account Fit', description: 'Does the account fit our ideal customer profile?' },
      buying_committee: { label: 'Buying Committee', description: 'Have we identified the buying committee?' },
      engagement: { label: 'Engagement', description: 'Are we engaging with key stakeholders?' }
    }
  },
  'TARGETING': {
    name: 'Targeting',
    description: 'Demographic, Firmographic, Technographic, Behavioral Fit',
    criteria: {
      demographic_fit: { label: 'Demographic Fit', description: 'Does the prospect fit demographic criteria?' },
      firmographic_fit: { label: 'Firmographic Fit', description: 'Does the company fit firmographic criteria?' },
      technographic_fit: { label: 'Technographic Fit', description: 'Does their tech stack fit our criteria?' },
      behavioral_fit: { label: 'Behavioral Fit', description: 'Do their behaviors indicate fit?' }
    }
  }
}

export function LeadQualificationWorkflow() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [qualifications, setQualifications] = useState<LeadQualification[]>([])
  const [evidence, setEvidence] = useState<FrameworkEvidence[]>([])
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [selectedFramework, setSelectedFramework] = useState<string>('BANT')
  const [loading, setLoading] = useState(true)
  const [qualifying, setQualifying] = useState(false)
  const [newEvidence, setNewEvidence] = useState<Partial<FrameworkEvidence>>({})

  useEffect(() => {
    fetchLeads()
    fetchQualifications()
    fetchEvidence()
  }, [])

  const fetchLeads = async () => {
    try {
      const response = await fetch('/api/leads?status=ENRICHED,QUALIFIED')
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

  const fetchQualifications = async () => {
    try {
      const response = await fetch('/api/leads/qualifications')
      if (response.ok) {
        const data = await response.json()
        setQualifications(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching qualifications:', error)
    }
  }

  const fetchEvidence = async () => {
    try {
      const response = await fetch('/api/leads/evidence')
      if (response.ok) {
        const data = await response.json()
        setEvidence(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching evidence:', error)
    }
  }

  const handleQualifyLead = async (leadId: string, framework: string) => {
    setQualifying(true)
    try {
      const response = await fetch('/api/leads/qualify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'qualify',
          lead_ids: [leadId],
          framework,
          auto_qualify: false
        })
      })

      if (response.ok) {
        await fetchQualifications()
        await fetchEvidence()
      }
    } catch (error) {
      console.error('Error qualifying lead:', error)
    } finally {
      setQualifying(false)
    }
  }

  const handleAddEvidence = async () => {
    if (!selectedLead || !newEvidence.field || !newEvidence.value) return

    try {
      const response = await fetch('/api/leads/qualify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'add_evidence',
          lead_id: selectedLead.id,
          framework: selectedFramework,
          field: newEvidence.field,
          value: newEvidence.value,
          confidence: newEvidence.confidence || 0.8,
          source: 'USER',
          justification: newEvidence.justification
        })
      })

      if (response.ok) {
        setNewEvidence({})
        await fetchEvidence()
      }
    } catch (error) {
      console.error('Error adding evidence:', error)
    }
  }

  const getQualificationStatus = (leadId: string, framework: string) => {
    const qualification = qualifications.find(
      q => q.lead_id === leadId && q.framework === framework
    )
    return qualification?.status || 'NOT_STARTED'
  }

  const getQualificationData = (leadId: string, framework: string) => {
    const qualification = qualifications.find(
      q => q.lead_id === leadId && q.framework === framework
    )
    return qualification?.data || {}
  }

  const getEvidenceForLead = (leadId: string, framework: string) => {
    return evidence.filter(e => e.lead_id === leadId && e.framework === framework)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'QUALIFIED':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'DISQUALIFIED':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'IN_PROGRESS':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
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
          <h1 className="text-3xl font-bold">Lead Qualification</h1>
          <p className="text-muted-foreground">
            Qualify leads using various frameworks
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Select value={selectedFramework} onValueChange={setSelectedFramework}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select framework" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(FRAMEWORK_CONFIGS).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  {config.name} - {config.description}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leads List */}
        <Card>
          <CardHeader>
            <CardTitle>Leads to Qualify</CardTitle>
            <CardDescription>
              Select a lead to begin qualification
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {leads.map((lead) => (
                <div
                  key={lead.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedLead?.id === lead.id ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedLead(lead)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-medium">{lead.first_name} {lead.last_name}</p>
                        <Badge variant="outline">{lead.company_name}</Badge>
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-sm text-muted-foreground">Score: {lead.score}</span>
                        <Badge variant="outline">{lead.geography}</Badge>
                        {lead.industry && <Badge variant="outline">{lead.industry}</Badge>}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(getQualificationStatus(lead.id, selectedFramework))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleQualifyLead(lead.id, selectedFramework)
                        }}
                        disabled={qualifying}
                      >
                        {qualifying ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Qualification Details */}
        <Card>
          <CardHeader>
            <CardTitle>Qualification Details</CardTitle>
            <CardDescription>
              {selectedLead ? `${selectedLead.first_name} ${selectedLead.last_name}` : 'Select a lead to view details'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedLead ? (
              <Tabs defaultValue="framework" className="w-full">
                <TabsList>
                  <TabsTrigger value="framework">Framework</TabsTrigger>
                  <TabsTrigger value="evidence">Evidence</TabsTrigger>
                  <TabsTrigger value="add-evidence">Add Evidence</TabsTrigger>
                </TabsList>
                
                <TabsContent value="framework" className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">
                      {FRAMEWORK_CONFIGS[selectedFramework as keyof typeof FRAMEWORK_CONFIGS]?.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {FRAMEWORK_CONFIGS[selectedFramework as keyof typeof FRAMEWORK_CONFIGS]?.description}
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    {Object.entries(FRAMEWORK_CONFIGS[selectedFramework as keyof typeof FRAMEWORK_CONFIGS]?.criteria || {}).map(([key, criterion]) => {
                      const qualificationData = getQualificationData(selectedLead.id, selectedFramework)
                      const isQualified = qualificationData[key]?.qualified || false
                      
                      return (
                        <div key={key} className="flex items-center space-x-3 p-3 border rounded-lg">
                          <Checkbox
                            checked={isQualified}
                            disabled
                          />
                          <div className="flex-1">
                            <Label className="font-medium">{criterion.label}</Label>
                            <p className="text-sm text-muted-foreground">{criterion.description}</p>
                            {qualificationData[key] && (
                              <div className="mt-1">
                                <Badge variant={isQualified ? 'success' : 'secondary'}>
                                  {isQualified ? 'Qualified' : 'Not Qualified'}
                                </Badge>
                                {qualificationData[key].confidence && (
                                  <span className="text-xs text-muted-foreground ml-2">
                                    Confidence: {Math.round(qualificationData[key].confidence * 100)}%
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Overall Status:</span>
                      <Badge variant={
                        getQualificationStatus(selectedLead.id, selectedFramework) === 'QUALIFIED' ? 'success' :
                        getQualificationStatus(selectedLead.id, selectedFramework) === 'DISQUALIFIED' ? 'destructive' :
                        getQualificationStatus(selectedLead.id, selectedFramework) === 'IN_PROGRESS' ? 'secondary' :
                        'outline'
                      }>
                        {getQualificationStatus(selectedLead.id, selectedFramework).replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="evidence" className="space-y-4">
                  <div className="space-y-3">
                    {getEvidenceForLead(selectedLead.id, selectedFramework).map((evidenceItem) => (
                      <div key={evidenceItem.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{evidenceItem.field}</span>
                          <Badge variant="outline">{evidenceItem.source}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {JSON.stringify(evidenceItem.value)}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            Confidence: {Math.round(evidenceItem.confidence * 100)}%
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(evidenceItem.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {evidenceItem.justification && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Justification: {evidenceItem.justification}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="add-evidence" className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="field">Field</Label>
                      <Input
                        id="field"
                        value={newEvidence.field || ''}
                        onChange={(e) => setNewEvidence({ ...newEvidence, field: e.target.value })}
                        placeholder="e.g., budget, authority, need"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="value">Value</Label>
                      <Textarea
                        id="value"
                        value={newEvidence.value || ''}
                        onChange={(e) => setNewEvidence({ ...newEvidence, value: e.target.value })}
                        placeholder="Evidence or value"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="confidence">Confidence (0-1)</Label>
                      <Input
                        id="confidence"
                        type="number"
                        min="0"
                        max="1"
                        step="0.1"
                        value={newEvidence.confidence || 0.8}
                        onChange={(e) => setNewEvidence({ ...newEvidence, confidence: parseFloat(e.target.value) })}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="justification">Justification</Label>
                      <Textarea
                        id="justification"
                        value={newEvidence.justification || ''}
                        onChange={(e) => setNewEvidence({ ...newEvidence, justification: e.target.value })}
                        placeholder="Why is this evidence relevant?"
                      />
                    </div>
                    
                    <Button onClick={handleAddEvidence} className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Evidence
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Select a lead to view qualification details</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
