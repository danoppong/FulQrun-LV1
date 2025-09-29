import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/supabase'

type LearningModule = Database['public']['Tables']['learning_modules']['Row']
type LearningModuleInsert = Database['public']['Tables']['learning_modules']['Insert']
type LearningModuleUpdate = Database['public']['Tables']['learning_modules']['Update']
type UserLearningProgress = Database['public']['Tables']['user_learning_progress']['Row']
type UserLearningProgressUpdate = Database['public']['Tables']['user_learning_progress']['Update']

export interface LearningModuleData {
  id: string
  title: string
  description: string | null
  content: string
  moduleType: 'video' | 'article' | 'quiz' | 'interactive' | 'micro_learning'
  durationMinutes: number | null
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced'
  tags: string[]
  prerequisites: string[]
  certificationRequired: boolean
  isActive: boolean
  organizationId: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface UserProgressData {
  id: string
  userId: string
  moduleId: string
  status: 'not_started' | 'in_progress' | 'completed' | 'certified'
  progressPercentage: number
  timeSpentMinutes: number
  lastAccessedAt: string | null
  completedAt: string | null
  certificationDate: string | null
  quizScores: Record<string, number>
  organizationId: string
  createdAt: string
  updatedAt: string
}

export interface LearningRecommendation {
  moduleId: string
  title: string
  reason: string
  priority: 'high' | 'medium' | 'low'
  estimatedTime: number
}

export class LearningAPI {
  /**
   * Get all learning modules for an organization
   */
  static async getModules(organizationId: string): Promise<LearningModuleData[]> {
    const { data, error } = await supabase
      .from('learning_modules')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch learning modules: ${error.message}`)
    }

    return data.map(this.transformToLearningModuleData)
  }

  /**
   * Get a specific learning module by ID
   */
  static async getModule(id: string): Promise<LearningModuleData | null> {
    const { data, error } = await supabase
      .from('learning_modules')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to fetch learning module: ${error.message}`)
    }

