// Enterprise AI API Layer
// API functions for enterprise AI intelligence features

import { createClient } from '@supabase/supabase-js';
import EnterpriseAIIntelligence from './enterprise-ai-intelligence';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Initialize AI intelligence engine
const aiIntelligence = new EnterpriseAIIntelligence(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  process.env.OPENAI_API_KEY!,
  process.env.ANTHROPIC_API_KEY!
);

// Types
export interface AIModelConfig {
  id?: string;
  name: string;
  modelType: 'lead_scoring' | 'deal_prediction' | 'forecasting' | 'coaching' | 'content_generation' | 'sentiment_analysis';
  provider: 'openai' | 'anthropic' | 'azure' | 'aws' | 'custom';
  modelVersion: string;
  config: Record<string, any>;
  isActive: boolean;
  isEnterprise: boolean;
  organizationId: string;
}

export interface CoachingRecommendation {
  id: string;
  userId: string;
  opportunityId?: string;
  recommendationType: 'skill_development' | 'process_improvement' | 'deal_strategy' | 'relationship_building';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  actionItems: string[];
  expectedImpact: string;
  timeframe: string;
  resources: string[];
  organizationId: string;
}

export interface ForecastingData {
  period: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  startDate: Date;
  endDate: Date;
  predictions: {
    revenue: number;
    deals: number;
    conversionRate: number;
    confidence: number;
  };
  scenarios: {
    optimistic: number;
    realistic: number;
    pessimistic: number;
  };
  factors: string[];
  organizationId: string;
}

// AI Models Management
export async function getAIModels(organizationId: string): Promise<AIModelConfig[]> {
  try {
    const { data, error } = await supabase
      .from('ai_models')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(model => ({
      id: model.id,
      name: model.name,
      modelType: model.model_type,
      provider: model.provider,
      modelVersion: model.model_version,
      config: model.config,
      isActive: model.is_active,
      isEnterprise: model.is_enterprise,
      organizationId: model.organization_id
    }));
  } catch (error) {
    console.error('Error fetching AI models:', error);
    throw error;
  }
}

export async function createAIModel(modelConfig: AIModelConfig, userId: string): Promise<AIModelConfig> {
  try {
    const { data, error } = await supabase
      .from('ai_models')
      .insert({
        name: modelConfig.name,
        model_type: modelConfig.modelType,
        provider: modelConfig.provider,
        model_version: modelConfig.modelVersion,
        config: modelConfig.config,
        is_active: modelConfig.isActive,
        is_enterprise: modelConfig.isEnterprise,
        organization_id: modelConfig.organizationId,
        created_by: userId
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      modelType: data.model_type,
      provider: data.provider,
      modelVersion: data.model_version,
      config: data.config,
      isActive: data.is_active,
      isEnterprise: data.is_enterprise,
      organizationId: data.organization_id
    };
  } catch (error) {
    console.error('Error creating AI model:', error);
    throw error;
  }
}

export async function updateAIModel(modelId: string, updates: Partial<AIModelConfig>): Promise<AIModelConfig> {
  try {
    const updateData: any = {};
    if (updates.name) updateData.name = updates.name;
    if (updates.modelType) updateData.model_type = updates.modelType;
    if (updates.provider) updateData.provider = updates.provider;
    if (updates.modelVersion) updateData.model_version = updates.modelVersion;
    if (updates.config) updateData.config = updates.config;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
    if (updates.isEnterprise !== undefined) updateData.is_enterprise = updates.isEnterprise;

    const { data, error } = await supabase
      .from('ai_models')
      .update(updateData)
      .eq('id', modelId)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      modelType: data.model_type,
      provider: data.provider,
      modelVersion: data.model_version,
      config: data.config,
      isActive: data.is_active,
      isEnterprise: data.is_enterprise,
      organizationId: data.organization_id
    };
  } catch (error) {
    console.error('Error updating AI model:', error);
    throw error;
  }
}

export async function deleteAIModel(modelId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('ai_models')
      .delete()
      .eq('id', modelId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting AI model:', error);
    throw error;
  }
}

// Advanced Lead Scoring
export async function generateAdvancedLeadScore(leadId: string, organizationId: string) {
  try {
    return await aiIntelligence.generateAdvancedLeadScore(leadId, organizationId);
  } catch (error) {
    console.error('Error generating advanced lead score:', error);
    throw error;
  }
}

export async function getLeadInsights(leadId: string, organizationId: string) {
  try {
    const { data, error } = await supabase
      .from('ai_insights')
      .select('*')
      .eq('entity_type', 'lead')
      .eq('entity_id', leadId)
      .eq('organization_id', organizationId)
      .eq('type', 'lead_scoring')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;
    return data[0] || null;
  } catch (error) {
    console.error('Error fetching lead insights:', error);
    throw error;
  }
}

// Deal Risk Assessment
export async function generateDealRiskAssessment(opportunityId: string, organizationId: string) {
  try {
    return await aiIntelligence.generateDealRiskAssessment(opportunityId, organizationId);
  } catch (error) {
    console.error('Error generating deal risk assessment:', error);
    throw error;
  }
}

export async function getDealInsights(opportunityId: string, organizationId: string) {
  try {
    const { data, error } = await supabase
      .from('ai_insights')
      .select('*')
      .eq('entity_type', 'opportunity')
      .eq('entity_id', opportunityId)
      .eq('organization_id', organizationId)
      .eq('type', 'deal_risk')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;
    return data[0] || null;
  } catch (error) {
    console.error('Error fetching deal insights:', error);
    throw error;
  }
}

