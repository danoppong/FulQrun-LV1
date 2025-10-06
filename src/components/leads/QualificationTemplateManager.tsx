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
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Loader2, Save, Plus, Copy, Trash2, Settings, Target, CheckCircle, AlertCircle } from 'lucide-react'

interface QualificationTemplate {
  id: string
  name: string
  description: string
  framework: string
  criteria: Record<string, QualificationCriterion>
  weights: Record<string, number>
  thresholds: {
    qualified: number
    disqualified: number
  }
  auto_qualify: boolean
  organization_id: string
  created_by: string
  created_at: string
  updated_at: string
}

interface QualificationCriterion {
  id: string
  label: string
  description: string
  type: 'boolean' | 'numeric' | 'text' | 'select' | 'multi_select'
  required: boolean
  weight: number
  options?: string[]
  validation?: {
    min?: number
    max?: number
    pattern?: string
  }
  scoring_rules?: {
    conditions: Array<{
      condition: string
      score: number
      weight: number
    }>
  }
}

interface QualificationPreset {
  id: string
  name: string
  description: string
  framework: string
  industry: string
  company_size: string
  use_case: string
  template: QualificationTemplate
}

const FRAMEWORK_PRESETS = {
  'BANT': {
    name: 'BANT',
    description: 'Budget, Authority, Need, Timeline',
    criteria: {
      budget: {
        id: 'budget',
        label: 'Budget',
        description: 'Does the prospect have budget for this solution?',
        type: 'boolean',
        required: true,
        weight: 0.3,
        scoring_rules: {
          conditions: [
            { condition: 'true', score: 1.0, weight: 0.3 },
            { condition: 'false', score: 0.0, weight: 0.3 }
          ]
        }
      },
      authority: {
        id: 'authority',
        label: 'Authority',
        description: 'Is the contact a decision maker or influencer?',
        type: 'select',
        required: true,
        weight: 0.25,
        options: ['Decision Maker', 'Influencer', 'End User', 'Unknown'],
        scoring_rules: {
          conditions: [
            { condition: 'Decision Maker', score: 1.0, weight: 0.25 },
            { condition: 'Influencer', score: 0.7, weight: 0.25 },
            { condition: 'End User', score: 0.3, weight: 0.25 },
            { condition: 'Unknown', score: 0.0, weight: 0.25 }
          ]
        }
      },
      need: {
        id: 'need',
        label: 'Need',
        description: 'Does the prospect have a clear need for this solution?',
        type: 'boolean',
        required: true,
        weight: 0.25,
        scoring_rules: {
          conditions: [
            { condition: 'true', score: 1.0, weight: 0.25 },
            { condition: 'false', score: 0.0, weight: 0.25 }
          ]
        }
      },
      timeline: {
        id: 'timeline',
        label: 'Timeline',
        description: 'Is there a specific timeline for implementation?',
        type: 'select',
        required: true,
        weight: 0.2,
        options: ['Immediate (0-3 months)', 'Short-term (3-6 months)', 'Medium-term (6-12 months)', 'Long-term (12+ months)', 'No timeline'],
        scoring_rules: {
          conditions: [
            { condition: 'Immediate (0-3 months)', score: 1.0, weight: 0.2 },
            { condition: 'Short-term (3-6 months)', score: 0.8, weight: 0.2 },
            { condition: 'Medium-term (6-12 months)', score: 0.6, weight: 0.2 },
            { condition: 'Long-term (12+ months)', score: 0.3, weight: 0.2 },
            { condition: 'No timeline', score: 0.0, weight: 0.2 }
          ]
        }
      }
    }
  },
  'CHAMP': {
    name: 'CHAMP',
    description: 'Challenges, Authority, Money, Prioritization',
    criteria: {
      challenges: {
        id: 'challenges',
        label: 'Challenges',
        description: 'What challenges is the prospect facing?',
        type: 'multi_select',
        required: true,
        weight: 0.3,
        options: ['Cost Reduction', 'Efficiency', 'Scalability', 'Compliance', 'Customer Experience', 'Security'],
        scoring_rules: {
          conditions: [
            { condition: 'multiple_selected', score: 1.0, weight: 0.3 },
            { condition: 'single_selected', score: 0.7, weight: 0.3 },
            { condition: 'none_selected', score: 0.0, weight: 0.3 }
          ]
        }
      },
      authority: {
        id: 'authority',
        label: 'Authority',
        description: 'Who has the authority to make decisions?',
        type: 'select',
        required: true,
        weight: 0.25,
        options: ['C-Level', 'VP Level', 'Director Level', 'Manager Level', 'Unknown'],
        scoring_rules: {
          conditions: [
            { condition: 'C-Level', score: 1.0, weight: 0.25 },
            { condition: 'VP Level', score: 0.9, weight: 0.25 },
            { condition: 'Director Level', score: 0.7, weight: 0.25 },
            { condition: 'Manager Level', score: 0.5, weight: 0.25 },
            { condition: 'Unknown', score: 0.0, weight: 0.25 }
          ]
        }
      },
      money: {
        id: 'money',
        label: 'Money',
        description: 'What is the budget for solving these challenges?',
        type: 'select',
        required: true,
        weight: 0.25,
        options: ['>$1M', '$500K-$1M', '$100K-$500K', '$50K-$100K', '<$50K', 'Unknown'],
        scoring_rules: {
          conditions: [
            { condition: '>$1M', score: 1.0, weight: 0.25 },
            { condition: '$500K-$1M', score: 0.9, weight: 0.25 },
            { condition: '$100K-$500K', score: 0.8, weight: 0.25 },
            { condition: '$50K-$100K', score: 0.6, weight: 0.25 },
            { condition: '<$50K', score: 0.3, weight: 0.25 },
            { condition: 'Unknown', score: 0.0, weight: 0.25 }
          ]
        }
      },
      prioritization: {
        id: 'prioritization',
        label: 'Prioritization',
        description: 'How high is this on their priority list?',
        type: 'select',
        required: true,
        weight: 0.2,
        options: ['Critical', 'High', 'Medium', 'Low', 'Not a priority'],
        scoring_rules: {
          conditions: [
            { condition: 'Critical', score: 1.0, weight: 0.2 },
            { condition: 'High', score: 0.8, weight: 0.2 },
            { condition: 'Medium', score: 0.6, weight: 0.2 },
            { condition: 'Low', score: 0.3, weight: 0.2 },
            { condition: 'Not a priority', score: 0.0, weight: 0.2 }
          ]
        }
      }
    }
  }
}