    return this.transformToLearningModuleData(data)
  }

  /**
   * Create a new learning module
   */
  static async createModule(
    module: Omit<LearningModuleData, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<LearningModuleData> {
    const insertData: LearningModuleInsert = {
      title: module.title,
      description: module.description,
      content: module.content,
      module_type: module.moduleType,
      duration_minutes: module.durationMinutes,
      difficulty_level: module.difficultyLevel,
      tags: module.tags,
      prerequisites: module.prerequisites,
      certification_required: module.certificationRequired,
      is_active: module.isActive,
      organization_id: module.organizationId,
      created_by: module.createdBy,
    }

    const { data, error } = await supabase
      .from('learning_modules')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create learning module: ${error.message}`)
    }

    return this.transformToLearningModuleData(data)
  }

  /**
   * Update an existing learning module
   */
  static async updateModule(
    id: string,
    updates: Partial<Omit<LearningModuleData, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<LearningModuleData> {
    const updateData: LearningModuleUpdate = {
      title: updates.title,
      description: updates.description,
      content: updates.content,
      module_type: updates.moduleType,
      duration_minutes: updates.durationMinutes,
      difficulty_level: updates.difficultyLevel,
      tags: updates.tags,
      prerequisites: updates.prerequisites,
      certification_required: updates.certificationRequired,
      is_active: updates.isActive,
    }

    const { data, error } = await supabase
      .from('learning_modules')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update learning module: ${error.message}`)
    }

    return this.transformToLearningModuleData(data)
  }

  /**
   * Delete a learning module
   */
  static async deleteModule(id: string): Promise<void> {
    const { error } = await supabase
      .from('learning_modules')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete learning module: ${error.message}`)
    }
  }

  /**
   * Get user's learning progress
   */
  static async getUserProgress(userId: string): Promise<UserProgressData[]> {
    const { data, error } = await supabase
      .from('user_learning_progress')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch user learning progress: ${error.message}`)
    }

    return data.map(this.transformToUserProgressData)
  }

  /**
   * Get user's progress for a specific module
   */
  static async getUserModuleProgress(
    userId: string,
    moduleId: string
  ): Promise<UserProgressData | null> {
    const { data, error } = await supabase
      .from('user_learning_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('module_id', moduleId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to fetch user module progress: ${error.message}`)
    }

    return this.transformToUserProgressData(data)
  }

  /**
   * Update user's learning progress
   */
  static async updateUserProgress(
    userId: string,
    moduleId: string,
    organizationId: string,
    progress: Partial<Omit<UserProgressData, 'id' | 'userId' | 'moduleId' | 'organizationId' | 'createdAt' | 'updatedAt'>>
  ): Promise<UserProgressData> {
    const updateData: UserLearningProgressUpdate = {
      status: progress.status,
      progress_percentage: progress.progressPercentage,
      time_spent_minutes: progress.timeSpentMinutes,
      last_accessed_at: progress.lastAccessedAt,
      completed_at: progress.completedAt,
      certification_date: progress.certificationDate,
      quiz_scores: progress.quizScores,
    }

    const { data, error } = await supabase
      .from('user_learning_progress')
      .upsert({
        user_id: userId,
        module_id: moduleId,
        ...updateData,
        organization_id: organizationId, // Use the passed organizationId
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update user learning progress: ${error.message}`)
    }

    return this.transformToUserProgressData(data)
  }

  /**
   * Start a learning module
   */
  static async startModule(
    userId: string,
    moduleId: string,
    organizationId: string
  ): Promise<UserProgressData> {
    return this.updateUserProgress(userId, moduleId, organizationId, {
      status: 'in_progress',
      progressPercentage: 0,
      timeSpentMinutes: 0,
      lastAccessedAt: new Date().toISOString(),
    })
  }

  /**
   * Complete a learning module
   */
  static async completeModule(
    userId: string,
    moduleId: string,
    organizationId: string,
    quizScores?: Record<string, number>
  ): Promise<UserProgressData> {
    return this.updateUserProgress(userId, moduleId, organizationId, {
      status: 'completed',
      progressPercentage: 100,
      completedAt: new Date().toISOString(),
      lastAccessedAt: new Date().toISOString(),
      quizScores: quizScores || {},
    })
  }

  /**
   * Award certification for a module
   */
  static async awardCertification(
    userId: string,
    moduleId: string,
    organizationId: string
  ): Promise<UserProgressData> {
    return this.updateUserProgress(userId, moduleId, organizationId, {
      status: 'certified',
      certificationDate: new Date().toISOString(),
    })
  }

  /**
   * Get learning recommendations for a user
   */
  static async getRecommendations(
    userId: string,
    organizationId: string
  ): Promise<LearningRecommendation[]> {
    // Get user's current progress
    const userProgress = await this.getUserProgress(userId)
    const completedModuleIds = userProgress
      .filter(p => p.status === 'completed' || p.status === 'certified')
      .map(p => p.moduleId)

    // Get all modules
    const modules = await this.getModules(organizationId)

    // Filter out completed modules and get recommendations
    const availableModules = modules.filter(m => !completedModuleIds.includes(m.id))

    // Simple recommendation logic - can be enhanced with AI
    const recommendations: LearningRecommendation[] = availableModules.map(module => ({
      moduleId: module.id,
      title: module.title,
      reason: this.getRecommendationReason(module),
      priority: this.getRecommendationPriority(module),
      estimatedTime: module.durationMinutes || 30,
    }))

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
  }

  /**
   * Get contextual learning recommendations based on opportunity stage
   */
  static async getContextualRecommendations(
    userId: string,
    organizationId: string,
    opportunityStage: string
  ): Promise<LearningRecommendation[]> {
    const allRecommendations = await this.getRecommendations(userId, organizationId)
    
    // Filter recommendations based on opportunity stage
    return allRecommendations.filter(rec => {
      const learningModule = allRecommendations.find(m => m.moduleId === rec.moduleId)
      return learningModule && this.isRelevantToStage(learningModule, opportunityStage)
    })
  }

  /**
   * Get learning statistics for a user
   */
  static async getUserLearningStats(userId: string): Promise<{
    totalModules: number
    completedModules: number
    certifiedModules: number
    totalTimeSpent: number
    averageScore: number
  }> {
    const userProgress = await this.getUserProgress(userId)
    
    const completedModules = userProgress.filter(p => p.status === 'completed' || p.status === 'certified')
    const certifiedModules = userProgress.filter(p => p.status === 'certified')
    const totalTimeSpent = userProgress.reduce((sum, p) => sum + p.timeSpentMinutes, 0)
    
    // Calculate average quiz score
    const quizScores = userProgress
      .filter(p => p.quizScores && Object.keys(p.quizScores).length > 0)
      .map(p => {
        const scores = Object.values(p.quizScores) as number[]
        return scores.reduce((sum, score) => sum + score, 0) / scores.length
      })
    
    const averageScore = quizScores.length > 0 
      ? quizScores.reduce((sum, score) => sum + score, 0) / quizScores.length 
      : 0

    return {
      totalModules: userProgress.length,
      completedModules: completedModules.length,
      certifiedModules: certifiedModules.length,
      totalTimeSpent,
      averageScore: Math.round(averageScore * 100) / 100,
    }
  }

  /**
   * Get recommendation reason for a module
   */
  private static getRecommendationReason(
    module: LearningModuleData
  ): string {
    // Simple logic - can be enhanced with AI
    if (module.difficultyLevel === 'beginner') {
      return 'Perfect for building foundational knowledge'
    } else if (module.tags.includes('sales')) {
      return 'Essential sales skills for your role'
    } else if (module.certificationRequired) {
      return 'Required certification for career advancement'
    } else {
      return 'Recommended based on your learning history'
    }
  }

  /**
   * Get recommendation priority for a module
   */
  private static getRecommendationPriority(
    module: LearningModuleData
  ): 'high' | 'medium' | 'low' {
    if (module.certificationRequired) return 'high'
    if (module.difficultyLevel === 'beginner') return 'high'
    if (module.tags.includes('sales')) return 'medium'
    return 'low'
  }

  /**
   * Check if module is relevant to opportunity stage
   */
  private static isRelevantToStage(learningModule: Record<string, unknown>, stage: string): boolean {
    // Simple stage-based filtering - can be enhanced
    const stageTags = {
      'prospecting': ['prospecting', 'lead generation', 'cold calling'],
      'engaging': ['engagement', 'communication', 'presentation'],
      'advancing': ['negotiation', 'closing', 'objection handling'],
      'key_decision': ['closing', 'contract', 'final presentation']
    }
    
    const relevantTags = stageTags[stage as keyof typeof stageTags] || []
    return learningModule.tags?.some((tag: string) => 
      relevantTags.some(relevantTag => 
        tag.toLowerCase().includes(relevantTag.toLowerCase())
      )
    ) || false
  }

  /**
   * Transform database row to LearningModuleData
   */
  private static transformToLearningModuleData(data: LearningModule): LearningModuleData {
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      content: data.content,
      moduleType: data.module_type,
      durationMinutes: data.duration_minutes,
      difficultyLevel: data.difficulty_level,
      tags: data.tags,
      prerequisites: data.prerequisites,
      certificationRequired: data.certification_required,
      isActive: data.is_active,
      organizationId: data.organization_id,
      createdBy: data.created_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  }

  /**
   * Transform database row to UserProgressData
   */
  private static transformToUserProgressData(data: UserLearningProgress): UserProgressData {
    return {
      id: data.id,
      userId: data.user_id,
      moduleId: data.module_id,
      status: data.status,
      progressPercentage: data.progress_percentage,
      timeSpentMinutes: data.time_spent_minutes,
      lastAccessedAt: data.last_accessed_at,
      completedAt: data.completed_at,
      certificationDate: data.certification_date,
      quizScores: data.quiz_scores,
      organizationId: data.organization_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  }
}