// AI-Powered Sales Coaching
export async function generateCoachingRecommendations(userId: string, organizationId: string): Promise<CoachingRecommendation[]> {
  try {
    return await aiIntelligence.generateCoachingRecommendations(userId, organizationId);
  } catch (error) {
    console.error('Error generating coaching recommendations:', error);
    throw error;
  }
}

export async function getCoachingInsights(userId: string, organizationId: string) {
  try {
    const { data, error } = await supabase
      .from('ai_insights')
      .select('*')
      .eq('entity_type', 'user')
      .eq('entity_id', userId)
      .eq('organization_id', organizationId)
      .eq('type', 'coaching')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching coaching insights:', error);
    throw error;
  }
}

export async function saveCoachingRecommendation(recommendation: CoachingRecommendation): Promise<void> {
  try {
    const { error } = await supabase
      .from('ai_insights')
      .insert({
        id: recommendation.id,
        type: 'coaching',
        entity_type: 'user',
        entity_id: recommendation.userId,
        insight_data: {
          recommendationType: recommendation.recommendationType,
          title: recommendation.title,
          description: recommendation.description,
          priority: recommendation.priority,
          actionItems: recommendation.actionItems,
          expectedImpact: recommendation.expectedImpact,
          timeframe: recommendation.timeframe,
          resources: recommendation.resources
        },
        confidence_score: 0.8,
        model_version: 'v3.0-enterprise',
        organization_id: recommendation.organizationId
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error saving coaching recommendation:', error);
    throw error;
  }
}

// Advanced Sales Forecasting
export async function generateSalesForecast(organizationId: string, period: 'weekly' | 'monthly' | 'quarterly' | 'yearly'): Promise<ForecastingData> {
  try {
    return await aiIntelligence.generateSalesForecast(organizationId, period);
  } catch (error) {
    console.error('Error generating sales forecast:', error);
    throw error;
  }
}

export async function getForecastingInsights(organizationId: string) {
  try {
    const { data, error } = await supabase
      .from('ai_insights')
      .select('*')
      .eq('entity_type', 'organization')
      .eq('entity_id', organizationId)
      .eq('organization_id', organizationId)
      .eq('type', 'forecasting')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching forecasting insights:', error);
    throw error;
  }
}

// AI Content Generation
export async function generateAIContent(type: 'email' | 'proposal' | 'presentation' | 'follow_up', context: any): Promise<string> {
  try {
    return await aiIntelligence.generateAIContent(type, context);
  } catch (error) {
    console.error('Error generating AI content:', error);
    throw error;
  }
}

// Performance Analytics
export async function generatePerformanceInsights(userId: string, organizationId: string) {
  try {
    const { data, error } = await supabase
      .from('ai_insights')
      .select('*')
      .eq('entity_type', 'user')
      .eq('entity_id', userId)
      .eq('organization_id', organizationId)
      .eq('type', 'performance')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;
    return data[0] || null;
  } catch (error) {
    console.error('Error fetching performance insights:', error);
    throw error;
  }
}

// Batch AI Processing
export async function processBatchAIInsights(organizationId: string, entityType: 'lead' | 'opportunity' | 'user', entityIds: string[]) {
  try {
    const results = [];
    
    for (const entityId of entityIds) {
      try {
        let insight;
        switch (entityType) {
          case 'lead':
            insight = await generateAdvancedLeadScore(entityId, organizationId);
            break;
          case 'opportunity':
            insight = await generateDealRiskAssessment(entityId, organizationId);
            break;
          case 'user':
            insight = await generateCoachingRecommendations(entityId, organizationId);
            break;
        }
        results.push({ entityId, success: true, insight });
      } catch (error) {
        results.push({ entityId, success: false, error: error.message });
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error processing batch AI insights:', error);
    throw error;
  }
}

// AI Model Performance Tracking
export async function trackAIModelPerformance(modelId: string, accuracy: number, metrics: Record<string, number>) {
  try {
    const { error } = await supabase
      .from('ai_models')
      .update({
        accuracy_metrics: {
          ...metrics,
          overall_accuracy: accuracy,
          last_updated: new Date().toISOString()
        }
      })
      .eq('id', modelId);

    if (error) throw error;
  } catch (error) {
    console.error('Error tracking AI model performance:', error);
    throw error;
  }
}

// AI Insights Cleanup
export async function cleanupOldInsights(organizationId: string, daysOld: number = 90) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const { error } = await supabase
      .from('ai_insights')
      .delete()
      .eq('organization_id', organizationId)
      .lt('created_at', cutoffDate.toISOString());

    if (error) throw error;
  } catch (error) {
    console.error('Error cleaning up old insights:', error);
    throw error;
  }
}

// Real-time AI Insights
export async function getRealTimeInsights(organizationId: string, entityType?: string, entityId?: string) {
  try {
    let query = supabase
      .from('ai_insights')
      .select('*')
      .eq('organization_id', organizationId)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    if (entityType) {
      query = query.eq('entity_type', entityType);
    }

    if (entityId) {
      query = query.eq('entity_id', entityId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching real-time insights:', error);
    throw error;
  }
}

// AI Model Configuration
export async function configureAIModel(modelId: string, config: Record<string, any>) {
  try {
    const { error } = await supabase
      .from('ai_models')
      .update({ config })
      .eq('id', modelId);

    if (error) throw error;
  } catch (error) {
    console.error('Error configuring AI model:', error);
    throw error;
  }
}

// Export all functions
export {
  aiIntelligence
};
