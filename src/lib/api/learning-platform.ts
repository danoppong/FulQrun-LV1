// Learning Platform API Layer
// API functions for learning management system, certifications, and compliance

import { createClient } from '@supabase/supabase-js';
import LearningManagementSystem, { 
  LearningModule, 
  CertificationTrack, 
  UserProgress, 
  LearningPath, 
  ComplianceRecord, 
  LearningAnalytics 
} from '@/lib/learning/learning-management';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Module Management
export async function createLearningModule(
  title: string,
  description: string,
  type: 'video' | 'article' | 'quiz' | 'interactive' | 'simulation',
  duration: number,
  difficulty: 'beginner' | 'intermediate' | 'advanced',
  category: string,
  tags: string[],
  content: any,
  prerequisites: string[],
  learningObjectives: string[],
  assessmentCriteria: string[],
  isComplianceRequired: boolean,
  complianceStandards: string[],
  organizationId: string
): Promise<LearningModule> {
  try {
    return await LearningManagementSystem.createModule({
      title,
      description,
      type,
      duration,
      difficulty,
      category,
      tags,
      content,
      prerequisites,
      learningObjectives,
      assessmentCriteria,
      isComplianceRequired,
      complianceStandards,
      organizationId
    });
  } catch (error) {
    console.error('Error creating learning module:', error);
    throw error;
  }
}

export async function getLearningModules(
  organizationId: string,
  category?: string
): Promise<LearningModule[]> {
  try {
    return await LearningManagementSystem.getModules(organizationId, category);
  } catch (error) {
    console.error('Error fetching learning modules:', error);
    throw error;
  }
}

export async function getLearningModule(moduleId: string): Promise<LearningModule | null> {
  try {
    return await LearningManagementSystem.getModule(moduleId);
  } catch (error) {
    console.error('Error fetching learning module:', error);
    throw error;
  }
}

export async function updateLearningModule(
  moduleId: string,
  updates: Partial<LearningModule>
): Promise<LearningModule> {
  try {
    const updateData: any = {};
    if (updates.title) updateData.title = updates.title;
    if (updates.description) updateData.description = updates.description;
    if (updates.type) updateData.type = updates.type;
    if (updates.duration) updateData.duration = updates.duration;
    if (updates.difficulty) updateData.difficulty = updates.difficulty;
    if (updates.category) updateData.category = updates.category;
    if (updates.tags) updateData.tags = updates.tags;
    if (updates.content) updateData.content = updates.content;
    if (updates.prerequisites) updateData.prerequisites = updates.prerequisites;
    if (updates.learningObjectives) updateData.learning_objectives = updates.learningObjectives;
    if (updates.assessmentCriteria) updateData.assessment_criteria = updates.assessmentCriteria;
    if (updates.isComplianceRequired !== undefined) updateData.is_compliance_required = updates.isComplianceRequired;
    if (updates.complianceStandards) updateData.compliance_standards = updates.complianceStandards;

    const { data, error } = await supabase
      .from('learning_modules')
      .update(updateData)
      .eq('id', moduleId)
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
  } catch (error) {
    console.error('Error updating learning module:', error);
    throw error;
  }
}

export async function deleteLearningModule(moduleId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('learning_modules')
      .update({ is_active: false })
      .eq('id', moduleId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting learning module:', error);
    throw error;
  }
}

// Certification Track Management
export async function createCertificationTrack(
  name: string,
  description: string,
  modules: string[],
  requirements: {
    minScore: number;
    maxAttempts: number;
    timeLimit: number;
    prerequisites: string[];
  },
  validityPeriod: number,
  organizationId: string
): Promise<CertificationTrack> {
  try {
    return await LearningManagementSystem.createCertificationTrack({
      name,
      description,
      modules,
      requirements,
      validityPeriod,
      isActive: true,
      organizationId
    });
  } catch (error) {
    console.error('Error creating certification track:', error);
    throw error;
  }
}

export async function getCertificationTracks(organizationId: string): Promise<CertificationTrack[]> {
  try {
    return await LearningManagementSystem.getCertificationTracks(organizationId);
  } catch (error) {
    console.error('Error fetching certification tracks:', error);
    throw error;
  }
}

export async function getCertificationTrack(trackId: string): Promise<CertificationTrack | null> {
  try {
    const { data, error } = await supabase
      .from('certification_tracks')
      .select('*')
      .eq('id', trackId)
      .single();

    if (error) return null;

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
  } catch (error) {
    console.error('Error fetching certification track:', error);
    throw error;
  }
}

// User Progress Management
export async function startLearningModule(
  userId: string,
  moduleId: string,
  organizationId: string
): Promise<UserProgress> {
  try {
    return await LearningManagementSystem.startModule(userId, moduleId, organizationId);
  } catch (error) {
    console.error('Error starting learning module:', error);
    throw error;
  }
}

