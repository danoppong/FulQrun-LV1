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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Plus, Play, Eye, Edit, Trash2, Filter, Search } from 'lucide-react'
import { LeadBriefForm } from './LeadBriefForm'
import { ICPProfileManagement } from '@/components/icp-profiles/ICPProfileManagement'

interface LeadBrief {
  id: string
  lead_type: 'account' | 'contact'
  geography: 'US' | 'EU' | 'UK' | 'APAC'
  industry?: string
  revenue_band?: string
  employee_band?: string
  entity_type: 'PUBLIC' | 'PRIVATE' | 'NONPROFIT' | 'OTHER'
  technographics: string[]
  installed_tools_hints: string[]
  intent_keywords: string[]
  time_horizon?: 'NEAR_TERM' | 'MID_TERM' | 'LONG_TERM'
  notes?: string
  icp_profile_id: string
  status: 'draft' | 'submitted' | 'orchestrated'
  created_at: string
  updated_at: string
  icp_profiles: {
    id: string
    name: string
    description?: string
  }
}

interface GenerationJob {
  id: string
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
  estimated_completion_time?: string
  generated_leads_count?: number
  errors?: string[]
}

export function LeadBriefDashboard() {
  const [leadBriefs, setLeadBriefs] = useState<LeadBrief[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedBrief, setSelectedBrief] = useState<LeadBrief | null>(null)
  const [generationJob, setGenerationJob] = useState<GenerationJob | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  useEffect(() => {
    fetchLeadBriefs()
  }, [])

  const fetchLeadBriefs = async () => {
    try {
      const response = await fetch('/api/lead-briefs')
      if (response.ok) {
        const data = await response.json()
        setLeadBriefs(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching lead briefs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateLeads = async (briefId: string) => {
    setIsGenerating(true)
    try {
      const response = await fetch('/api/leads/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lead_brief_id: briefId,
          target_count: 100,
          priority: 'MEDIUM',
          enrichment_level: 'ENHANCED'
        })
      })

      if (response.ok) {
        const data = await response.json()
        setGenerationJob(data.data)
        
        // Poll for job completion
        pollJobStatus(data.data.job_id)
      } else {
        const error = await response.json()
        console.error('Error generating leads:', error)
      }
    } catch (error) {
      console.error('Error generating leads:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const pollJobStatus = async (jobId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/leads/generate?job_id=${jobId}`)
        if (response.ok) {
          const data = await response.json()
          const job = data.data
          setGenerationJob(job)

          if (job.status === 'COMPLETED' || job.status === 'FAILED') {
            clearInterval(pollInterval)
            fetchLeadBriefs() // Refresh the list
          }
        }
      } catch (error) {
        console.error('Error polling job status:', error)
        clearInterval(pollInterval)
      }
    }, 2000)

    // Clear interval after 5 minutes
    setTimeout(() => clearInterval(pollInterval), 300000)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { variant: 'secondary' as const, label: 'Draft' },
      submitted: { variant: 'default' as const, label: 'Submitted' },
      orchestrated: { variant: 'success' as const, label: 'Orchestrated' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const filteredBriefs = leadBriefs.filter(brief => {
    const matchesSearch = brief.icp_profiles.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         brief.industry?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         brief.geography.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || brief.status === statusFilter
    
    return matchesSearch && matchesStatus
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
          <h1 className="text-3xl font-bold">AI Lead Management</h1>
          <p className="text-muted-foreground">
            Create and manage AI-powered lead generation briefs
          </p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Lead Brief
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Lead Brief</DialogTitle>
              <DialogDescription>
                Define criteria for AI-powered lead generation
              </DialogDescription>
            </DialogHeader>
            <LeadBriefForm onSuccess={() => {
              setShowCreateDialog(false)
              fetchLeadBriefs()
            }} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Generation Job Status */}
      {generationJob && (
        <Alert>
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <strong>Generation Job Status:</strong> {generationJob.status}
                {generationJob.generated_leads_count && (
                  <span className="ml-2">
                    - Generated {generationJob.generated_leads_count} leads
                  </span>
                )}
              </div>
              {generationJob.status === 'IN_PROGRESS' && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search lead briefs..."
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
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="orchestrated">Orchestrated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lead Briefs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBriefs.map((brief) => (
          <Card key={brief.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{brief.icp_profiles.name}</CardTitle>
                {getStatusBadge(brief.status)}
              </div>
              <CardDescription>
                {brief.lead_type === 'account' ? 'Account-based' : 'Contact-based'} lead generation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">Geography:</span>
                  <Badge variant="outline">{brief.geography}</Badge>
                </div>
                {brief.industry && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Industry:</span>
                    <span className="text-sm text-muted-foreground">{brief.industry}</span>
                  </div>
                )}
                {brief.revenue_band && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Revenue:</span>
                    <span className="text-sm text-muted-foreground">{brief.revenue_band}</span>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">Entity Type:</span>
                  <Badge variant="outline">{brief.entity_type}</Badge>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                  Created: {new Date(brief.created_at).toLocaleDateString()}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedBrief(brief)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Button>
                
                {brief.status === 'submitted' && (
                  <Button
                    size="sm"
                    onClick={() => handleGenerateLeads(brief.id)}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    Generate Leads
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredBriefs.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground">No lead briefs found</p>
              <Button
                className="mt-4"
                onClick={() => setShowCreateDialog(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Lead Brief
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lead Brief Detail Modal */}
      {selectedBrief && (
        <Dialog open={!!selectedBrief} onOpenChange={() => setSelectedBrief(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Lead Brief Details</DialogTitle>
              <DialogDescription>
                {selectedBrief.icp_profiles.name} - {selectedBrief.lead_type} generation
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="overview" className="w-full">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="criteria">Criteria</TabsTrigger>
                <TabsTrigger value="technographics">Technographics</TabsTrigger>
                <TabsTrigger value="intent">Intent</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Lead Type</Label>
                    <p className="text-sm font-medium capitalize">{selectedBrief.lead_type}</p>
                  </div>
                  <div>
                    <Label>Geography</Label>
                    <p className="text-sm font-medium">{selectedBrief.geography}</p>
                  </div>
                  <div>
                    <Label>Industry</Label>
                    <p className="text-sm font-medium">{selectedBrief.industry || 'Not specified'}</p>
                  </div>
                  <div>
                    <Label>Revenue Band</Label>
                    <p className="text-sm font-medium">{selectedBrief.revenue_band || 'Not specified'}</p>
                  </div>
                  <div>
                    <Label>Employee Band</Label>
                    <p className="text-sm font-medium">{selectedBrief.employee_band || 'Not specified'}</p>
                  </div>
                  <div>
                    <Label>Entity Type</Label>
                    <p className="text-sm font-medium">{selectedBrief.entity_type}</p>
                  </div>
                </div>
                
                {selectedBrief.notes && (
                  <div>
                    <Label>Notes</Label>
                    <p className="text-sm">{selectedBrief.notes}</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="criteria" className="space-y-4">
                <div>
                  <Label>ICP Profile</Label>
                  <p className="text-sm font-medium">{selectedBrief.icp_profiles.name}</p>
                  {selectedBrief.icp_profiles.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedBrief.icp_profiles.description}
                    </p>
                  )}
                </div>
                
                <div>
                  <Label>Time Horizon</Label>
                  <p className="text-sm font-medium">
                    {selectedBrief.time_horizon ? selectedBrief.time_horizon.replace('_', ' ') : 'Not specified'}
                  </p>
                </div>
              </TabsContent>
              
              <TabsContent value="technographics" className="space-y-4">
                <div>
                  <Label>Technographics</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedBrief.technographics.length > 0 ? (
                      selectedBrief.technographics.map((tech, index) => (
                        <Badge key={index} variant="outline">{tech}</Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">None specified</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <Label>Installed Tools Hints</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedBrief.installed_tools_hints.length > 0 ? (
                      selectedBrief.installed_tools_hints.map((tool, index) => (
                        <Badge key={index} variant="outline">{tool}</Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">None specified</p>
                    )}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="intent" className="space-y-4">
                <div>
                  <Label>Intent Keywords</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedBrief.intent_keywords.length > 0 ? (
                      selectedBrief.intent_keywords.map((keyword, index) => (
                        <Badge key={index} variant="outline">{keyword}</Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">None specified</p>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
