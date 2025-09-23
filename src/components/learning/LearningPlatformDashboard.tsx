'use client';

import React, { useState, useEffect } from 'react';
import { 
  AcademicCapIcon, 
  BookOpenIcon, 
  TrophyIcon, 
  ChartBarIcon,
  ClockIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  PlusIcon,
  CogIcon,
  DocumentTextIcon,
  VideoCameraIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline';
import LearningPlatformAPI from '../api/learning-platform';
import { LearningModule, CertificationTrack, UserProgress, LearningPath, ComplianceRecord } from '../learning/learning-management';

interface LearningPlatformDashboardProps {
  organizationId: string;
  userId?: string;
}

export default function LearningPlatformDashboard({ organizationId, userId }: LearningPlatformDashboardProps) {
  const [modules, setModules] = useState<LearningModule[]>([]);
  const [tracks, setTracks] = useState<CertificationTrack[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [complianceRecords, setComplianceRecords] = useState<ComplianceRecord[]>([]);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'modules' | 'tracks' | 'progress' | 'compliance' | 'analytics'>('modules');
  const [showCreateModule, setShowCreateModule] = useState(false);

  useEffect(() => {
    loadData();
  }, [organizationId, userId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [modulesData, tracksData, progressData, pathsData, complianceData, dashboardData] = await Promise.all([
        LearningPlatformAPI.getLearningModules(organizationId),
        LearningPlatformAPI.getCertificationTracks(organizationId),
        userId ? LearningPlatformAPI.getUserLearningProgress(userId, organizationId) : Promise.resolve([]),
        LearningPlatformAPI.getLearningPaths(organizationId),
        userId ? LearningPlatformAPI.getComplianceRecords(userId, organizationId) : Promise.resolve([]),
        LearningPlatformAPI.getLearningDashboardData(organizationId)
      ]);
      
      setModules(modulesData);
      setTracks(tracksData);
      setUserProgress(progressData);
      setLearningPaths(pathsData);
      setComplianceRecords(complianceData);
      setDashboardData(dashboardData);
    } catch (error) {
      console.error('Error loading learning platform data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getModuleIcon = (type: string) => {
    switch (type) {
      case 'video': return <VideoCameraIcon className="h-5 w-5 text-blue-600" />;
      case 'article': return <DocumentTextIcon className="h-5 w-5 text-green-600" />;
      case 'quiz': return <QuestionMarkCircleIcon className="h-5 w-5 text-purple-600" />;
      case 'interactive': return <PlayIcon className="h-5 w-5 text-orange-600" />;
      case 'simulation': return <CogIcon className="h-5 w-5 text-red-600" />;
      default: return <BookOpenIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-600 bg-green-100';
      case 'intermediate': return 'text-yellow-600 bg-yellow-100';
      case 'advanced': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getProgressStatus = (progress: UserProgress) => {
    switch (progress.status) {
      case 'completed': return { color: 'text-green-600', icon: <CheckCircleIcon className="h-4 w-4" /> };
      case 'in_progress': return { color: 'text-blue-600', icon: <PlayIcon className="h-4 w-4" /> };
      case 'failed': return { color: 'text-red-600', icon: <ExclamationTriangleIcon className="h-4 w-4" /> };
      default: return { color: 'text-gray-600', icon: <ClockIcon className="h-4 w-4" /> };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Learning Management System</h1>
          <p className="text-gray-600">Manage courses, certifications, and compliance training</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowCreateModule(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Create Module</span>
          </button>
          <button
            onClick={loadData}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            <ChartBarIcon className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Dashboard Overview */}
      {dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-2 mb-2">
              <BookOpenIcon className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Total Modules</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{dashboardData.totalModules}</p>
            <p className="text-sm text-gray-500">Available for learning</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-2 mb-2">
              <UserGroupIcon className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-gray-700">Active Learners</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{dashboardData.totalUsers}</p>
            <p className="text-sm text-gray-500">Currently enrolled</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-2 mb-2">
              <TrophyIcon className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium text-gray-700">Completion Rate</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{Math.round(dashboardData.completionRate * 100)}%</p>
            <p className="text-sm text-gray-500">Modules completed</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-2 mb-2">
              <ClockIcon className="h-5 w-5 text-orange-600" />
              <span className="text-sm font-medium text-gray-700">Avg Time</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{Math.round(dashboardData.averageTimeSpent)}m</p>
            <p className="text-sm text-gray-500">Per module</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'modules', label: 'Learning Modules', icon: BookOpenIcon },
              { id: 'tracks', label: 'Certification Tracks', icon: TrophyIcon },
              { id: 'progress', label: 'My Progress', icon: ChartBarIcon },
              { id: 'compliance', label: 'Compliance', icon: CheckCircleIcon },
              { id: 'analytics', label: 'Analytics', icon: ChartBarIcon }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    selectedTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {selectedTab === 'modules' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Learning Modules</h3>
                <div className="flex items-center space-x-2">
                  <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    <option>All Categories</option>
                    <option>Sales Training</option>
                    <option>Product Knowledge</option>
                    <option>Compliance</option>
                    <option>Soft Skills</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {modules.map((module) => (
                  <div key={module.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        {getModuleIcon(module.type)}
                        <span className="text-sm font-medium text-gray-700">{module.type}</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(module.difficulty)}`}>
                        {module.difficulty}
                      </span>
                    </div>
                    
                    <h4 className="font-semibold text-gray-900 mb-2">{module.title}</h4>
                    <p className="text-sm text-gray-600 mb-3">{module.description}</p>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                      <span>{module.duration} minutes</span>
                      <span>{module.category}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                        Start Learning
                      </button>
                      {module.isComplianceRequired && (
                        <span className="text-xs text-red-600 font-medium">Required</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedTab === 'tracks' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Certification Tracks</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tracks.map((track) => (
                  <div key={track.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center space-x-2 mb-3">
                      <TrophyIcon className="h-5 w-5 text-yellow-600" />
                      <span className="text-sm font-medium text-gray-700">Certification Track</span>
                    </div>
                    
                    <h4 className="font-semibold text-gray-900 mb-2">{track.name}</h4>
                    <p className="text-sm text-gray-600 mb-3">{track.description}</p>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Modules:</span>
                        <span className="font-medium">{track.modules.length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Min Score:</span>
                        <span className="font-medium">{track.requirements.minScore}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Validity:</span>
                        <span className="font-medium">{track.validityPeriod} days</span>
                      </div>
                    </div>
                    
                    <button className="w-full px-3 py-2 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700">
                      Enroll in Track
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedTab === 'progress' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">My Learning Progress</h3>
              <div className="space-y-3">
                {userProgress.map((progress) => {
                  const module = modules.find(m => m.id === progress.moduleId);
                  const status = getProgressStatus(progress);
                  
                  return (
                    <div key={progress.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          {module && getModuleIcon(module.type)}
                          <div>
                            <h4 className="font-semibold text-gray-900">{module?.title || 'Unknown Module'}</h4>
                            <p className="text-sm text-gray-500">{module?.category}</p>
                          </div>
                        </div>
                        <div className={`flex items-center space-x-2 ${status.color}`}>
                          {status.icon}
                          <span className="text-sm font-medium">{progress.status}</span>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Progress</span>
                          <span>{progress.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${progress.progress}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>Time spent: {progress.timeSpent} minutes</span>
                        {progress.score && <span>Score: {progress.score}%</span>}
                        <span>Attempts: {progress.attempts}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {selectedTab === 'compliance' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Compliance Records</h3>
              <div className="space-y-3">
                {complianceRecords.map((record) => {
                  const module = modules.find(m => m.id === record.moduleId);
                  const isExpired = record.expiryDate && record.expiryDate < new Date();
                  
                  return (
                    <div key={record.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <CheckCircleIcon className={`h-5 w-5 ${isExpired ? 'text-red-600' : 'text-green-600'}`} />
                          <div>
                            <h4 className="font-semibold text-gray-900">{module?.title || 'Unknown Module'}</h4>
                            <p className="text-sm text-gray-500">Completed: {record.completedAt.toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">Score: {record.score}%</p>
                          {record.expiryDate && (
                            <p className={`text-sm ${isExpired ? 'text-red-600' : 'text-gray-500'}`}>
                              {isExpired ? 'Expired' : `Expires: ${record.expiryDate.toLocaleDateString()}`}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {record.certificateUrl && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Certificate available</span>
                          <a 
                            href={record.certificateUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                          >
                            Download Certificate
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {selectedTab === 'analytics' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Learning Analytics</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Top Performers</h4>
                  <div className="space-y-2">
                    {dashboardData?.topPerformers?.slice(0, 5).map((performer: any, index: number) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">{performer.fullName || performer.email}</span>
                        <span className="text-sm font-medium text-gray-900">{performer.averageScore}%</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Popular Modules</h4>
                  <div className="space-y-2">
                    {dashboardData?.popularModules?.slice(0, 5).map((module: any, index: number) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">{module.title}</span>
                        <span className="text-sm font-medium text-gray-900">{module.completionCount} completions</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
