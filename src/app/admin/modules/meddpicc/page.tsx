'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  CheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  CloudArrowUpIcon,
  CloudArrowDownIcon
} from '@heroicons/react/24/outline'
import { MEDDPICCPillar, MEDDPICCQuestion, MEDDPICCThresholds } from '@/lib/meddpicc'
import useMEDDPICCConfiguration from '@/hooks/useMEDDPICCConfiguration'

interface PillarEditorProps {
  pillar: MEDDPICCPillar
  onPillarChange: (pillar: MEDDPICCPillar) => void
  onDelete: () => void
  totalWeight: number
}

interface QuestionEditorProps {
  question: MEDDPICCQuestion
  onQuestionChange: (question: MEDDPICCQuestion) => void
  onDelete: () => void
}

const QUESTION_TYPES = [
  { value: 'text', label: 'Text Input', description: 'Long-form text responses' },
  { value: 'scale', label: 'Scale (1-10)', description: 'Numeric rating scale' },
  { value: 'yes_no', label: 'Yes/No', description: 'Boolean choice' },
  { value: 'multiple_choice', label: 'Multiple Choice', description: 'Select from options' }
]

const PILLAR_ICONS = ['📊', '💰', '📝', '🔄', '📄', '🔍', '💥', '🤝', '⚔️', '🎯', '📈', '⚡', '🏆', '🔧']
const PILLAR_COLORS = [
  'bg-blue-100 text-blue-800',
  'bg-green-100 text-green-800',
  'bg-purple-100 text-purple-800',
  'bg-orange-100 text-orange-800',
  'bg-gray-100 text-gray-800',
  'bg-red-100 text-red-800',
  'bg-yellow-100 text-yellow-800',
  'bg-indigo-100 text-indigo-800',
  'bg-pink-100 text-pink-800'
]

