// Enterprise Learning Management System
// Core logic for LMS, certification tracks, compliance training, and AI-powered personalization

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Types
export interface LearningModule {
  id: string;
  title: string;
  description: string;
  type: 'video' | 'article' | 'quiz' | 'interactive' | 'simulation';
  duration: number; // in minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  tags: string[];
  content: Record<string, unknown>;
  prerequisites: string[];
  learningObjectives: string[];
  assessmentCriteria: string[];
  isComplianceRequired: boolean;
  complianceStandards: string[];
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CertificationTrack {
  id: string;
  name: string;
  description: string;
  modules: string[];
  requirements: {
    minScore: number;
    maxAttempts: number;
    timeLimit: number;
    prerequisites: string[];
  };
  validityPeriod: number; // in days
  isActive: boolean;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProgress {
  id: string;
  userId: string;
  moduleId: string;
  trackId?: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'failed';
  progress: number; // 0-100
  score?: number;
  attempts: number;
  timeSpent: number; // in minutes
  lastAccessedAt: Date;
  completedAt?: Date;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LearningPath {
  id: string;
  name: string;
  description: string;
  modules: string[];
  estimatedDuration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  isPersonalized: boolean;
  aiGenerated: boolean;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ComplianceRecord {
  id: string;
  userId: string;
  moduleId: string;
  trackId?: string;
  completedAt: Date;
  score: number;
  certificateUrl?: string;
  expiryDate?: Date;
  isExpired: boolean;
  organizationId: string;
  createdAt: Date;
}

export interface LearningAnalytics {
  id: string;
  userId: string;
  moduleId: string;
  eventType: 'start' | 'pause' | 'resume' | 'complete' | 'fail' | 'skip';
  timestamp: Date;
  metadata: Record<string, unknown>;
  organizationId: string;
}

class LearningManagementSystem {
  // Module Management
  async createModule(module: Omit<LearningModule, 'id' | 'createdAt' | 'updatedAt'>): Promise<LearningModule> {
    const { data, error } = await supabase
      .from('learning_modules')
      .insert({
        title: module.title,
        description: module.description,
        type: module.type,
        duration: module.duration,
        difficulty: module.difficulty,
        category: module.category,
        tags: module.tags,
        content: module.content,
        prerequisites: module.prerequisites,
        learning_objectives: module.learningObjectives,
        assessment_criteria: module.assessmentCriteria,
        is_compliance_required: module.isComplianceRequired,
        compliance_standards: module.complianceStandards,
        organization_id: module.organizationId
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      title: data.title,
      description: data.description,
      type: data.type,
      duration: data.duration,
      difficulty: data.difficulty,
      category: data.category,
      tags: data.tags,
      content: data.content,
      prerequisites: data.prerequisites,
      learningObjectives: data.learning_objectives,
      assessmentCriteria: data.assessment_criteria,
      isComplianceRequired: data.is_compliance_required,
      complianceStandards: data.compliance_standards,
      organizationId: data.organization_id,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  async getModules(organizationId: string, category?: string): Promise<LearningModule[]> {
    let query = supabase
      .from('learning_modules')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true);

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data.map(module => ({
      id: module.id,
      title: module.title,
      description: module.description,
      type: module.type,
      duration: module.duration,
      difficulty: module.difficulty,
      category: module.category,
      tags: module.tags,
      content: module.content,
      prerequisites: module.prerequisites,
      learningObjectives: module.learning_objectives,
      assessmentCriteria: module.assessment_criteria,
      isComplianceRequired: module.is_compliance_required,
      complianceStandards: module.compliance_standards,
      organizationId: module.organization_id,
      createdAt: new Date(module.created_at),
      updatedAt: new Date(module.updated_at)
    }));
  }

  async getModule(moduleId: string): Promise<LearningModule | null> {
    const { data, error } = await supabase
      .from('learning_modules')
      .select('*')
      .eq('id', moduleId)
      .single();

    if (error) return null;

    return {
      id: data.id,
      title: data.title,
      description: data.description,
      type: data.type,
      duration: data.duration,
      difficulty: data.difficulty,
      category: data.category,
      tags: data.tags,
      content: data.content,
      prerequisites: data.prerequisites,
      learningObjectives: data.learning_objectives,
      assessmentCriteria: data.assessment_criteria,
      isComplianceRequired: data.is_compliance_required,
      complianceStandards: data.compliance_standards,
      organizationId: data.organization_id,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  // Certification Track Management
  async createCertificationTrack(track: Omit<CertificationTrack, 'id' | 'createdAt' | 'updatedAt'>): Promise<CertificationTrack> {
    const { data, error } = await supabase
      .from('certification_tracks')
      .insert({
        name: track.name,
        description: track.description,
        modules: track.modules,
        requirements: track.requirements,
        validity_period: track.validityPeriod,
        is_active: track.isActive,
        organization_id: track.organizationId
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      modules: data.modules,
      requirements: data.requirements,
      validityPeriod: data.validity_period,
      isActive: data.is_active,
      organizationId: data.organization_id,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  async getCertificationTracks(organizationId: string): Promise<CertificationTrack[]> {
    const { data, error } = await supabase
      .from('certification_tracks')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true);

    if (error) throw error;

    return data.map(track => ({
      id: track.id,
      name: track.name,
      description: track.description,
      modules: track.modules,
      requirements: track.requirements,
      validityPeriod: track.validity_period,
      isActive: track.is_active,
      organizationId: track.organization_id,
      createdAt: new Date(track.created_at),
      updatedAt: new Date(track.updated_at)
    }));
  }

  // User Progress Management
  async startModule(userId: string, moduleId: string, organizationId: string): Promise<UserProgress> {
    const existingProgress = await this.getUserProgress(userId, moduleId);
    
    if (existingProgress) {
      return existingProgress;
    }

    const { data, error } = await supabase
      .from('user_learning_progress')
      .insert({
        user_id: userId,
        module_id: moduleId,
        status: 'in_progress',
        progress: 0,
        attempts: 0,
        time_spent: 0,
        last_accessed_at: new Date().toISOString(),
        organization_id: organizationId
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      userId: data.user_id,
      moduleId: data.module_id,
      trackId: data.track_id,
      status: data.status,
      progress: data.progress,
      score: data.score,
      attempts: data.attempts,
      timeSpent: data.time_spent,
      lastAccessedAt: new Date(data.last_accessed_at),
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
      organizationId: data.organization_id,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  async updateProgress(
    userId: string,
    moduleId: string,
    progress: number,
    timeSpent: number
  ): Promise<UserProgress> {
    const { data, error } = await supabase
      .from('user_learning_progress')
      .update({
        progress,
        time_spent: timeSpent,
        last_accessed_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('module_id', moduleId)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      userId: data.user_id,
      moduleId: data.module_id,
      trackId: data.track_id,
      status: data.status,
      progress: data.progress,
      score: data.score,
      attempts: data.attempts,
      timeSpent: data.time_spent,
      lastAccessedAt: new Date(data.last_accessed_at),
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
      organizationId: data.organization_id,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  async completeModule(
    userId: string,
    moduleId: string,
    score: number,
    timeSpent: number
  ): Promise<UserProgress> {
    // Get existing progress first
    const { data: existingProgress } = await supabase
      .from('user_learning_progress')
      .select('attempts')
      .eq('user_id', userId)
      .eq('module_id', moduleId)
      .single();

    const { data, error } = await supabase
      .from('user_learning_progress')
      .update({
        status: 'completed',
        progress: 100,
        score,
        attempts: (existingProgress?.attempts || 0) + 1,
        time_spent: timeSpent,
        completed_at: new Date().toISOString(),
        last_accessed_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('module_id', moduleId)
      .select()
      .single();

    if (error) throw error;

    // Create compliance record if required
    const learningModule = await this.getModule(moduleId);
    if (learningModule?.isComplianceRequired) {
      await this.createComplianceRecord({
        userId,
        moduleId,
        completedAt: new Date(),
        score,
        organizationId: learningModule.organizationId,
        isExpired: false
      });
    }

    return {
      id: data.id,
      userId: data.user_id,
      moduleId: data.module_id,
      trackId: data.track_id,
      status: data.status,
      progress: data.progress,
      score: data.score,
      attempts: data.attempts,
      timeSpent: data.time_spent,
      lastAccessedAt: new Date(data.last_accessed_at),
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
      organizationId: data.organization_id,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  async getUserProgress(userId: string, moduleId: string): Promise<UserProgress | null> {
    const { data, error } = await supabase
      .from('user_learning_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('module_id', moduleId)
      .single();

    if (error) return null;

    return {
      id: data.id,
      userId: data.user_id,
      moduleId: data.module_id,
      trackId: data.track_id,
      status: data.status,
      progress: data.progress,
      score: data.score,
      attempts: data.attempts,
      timeSpent: data.time_spent,
      lastAccessedAt: new Date(data.last_accessed_at),
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
      organizationId: data.organization_id,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  async getUserProgressByOrganization(userId: string, organizationId: string): Promise<UserProgress[]> {
    const { data, error } = await supabase
      .from('user_learning_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('organization_id', organizationId);

    if (error) throw error;

    return data.map(progress => ({
      id: progress.id,
      userId: progress.user_id,
      moduleId: progress.module_id,
      trackId: progress.track_id,
      status: progress.status,
      progress: progress.progress,
      score: progress.score,
      attempts: progress.attempts,
      timeSpent: progress.time_spent,
      lastAccessedAt: new Date(progress.last_accessed_at),
      completedAt: progress.completed_at ? new Date(progress.completed_at) : undefined,
      organizationId: progress.organization_id,
      createdAt: new Date(progress.created_at),
      updatedAt: new Date(progress.updated_at)
    }));
  }

  // AI-Powered Personalization
  async generatePersonalizedLearningPath(
    userId: string,
    organizationId: string,
    preferences: {
      categories: string[];
      difficulty: 'beginner' | 'intermediate' | 'advanced';
      estimatedDuration: number;
      learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
    }
  ): Promise<LearningPath> {
    // Get user's existing progress and performance
    const userProgress = await this.getUserProgressByOrganization(userId, organizationId);
    const completedModules = userProgress.filter(p => p.status === 'completed');
    const failedModules = userProgress.filter(p => p.status === 'failed');

    // Analyze user's strengths and weaknesses
    const performanceAnalysis = this.analyzeUserPerformance(userProgress);
    
    // Get available modules
    const availableModules = await this.getModules(organizationId);
    
    // Filter modules based on preferences and prerequisites
    const filteredModules = availableModules.filter(module => {
      // Check if user has completed prerequisites
      const prerequisitesMet = module.prerequisites.every(prereqId => 
        completedModules.some(progress => progress.moduleId === prereqId)
      );
      
      // Check if module matches preferences
      const matchesCategory = preferences.categories.includes(module.category);
      const matchesDifficulty = module.difficulty === preferences.difficulty;
      
      return prerequisitesMet && matchesCategory && matchesDifficulty;
    });

    // Use AI to generate personalized learning path
    const personalizedModules = await this.generateAIRecommendedModules(
      filteredModules,
      performanceAnalysis,
      preferences
    );

    // Create learning path
    const learningPath = await this.createLearningPath({
      name: `Personalized Path for ${userId}`,
      description: 'AI-generated personalized learning path',
      modules: personalizedModules.map(m => m.id),
      estimatedDuration: personalizedModules.reduce((total, m) => total + m.duration, 0),
      difficulty: preferences.difficulty,
      isPersonalized: true,
      aiGenerated: true,
      organizationId
    });

    return learningPath;
  }

  private analyzeUserPerformance(progress: UserProgress[]): Record<string, unknown> {
    const completed = progress.filter(p => p.status === 'completed');
    const failed = progress.filter(p => p.status === 'failed');
    
    return {
      completionRate: completed.length / progress.length,
      averageScore: completed.reduce((sum, p) => sum + (p.score || 0), 0) / completed.length,
      averageTimeSpent: completed.reduce((sum, p) => sum + p.timeSpent, 0) / completed.length,
      failureRate: failed.length / progress.length,
      strengths: this.identifyStrengths(completed),
      weaknesses: this.identifyWeaknesses(failed)
    };
  }

  private identifyStrengths(completed: UserProgress[]): string[] {
    // Analyze completed modules to identify user strengths
    const strengths: string[] = [];
    
    const highScoringModules = completed.filter(p => (p.score || 0) >= 80);
    const quickCompletionModules = completed.filter(p => p.timeSpent < 30); // Less than 30 minutes
    
    if (highScoringModules.length > completed.length * 0.7) {
      strengths.push('high_performance');
    }
    
    if (quickCompletionModules.length > completed.length * 0.5) {
      strengths.push('fast_learning');
    }
    
    return strengths;
  }

  private identifyWeaknesses(failed: UserProgress[]): string[] {
    // Analyze failed modules to identify user weaknesses
    const weaknesses: string[] = [];
    
    const multipleAttempts = failed.filter(p => p.attempts > 2);
    const longTimeSpent = failed.filter(p => p.timeSpent > 60); // More than 60 minutes
    
    if (multipleAttempts.length > 0) {
      weaknesses.push('retention_challenges');
    }
    
    if (longTimeSpent.length > 0) {
      weaknesses.push('time_management');
    }
    
    return weaknesses;
  }

  private async generateAIRecommendedModules(
    availableModules: LearningModule[],
    performanceAnalysis: Record<string, unknown>,
    preferences: Record<string, unknown>
  ): Promise<LearningModule[]> {
    // This would integrate with AI service to generate recommendations
    // For now, return a simple algorithm-based recommendation
    
    const recommendedModules = [...availableModules];
    
    // Sort by difficulty if user prefers structured learning
    if (preferences.learningStyle === 'reading') {
      recommendedModules.sort((a, b) => {
        const difficultyOrder = { beginner: 1, intermediate: 2, advanced: 3 };
        return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
      });
    }
    
    // Limit to estimated duration
    let totalDuration = 0;
    const limitedModules = [];
    
    for (const learningModule of recommendedModules) {
      if (totalDuration + learningModule.duration <= preferences.estimatedDuration) {
        limitedModules.push(learningModule);
        totalDuration += learningModule.duration;
      }
    }
    
    return limitedModules;
  }

  // Learning Path Management
  async createLearningPath(path: Omit<LearningPath, 'id' | 'createdAt' | 'updatedAt'>): Promise<LearningPath> {
    const { data, error } = await supabase
      .from('learning_paths')
      .insert({
        name: path.name,
        description: path.description,
        modules: path.modules,
        estimated_duration: path.estimatedDuration,
        difficulty: path.difficulty,
        is_personalized: path.isPersonalized,
        ai_generated: path.aiGenerated,
        organization_id: path.organizationId
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      modules: data.modules,
      estimatedDuration: data.estimated_duration,
      difficulty: data.difficulty,
      isPersonalized: data.is_personalized,
      aiGenerated: data.ai_generated,
      organizationId: data.organization_id,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  async getLearningPaths(organizationId: string): Promise<LearningPath[]> {
    const { data, error } = await supabase
      .from('learning_paths')
      .select('*')
      .eq('organization_id', organizationId);

    if (error) throw error;

    return data.map(path => ({
      id: path.id,
      name: path.name,
      description: path.description,
      modules: path.modules,
      estimatedDuration: path.estimated_duration,
      difficulty: path.difficulty,
      isPersonalized: path.is_personalized,
      aiGenerated: path.ai_generated,
      organizationId: path.organization_id,
      createdAt: new Date(path.created_at),
      updatedAt: new Date(path.updated_at)
    }));
  }

  // Compliance Management
  async createComplianceRecord(record: Omit<ComplianceRecord, 'id' | 'createdAt'>): Promise<ComplianceRecord> {
    const { data, error } = await supabase
      .from('compliance_records')
      .insert({
        user_id: record.userId,
        module_id: record.moduleId,
        track_id: record.trackId,
        completed_at: record.completedAt.toISOString(),
        score: record.score,
        certificate_url: record.certificateUrl,
        expiry_date: record.expiryDate?.toISOString(),
        is_expired: record.isExpired,
        organization_id: record.organizationId
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      userId: data.user_id,
      moduleId: data.module_id,
      trackId: data.track_id,
      completedAt: new Date(data.completed_at),
      score: data.score,
      certificateUrl: data.certificate_url,
      expiryDate: data.expiry_date ? new Date(data.expiry_date) : undefined,
      isExpired: data.is_expired,
      organizationId: data.organization_id,
      createdAt: new Date(data.created_at)
    };
  }

  async getComplianceRecords(userId: string, organizationId: string): Promise<ComplianceRecord[]> {
    const { data, error } = await supabase
      .from('compliance_records')
      .select('*')
      .eq('user_id', userId)
      .eq('organization_id', organizationId);

    if (error) throw error;

    return data.map(record => ({
      id: record.id,
      userId: record.user_id,
      moduleId: record.module_id,
      trackId: record.track_id,
      completedAt: new Date(record.completed_at),
      score: record.score,
      certificateUrl: record.certificate_url,
      expiryDate: record.expiry_date ? new Date(record.expiry_date) : undefined,
      isExpired: record.is_expired,
      organizationId: record.organization_id,
      createdAt: new Date(record.created_at)
    }));
  }

  // Analytics
  async trackLearningEvent(event: Omit<LearningAnalytics, 'id'>): Promise<void> {
    await supabase
      .from('learning_analytics')
      .insert({
        user_id: event.userId,
        module_id: event.moduleId,
        event_type: event.eventType,
        timestamp: event.timestamp.toISOString(),
        metadata: event.metadata,
        organization_id: event.organizationId
      });
  }

  async getLearningAnalytics(organizationId: string, userId?: string): Promise<LearningAnalytics[]> {
    let query = supabase
      .from('learning_analytics')
      .select('*')
      .eq('organization_id', organizationId);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data.map(analytics => ({
      id: analytics.id,
      userId: analytics.user_id,
      moduleId: analytics.module_id,
      eventType: analytics.event_type,
      timestamp: new Date(analytics.timestamp),
      metadata: analytics.metadata,
      organizationId: analytics.organization_id
    }));
  }

  // Reporting
  async getLearningReport(organizationId: string, dateFrom?: Date, dateTo?: Date): Promise<any> {
    let query = supabase
      .from('user_learning_progress')
      .select('*')
      .eq('organization_id', organizationId);

    if (dateFrom) {
      query = query.gte('created_at', dateFrom.toISOString());
    }

    if (dateTo) {
      query = query.lte('created_at', dateTo.toISOString());
    }

    const { data, error } = await query;

    if (error) throw error;

    const report = {
      totalUsers: new Set(data.map(p => p.user_id)).size,
      totalModules: new Set(data.map(p => p.module_id)).size,
      completedModules: data.filter(p => p.status === 'completed').length,
      inProgressModules: data.filter(p => p.status === 'in_progress').length,
      failedModules: data.filter(p => p.status === 'failed').length,
      averageScore: data
        .filter(p => p.score !== null)
        .reduce((sum, p) => sum + p.score, 0) / data.filter(p => p.score !== null).length,
      averageTimeSpent: data.reduce((sum, p) => sum + p.time_spent, 0) / data.length,
      completionRate: data.filter(p => p.status === 'completed').length / data.length
    };

    return report;
  }
}

export default new LearningManagementSystem();