export function QualificationTemplateManager() {
  const [templates, setTemplates] = useState<QualificationTemplate[]>([])
  const [presets, setPresets] = useState<QualificationPreset[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<QualificationTemplate | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Partial<QualificationTemplate>>({})
  const [activeTab, setActiveTab] = useState('templates')

  useEffect(() => {
    fetchTemplates()
    fetchPresets()
  }, [])

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/qualification/templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPresets = async () => {
    try {
      const response = await fetch('/api/qualification/presets')
      if (response.ok) {
        const data = await response.json()
        setPresets(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching presets:', error)
    }
  }

  const handleCreateTemplate = async () => {
    try {
      const response = await fetch('/api/qualification/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingTemplate)
      })

      if (response.ok) {
        await fetchTemplates()
        setShowCreateDialog(false)
        setEditingTemplate({})
      }
    } catch (error) {
      console.error('Error creating template:', error)
    }
  }

  const handleCreateFromPreset = async (preset: QualificationPreset) => {
    setEditingTemplate({
      name: `${preset.template.name} - ${preset.industry}`,
      description: `${preset.template.description} for ${preset.industry} companies`,
      framework: preset.framework,
      criteria: preset.template.criteria,
      weights: preset.template.weights,
      thresholds: preset.template.thresholds,
      auto_qualify: preset.template.auto_qualify
    })
    setShowCreateDialog(true)
  }

  const handleEditTemplate = (template: QualificationTemplate) => {
    setSelectedTemplate(template)
    setEditingTemplate(template)
  }

  const handleSaveTemplate = async () => {
    if (!selectedTemplate) return

    try {
      const response = await fetch(`/api/qualification/templates/${selectedTemplate.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingTemplate)
      })

      if (response.ok) {
        await fetchTemplates()
        setSelectedTemplate(null)
        setEditingTemplate({})
      }
    } catch (error) {
      console.error('Error saving template:', error)
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      const response = await fetch(`/api/qualification/templates/${templateId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchTemplates()
      }
    } catch (error) {
      console.error('Error deleting template:', error)
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
          <h1 className="text-3xl font-bold">Qualification Templates</h1>
          <p className="text-muted-foreground">
            Create and manage qualification templates and presets
          </p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Qualification Template</DialogTitle>
              <DialogDescription>
                Define criteria and scoring rules for lead qualification
              </DialogDescription>
            </DialogHeader>
            <TemplateEditor
              template={editingTemplate}
              onChange={setEditingTemplate}
              onSave={handleCreateTemplate}
              onCancel={() => setShowCreateDialog(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="presets">Presets</TabsTrigger>
          <TabsTrigger value="editor">Template Editor</TabsTrigger>
        </TabsList>
        
        <TabsContent value="templates" className="space-y-6">
          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <Badge variant="outline">{template.framework}</Badge>
                  </div>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Criteria Count</span>
                      <span className="text-sm">{Object.keys(template.criteria).length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Auto Qualify</span>
                      <Badge variant={template.auto_qualify ? 'success' : 'secondary'}>
                        {template.auto_qualify ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Qualified Threshold</span>
                      <span className="text-sm">{Math.round(template.thresholds.qualified * 100)}%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditTemplate(template)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteTemplate(template.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {templates.length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No templates created yet</p>
                  <Button
                    className="mt-4"
                    onClick={() => setShowCreateDialog(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Template
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="presets" className="space-y-6">
          {/* Presets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(FRAMEWORK_PRESETS).map(([frameworkKey, framework]) => (
              <Card key={frameworkKey} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{framework.name}</CardTitle>
                    <Badge variant="outline">{frameworkKey}</Badge>
                  </div>
                  <CardDescription>{framework.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Criteria Count</span>
                      <span className="text-sm">{Object.keys(framework.criteria).length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Scoring Rules</span>
                      <span className="text-sm">Advanced</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Criteria:</h4>
                    {Object.entries(framework.criteria).map(([key, criterion]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-xs">{criterion.label}</span>
                        <Badge variant="outline" className="text-xs">
                          {criterion.type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  
                  <Button
                    className="w-full"
                    onClick={() => handleCreateFromPreset({
                      id: frameworkKey,
                      name: `${framework.name} Template`,
                      description: framework.description,
                      framework: frameworkKey,
                      industry: 'General',
                      company_size: 'All',
                      use_case: 'General Qualification',
                      template: {
                        id: frameworkKey,
                        name: framework.name,
                        description: framework.description,
                        framework: frameworkKey,
                        criteria: framework.criteria,
                        weights: Object.fromEntries(
                          Object.entries(framework.criteria).map(([key, criterion]) => [key, criterion.weight])
                        ),
                        thresholds: {
                          qualified: 0.7,
                          disqualified: 0.3
                        },
                        auto_qualify: false,
                        organization_id: '',
                        created_by: '',
                        created_at: '',
                        updated_at: ''
                      }
                    })}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Use as Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="editor" className="space-y-6">
          {selectedTemplate ? (
            <TemplateEditor
              template={editingTemplate}
              onChange={setEditingTemplate}
              onSave={handleSaveTemplate}
              onCancel={() => setSelectedTemplate(null)}
            />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Select a template to edit</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface TemplateEditorProps {
  template: Partial<QualificationTemplate>
  onChange: (template: Partial<QualificationTemplate>) => void
  onSave: () => void
  onCancel: () => void
}

function TemplateEditor({ template, onChange, onSave, onCancel }: TemplateEditorProps) {
  const [activeCriterion, setActiveCriterion] = useState<string | null>(null)

  const handleAddCriterion = () => {
    const newCriterion: QualificationCriterion = {
      id: `criterion_${Date.now()}`,
      label: 'New Criterion',
      description: 'Criterion description',
      type: 'boolean',
      required: true,
      weight: 0.1,
      options: [],
      scoring_rules: {
        conditions: [
          { condition: 'true', score: 1.0, weight: 0.1 },
          { condition: 'false', score: 0.0, weight: 0.1 }
        ]
      }
    }

    onChange({
      ...template,
      criteria: {
        ...template.criteria,
        [newCriterion.id]: newCriterion
      }
    })
    setActiveCriterion(newCriterion.id)
  }

  const handleUpdateCriterion = (criterionId: string, updates: Partial<QualificationCriterion>) => {
    onChange({
      ...template,
      criteria: {
        ...template.criteria,
        [criterionId]: {
          ...template.criteria?.[criterionId],
          ...updates
        }
      }
    })
  }

  const handleDeleteCriterion = (criterionId: string) => {
    const newCriteria = { ...template.criteria }
    delete newCriteria[criterionId]
    onChange({
      ...template,
      criteria: newCriteria
    })
    setActiveCriterion(null)
  }

  return (
    <div className="space-y-6">
      {/* Template Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Template Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                value={template.name || ''}
                onChange={(e) => onChange({ ...template, name: e.target.value })}
                placeholder="Enter template name"
              />
            </div>
            
            <div>
              <Label htmlFor="framework">Framework</Label>
              <Select
                value={template.framework || ''}
                onValueChange={(value) => onChange({ ...template, framework: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select framework" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BANT">BANT</SelectItem>
                  <SelectItem value="CHAMP">CHAMP</SelectItem>
                  <SelectItem value="GPCTBA/C&I">GPCTBA/C&I</SelectItem>
                  <SelectItem value="SPICED">SPICED</SelectItem>
                  <SelectItem value="ANUM">ANUM</SelectItem>
                  <SelectItem value="FAINT">FAINT</SelectItem>
                  <SelectItem value="NEAT">NEAT</SelectItem>
                  <SelectItem value="PACT">PACT</SelectItem>
                  <SelectItem value="JTBD_FIT">JTBD-Fit</SelectItem>
                  <SelectItem value="FIVE_FIT">5-Fit</SelectItem>
                  <SelectItem value="ABM">ABM</SelectItem>
                  <SelectItem value="TARGETING">Targeting</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={template.description || ''}
              onChange={(e) => onChange({ ...template, description: e.target.value })}
              placeholder="Enter template description"
            />
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="auto_qualify"
                checked={template.auto_qualify || false}
                onCheckedChange={(checked) => onChange({ ...template, auto_qualify: checked })}
              />
              <Label htmlFor="auto_qualify">Auto Qualify</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Criteria Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Qualification Criteria</CardTitle>
              <CardDescription>
                Define the criteria and scoring rules for qualification
              </CardDescription>
            </div>
            <Button onClick={handleAddCriterion}>
              <Plus className="h-4 w-4 mr-2" />
              Add Criterion
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(template.criteria || {}).map(([criterionId, criterion]) => (
              <div key={criterionId} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium">{criterion.label}</h4>
                    <Badge variant="outline">{criterion.type}</Badge>
                    {criterion.required && <Badge variant="destructive">Required</Badge>}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveCriterion(activeCriterion === criterionId ? null : criterionId)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteCriterion(criterionId)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground mb-4">{criterion.description}</p>
                
                {activeCriterion === criterionId && (
                  <div className="space-y-4 p-4 bg-muted rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Label</Label>
                        <Input
                          value={criterion.label}
                          onChange={(e) => handleUpdateCriterion(criterionId, { label: e.target.value })}
                        />
                      </div>
                      
                      <div>
                        <Label>Type</Label>
                        <Select
                          value={criterion.type}
                          onValueChange={(value: any) => handleUpdateCriterion(criterionId, { type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="boolean">Boolean</SelectItem>
                            <SelectItem value="numeric">Numeric</SelectItem>
                            <SelectItem value="text">Text</SelectItem>
                            <SelectItem value="select">Select</SelectItem>
                            <SelectItem value="multi_select">Multi-Select</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={criterion.description}
                        onChange={(e) => handleUpdateCriterion(criterionId, { description: e.target.value })}
                      />
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={criterion.required}
                          onCheckedChange={(checked) => handleUpdateCriterion(criterionId, { required: checked })}
                        />
                        <Label>Required</Label>
                      </div>
                      
                      <div className="flex-1">
                        <Label>Weight: {Math.round(criterion.weight * 100)}%</Label>
                        <Slider
                          value={[criterion.weight]}
                          onValueChange={(value) => handleUpdateCriterion(criterionId, { weight: value[0] })}
                          max={1}
                          min={0}
                          step={0.05}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Thresholds */}
      <Card>
        <CardHeader>
          <CardTitle>Qualification Thresholds</CardTitle>
          <CardDescription>
            Set the thresholds for qualified and disqualified leads
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Qualified Threshold: {Math.round((template.thresholds?.qualified || 0.7) * 100)}%</Label>
              <Slider
                value={[template.thresholds?.qualified || 0.7]}
                onValueChange={(value) => onChange({
                  ...template,
                  thresholds: {
                    ...template.thresholds,
                    qualified: value[0],
                    disqualified: template.thresholds?.disqualified || 0.3
                  }
                })}
                max={1}
                min={0}
                step={0.05}
                className="w-full"
              />
            </div>
            
            <div>
              <Label>Disqualified Threshold: {Math.round((template.thresholds?.disqualified || 0.3) * 100)}%</Label>
              <Slider
                value={[template.thresholds?.disqualified || 0.3]}
                onValueChange={(value) => onChange({
                  ...template,
                  thresholds: {
                    ...template.thresholds,
                    qualified: template.thresholds?.qualified || 0.7,
                    disqualified: value[0]
                  }
                })}
                max={1}
                min={0}
                step={0.05}
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end space-x-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onSave}>
          <Save className="h-4 w-4 mr-2" />
          Save Template
        </Button>
      </div>
    </div>
  )
}
