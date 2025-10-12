// Administration Module - Learning Platform Configuration
// Comprehensive learning platform configuration management

'use client';

import React, { useState, useEffect } from 'react';
import {
  BookOpenIcon, 
  AcademicCapIcon, 
  TrophyIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentTextIcon,
  UserGroupIcon,
  PlayIcon,
  DocumentIcon
} from '@heroicons/react/24/outline';
import { getSupabaseClient } from '@/lib/supabase-client'
import { z } from 'zod';

const _supabase = getSupabaseClient();

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface LearningConfiguration {
  modules: LearningModule[];
  courses: Course[];
  certifications: Certification[];
  assessments: Assessment[];
  tracks: LearningTrack[];
  compliance: ComplianceRequirement[];
}

interface LearningModule {
  id: string;
  title: string;
  description?: string;
  type: 'video' | 'document' | 'interactive' | 'assessment' | 'external';
  content: ModuleContent;
  duration: number; // in minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  prerequisites: string[];
  learningObjectives: string[];
  tags: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ModuleContent {
  videoUrl?: string;
  documentUrl?: string;
  externalUrl?: string;
  interactiveContent?: Record<string, unknown>;
  transcript?: string;
  resources: ContentResource[];
}

interface ContentResource {
  id: string;
  name: string;
  type: 'document' | 'link' | 'video' | 'image';
  url: string;
  description?: string;
}

interface Course {
  id: string;
  title: string;
  description?: string;
  modules: string[]; // module IDs
  instructor?: string;
  duration: number; // in hours
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  prerequisites: string[];
  learningObjectives: string[];
  completionCriteria: CompletionCriteria;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface CompletionCriteria {
  type: 'all_modules' | 'percentage' | 'assessment_score';
  value: number;
  assessmentId?: string;
}

interface Certification {
  id: string;
  name: string;
  description?: string;
  courses: string[]; // course IDs
  requirements: CertificationRequirement[];
  validityPeriod: number; // in months
  renewalRequirements: RenewalRequirement[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface CertificationRequirement {
  type: 'course_completion' | 'assessment_score' | 'practical_exam';
  courseId?: string;
  assessmentId?: string;
  minScore?: number;
  minDuration?: number;
}

interface RenewalRequirement {
  type: 'retake_assessment' | 'complete_course' | 'continuing_education';
  courseId?: string;
  assessmentId?: string;
  hours?: number;
}

interface Assessment {
  id: string;
  title: string;
  description?: string;
  type: 'quiz' | 'exam' | 'practical' | 'peer_review';
  questions: AssessmentQuestion[];
  passingScore: number;
  timeLimit?: number; // in minutes
  attempts: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface AssessmentQuestion {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'essay' | 'fill_blank';
  question: string;
  options?: string[];
  correctAnswer?: string;
  points: number;
  explanation?: string;
}

interface LearningTrack {
  id: string;
  name: string;
  description?: string;
  courses: string[]; // course IDs
  targetAudience: string[];
  estimatedDuration: number; // in hours
  prerequisites: string[];
  learningPath: LearningPathStep[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface LearningPathStep {
  courseId: string;
  order: number;
  isOptional: boolean;
  prerequisites: string[];
}

interface ComplianceRequirement {
  id: string;
  name: string;
  description?: string;
  type: 'mandatory' | 'recommended' | 'optional';
  courses: string[]; // course IDs
  targetRoles: string[];
  frequency: 'once' | 'annual' | 'biannual' | 'quarterly';
  dueDate?: Date;
  isActive: boolean;
}

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const LearningModuleSchema = z.object({
  title: z.string().min(1, 'Module title is required'),
  description: z.string().optional(),
  type: z.enum(['video', 'document', 'interactive', 'assessment', 'external']),
  duration: z.number().min(1, 'Duration must be at least 1 minute'),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  prerequisites: z.array(z.string()),
  learningObjectives: z.array(z.string()),
  tags: z.array(z.string()),
  isActive: z.boolean()
});

const CourseSchema = z.object({
  title: z.string().min(1, 'Course title is required'),
  description: z.string().optional(),
  modules: z.array(z.string()),
  instructor: z.string().optional(),
  duration: z.number().min(1, 'Duration must be at least 1 hour'),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  category: z.string().min(1, 'Category is required'),
  prerequisites: z.array(z.string()),
  learningObjectives: z.array(z.string()),
  isActive: z.boolean()
});

const _AssessmentSchema = z.object({
  title: z.string().min(1, 'Assessment title is required'),
  description: z.string().optional(),
  type: z.enum(['quiz', 'exam', 'practical', 'peer_review']),
  passingScore: z.number().min(0).max(100, 'Passing score must be between 0-100'),
  timeLimit: z.number().optional(),
  attempts: z.number().min(1, 'Must allow at least 1 attempt'),
  isActive: z.boolean()
});

// =============================================================================
// LEARNING MODULES COMPONENT
// =============================================================================

function LearningModules({ config, onUpdate }: { config: LearningConfiguration; onUpdate: (config: LearningConfiguration) => void }) {
  const [modules, setModules] = useState<LearningModule[]>(config.modules);
  const [showForm, setShowForm] = useState(false);
  const [editingModule, setEditingModule] = useState<LearningModule | undefined>();

  const types = [
    { value: 'video', label: 'Video', icon: PlayIcon, color: 'bg-red-100 text-red-800' },
    { value: 'document', label: 'Document', icon: DocumentIcon, color: 'bg-blue-100 text-blue-800' },
    { value: 'interactive', label: 'Interactive', icon: AcademicCapIcon, color: 'bg-green-100 text-green-800' },
    { value: 'assessment', label: 'Assessment', icon: DocumentTextIcon, color: 'bg-yellow-100 text-yellow-800' },
    { value: 'external', label: 'External', icon: BookOpenIcon, color: 'bg-purple-100 text-purple-800' }
  ];

  const difficulties = [
    { value: 'beginner', label: 'Beginner', color: 'bg-green-100 text-green-800' },
    { value: 'intermediate', label: 'Intermediate', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'advanced', label: 'Advanced', color: 'bg-red-100 text-red-800' }
  ];

  const handleSaveModule = (moduleData: Partial<LearningModule>) => {
    try {
      const validatedData = LearningModuleSchema.parse(moduleData);
      
      if (editingModule) {
        const updatedModules = modules.map(m => 
          m.id === editingModule.id 
            ? { ...m, ...validatedData, id: editingModule.id, updatedAt: new Date() }
            : m
        );
        setModules(updatedModules);
      } else {
        const newModule: LearningModule = {
          id: Date.now().toString(),
          ...validatedData,
          content: {
            resources: []
          },
          createdAt: new Date(),
          updatedAt: new Date()
        };
        setModules([...modules, newModule]);
      }
      
      setShowForm(false);
      setEditingModule(undefined);
      
      onUpdate({
        ...config,
        modules,
        courses: config.courses,
        certifications: config.certifications,
        assessments: config.assessments,
        tracks: config.tracks,
        compliance: config.compliance
      });
    } catch (error) {
      console.error('Error saving module:', error);
    }
  };

  const handleDeleteModule = (moduleId: string) => {
    setModules(modules.filter(m => m.id !== moduleId));
    onUpdate({
      ...config,
      modules: modules.filter(m => m.id !== moduleId),
      courses: config.courses,
      certifications: config.certifications,
      assessments: config.assessments,
      tracks: config.tracks,
      compliance: config.compliance
    });
  };

  const handleToggleModule = (moduleId: string) => {
    const updatedModules = modules.map(m => 
      m.id === moduleId ? { ...m, isActive: !m.isActive, updatedAt: new Date() } : m
    );
    setModules(updatedModules);
    onUpdate({
      ...config,
      modules: updatedModules,
      courses: config.courses,
      certifications: config.certifications,
      assessments: config.assessments,
      tracks: config.tracks,
      compliance: config.compliance
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Learning Modules</h3>
          <p className="text-sm text-gray-500">Create and manage individual learning modules</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Module
        </button>
      </div>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map((module) => {
          const type = types.find(t => t.value === module.type);
          const difficulty = difficulties.find(d => d.value === module.difficulty);
          const TypeIcon = type?.icon || DocumentIcon;
          
          return (
            <div key={module.id} className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <TypeIcon className="h-5 w-5 text-blue-600 mr-2" />
                  <h4 className="text-sm font-medium text-gray-900">{module.title}</h4>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => {
                      setEditingModule(module);
                      setShowForm(true);
                    }}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleToggleModule(module.id)}
                    className={module.isActive ? "text-red-600 hover:text-red-900" : "text-green-600 hover:text-green-900"}
                  >
                    {module.isActive ? <XCircleIcon className="h-4 w-4" /> : <CheckCircleIcon className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => handleDeleteModule(module.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              {module.description && (
                <p className="text-sm text-gray-500 mb-3">{module.description}</p>
              )}
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Type</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${type?.color}`}>
                    {type?.label}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Difficulty</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${difficulty?.color}`}>
                    {difficulty?.label}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Duration</span>
                  <span className="text-xs text-gray-900">{module.duration} min</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Objectives</span>
                  <span className="text-xs text-gray-900">{module.learningObjectives.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Status</span>
                  <span className={`text-xs ${module.isActive ? 'text-green-600' : 'text-red-600'}`}>
                    {module.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Module Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-4/5 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingModule ? 'Edit Learning Module' : 'Create Learning Module'}
              </h3>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleSaveModule({
                  title: formData.get('title') as string,
                  description: formData.get('description') as string,
                  type: formData.get('type') as unknown,
                  duration: parseInt(formData.get('duration') as string),
                  difficulty: formData.get('difficulty') as unknown,
                  prerequisites: [],
                  learningObjectives: [],
                  tags: [],
                  isActive: true
                });
              }} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Module Title</label>
                    <input
                      type="text"
                      name="title"
                      defaultValue={editingModule?.title}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Type</label>
                    <select
                      name="type"
                      defaultValue={editingModule?.type}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                      {types.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    name="description"
                    defaultValue={editingModule?.description}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Duration (minutes)</label>
                    <input
                      type="number"
                      name="duration"
                      defaultValue={editingModule?.duration}
                      min="1"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Difficulty</label>
                    <select
                      name="difficulty"
                      defaultValue={editingModule?.difficulty}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                      {difficulties.map(difficulty => (
                        <option key={difficulty.value} value={difficulty.value}>{difficulty.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingModule(undefined);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    {editingModule ? 'Update Module' : 'Create Module'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// COURSES COMPONENT
// =============================================================================

function Courses({ config, onUpdate }: { config: LearningConfiguration; onUpdate: (config: LearningConfiguration) => void }) {
  const [courses, setCourses] = useState<Course[]>(config.courses);
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | undefined>();

  const categories = [
    'Sales Training',
    'Product Knowledge',
    'Compliance',
    'Leadership',
    'Technical Skills',
    'Customer Service',
    'Marketing',
    'Other'
  ];

  const difficulties = [
    { value: 'beginner', label: 'Beginner', color: 'bg-green-100 text-green-800' },
    { value: 'intermediate', label: 'Intermediate', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'advanced', label: 'Advanced', color: 'bg-red-100 text-red-800' }
  ];

  const handleSaveCourse = (courseData: Partial<Course>) => {
    try {
      const validatedData = CourseSchema.parse(courseData);
      
      if (editingCourse) {
        const updatedCourses = courses.map(c => 
          c.id === editingCourse.id 
            ? { ...c, ...validatedData, id: editingCourse.id, updatedAt: new Date() }
            : c
        );
        setCourses(updatedCourses);
      } else {
        const newCourse: Course = {
          id: Date.now().toString(),
          ...validatedData,
          completionCriteria: {
            type: 'all_modules',
            value: 100
          },
          createdAt: new Date(),
          updatedAt: new Date()
        };
        setCourses([...courses, newCourse]);
      }
      
      setShowForm(false);
      setEditingCourse(undefined);
      
      onUpdate({
        ...config,
        modules: config.modules,
        courses,
        certifications: config.certifications,
        assessments: config.assessments,
        tracks: config.tracks,
        compliance: config.compliance
      });
    } catch (error) {
      console.error('Error saving course:', error);
    }
  };

  const handleDeleteCourse = (courseId: string) => {
    setCourses(courses.filter(c => c.id !== courseId));
    onUpdate({
      ...config,
      modules: config.modules,
      courses: courses.filter(c => c.id !== courseId),
      certifications: config.certifications,
      assessments: config.assessments,
      tracks: config.tracks,
      compliance: config.compliance
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Courses</h3>
          <p className="text-sm text-gray-500">Create and manage learning courses</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Course
        </button>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {courses.map((course) => {
          const difficulty = difficulties.find(d => d.value === course.difficulty);
          
          return (
            <div key={course.id} className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <BookOpenIcon className="h-5 w-5 text-blue-600 mr-2" />
                  <h4 className="text-sm font-medium text-gray-900">{course.title}</h4>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => {
                      setEditingCourse(course);
                      setShowForm(true);
                    }}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCourse(course.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              {course.description && (
                <p className="text-sm text-gray-500 mb-3">{course.description}</p>
              )}
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Category</span>
                  <span className="text-xs text-gray-900">{course.category}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Difficulty</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${difficulty?.color}`}>
                    {difficulty?.label}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Duration</span>
                  <span className="text-xs text-gray-900">{course.duration} hours</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Modules</span>
                  <span className="text-xs text-gray-900">{course.modules.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Status</span>
                  <span className={`text-xs ${course.isActive ? 'text-green-600' : 'text-red-600'}`}>
                    {course.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Course Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-4/5 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingCourse ? 'Edit Course' : 'Create Course'}
              </h3>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleSaveCourse({
                  title: formData.get('title') as string,
                  description: formData.get('description') as string,
                  modules: [],
                  instructor: formData.get('instructor') as string,
                  duration: parseInt(formData.get('duration') as string),
                  difficulty: formData.get('difficulty') as unknown,
                  category: formData.get('category') as string,
                  prerequisites: [],
                  learningObjectives: [],
                  isActive: true
                });
              }} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Course Title</label>
                    <input
                      type="text"
                      name="title"
                      defaultValue={editingCourse?.title}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Category</label>
                    <select
                      name="category"
                      defaultValue={editingCourse?.category}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    name="description"
                    defaultValue={editingCourse?.description}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Duration (hours)</label>
                    <input
                      type="number"
                      name="duration"
                      defaultValue={editingCourse?.duration}
                      min="1"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Difficulty</label>
                    <select
                      name="difficulty"
                      defaultValue={editingCourse?.difficulty}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                      {difficulties.map(difficulty => (
                        <option key={difficulty.value} value={difficulty.value}>{difficulty.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Instructor</label>
                    <input
                      type="text"
                      name="instructor"
                      defaultValue={editingCourse?.instructor}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingCourse(undefined);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    {editingCourse ? 'Update Course' : 'Create Course'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// MAIN LEARNING CONFIGURATION COMPONENT
// =============================================================================

export default function LearningConfiguration() {
  const [config, setConfig] = useState<LearningConfiguration>({
    modules: [],
    courses: [],
    certifications: [],
    assessments: [],
    tracks: [],
    compliance: []
  });

  const [activeTab, setActiveTab] = useState('modules');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      setLoading(true);
      
      // Mock configuration data
      const mockConfig: LearningConfiguration = {
        modules: [
          {
            id: '1',
            title: 'Introduction to Sales',
            description: 'Basic sales concepts and techniques',
            type: 'video',
            content: {
              resources: []
            },
            duration: 30,
            difficulty: 'beginner',
            prerequisites: [],
            learningObjectives: ['Understand basic sales concepts', 'Learn sales techniques'],
            tags: ['sales', 'basics'],
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '2',
            title: 'Advanced Negotiation',
            description: 'Advanced negotiation strategies and tactics',
            type: 'interactive',
            content: {
              resources: []
            },
            duration: 45,
            difficulty: 'advanced',
            prerequisites: ['1'],
            learningObjectives: ['Master negotiation techniques', 'Handle complex deals'],
            tags: ['negotiation', 'advanced'],
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        courses: [
          {
            id: '1',
            title: 'Sales Fundamentals',
            description: 'Complete course covering all sales fundamentals',
            modules: ['1', '2'],
            instructor: 'John Smith',
            duration: 8,
            difficulty: 'beginner',
            category: 'Sales Training',
            prerequisites: [],
            learningObjectives: ['Master sales fundamentals', 'Apply sales techniques'],
            completionCriteria: {
              type: 'all_modules',
              value: 100
            },
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        certifications: [],
        assessments: [],
        tracks: [],
        compliance: []
      };
      
      setConfig(mockConfig);
    } catch (error) {
      console.error('Error loading learning configuration:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigUpdate = (updatedConfig: LearningConfiguration) => {
    setConfig(updatedConfig);
    // In real implementation, this would save to the API
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'modules', name: 'Learning Modules', icon: AcademicCapIcon },
    { id: 'courses', name: 'Courses', icon: BookOpenIcon },
    { id: 'certifications', name: 'Certifications', icon: TrophyIcon },
    { id: 'assessments', name: 'Assessments', icon: DocumentTextIcon },
    { id: 'tracks', name: 'Learning Tracks', icon: UserGroupIcon },
    { id: 'compliance', name: 'Compliance', icon: CheckCircleIcon }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Learning Platform Configuration</h1>
        <p className="mt-1 text-sm text-gray-500">
          Configure learning modules, courses, certifications, and compliance requirements
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <AcademicCapIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Learning Modules</p>
              <p className="text-2xl font-semibold text-gray-900">{config.modules.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <BookOpenIcon className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Courses</p>
              <p className="text-2xl font-semibold text-gray-900">{config.courses.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <TrophyIcon className="h-8 w-8 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Certifications</p>
              <p className="text-2xl font-semibold text-gray-900">{config.certifications.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <DocumentTextIcon className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Assessments</p>
              <p className="text-2xl font-semibold text-gray-900">{config.assessments.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4 mr-2 inline" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white p-6 rounded-lg shadow">
        {activeTab === 'modules' && (
          <LearningModules config={config} onUpdate={handleConfigUpdate} />
        )}
        {activeTab === 'courses' && (
          <Courses config={config} onUpdate={handleConfigUpdate} />
        )}
        {activeTab === 'certifications' && (
          <div className="text-center py-12">
            <TrophyIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Certification Configuration</h3>
            <p className="text-gray-500">Certification management coming soon...</p>
          </div>
        )}
        {activeTab === 'assessments' && (
          <div className="text-center py-12">
            <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Assessment Configuration</h3>
            <p className="text-gray-500">Assessment management coming soon...</p>
          </div>
        )}
        {activeTab === 'tracks' && (
          <div className="text-center py-12">
            <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Learning Tracks Configuration</h3>
            <p className="text-gray-500">Learning tracks management coming soon...</p>
          </div>
        )}
        {activeTab === 'compliance' && (
          <div className="text-center py-12">
            <CheckCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Compliance Configuration</h3>
            <p className="text-gray-500">Compliance requirements management coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
}