function QuestionEditor({ question, onQuestionChange, onDelete }: QuestionEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedQuestion, setEditedQuestion] = useState<MEDDPICCQuestion>(question)

  useEffect(() => {
    setEditedQuestion(question)
  }, [question])

  const handleSave = () => {
    onQuestionChange(editedQuestion)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditedQuestion(question)
    setIsEditing(false)
  }

  const addAnswer = () => {
    setEditedQuestion({
      ...editedQuestion,
      answers: [
        ...(editedQuestion.answers || []),
        { text: '', points: 0 }
      ]
    })
  }

  const updateAnswer = (index: number, field: 'text' | 'points', value: string | number) => {
    const newAnswers = [...(editedQuestion.answers || [])]
    newAnswers[index] = { ...newAnswers[index], [field]: value }
    setEditedQuestion({ ...editedQuestion, answers: newAnswers })
  }

  const removeAnswer = (index: number) => {
    const newAnswers = (editedQuestion.answers || []).filter((_, i) => i !== index)
    setEditedQuestion({ ...editedQuestion, answers: newAnswers })
  }

  if (isEditing) {
    return (
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Edit Question</CardTitle>
            <div className="flex space-x-2">
              <Button size="sm" onClick={handleSave}>
                <CheckIcon className="w-4 h-4 mr-1" />
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="question-text">Question Text</Label>
            <Textarea
              id="question-text"
              value={editedQuestion.text}
              onChange={(e) => setEditedQuestion({ ...editedQuestion, text: e.target.value })}
              placeholder="Enter the question text..."
              rows={2}
            />
          </div>
          
          <div>
            <Label htmlFor="question-tooltip">Tooltip (Optional)</Label>
            <Input
              id="question-tooltip"
              value={editedQuestion.tooltip || ''}
              onChange={(e) => setEditedQuestion({ ...editedQuestion, tooltip: e.target.value })}
              placeholder="Helpful hint or explanation..."
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="question-type">Question Type</Label>
              <Select
                value={editedQuestion.type}
                onValueChange={(value: 'text' | 'scale' | 'multiple_choice' | 'yes_no') => setEditedQuestion({ ...editedQuestion, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {QUESTION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-xs text-gray-500">{type.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="question-required"
                checked={editedQuestion.required}
                onCheckedChange={(checked) => setEditedQuestion({ ...editedQuestion, required: checked })}
              />
              <Label htmlFor="question-required">Required</Label>
            </div>
          </div>
          
          {(editedQuestion.type === 'scale' || editedQuestion.type === 'multiple_choice') && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Answer Options</Label>
                <Button size="sm" variant="outline" onClick={addAnswer}>
                  <PlusIcon className="w-4 h-4 mr-1" />
                  Add Answer
                </Button>
              </div>
              <div className="space-y-2">
                {(editedQuestion.answers || []).map((answer, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      value={answer.text}
                      onChange={(e) => updateAnswer(index, 'text', e.target.value)}
                      placeholder="Answer text"
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      value={answer.points}
                      onChange={(e) => updateAnswer(index, 'points', parseInt(e.target.value) || 0)}
                      placeholder="Points"
                      className="w-20"
                    />
                    <Button size="sm" variant="outline" onClick={() => removeAnswer(index)}>
                      <TrashIcon className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h4 className="font-medium">{question.text}</h4>
              <Badge variant={question.required ? "default" : "secondary"}>
                {question.required ? "Required" : "Optional"}
              </Badge>
              <Badge variant="outline">{QUESTION_TYPES.find(t => t.value === question.type)?.label}</Badge>
            </div>
            {question.tooltip && (
              <p className="text-sm text-gray-600 mb-2">{question.tooltip}</p>
            )}
            {question.answers && question.answers.length > 0 && (
              <div className="text-xs text-gray-500">
                Answers: {question.answers.map(a => `${a.text} (${a.points}pts)`).join(', ')}
              </div>
            )}
          </div>
          <div className="flex space-x-1 ml-4">
            <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
              <PencilIcon className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={onDelete}>
              <TrashIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function PillarEditor({ pillar, onPillarChange, onDelete, totalWeight }: PillarEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedPillar, setEditedPillar] = useState<MEDDPICCPillar>(pillar)

  useEffect(() => {
    setEditedPillar(pillar)
  }, [pillar])

  const handleSave = () => {
    onPillarChange(editedPillar)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditedPillar(pillar)
    setIsEditing(false)
  }

  const addQuestion = () => {
    const newQuestion: MEDDPICCQuestion = {
      id: `question_${Date.now()}`,
      text: '',
      type: 'text',
      required: true
    }
    setEditedPillar({
      ...editedPillar,
      questions: [...editedPillar.questions, newQuestion]
    })
  }

  const updateQuestion = (index: number, question: MEDDPICCQuestion) => {
    const newQuestions = [...editedPillar.questions]
    newQuestions[index] = question
    setEditedPillar({ ...editedPillar, questions: newQuestions })
  }

  const removeQuestion = (index: number) => {
    const newQuestions = editedPillar.questions.filter((_, i) => i !== index)
    setEditedPillar({ ...editedPillar, questions: newQuestions })
  }

  const weightPercentage = totalWeight > 0 ? ((pillar.weight / totalWeight) * 100).toFixed(1) : '0.0'
  const isWeightValid = totalWeight === 100

  if (isEditing) {
    return (
      <Card className="border-l-4 border-l-green-500">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Edit Pillar: {editedPillar.displayName}</CardTitle>
            <div className="flex space-x-2">
              <Button onClick={handleSave}>
                <CheckIcon className="w-4 h-4 mr-1" />
                Save
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pillar-id">Pillar ID</Label>
              <Input
                id="pillar-id"
                value={editedPillar.id}
                onChange={(e) => setEditedPillar({ ...editedPillar, id: e.target.value })}
                placeholder="unique_pillar_id"
              />
            </div>
            <div>
              <Label htmlFor="pillar-name">Display Name</Label>
              <Input
                id="pillar-name"
                value={editedPillar.displayName}
                onChange={(e) => setEditedPillar({ ...editedPillar, displayName: e.target.value })}
                placeholder="Pillar Name"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="pillar-description">Description</Label>
            <Textarea
              id="pillar-description"
              value={editedPillar.description}
              onChange={(e) => setEditedPillar({ ...editedPillar, description: e.target.value })}
              placeholder="Describe what this pillar measures..."
              rows={2}
            />
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="pillar-weight">Weight (%)</Label>
              <Input
                id="pillar-weight"
                type="number"
                min="0"
                max="100"
                value={editedPillar.weight}
                onChange={(e) => setEditedPillar({ ...editedPillar, weight: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label htmlFor="pillar-icon">Icon</Label>
              <Select
                value={editedPillar.icon}
                onValueChange={(value) => setEditedPillar({ ...editedPillar, icon: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PILLAR_ICONS.map((icon) => (
                    <SelectItem key={icon} value={icon}>
                      <span className="text-lg">{icon}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="pillar-color">Color Theme</Label>
              <Select
                value={editedPillar.color}
                onValueChange={(value) => setEditedPillar({ ...editedPillar, color: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PILLAR_COLORS.map((color) => (
                    <SelectItem key={color} value={color}>
                      <div className={`px-2 py-1 rounded text-xs ${color}`}>
                        Sample
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium">Questions ({editedPillar.questions.length})</h4>
              <Button variant="outline" onClick={addQuestion}>
                <PlusIcon className="w-4 h-4 mr-1" />
                Add Question
              </Button>
            </div>
            <div className="space-y-3">
              {editedPillar.questions.map((question, index) => (
                <QuestionEditor
                  key={question.id}
                  question={question}
                  onQuestionChange={(q) => updateQuestion(index, q)}
                  onDelete={() => removeQuestion(index)}
                />
              ))}
              {editedPillar.questions.length === 0 && (
                <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                  No questions defined. Click &quot;Add Question&quot; to get started.
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{pillar.icon}</span>
            <div>
              <CardTitle className="text-lg">{pillar.displayName}</CardTitle>
              <CardDescription>{pillar.description}</CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`px-2 py-1 rounded text-xs ${pillar.color}`}>
              {pillar.weight}% ({weightPercentage}%)
            </div>
            {!isWeightValid && (
              <ExclamationTriangleIcon className="w-5 h-5 text-amber-500" />
            )}
            <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
              <PencilIcon className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={onDelete}>
              <TrashIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>{pillar.questions.length} questions</span>
          <Badge variant="outline">{pillar.id}</Badge>
        </div>
      </CardContent>
    </Card>
  )
}

export default function MEDDPICCConfigurationPage() {
  const {
    config,
    configRecord,
    isLoading,
    hasChanges,
    validation,
    updateConfig,
    saveConfiguration,
    resetToDefault,
    validateConfiguration,
    exportConfiguration,
    importConfiguration,
    error,
    clearError
  } = useMEDDPICCConfiguration()

  const [activeTab, setActiveTab] = useState('pillars')
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    if (!config) return
    
    setIsSaving(true)
    try {
      // Validate the configuration first
      const validation = validateConfiguration(config)
      
      if (!validation.isValid) {
        alert(`Configuration validation failed:\n${validation.errors.join('\n')}`)
        return
      }
      
      // For now, just save to localStorage as a fallback until API is working
      const configToSave = {
        ...config,
        metadata: {
          version: '1.0.0',
          lastModified: new Date().toISOString(),
          modifiedBy: 'admin',
          source: 'admin_interface'
        }
      }
      
      localStorage.setItem('meddpicc_custom_config', JSON.stringify(configToSave))
      
      // Try to save via API, but don't fail if it doesn't work
      try {
        await saveConfiguration({
          name: configRecord?.name || 'Custom MEDDPICC Configuration',
          description: configRecord?.description || 'Customized MEDDPICC configuration'
        })
        alert('Configuration saved successfully to database!')
      } catch (apiError) {
        console.warn('Database save failed, but configuration is saved locally:', apiError)
        alert('Configuration saved locally! (Database save will be attempted when server is ready)')
      }
      
    } catch (error) {
      console.error('Failed to save configuration:', error)
      alert('Failed to save configuration. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = async () => {
    if (confirm('Are you sure you want to reset to default configuration? All customizations will be lost.')) {
      try {
        await resetToDefault()
        alert('Configuration reset to default successfully!')
      } catch (error) {
        console.error('Failed to reset configuration:', error)
        alert('Failed to reset configuration.')
      }
    }
  }

  const handleExport = async () => {
    try {
      const jsonData = await exportConfiguration()
      const blob = new Blob([jsonData], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `meddpicc-config-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to export configuration:', error)
      alert('Failed to export configuration')
    }
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      await importConfiguration(text)
      alert('Configuration imported successfully!')
    } catch (error) {
      console.error('Failed to import configuration:', error)
      alert('Failed to import configuration. Please check the file format.')
    }
  }

  const addPillar = () => {
    if (!config) return
    
    const newPillar: MEDDPICCPillar = {
      id: `pillar_${Date.now()}`,
      displayName: 'New Pillar',
      description: '',
      weight: 0,
      icon: '🎯',
      color: 'bg-gray-100 text-gray-800',
      questions: []
    }
    updateConfig({
      ...config,
      pillars: [...config.pillars, newPillar]
    })
  }

  const updatePillar = (index: number, pillar: MEDDPICCPillar) => {
    if (!config) return
    
    const newPillars = [...config.pillars]
    newPillars[index] = pillar
    updateConfig({
      ...config,
      pillars: newPillars,
      scoring: {
        ...config.scoring,
        weights: {
          ...config.scoring.weights,
          [pillar.id]: pillar.weight
        }
      }
    })
  }

  const removePillar = (index: number) => {
    if (!config) return
    
    const pillarToRemove = config.pillars[index]
    const newPillars = config.pillars.filter((_, i) => i !== index)
    const newWeights = { ...config.scoring.weights }
    delete newWeights[pillarToRemove.id]
    
    updateConfig({
      ...config,
      pillars: newPillars,
      scoring: {
        ...config.scoring,
        weights: newWeights
      }
    })
  }

  const updateThresholds = (thresholds: MEDDPICCThresholds) => {
    if (!config) return
    
    updateConfig({
      ...config,
      scoring: {
        ...config.scoring,
        thresholds
      }
    })
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2 text-gray-600">Loading MEDDPICC configuration...</span>
        </div>
      </div>
    )
  }

  if (!config) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <Alert>
          <ExclamationTriangleIcon className="h-4 w-4" />
          <AlertDescription>
            Failed to load MEDDPICC configuration. Please refresh the page.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const totalWeight = Object.values(config.scoring.weights).reduce((sum, weight) => sum + weight, 0)
  const isWeightValid = Math.abs(totalWeight - 100) < 0.1

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">MEDDPICC Configuration</h1>
            <p className="text-gray-600 mt-1">Configure pillars, questions, weights, and scoring algorithm</p>
          </div>
          <div className="flex items-center space-x-3">
            {hasChanges && (
              <Badge variant="outline" className="text-amber-600 border-amber-600">
                <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                Unsaved Changes
              </Badge>
            )}
            {validation && !validation.isValid && (
              <Badge variant="outline" className="text-red-600 border-red-600">
                <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                Validation Errors
              </Badge>
            )}
            <div className="flex space-x-2">
              <Button variant="outline" onClick={handleExport}>
                <CloudArrowDownIcon className="w-4 h-4 mr-1" />
                Export
              </Button>
              <label className="cursor-pointer">
                <Button variant="outline" asChild>
                  <span>
                    <CloudArrowUpIcon className="w-4 h-4 mr-1" />
                    Import
                  </span>
                </Button>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
              <Button 
                variant="outline" 
                onClick={handleReset}
                className="text-red-600 hover:text-red-700"
              >
                Reset to Default
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={isSaving || !hasChanges || (validation && !validation.isValid)}
              >
                <CheckIcon className="w-4 h-4 mr-1" />
                {isSaving ? 'Saving...' : 'Save Configuration'}
              </Button>
            </div>
          </div>
        </div>
        
        {error && (
          <Alert className="mt-4 border-red-200 bg-red-50">
            <ExclamationTriangleIcon className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearError}
                className="ml-2 text-red-600 hover:text-red-800"
              >
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {validation && validation.errors.length > 0 && (
          <Alert className="mt-4 border-red-200 bg-red-50">
            <ExclamationTriangleIcon className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <div className="font-medium mb-2">Configuration Errors:</div>
              <ul className="list-disc list-inside space-y-1">
                {validation.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {validation && validation.warnings.length > 0 && (
          <Alert className="mt-4 border-amber-200 bg-amber-50">
            <ExclamationTriangleIcon className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <div className="font-medium mb-2">Configuration Warnings:</div>
              <ul className="list-disc list-inside space-y-1">
                {validation.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
        
        {!isWeightValid && (
          <Alert className="mt-4">
            <ExclamationTriangleIcon className="h-4 w-4" />
            <AlertDescription>
              Warning: Total pillar weights sum to {totalWeight.toFixed(1)}% instead of 100%. Please adjust weights to ensure proper scoring.
            </AlertDescription>
          </Alert>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="pillars">Pillars & Questions</TabsTrigger>
          <TabsTrigger value="scoring">Scoring & Weights</TabsTrigger>
          <TabsTrigger value="thresholds">Quality Thresholds</TabsTrigger>
          <TabsTrigger value="algorithm">Algorithm Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="pillars" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">MEDDPICC Pillars</h2>
              <p className="text-gray-600">Configure the qualification pillars and their questions</p>
            </div>
            <Button onClick={addPillar}>
              <PlusIcon className="w-4 h-4 mr-1" />
              Add Pillar
            </Button>
          </div>
          
          <div className="grid gap-6">
            {config.pillars.map((pillar, index) => (
              <PillarEditor
                key={pillar.id}
                pillar={pillar}
                onPillarChange={(p) => updatePillar(index, p)}
                onDelete={() => removePillar(index)}
                totalWeight={totalWeight}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="scoring" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold">Weight Distribution</h2>
            <p className="text-gray-600">Configure how much each pillar contributes to the overall score</p>
          </div>
          
          <div className="grid gap-4">
            {config.pillars.map((pillar) => (
              <Card key={pillar.id}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{pillar.icon}</span>
                      <div>
                        <div className="font-medium">{pillar.displayName}</div>
                        <div className="text-sm text-gray-600">{pillar.description}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={pillar.weight}
                          onChange={(e) => updatePillar(
                            config.pillars.findIndex(p => p.id === pillar.id),
                            { ...pillar, weight: parseInt(e.target.value) || 0 }
                          )}
                          className="w-20 text-center"
                        />
                        <div className="text-xs text-gray-500 mt-1">
                          {totalWeight > 0 ? ((pillar.weight / totalWeight) * 100).toFixed(1) : '0.0'}% of total
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="font-medium">Total Weight</div>
                <div className={`text-lg font-bold ${isWeightValid ? 'text-green-600' : 'text-red-600'}`}>
                  {totalWeight}%
                  {isWeightValid ? (
                    <CheckCircleIcon className="w-5 h-5 inline ml-2" />
                  ) : (
                    <ExclamationTriangleIcon className="w-5 h-5 inline ml-2" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="thresholds" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold">Quality Thresholds</h2>
            <p className="text-gray-600">Define score ranges for qualification levels</p>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            {Object.entries(config.scoring.thresholds).map(([level, threshold]) => (
              <Card key={level}>
                <CardHeader>
                  <CardTitle className="capitalize">{level} Threshold</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={threshold}
                      onChange={(e) => updateThresholds({
                        ...config.scoring.thresholds,
                        [level]: parseInt(e.target.value) || 0
                      })}
                    />
                    <span className="text-gray-500">%</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="algorithm" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold">Algorithm Settings</h2>
            <p className="text-gray-600">Configure scoring algorithm parameters</p>
          </div>
          
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Text Scoring Algorithm</CardTitle>
                <CardDescription>How text responses are evaluated and scored</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <InformationCircleIcon className="h-4 w-4" />
                  <AlertDescription>
                    Text responses are scored based on content length, quality keywords, and completeness. 
                    The algorithm awards points for meaningful responses with pharmaceutical context.
                  </AlertDescription>
                </Alert>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Base Points (Any Content)</Label>
                    <Input type="number" defaultValue="3" />
                  </div>
                  <div>
                    <Label>Minimum Content Length</Label>
                    <Input type="number" defaultValue="3" />
                  </div>
                  <div>
                    <Label>Good Detail Length</Label>
                    <Input type="number" defaultValue="10" />
                  </div>
                  <div>
                    <Label>Comprehensive Length</Label>
                    <Input type="number" defaultValue="25" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Quality Keywords</CardTitle>
                <CardDescription>Keywords that indicate high-quality pharmaceutical responses</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  defaultValue="specific, measurable, quantified, roi, impact, cost, savings, efficiency, revenue, profit, test, quality, improvement, lives, saved"
                  rows={3}
                  placeholder="Enter comma-separated keywords..."
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}