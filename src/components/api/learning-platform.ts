// Learning Platform API
// API functions for learning platform features

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Types
export interface Course {
  id: string
  title: string
  description: string
  category: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  duration: number // in minutes
  isActive: boolean
  organizationId: string
  createdAt: string
  updatedAt: string
}

export interface LearningProgress {
  id: string
  userId: string
  courseId: string
  progress: number // percentage
  completed: boolean
  lastAccessed: string
  timeSpent: number // in minutes
  organizationId: string
}

export interface LearningPath {
  id: string
  name: string
  description: string
  courses: string[] // course IDs
  isActive: boolean
  organizationId: string
  createdAt: string
}

// Course Management
export async function getCourses(organizationId: string): Promise<Course[]> {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching courses:', error)
    throw error
  }
}

export async function getCourse(courseId: string): Promise<Course | null> {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching course:', error)
    throw error
  }
}

export async function createCourse(course: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>): Promise<Course> {
  try {
    const { data, error } = await supabase
      .from('courses')
      .insert({
        title: course.title,
        description: course.description,
        category: course.category,
        difficulty: course.difficulty,
        duration: course.duration,
        is_active: course.isActive,
        organization_id: course.organizationId
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error creating course:', error)
    throw error
  }
}

// Learning Progress Tracking
export async function getLearningProgress(userId: string, organizationId: string): Promise<LearningProgress[]> {
  try {
    const { data, error } = await supabase
      .from('learning_progress')
      .select(`
        *,
        courses(*)
      `)
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .order('last_accessed', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching learning progress:', error)
    throw error
  }
}

export async function updateLearningProgress(
  userId: string, 
  courseId: string, 
  progress: number, 
  organizationId: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('learning_progress')
      .upsert({
        user_id: userId,
        course_id: courseId,
        progress,
        completed: progress >= 100,
        last_accessed: new Date().toISOString(),
        organization_id: organizationId
      })

    if (error) throw error
  } catch (error) {
    console.error('Error updating learning progress:', error)
    throw error
  }
}

// Learning Paths
export async function getLearningPaths(organizationId: string): Promise<LearningPath[]> {
  try {
    const { data, error } = await supabase
      .from('learning_paths')
      .select(`
        *,
        courses(*)
      `)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching learning paths:', error)
    throw error
  }
}

export async function createLearningPath(path: Omit<LearningPath, 'id' | 'createdAt'>): Promise<LearningPath> {
  try {
    const { data, error } = await supabase
      .from('learning_paths')
      .insert({
        name: path.name,
        description: path.description,
        courses: path.courses,
        is_active: path.isActive,
        organization_id: path.organizationId
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error creating learning path:', error)
    throw error
  }
}

// Analytics
export async function getLearningAnalytics(organizationId: string) {
  try {
    const { data, error } = await supabase
      .from('learning_progress')
      .select(`
        *,
        users(*),
        courses(*)
      `)
      .eq('organization_id', organizationId)

    if (error) throw error

    // Calculate analytics
    const totalUsers = new Set(data?.map(p => p.user_id)).size
    const totalCourses = new Set(data?.map(p => p.course_id)).size
    const completedCourses = data?.filter(p => p.completed).length || 0
    const averageProgress = data?.reduce((sum, p) => sum + p.progress, 0) / (data?.length || 1)

    return {
      totalUsers,
      totalCourses,
      completedCourses,
      averageProgress: Math.round(averageProgress),
      totalProgress: data?.length || 0
    }
  } catch (error) {
    console.error('Error fetching learning analytics:', error)
    throw error
  }
}

// Learning Platform API Class
export class LearningPlatformAPI {
  static async getCourses(organizationId: string): Promise<Course[]> {
    return getCourses(organizationId)
  }

  static async getCourse(courseId: string): Promise<Course | null> {
    return getCourse(courseId)
  }

  static async createCourse(course: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>): Promise<Course> {
    return createCourse(course)
  }

  static async getLearningProgress(userId: string, organizationId: string): Promise<LearningProgress[]> {
    return getLearningProgress(userId, organizationId)
  }

  static async updateLearningProgress(
    userId: string, 
    courseId: string, 
    progress: number, 
    organizationId: string
  ): Promise<void> {
    return updateLearningProgress(userId, courseId, progress, organizationId)
  }

  static async getLearningPaths(organizationId: string): Promise<LearningPath[]> {
    return getLearningPaths(organizationId)
  }

  static async createLearningPath(path: Omit<LearningPath, 'id' | 'createdAt'>): Promise<LearningPath> {
    return createLearningPath(path)
  }

  static async getLearningAnalytics(organizationId: string) {
    return getLearningAnalytics(organizationId)
  }
}

export default LearningPlatformAPI