export async function updateLearningProgress(
  userId: string,
  moduleId: string,
  progress: number,
  timeSpent: number
): Promise<UserProgress> {
  try {
    return await LearningManagementSystem.updateProgress(userId, moduleId, progress, timeSpent);
  } catch (error) {
    console.error('Error updating learning progress:', error);
    throw error;
  }
}

export async function completeLearningModule(
  userId: string,
  moduleId: string,
  score: number,
  timeSpent: number
): Promise<UserProgress> {
  try {
    return await LearningManagementSystem.completeModule(userId, moduleId, score, timeSpent);
  } catch (error) {
    console.error('Error completing learning module:', error);
    throw error;
  }
}

export async function getUserLearningProgress(
  userId: string,
  organizationId: string
): Promise<UserProgress[]> {
  try {
    return await LearningManagementSystem.getUserProgressByOrganization(userId, organizationId);
  } catch (error) {
    console.error('Error fetching user learning progress:', error);
    throw error;
  }
}

export async function getUserModuleProgress(
  userId: string,
  moduleId: string
): Promise<UserProgress | null> {
  try {
    return await LearningManagementSystem.getUserProgress(userId, moduleId);
  } catch (error) {
    console.error('Error fetching user module progress:', error);
    throw error;
  }
}

// AI-Powered Personalization
export async function generatePersonalizedLearningPath(
  userId: string,
  organizationId: string,
  preferences: {
    categories: string[];
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    estimatedDuration: number;
    learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
  }
): Promise<LearningPath> {
  try {
    return await LearningManagementSystem.generatePersonalizedLearningPath(
      userId,
      organizationId,
      preferences
    );
  } catch (error) {
    console.error('Error generating personalized learning path:', error);
    throw error;
  }
}

export async function getLearningPaths(organizationId: string): Promise<LearningPath[]> {
  try {
    return await LearningManagementSystem.getLearningPaths(organizationId);
  } catch (error) {
    console.error('Error fetching learning paths:', error);
    throw error;
  }
}

export async function createLearningPath(
  name: string,
  description: string,
  modules: string[],
  estimatedDuration: number,
  difficulty: 'beginner' | 'intermediate' | 'advanced',
  isPersonalized: boolean,
  aiGenerated: boolean,
  organizationId: string
): Promise<LearningPath> {
  try {
    return await LearningManagementSystem.createLearningPath({
      name,
      description,
      modules,
      estimatedDuration,
      difficulty,
      isPersonalized,
      aiGenerated,
      organizationId
    });
  } catch (error) {
    console.error('Error creating learning path:', error);
    throw error;
  }
}

// Compliance Management
export async function getComplianceRecords(
  userId: string,
  organizationId: string
): Promise<ComplianceRecord[]> {
  try {
    return await LearningManagementSystem.getComplianceRecords(userId, organizationId);
  } catch (error) {
    console.error('Error fetching compliance records:', error);
    throw error;
  }
}

export async function getOrganizationComplianceRecords(organizationId: string): Promise<ComplianceRecord[]> {
  try {
    const { data, error } = await supabase
      .from('compliance_records')
      .select('*')
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
  } catch (error) {
    console.error('Error fetching organization compliance records:', error);
    throw error;
  }
}

export async function generateComplianceCertificate(
  userId: string,
  moduleId: string,
  score: number,
  organizationId: string
): Promise<string> {
  try {
    // This would integrate with a certificate generation service
    // For now, return a placeholder URL
    const certificateUrl = `https://certificates.example.com/${userId}/${moduleId}/${Date.now()}.pdf`;
    
    // Update compliance record with certificate URL
    await supabase
      .from('compliance_records')
      .update({ certificate_url: certificateUrl })
      .eq('user_id', userId)
      .eq('module_id', moduleId)
      .eq('organization_id', organizationId);

    return certificateUrl;
  } catch (error) {
    console.error('Error generating compliance certificate:', error);
    throw error;
  }
}

// Analytics and Reporting
export async function trackLearningEvent(
  userId: string,
  moduleId: string,
  eventType: 'start' | 'pause' | 'resume' | 'complete' | 'fail' | 'skip',
  metadata: any,
  organizationId: string
): Promise<void> {
  try {
    await LearningManagementSystem.trackLearningEvent({
      userId,
      moduleId,
      eventType,
      timestamp: new Date(),
      metadata,
      organizationId
    });
  } catch (error) {
    console.error('Error tracking learning event:', error);
    // Don't throw error for analytics failures
  }
}

export async function getLearningAnalytics(
  organizationId: string,
  userId?: string
): Promise<LearningAnalytics[]> {
  try {
    return await LearningManagementSystem.getLearningAnalytics(organizationId, userId);
  } catch (error) {
    console.error('Error fetching learning analytics:', error);
    throw error;
  }
}

