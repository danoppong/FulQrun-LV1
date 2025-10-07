'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { ;
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Zap,
  BarChart3,
  Plus,
  Play,
  TrendingUp,
  X,
  Settings
} from 'lucide-react'
import { DataSourceConfig } from './DataSourceConfig';

export function AILeadManagement() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')
  const [showBriefModal, setShowBriefModal] = useState(false)
  const [showGenerationModal, setShowGenerationModal] = useState(false)
  const [showDataSourceConfig, setShowDataSourceConfig] = useState(false)
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false)
  const [editingBrief, setEditingBrief] = useState<typeof createdBriefs[0] | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generatedLeads, setGeneratedLeads] = useState<Array<{
    id: string
    name: string
    company: string
    industry: string
    location: string
    size: string
    website: string
    description: string
    score: number
    status: 'pending' | 'accepted' | 'rejected'
    createdAt: string
  }>>([])
  const [acceptingLead, setAcceptingLead] = useState<string | null>(null)
  const [createdBriefs, setCreatedBriefs] = useState<Array<{
    id: string
    lead_type: string
    geography: string
    industry: string
    employee_band: string
    entity_type: string
    time_horizon: string
    notes: string
    status: string
    created_at: string
  }>>([])

  // Load existing briefs on component mount
  useEffect(() => {
    loadBriefs()
  }, [])

  const loadBriefs = () => {
    try {
      const savedBriefs = localStorage.getItem('ai-lead-briefs')
      if (savedBriefs) {
        setCreatedBriefs(JSON.parse(savedBriefs))
      }
    } catch (error) {
      console.error('Failed to load briefs from localStorage:', error)
    }
  }

  const saveBriefs = (briefs: typeof createdBriefs) => {
    try {
      localStorage.setItem('ai-lead-briefs', JSON.stringify(briefs))
    } catch (error) {
      console.error('Failed to save briefs to localStorage:', error)
    }
  }

  const handleCreateBrief = () => {
    setEditingBrief(null)
    setShowBriefModal(true)
  }

  const handleEditBrief = (brief: typeof createdBriefs[0]) => {
    setEditingBrief(brief)
    setShowBriefModal(true)
  }

  const handleToggleBriefStatus = (briefId: string) => {
    const updatedBriefs = createdBriefs.map(brief => 
      brief.id === briefId 
        ? { ...brief, status: brief.status === 'draft' ? 'active' : 'draft' }
        : brief
    )
    setCreatedBriefs(updatedBriefs)
    saveBriefs(updatedBriefs)
  }

  const handleStartGeneration = () => {
    setShowGenerationModal(true)
  }

  const handleViewAnalytics = () => {
    setShowAnalyticsModal(true)
  }

  const handleConfigureDataSources = () => {
    setShowDataSourceConfig(true)
  }

  const simulateAIGeneration = async (briefId: string, targetCount: number) => {
    setIsGenerating(true)
    setGenerationProgress(0)
    setGeneratedLeads([])
    
    // Find the selected brief for validation
    const selectedBrief = createdBriefs.find(brief => brief.id === briefId)
    if (!selectedBrief) {
      console.error('Brief not found:', briefId)
      setIsGenerating(false)
      return
    }
    
    console.log('AI Generation Starting:', {
      briefId,
      targetCount,
      briefCriteria: {
        lead_type: selectedBrief.lead_type,
        geography: selectedBrief.geography,
        industry: selectedBrief.industry,
        employee_band: selectedBrief.employee_band,
        entity_type: selectedBrief.entity_type
      }
    })
    
    // Get available companies for debugging
    const availableCompanies = getCompanyDataByCriteria(selectedBrief.geography, selectedBrief.industry, selectedBrief.employee_band)
    console.log(`Available companies after filtering: ${availableCompanies.length}`)
    if (availableCompanies.length > 0) {
      console.log('Sample companies:', availableCompanies.slice(0, 3).map(c => ({ name: c.name, size: c.size })))
    }
    
    // Simulate AI generation process with progress updates
    const steps = [
      { progress: 20, message: 'Analyzing brief criteria...' },
      { progress: 40, message: 'Searching data sources...' },
      { progress: 60, message: 'Generating lead candidates...' },
      { progress: 80, message: 'Scoring and ranking leads...' },
      { progress: 100, message: 'Generation complete!' }
    ]
    
    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, 1000)) // 1 second delay
      setGenerationProgress(step.progress)
      
      // Generate leads only once at 80% progress to avoid duplicates
      if (step.progress === 80) {
        const newLeads = generateSampleLeads(targetCount, briefId)
        console.log(`Generated ${newLeads.length} leads (requested: ${targetCount})`)
        setGeneratedLeads(newLeads)
      }
    }
    
    setIsGenerating(false)
  }

  const generateSampleLeads = (count: number, briefId: string) => {
    // Find the selected brief to get criteria
    const selectedBrief = createdBriefs.find(brief => brief.id === briefId)
    if (!selectedBrief) return []

    // Define realistic company data based on geography and industry
    const companyData = getCompanyDataByCriteria(selectedBrief.geography, selectedBrief.industry, selectedBrief.employee_band)
    
    return Array.from({ length: count }, (_, i) => {
      const company = companyData[Math.floor(Math.random() * companyData.length)]
      
      // Generate lead based on brief's lead_type
      if (selectedBrief.lead_type === 'account') {
        // Company/Account leads
        return {
          id: `lead_${Date.now()}_${i}`,
          name: company.name,
          company: company.name,
          industry: company.industry,
          location: company.location,
          size: company.size,
          website: company.website,
          description: company.description,
          score: Math.floor(Math.random() * 40) + 60, // 60-100 score
          status: 'pending' as const,
          createdAt: new Date().toISOString()
        }
      } else {
        // Contact/Person leads
        return {
          id: `lead_${Date.now()}_${i}`,
          name: `${company.title} at ${company.name}`,
          company: company.name,
          industry: company.industry,
          location: company.location,
          size: company.size,
          website: company.website,
          description: `${company.title} at ${company.name} - ${company.description}`,
          score: Math.floor(Math.random() * 40) + 60, // 60-100 score
          status: 'pending' as const,
          createdAt: new Date().toISOString()
        }
      }
    })
  }

  const getCompanyDataByCriteria = (geography: string, industry?: string, employeeBand?: string) => {
    // Define realistic companies by geography and industry
    const companiesByGeography = {
      'US': {
        'Healthcare': [
          // Small companies (1-50 employees)
          { name: 'MedTech Solutions', industry: 'Healthcare', location: 'Austin, TX', size: '15 employees', website: 'https://www.medtechsolutions.com', title: 'CEO', description: 'Small medical device startup specializing in innovative healthcare solutions' },
          { name: 'Wellness Innovations', industry: 'Healthcare', location: 'Denver, CO', size: '25 employees', website: 'https://www.wellnessinnovations.com', title: 'Founder', description: 'Boutique wellness company focused on natural health products' },
          { name: 'HealthTech Partners', industry: 'Healthcare', location: 'Portland, OR', size: '35 employees', website: 'https://www.healthtechpartners.com', title: 'Managing Director', description: 'Small healthcare technology consulting firm' },
          { name: 'BioCare Labs', industry: 'Healthcare', location: 'San Diego, CA', size: '42 employees', website: 'https://www.biocarelabs.com', title: 'Chief Scientific Officer', description: 'Small biotech company developing specialized medical products' },
          { name: 'MediStart Inc', industry: 'Healthcare', location: 'Boston, MA', size: '28 employees', website: 'https://www.medistart.com', title: 'President', description: 'Startup focused on personalized medicine solutions' },
          // Medium companies (51-200 employees)
          { name: 'Regional Medical Group', industry: 'Healthcare', location: 'Phoenix, AZ', size: '120 employees', website: 'https://www.regionalmedical.com', title: 'Medical Director', description: 'Regional healthcare provider with multiple clinics' },
          { name: 'HealthPlus Systems', industry: 'Healthcare', location: 'Miami, FL', size: '85 employees', website: 'https://www.healthplussystems.com', title: 'VP of Operations', description: 'Healthcare technology company serving local markets' },
          { name: 'MediCore Solutions', industry: 'Healthcare', location: 'Seattle, WA', size: '150 employees', website: 'https://www.medicoresolutions.com', title: 'Chief Technology Officer', description: 'Healthcare software company with regional presence' },
          // Large companies (201-1000 employees)
          { name: 'Advanced Medical Systems', industry: 'Healthcare', location: 'Chicago, IL', size: '450 employees', website: 'https://www.advancedmedical.com', title: 'VP of Business Development', description: 'Mid-size medical equipment manufacturer' },
          { name: 'Healthcare Innovations Corp', industry: 'Healthcare', location: 'Atlanta, GA', size: '750 employees', website: 'https://www.healthcareinnovations.com', title: 'Director of Strategic Partnerships', description: 'Healthcare technology company with national reach' },
          // Very large companies (1000+ employees)
          { name: 'Mayo Clinic', industry: 'Healthcare', location: 'Rochester, MN', size: '50,000+ employees', website: 'https://www.mayoclinic.org', title: 'Chief Medical Officer', description: 'Leading healthcare provider with advanced medical research' },
          { name: 'Cleveland Clinic', industry: 'Healthcare', location: 'Cleveland, OH', size: '30,000+ employees', website: 'https://www.clevelandclinic.org', title: 'VP of Operations', description: 'World-renowned medical center with innovative treatments' },
          { name: 'Kaiser Permanente', industry: 'Healthcare', location: 'Oakland, CA', size: '200,000+ employees', website: 'https://www.kaiserpermanente.org', title: 'Director of IT', description: 'Integrated healthcare system with digital health initiatives' },
          { name: 'UnitedHealth Group', industry: 'Healthcare', location: 'Minnetonka, MN', size: '400,000+ employees', website: 'https://www.unitedhealthgroup.com', title: 'VP of Strategy', description: 'Leading health insurance and healthcare services company' },
          { name: 'Johnson & Johnson', industry: 'Healthcare', location: 'New Brunswick, NJ', size: '150,000+ employees', website: 'https://www.jnj.com', title: 'Head of Digital Health', description: 'Pharmaceutical and medical device company with global reach' }
        ],
        'Technology': [
          { name: 'Microsoft', industry: 'Technology', location: 'Redmond, WA', size: '200,000+ employees', website: 'https://www.microsoft.com', title: 'VP of Enterprise Sales', description: 'Leading technology company with cloud and productivity solutions' },
          { name: 'Google', industry: 'Technology', location: 'Mountain View, CA', size: '180,000+ employees', website: 'https://www.google.com', title: 'Director of Business Development', description: 'Search engine and cloud computing giant' },
          { name: 'Amazon', industry: 'Technology', location: 'Seattle, WA', size: '1,500,000+ employees', website: 'https://www.amazon.com', title: 'VP of AWS Sales', description: 'E-commerce and cloud computing leader' },
          { name: 'Salesforce', industry: 'Technology', location: 'San Francisco, CA', size: '80,000+ employees', website: 'https://www.salesforce.com', title: 'Head of Enterprise', description: 'Leading CRM and cloud software provider' },
          { name: 'Oracle', industry: 'Technology', location: 'Austin, TX', size: '140,000+ employees', website: 'https://www.oracle.com', title: 'VP of Cloud Sales', description: 'Enterprise software and cloud infrastructure company' }
        ],
        'Manufacturing': [
          { name: 'General Electric', industry: 'Manufacturing', location: 'Boston, MA', size: '170,000+ employees', website: 'https://www.ge.com', title: 'VP of Operations', description: 'Diversified industrial company with aviation and healthcare divisions' },
          { name: 'Boeing', industry: 'Manufacturing', location: 'Chicago, IL', size: '140,000+ employees', website: 'https://www.boeing.com', title: 'Director of Supply Chain', description: 'Leading aerospace manufacturer and defense contractor' },
          { name: 'Caterpillar', industry: 'Manufacturing', location: 'Deerfield, IL', size: '100,000+ employees', website: 'https://www.caterpillar.com', title: 'Head of Digital Transformation', description: 'Heavy machinery and equipment manufacturer' },
          { name: '3M', industry: 'Manufacturing', location: 'Maplewood, MN', size: '95,000+ employees', website: 'https://www.3m.com', title: 'VP of Innovation', description: 'Diversified technology company with industrial and consumer products' },
          { name: 'Honeywell', industry: 'Manufacturing', location: 'Charlotte, NC', size: '110,000+ employees', website: 'https://www.honeywell.com', title: 'Director of Smart Building Solutions', description: 'Industrial technology and aerospace company' }
        ]
      },
      'APAC': {
        'Healthcare': [
          { name: 'SingHealth', industry: 'Healthcare', location: 'Singapore', size: '15,000+ employees', website: 'https://www.singhealth.com.sg', title: 'Chief Medical Officer', description: 'Largest healthcare group in Singapore with advanced medical facilities' },
          { name: 'Raffles Medical Group', industry: 'Healthcare', location: 'Singapore', size: '3,000+ employees', website: 'https://www.rafflesmedicalgroup.com', title: 'VP of Operations', description: 'Leading private healthcare provider in Asia Pacific' },
          { name: 'Hong Kong Sanatorium', industry: 'Healthcare', location: 'Hong Kong', size: '2,500+ employees', website: 'https://www.hksh.com', title: 'Director of IT', description: 'Premier private hospital with cutting-edge medical technology' },
          { name: 'Bumrungrad Hospital', industry: 'Healthcare', location: 'Bangkok, Thailand', size: '4,000+ employees', website: 'https://www.bumrungrad.com', title: 'Head of Digital Health', description: 'International hospital with world-class medical services' },
          { name: 'Mount Elizabeth Hospital', industry: 'Healthcare', location: 'Singapore', size: '1,800+ employees', website: 'https://www.mountelizabeth.com.sg', title: 'VP of Strategy', description: 'Leading private hospital with specialized medical centers' }
        ],
        'Technology': [
          { name: 'Samsung', industry: 'Technology', location: 'Seoul, South Korea', size: '270,000+ employees', website: 'https://www.samsung.com', title: 'VP of Enterprise Solutions', description: 'Global technology leader in electronics and semiconductors' },
          { name: 'Sony', industry: 'Technology', location: 'Tokyo, Japan', size: '110,000+ employees', website: 'https://www.sony.com', title: 'Director of Business Development', description: 'Leading electronics and entertainment company' },
          { name: 'Tencent', industry: 'Technology', location: 'Shenzhen, China', size: '120,000+ employees', website: 'https://www.tencent.com', title: 'Head of Cloud Services', description: 'Leading internet technology company with social media and gaming' },
          { name: 'Alibaba', industry: 'Technology', location: 'Hangzhou, China', size: '250,000+ employees', website: 'https://www.alibaba.com', title: 'VP of Enterprise Sales', description: 'E-commerce and cloud computing giant in China' },
          { name: 'SoftBank', industry: 'Technology', location: 'Tokyo, Japan', size: '80,000+ employees', website: 'https://www.softbank.com', title: 'Director of Investment Strategy', description: 'Technology investment and telecommunications company' }
        ],
        'Manufacturing': [
          { name: 'Toyota', industry: 'Manufacturing', location: 'Toyota City, Japan', size: '370,000+ employees', website: 'https://www.toyota.com', title: 'VP of Operations', description: 'Leading automotive manufacturer with global production facilities' },
          { name: 'Hyundai', industry: 'Manufacturing', location: 'Seoul, South Korea', size: '120,000+ employees', website: 'https://www.hyundai.com', title: 'Head of Smart Manufacturing', description: 'Automotive manufacturer with advanced manufacturing technology' },
          { name: 'Foxconn', industry: 'Manufacturing', location: 'Taipei, Taiwan', size: '1,200,000+ employees', website: 'https://www.foxconn.com', title: 'Director of Supply Chain', description: 'Leading electronics manufacturing services provider' },
          { name: 'TSMC', industry: 'Manufacturing', location: 'Hsinchu, Taiwan', size: '60,000+ employees', website: 'https://www.tsmc.com', title: 'VP of Technology', description: 'World\'s largest semiconductor foundry company' },
          { name: 'BYD', industry: 'Manufacturing', location: 'Shenzhen, China', size: '280,000+ employees', website: 'https://www.byd.com', title: 'Head of Electric Vehicles', description: 'Leading electric vehicle and battery manufacturer' }
        ]
      },
      'EU': {
        'Healthcare': [
          { name: 'Roche', industry: 'Healthcare', location: 'Basel, Switzerland', size: '100,000+ employees', website: 'https://www.roche.com', title: 'VP of Digital Health', description: 'Leading pharmaceutical company with personalized healthcare solutions' },
          { name: 'Novartis', industry: 'Healthcare', location: 'Basel, Switzerland', size: '110,000+ employees', website: 'https://www.novartis.com', title: 'Head of Innovation', description: 'Global healthcare company focused on innovative medicines' },
          { name: 'Sanofi', industry: 'Healthcare', location: 'Paris, France', size: '90,000+ employees', website: 'https://www.sanofi.com', title: 'Director of Digital Transformation', description: 'Leading pharmaceutical company with global healthcare solutions' },
          { name: 'GSK', industry: 'Healthcare', location: 'London, UK', size: '95,000+ employees', website: 'https://www.gsk.com', title: 'VP of Strategy', description: 'Global pharmaceutical and healthcare company' },
          { name: 'Bayer', industry: 'Healthcare', location: 'Leverkusen, Germany', size: '100,000+ employees', website: 'https://www.bayer.com', title: 'Head of Life Sciences', description: 'Life sciences company with pharmaceuticals and consumer health' }
        ],
        'Technology': [
          { name: 'SAP', industry: 'Technology', location: 'Walldorf, Germany', size: '110,000+ employees', website: 'https://www.sap.com', title: 'VP of Cloud Solutions', description: 'Leading enterprise software company with cloud and analytics' },
          { name: 'ASML', industry: 'Technology', location: 'Veldhoven, Netherlands', size: '35,000+ employees', website: 'https://www.asml.com', title: 'Director of Technology', description: 'Leading semiconductor equipment manufacturer' },
          { name: 'Spotify', industry: 'Technology', location: 'Stockholm, Sweden', size: '8,000+ employees', website: 'https://www.spotify.com', title: 'Head of Enterprise', description: 'Leading music streaming platform with global reach' },
          { name: 'Adyen', industry: 'Technology', location: 'Amsterdam, Netherlands', size: '3,500+ employees', website: 'https://www.adyen.com', title: 'VP of Sales', description: 'Leading payment platform for global commerce' },
          { name: 'Klarna', industry: 'Technology', location: 'Stockholm, Sweden', size: '5,000+ employees', website: 'https://www.klarna.com', title: 'Director of Business Development', description: 'Leading buy now, pay later fintech company' }
        ],
        'Manufacturing': [
          { name: 'Volkswagen', industry: 'Manufacturing', location: 'Wolfsburg, Germany', size: '670,000+ employees', website: 'https://www.volkswagen.com', title: 'VP of Digital Manufacturing', description: 'Leading automotive manufacturer with electric vehicle initiatives' },
          { name: 'BMW', industry: 'Manufacturing', location: 'Munich, Germany', size: '130,000+ employees', website: 'https://www.bmw.com', title: 'Head of Innovation', description: 'Premium automotive manufacturer with sustainable mobility solutions' },
          { name: 'Siemens', industry: 'Manufacturing', location: 'Munich, Germany', size: '300,000+ employees', website: 'https://www.siemens.com', title: 'Director of Digital Industries', description: 'Industrial technology company with smart manufacturing solutions' },
          { name: 'Airbus', industry: 'Manufacturing', location: 'Toulouse, France', size: '130,000+ employees', website: 'https://www.airbus.com', title: 'VP of Operations', description: 'Leading aerospace manufacturer with commercial and defense aircraft' },
          { name: 'Nestlé', industry: 'Manufacturing', location: 'Vevey, Switzerland', size: '270,000+ employees', website: 'https://www.nestle.com', title: 'Head of Digital Transformation', description: 'Leading food and beverage company with global operations' }
        ]
      },
      'UK': {
        'Healthcare': [
          { name: 'GSK', industry: 'Healthcare', location: 'London, UK', size: '95,000+ employees', website: 'https://www.gsk.com', title: 'VP of Digital Health', description: 'Global pharmaceutical and healthcare company' },
          { name: 'AstraZeneca', industry: 'Healthcare', location: 'Cambridge, UK', size: '83,000+ employees', website: 'https://www.astrazeneca.com', title: 'Head of Innovation', description: 'Leading pharmaceutical company with oncology and biopharmaceuticals' },
          { name: 'NHS', industry: 'Healthcare', location: 'London, UK', size: '1,500,000+ employees', website: 'https://www.nhs.uk', title: 'Director of Digital Services', description: 'National health service with digital transformation initiatives' },
          { name: 'Bupa', industry: 'Healthcare', location: 'London, UK', size: '85,000+ employees', website: 'https://www.bupa.com', title: 'VP of Strategy', description: 'Leading international healthcare group' },
          { name: 'Spire Healthcare', industry: 'Healthcare', location: 'London, UK', size: '8,000+ employees', website: 'https://www.spirehealthcare.com', title: 'Head of Operations', description: 'Leading private hospital group in the UK' }
        ],
        'Technology': [
          { name: 'ARM', industry: 'Technology', location: 'Cambridge, UK', size: '6,000+ employees', website: 'https://www.arm.com', title: 'VP of Enterprise', description: 'Leading semiconductor and software design company' },
          { name: 'Revolut', industry: 'Technology', location: 'London, UK', size: '8,000+ employees', website: 'https://www.revolut.com', title: 'Head of Business Banking', description: 'Leading fintech company with digital banking services' },
          { name: 'Wise', industry: 'Technology', location: 'London, UK', size: '4,000+ employees', website: 'https://www.wise.com', title: 'Director of Growth', description: 'Leading international money transfer service' },
          { name: 'Darktrace', industry: 'Technology', location: 'Cambridge, UK', size: '2,000+ employees', website: 'https://www.darktrace.com', title: 'VP of Sales', description: 'Leading cybersecurity company with AI-powered threat detection' },
          { name: 'Monzo', industry: 'Technology', location: 'London, UK', size: '2,500+ employees', website: 'https://www.monzo.com', title: 'Head of Business Banking', description: 'Leading digital bank with innovative financial services' }
        ],
        'Manufacturing': [
          { name: 'Rolls-Royce', industry: 'Manufacturing', location: 'Derby, UK', size: '50,000+ employees', website: 'https://www.rolls-royce.com', title: 'VP of Digital Engineering', description: 'Leading aerospace and defense company with advanced engineering' },
          { name: 'BAE Systems', industry: 'Manufacturing', location: 'London, UK', size: '90,000+ employees', website: 'https://www.baesystems.com', title: 'Director of Innovation', description: 'Leading defense and aerospace company with global operations' },
          { name: 'Jaguar Land Rover', industry: 'Manufacturing', location: 'Coventry, UK', size: '40,000+ employees', website: 'https://www.jaguarlandrover.com', title: 'Head of Electric Vehicles', description: 'Premium automotive manufacturer with electric vehicle initiatives' },
          { name: 'Unilever', industry: 'Manufacturing', location: 'London, UK', size: '150,000+ employees', website: 'https://www.unilever.com', title: 'VP of Digital Transformation', description: 'Leading consumer goods company with sustainable business practices' },
          { name: 'GlaxoSmithKline', industry: 'Manufacturing', location: 'London, UK', size: '95,000+ employees', website: 'https://www.gsk.com', title: 'Head of Manufacturing', description: 'Global pharmaceutical company with advanced manufacturing capabilities' }
        ]
      }
    }

    // Get companies for the specified geography
    const geographyCompanies = companiesByGeography[geography as keyof typeof companiesByGeography] || {}
    
    // If industry is specified, return companies from that industry, otherwise return all
    let companies = []
    if (industry) {
      companies = geographyCompanies[industry as keyof typeof geographyCompanies] || []
    } else {
      companies = Object.values(geographyCompanies).flat()
    }
    
    // Filter by employee band if specified
    if (employeeBand && companies.length > 0) {
      companies = companies.filter(company => {
        const companySize = company.size.toLowerCase()
        
        switch (employeeBand) {
          case '1–50':
            return companySize.includes('employees') && 
                   (companySize.includes('15') || companySize.includes('25') || 
                    companySize.includes('35') || companySize.includes('42') || 
                    companySize.includes('28') || companySize.includes('1-50') ||
                    companySize.includes('1–50'))
          case '51–200':
            return companySize.includes('employees') && 
                   (companySize.includes('120') || companySize.includes('85') || 
                    companySize.includes('150') || companySize.includes('51-200') ||
                    companySize.includes('51–200'))
          case '201–1k':
            return companySize.includes('employees') && 
                   (companySize.includes('450') || companySize.includes('750') || 
                    companySize.includes('201-1k') || companySize.includes('201–1k'))
          case '1k–5k':
            return companySize.includes('employees') && 
                   (companySize.includes('1k') || companySize.includes('2k') || 
                    companySize.includes('3k') || companySize.includes('4k') ||
                    companySize.includes('1k–5k'))
          case '>5k':
            return companySize.includes('employees') && 
                   (companySize.includes('50,000') || companySize.includes('30,000') || 
                    companySize.includes('200,000') || companySize.includes('400,000') ||
                    companySize.includes('150,000') || companySize.includes('>5k'))
          default:
            return true
        }
      })
    }
    
    return companies
  }

  const handleLeadAction = async (leadId: string, action: 'accept' | 'reject') => {
    if (action === 'accept') {
      // Find the lead to accept
      const leadToAccept = generatedLeads.find(lead => lead.id === leadId)
      if (!leadToAccept) return

      // Set loading state
      setAcceptingLead(leadId)

      try {
        // Import the lead API
        const { leadAPI } = await import('@/lib/api/leads')
        
        // Parse the lead name to extract first and last name
        const nameParts = leadToAccept.name.split(' ')
        const firstName = nameParts[0] || ''
        const lastName = nameParts.slice(1).join(' ') || ''
        
        // Create the lead in the database
        const result = await leadAPI.createLead({
          first_name: firstName,
          last_name: lastName,
          email: '', // AI-generated leads don't have email yet
          phone: '', // AI-generated leads don't have phone yet
          company: leadToAccept.company,
          source: 'AI Generated',
          status: 'new',
          notes: `AI Generated Lead - ${leadToAccept.description}\nWebsite: ${leadToAccept.website}\nIndustry: ${leadToAccept.industry}\nLocation: ${leadToAccept.location}\nSize: ${leadToAccept.size}`
        })

        if (result.error) {
          console.error('Failed to save accepted lead:', result.error)
          alert(`Failed to save lead: ${result.error.message}`)
          return
        }

        // Update the UI to show the lead was accepted
        setGeneratedLeads(prev => 
          prev.map(lead => 
            lead.id === leadId 
              ? { ...lead, status: 'accepted' }
              : lead
          )
        )

        // Show success message
        alert(`✅ Lead "${leadToAccept.name}" has been added to your leads list!`)
        
      } catch (error) {
        console.error('Error saving accepted lead:', error)
        alert(`Failed to save lead: ${error.message}`)
      } finally {
        // Clear loading state
        setAcceptingLead(null)
      }
    } else {
      // Just mark as rejected in the UI
      setGeneratedLeads(prev => 
        prev.map(lead => 
          lead.id === leadId 
            ? { ...lead, status: 'rejected' }
            : lead
        )
      )
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Lead Management</h1>
          <p className="text-gray-600">
            Complete AI-powered lead generation and management system
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge className="bg-green-100 text-green-800 text-sm">
            Phase 5 Complete
          </Badge>
        </div>
      </div>

      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="briefs">Lead Briefs</TabsTrigger>
          <TabsTrigger value="generation">AI Generation</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Data Source Warning */}
                <Alert className="border-orange-200 bg-orange-50">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium text-orange-800">⚠️ Currently Using Demo Data</p>
                      <p className="text-sm text-orange-700">
                        The AI Lead Management system is currently using <strong>fake demonstration data</strong> for testing purposes. 
                        Companies like "MedTech Solutions" and websites like "medtechsolutions.com" are <strong>not real</strong>.
                      </p>
                      <div className="flex space-x-2 mt-3">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={handleConfigureDataSources}
                          className="text-orange-700 border-orange-300 hover:bg-orange-100"
                        >
                          <Settings className="h-4 w-4 mr-1" />
                          Configure Real Data Sources
                        </Button>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>

                {/* System Status */}
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium">AI Lead Management System Status</p>
                      <ul className="text-sm space-y-1 list-disc list-inside">
                        <li>✅ Database schema deployed and ready</li>
                        <li>✅ Core APIs implemented and tested</li>
                        <li>✅ Frontend components built and integrated</li>
                        <li>✅ Lead brief creation and management</li>
                        <li>⚠️ AI-powered lead generation (using demo data)</li>
                        <li>✅ Integration providers ready for setup</li>
                      </ul>
                      <p className="text-sm mt-2">
                        The AI Lead Management system is operational with core features ready for use. 
                        <strong>Configure real data sources to generate actual company leads.</strong>
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Lead Briefs</span>
                </CardTitle>
                <CardDescription>Create and manage AI lead generation briefs</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full" 
                  onClick={handleCreateBrief}
                  disabled={false}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Brief
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5" />
                  <span>AI Generation</span>
                </CardTitle>
                <CardDescription>Generate and manage AI-powered leads</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full" 
                  onClick={handleStartGeneration}
                  disabled={false}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Generation
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Analytics</span>
                </CardTitle>
                <CardDescription>View performance metrics and insights</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full" 
                  onClick={handleViewAnalytics}
                  disabled={false}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  View Analytics
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="briefs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Lead Brief Management</span>
                <Button onClick={handleCreateBrief}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Brief
                </Button>
              </CardTitle>
              <CardDescription>Create and manage AI lead generation briefs</CardDescription>
            </CardHeader>
            <CardContent>
              {createdBriefs.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Briefs Created Yet</h3>
                  <p className="text-gray-600 mb-4">Create your first brief to start generating AI leads</p>
                  <Button onClick={handleCreateBrief}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Brief
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Created Briefs ({createdBriefs.length})</h3>
                  <div className="grid gap-4">
                    {createdBriefs.map((brief) => (
                      <Card key={brief.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <h4 className="font-medium">Brief {brief.id.slice(-8)}</h4>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <span>Type: {brief.lead_type}</span>
                              <span>Geography: {brief.geography}</span>
                              <span>Size: {brief.employee_band || 'Any'}</span>
                              <span>Industry: {brief.industry || 'Any'}</span>
                              <span>Entity: {brief.entity_type}</span>
                            </div>
                            {brief.notes && (
                              <p className="text-sm text-gray-500">{brief.notes}</p>
                            )}
                            <p className="text-xs text-gray-400">
                              Created: {new Date(brief.created_at).toLocaleString()}
                            </p>
                          </div>
                                <div className="flex flex-col space-y-2">
                                  <Badge variant="outline">
                                    {brief.time_horizon.replace('_', ' ')}
                                  </Badge>
                                  <Badge className={brief.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}>
                                    {brief.status}
                                  </Badge>
                                  <div className="flex space-x-2 mt-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleEditBrief(brief)}
                                      className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                    >
                                      <FileText className="h-3 w-3 mr-1" />
                                      Edit
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleToggleBriefStatus(brief.id)}
                                      className={brief.status === 'draft' ? 'text-green-600 border-green-200 hover:bg-green-50' : 'text-yellow-600 border-yellow-200 hover:bg-yellow-50'}
                                    >
                                      {brief.status === 'draft' ? (
                                        <>
                                          <CheckCircle className="h-3 w-3 mr-1" />
                                          Activate
                                        </>
                                      ) : (
                                        <>
                                          <Clock className="h-3 w-3 mr-1" />
                                          Draft
                                        </>
                                      )}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleDeleteBrief(brief.id)}
                                      className="text-red-600 border-red-200 hover:bg-red-50"
                                    >
                                      <X className="h-3 w-3 mr-1" />
                                      Delete
                                    </Button>
                                  </div>
                                </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="generation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Lead Generation</CardTitle>
              <CardDescription>Generate and manage AI-powered leads</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Zap className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">AI Lead Generation</h3>
                <p className="text-gray-600 mb-4">Start the AI-powered lead generation process</p>
                <Button onClick={handleStartGeneration}>
                  <Play className="h-4 w-4 mr-2" />
                  Start Generation
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Dashboard</CardTitle>
              <CardDescription>View performance metrics and insights</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">Analytics Dashboard</h3>
                <p className="text-gray-600 mb-4">View comprehensive analytics and performance metrics</p>
                <Button onClick={handleViewAnalytics}>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  View Analytics
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Lead Brief Creation Modal */}
      <Dialog open={showBriefModal} onOpenChange={setShowBriefModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>{editingBrief ? 'Edit Lead Generation Brief' : 'Create Lead Generation Brief'}</span>
          </DialogTitle>
          <DialogDescription>
            {editingBrief ? 'Update the criteria for AI-powered lead generation.' : 'Define criteria for AI-powered lead generation. The AI will use this brief to generate qualified candidates.'}
          </DialogDescription>
          </DialogHeader>
          
                <LeadBriefForm 
                  editingBrief={editingBrief}
                  onClose={() => {
                    setShowBriefModal(false)
                    setEditingBrief(null)
                  }} 
                  onBriefCreated={(brief) => {
                    if (editingBrief) {
                      // Update existing brief
                      const updatedBriefs = createdBriefs.map(b => 
                        b.id === editingBrief.id ? { ...brief, id: editingBrief.id } : b
                      )
                      setCreatedBriefs(updatedBriefs)
                      saveBriefs(updatedBriefs)
                    } else {
                      // Create new brief
                      const newBriefs = [...createdBriefs, brief]
                      setCreatedBriefs(newBriefs)
                      saveBriefs(newBriefs)
                    }
                    setShowBriefModal(false)
                    setEditingBrief(null)
                  }}
                />
        </DialogContent>
      </Dialog>

      {/* AI Generation Modal */}
      <Dialog open={showGenerationModal} onOpenChange={setShowGenerationModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5" />
              <span>Start AI Lead Generation</span>
            </DialogTitle>
            <DialogDescription>
              Configure and start the AI-powered lead generation process.
            </DialogDescription>
          </DialogHeader>
          
                <AIGenerationForm 
                  onClose={() => setShowGenerationModal(false)} 
                  availableBriefs={createdBriefs}
                  onStartGeneration={simulateAIGeneration}
                  isGenerating={isGenerating}
                  generationProgress={generationProgress}
                  generatedLeads={generatedLeads}
                  onLeadAction={handleLeadAction}
                  acceptingLead={acceptingLead}
                />
        </DialogContent>
      </Dialog>

            {/* Analytics Modal */}
            <Dialog open={showAnalyticsModal} onOpenChange={setShowAnalyticsModal}>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>AI Lead Analytics</span>
                  </DialogTitle>
                  <DialogDescription>
                    View comprehensive analytics and performance metrics for AI-generated leads.
                  </DialogDescription>
                </DialogHeader>
                
                <AnalyticsDashboard onClose={() => setShowAnalyticsModal(false)} />
              </DialogContent>
            </Dialog>

            {/* Data Source Configuration Modal */}
            <Dialog open={showDataSourceConfig} onOpenChange={setShowDataSourceConfig}>
              <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center space-x-2">
                    <Settings className="h-5 w-5" />
                    <span>Configure Real Data Sources</span>
                  </DialogTitle>
                  <DialogDescription>
                    Replace fake demonstration data with real company information from professional data providers.
                  </DialogDescription>
                </DialogHeader>
                
                <DataSourceConfig onClose={() => setShowDataSourceConfig(false)} />
              </DialogContent>
            </Dialog>
    </div>
  )
}

// Lead Brief Form Component
function LeadBriefForm({ 
  editingBrief,
  onClose, 
  onBriefCreated 
}: { 
  editingBrief?: typeof createdBriefs[0] | null
  onClose: () => void
  onBriefCreated: (brief: {
    id: string
    lead_type: string
    geography: string
    industry: string
    employee_band: string
    entity_type: string
    time_horizon: string
    notes: string
    status: string
    created_at: string
  }) => void
}) {
  const [formData, setFormData] = useState({
    lead_type: editingBrief?.lead_type || 'account',
    geography: editingBrief?.geography || 'US',
    industry: editingBrief?.industry || '',
    employee_band: editingBrief?.employee_band || '',
    entity_type: editingBrief?.entity_type || 'PRIVATE',
    time_horizon: editingBrief?.time_horizon || 'NEAR_TERM',
    notes: editingBrief?.notes || ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log(editingBrief ? 'Updating lead brief:' : 'Creating lead brief:', formData)
    
    // Create a brief object with a unique ID
    const brief = {
      id: editingBrief?.id || `brief_${Date.now()}`,
      lead_type: formData.lead_type,
      geography: formData.geography,
      industry: formData.industry,
      employee_band: formData.employee_band,
      entity_type: formData.entity_type,
      time_horizon: formData.time_horizon,
      notes: formData.notes,
      status: editingBrief?.status || 'draft',
      created_at: editingBrief?.created_at || new Date().toISOString()
    }
    
    // Call the callback to add/update the brief
    onBriefCreated(brief)
    
    // Show success message
    alert(`${editingBrief ? 'Lead Brief Updated' : 'Lead Brief Created'}!\n\nType: ${formData.lead_type}\nGeography: ${formData.geography}\nEntity: ${formData.entity_type}`)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="lead_type">Lead Type *</Label>
          <Select value={formData.lead_type} onValueChange={(value) => setFormData({ ...formData, lead_type: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="account">Account (Company)</SelectItem>
              <SelectItem value="contact">Contact (Person)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="geography">Geography *</Label>
          <Select value={formData.geography} onValueChange={(value) => setFormData({ ...formData, geography: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="US">United States</SelectItem>
              <SelectItem value="EU">European Union</SelectItem>
              <SelectItem value="UK">United Kingdom</SelectItem>
              <SelectItem value="APAC">Asia Pacific</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="industry">Industry</Label>
          <Input
            id="industry"
            value={formData.industry}
            onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
            placeholder="e.g., Technology, Healthcare"
          />
        </div>

        <div>
          <Label htmlFor="employee_band">Employee Band</Label>
          <Select value={formData.employee_band} onValueChange={(value) => setFormData({ ...formData, employee_band: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select employee band" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1–50">1–50 employees</SelectItem>
              <SelectItem value="51–200">51–200 employees</SelectItem>
              <SelectItem value="201–1k">201–1k employees</SelectItem>
              <SelectItem value="1k–5k">1k–5k employees</SelectItem>
              <SelectItem value="&gt;5k">&gt;5k employees</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="entity_type">Entity Type *</Label>
          <Select value={formData.entity_type} onValueChange={(value) => setFormData({ ...formData, entity_type: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PUBLIC">Public Company</SelectItem>
              <SelectItem value="PRIVATE">Private Company</SelectItem>
              <SelectItem value="NONPROFIT">Nonprofit</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="time_horizon">Time Horizon</Label>
          <Select value={formData.time_horizon} onValueChange={(value) => setFormData({ ...formData, time_horizon: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NEAR_TERM">Near Term (0-3 months)</SelectItem>
              <SelectItem value="MID_TERM">Mid Term (3-6 months)</SelectItem>
              <SelectItem value="LONG_TERM">Long Term (6+ months)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Describe the ideal lead profile..."
          rows={4}
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
            <Button type="submit">
              <Plus className="h-4 w-4 mr-2" />
              {editingBrief ? 'Update Brief' : 'Create Brief'}
            </Button>
      </div>
    </form>
  )
}

// AI Generation Form Component
function AIGenerationForm({ 
  onClose, 
  availableBriefs,
  onStartGeneration,
  isGenerating,
  generationProgress,
  generatedLeads,
  onLeadAction,
  acceptingLead
}: { 
  onClose: () => void
  availableBriefs: Array<{
    id: string
    lead_type: string
    geography: string
    industry: string
    employee_band: string
    entity_type: string
    time_horizon: string
    notes: string
    status: string
    created_at: string
  }>
  onStartGeneration: (briefId: string, targetCount: number) => Promise<void>
  isGenerating: boolean
  generationProgress: number
  generatedLeads: Array<{
    id: string
    name: string
    company: string
    industry: string
    location: string
    size: string
    website: string
    description: string
    score: number
    status: 'pending' | 'accepted' | 'rejected'
    createdAt: string
  }>
  onLeadAction: (leadId: string, action: 'accept' | 'reject') => void
  acceptingLead: string | null
}) {
  const [formData, setFormData] = useState({
    briefId: '',
    targetCount: '100',
    priority: 'medium',
    enrichmentLevel: 'standard'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Starting AI generation:', formData)
    
    // Check if a valid brief is selected
    if (!formData.briefId || formData.briefId === 'no-briefs') {
      alert('Please select a valid brief before starting generation.')
      return
    }
    
    // Find the selected brief
    const selectedBrief = availableBriefs.find(brief => brief.id === formData.briefId)
    
    // Start the generation process
    await onStartGeneration(formData.briefId, parseInt(formData.targetCount))
    
    alert(`AI Generation Started!\n\nBrief: ${selectedBrief ? `Brief ${selectedBrief.id.slice(-8)}` : 'Unknown'}\nTarget Count: ${formData.targetCount}\nPriority: ${formData.priority}\nEnrichment: ${formData.enrichmentLevel}`)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="briefId">Select Brief *</Label>
          <Select value={formData.briefId} onValueChange={(value) => setFormData({ ...formData, briefId: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select a lead brief" />
            </SelectTrigger>
            <SelectContent>
              {availableBriefs.length === 0 ? (
                <SelectItem value="no-briefs" disabled>No briefs available - Create a brief first</SelectItem>
              ) : (
                availableBriefs.map((brief) => (
                  <SelectItem key={brief.id} value={brief.id}>
                    Brief {brief.id.slice(-8)} ({brief.geography}, {brief.lead_type})
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="targetCount">Target Lead Count *</Label>
          <Select value={formData.targetCount} onValueChange={(value) => setFormData({ ...formData, targetCount: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="50">50 leads</SelectItem>
              <SelectItem value="100">100 leads</SelectItem>
              <SelectItem value="250">250 leads</SelectItem>
              <SelectItem value="500">500 leads</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="priority">Priority</Label>
          <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="enrichmentLevel">Enrichment Level</Label>
          <Select value={formData.enrichmentLevel} onValueChange={(value) => setFormData({ ...formData, enrichmentLevel: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="basic">Basic</SelectItem>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Progress Section */}
      {isGenerating && (
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Generating leads...</span>
              <span>{generationProgress}%</span>
            </div>
            <Progress value={generationProgress} className="w-full" />
          </div>
        </div>
      )}

            {/* Generated Leads Section */}
            {generatedLeads.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Generated Leads ({generatedLeads.length})</h3>
                  <div className="flex items-center space-x-4 text-sm">
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {generatedLeads.filter(lead => lead.status === 'accepted').length} Accepted
                    </Badge>
                    <Badge className="bg-red-100 text-red-800">
                      <X className="h-3 w-3 mr-1" />
                      {generatedLeads.filter(lead => lead.status === 'rejected').length} Rejected
                    </Badge>
                    <Badge variant="outline">
                      <Clock className="h-3 w-3 mr-1" />
                      {generatedLeads.filter(lead => lead.status === 'pending').length} Pending
                    </Badge>
                  </div>
                </div>
          <div className="max-h-96 overflow-y-auto space-y-3">
            {generatedLeads.map((lead) => (
              <Card key={lead.id} className={`p-4 ${
                lead.status === 'accepted' ? 'border-green-200 bg-green-50' :
                lead.status === 'rejected' ? 'border-red-200 bg-red-50' :
                'border-gray-200'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium">{lead.name}</h4>
                      <Badge variant={lead.score >= 80 ? 'default' : lead.score >= 60 ? 'secondary' : 'outline'}>
                        Score: {lead.score}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                      <div>Company: {lead.company}</div>
                      <div>Industry: {lead.industry}</div>
                      <div>Location: {lead.location}</div>
                      <div>Size: {lead.size}</div>
                      <div className="col-span-2">
                        Website: <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">{lead.website}</a>
                      </div>
                      {lead.description && (
                        <div className="col-span-2 text-xs text-gray-500 mt-1">
                          {lead.description}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                          {lead.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onLeadAction(lead.id, 'accept')}
                                disabled={acceptingLead === lead.id}
                                className="text-green-600 border-green-200 hover:bg-green-50 disabled:opacity-50"
                              >
                                {acceptingLead === lead.id ? (
                                  <>
                                    <Clock className="h-4 w-4 mr-1 animate-spin" />
                                    Adding...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Accept
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onLeadAction(lead.id, 'reject')}
                                disabled={acceptingLead === lead.id}
                                className="text-red-600 border-red-200 hover:bg-red-50 disabled:opacity-50"
                              >
                                <X className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                    {lead.status === 'accepted' && (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Accepted
                      </Badge>
                    )}
                    {lead.status === 'rejected' && (
                      <Badge className="bg-red-100 text-red-800">
                        <X className="h-3 w-3 mr-1" />
                        Rejected
                      </Badge>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={!formData.briefId || formData.briefId === 'no-briefs' || isGenerating}
        >
          <Play className="h-4 w-4 mr-2" />
          {isGenerating ? 'Generating...' : 'Start Generation'}
        </Button>
      </div>
    </form>
  )
}

// Analytics Dashboard Component
function AnalyticsDashboard({ onClose }: { onClose: () => void }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Leads Generated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,247</div>
            <p className="text-xs text-gray-500">+12% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Qualification Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">68%</div>
            <p className="text-xs text-gray-500">+5% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23%</div>
            <p className="text-xs text-gray-500">+3% from last month</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  )
}