export async function getLearningReport(
  organizationId: string,
  dateFrom?: Date,
  dateTo?: Date
): Promise<any> {
  try {
    return await LearningManagementSystem.getLearningReport(organizationId, dateFrom, dateTo);
  } catch (error) {
    console.error('Error generating learning report:', error);
    throw error;
  }
}

export async function getLearningDashboardData(organizationId: string): Promise<any> {
  try {
    const [report, analytics, complianceRecords] = await Promise.all([
      LearningManagementSystem.getLearningReport(organizationId),
      LearningManagementSystem.getLearningAnalytics(organizationId),
      getOrganizationComplianceRecords(organizationId)
    ]);

    const dashboardData = {
      ...report,
      recentActivity: analytics.slice(-10),
      complianceStatus: {
        totalRecords: complianceRecords.length,
        expiredRecords: complianceRecords.filter(r => r.isExpired).length,
        expiringSoon: complianceRecords.filter(r => 
          r.expiryDate && 
          r.expiryDate.getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000 // 30 days
        ).length
      },
      topPerformers: await getTopPerformers(organizationId),
      popularModules: await getPopularModules(organizationId)
    };

    return dashboardData;
  } catch (error) {
    console.error('Error fetching learning dashboard data:', error);
    throw error;
  }
}

async function getTopPerformers(organizationId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('user_learning_progress')
      .select(`
        user_id,
        score,
        users!inner(email, full_name)
      `)
      .eq('organization_id', organizationId)
      .eq('status', 'completed')
      .not('score', 'is', null)
      .order('score', { ascending: false })
      .limit(10);

    if (error) throw error;

    return data.map(item => ({
      userId: item.user_id,
      email: item.users.email,
      fullName: item.users.full_name,
      averageScore: item.score
    }));
  } catch (error) {
    console.error('Error fetching top performers:', error);
    return [];
  }
}

async function getPopularModules(organizationId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('user_learning_progress')
      .select(`
        module_id,
        learning_modules!inner(title, category, duration)
      `)
      .eq('organization_id', organizationId)
      .eq('status', 'completed');

    if (error) throw error;

    // Count completions per module
    const moduleCounts = data.reduce((acc: any, item) => {
      const moduleId = item.module_id;
      acc[moduleId] = (acc[moduleId] || 0) + 1;
      return acc;
    }, {});

    // Get module details and sort by completion count
    const popularModules = Object.entries(moduleCounts)
      .map(([moduleId, count]) => {
        const moduleData = data.find(d => d.module_id === moduleId);
        return {
          moduleId,
          title: moduleData?.learning_modules?.title,
          category: moduleData?.learning_modules?.category,
          duration: moduleData?.learning_modules?.duration,
          completionCount: count
        };
      })
      .sort((a, b) => b.completionCount - a.completionCount)
      .slice(0, 10);

    return popularModules;
  } catch (error) {
    console.error('Error fetching popular modules:', error);
    return [];
  }
}

// Assessment and Quiz Management
export async function createAssessment(
  moduleId: string,
  questions: any[],
  passingScore: number,
  timeLimit: number,
  organizationId: string
): Promise<any> {
  try {
    const { data, error } = await supabase
      .from('assessments')
      .insert({
        module_id: moduleId,
        questions,
        passing_score: passingScore,
        time_limit: timeLimit,
        organization_id: organizationId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating assessment:', error);
    throw error;
  }
}

export async function submitAssessment(
  userId: string,
  assessmentId: string,
  answers: any[],
  timeSpent: number,
  organizationId: string
): Promise<any> {
  try {
    // Get assessment details
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select('*')
      .eq('id', assessmentId)
      .single();

    if (assessmentError) throw assessmentError;

    // Calculate score
    let correctAnswers = 0;
    assessment.questions.forEach((question: any, index: number) => {
      if (answers[index] === question.correct_answer) {
        correctAnswers++;
      }
    });

    const score = (correctAnswers / assessment.questions.length) * 100;
    const passed = score >= assessment.passing_score;

    // Save assessment result
    const { data, error } = await supabase
      .from('assessment_results')
      .insert({
        user_id: userId,
        assessment_id: assessmentId,
        module_id: assessment.module_id,
        answers,
        score,
        passed,
        time_spent: timeSpent,
        organization_id: organizationId
      })
      .select()
      .single();

    if (error) throw error;

    return {
      ...data,
      correctAnswers,
      totalQuestions: assessment.questions.length,
      passingScore: assessment.passing_score
    };
  } catch (error) {
    console.error('Error submitting assessment:', error);
    throw error;
  }
}

// Export all functions
export {
  LearningManagementSystem
};
