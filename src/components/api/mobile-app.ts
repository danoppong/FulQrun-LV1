// Mobile App API
// API functions for mobile app features

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Types
export interface MobileAppConfig {
  id: string
  organizationId: string
  appName: string
  appVersion: string
  features: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface MobileUser {
  id: string
  userId: string
  deviceId: string
  deviceType: 'ios' | 'android'
  appVersion: string
  lastActive: string
  organizationId: string
}

export interface MobileAnalytics {
  totalUsers: number
  activeUsers: number
  appVersions: Record<string, number>
  deviceTypes: Record<string, number>
  averageSessionTime: number
  crashRate: number
}

export interface PushNotification {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'success' | 'error'
  targetUsers: string[] // user IDs
  scheduledAt?: string
  sentAt?: string
  organizationId: string
}

// Mobile App Configuration
export async function getMobileAppConfig(organizationId: string): Promise<MobileAppConfig | null> {
  try {
    const { data, error } = await supabase
      .from('mobile_app_config')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching mobile app config:', error)
    throw error
  }
}

export async function updateMobileAppConfig(
  organizationId: string, 
  config: Partial<MobileAppConfig>
): Promise<MobileAppConfig> {
  try {
    const { data, error } = await supabase
      .from('mobile_app_config')
      .upsert({
        organization_id: organizationId,
        app_name: config.appName,
        app_version: config.appVersion,
        features: config.features,
        is_active: config.isActive
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error updating mobile app config:', error)
    throw error
  }
}

// Mobile User Management
export async function getMobileUsers(organizationId: string): Promise<MobileUser[]> {
  try {
    const { data, error } = await supabase
      .from('mobile_users')
      .select(`
        *,
        users(*)
      `)
      .eq('organization_id', organizationId)
      .order('last_active', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching mobile users:', error)
    throw error
  }
}

export async function registerMobileUser(
  userId: string,
  deviceId: string,
  deviceType: 'ios' | 'android',
  appVersion: string,
  organizationId: string
): Promise<MobileUser> {
  try {
    const { data, error } = await supabase
      .from('mobile_users')
      .upsert({
        user_id: userId,
        device_id: deviceId,
        device_type: deviceType,
        app_version: appVersion,
        last_active: new Date().toISOString(),
        organization_id: organizationId
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error registering mobile user:', error)
    throw error
  }
}

export async function updateMobileUserActivity(
  userId: string,
  deviceId: string,
  organizationId: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('mobile_users')
      .update({
        last_active: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('device_id', deviceId)
      .eq('organization_id', organizationId)

    if (error) throw error
  } catch (error) {
    console.error('Error updating mobile user activity:', error)
    throw error
  }
}

// Push Notifications
export async function getPushNotifications(organizationId: string): Promise<PushNotification[]> {
  try {
    const { data, error } = await supabase
      .from('push_notifications')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching push notifications:', error)
    throw error
  }
}

export async function createPushNotification(
  notification: Omit<PushNotification, 'id' | 'sentAt'>
): Promise<PushNotification> {
  try {
    const { data, error } = await supabase
      .from('push_notifications')
      .insert({
        title: notification.title,
        message: notification.message,
        type: notification.type,
        target_users: notification.targetUsers,
        scheduled_at: notification.scheduledAt,
        organization_id: notification.organizationId
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error creating push notification:', error)
    throw error
  }
}

export async function sendPushNotification(notificationId: string): Promise<void> {
  try {
    // This would integrate with push notification services like Firebase
    // For now, just mark as sent
    const { error } = await supabase
      .from('push_notifications')
      .update({
        sent_at: new Date().toISOString()
      })
      .eq('id', notificationId)

    if (error) throw error
  } catch (error) {
    console.error('Error sending push notification:', error)
    throw error
  }
}

// Mobile Analytics
export async function getMobileAnalytics(organizationId: string): Promise<MobileAnalytics> {
  try {
    const { data: users, error: usersError } = await supabase
      .from('mobile_users')
      .select('*')
      .eq('organization_id', organizationId)

    if (usersError) throw usersError

    const totalUsers = users?.length || 0
    const activeUsers = users?.filter(u => {
      const lastActive = new Date(u.last_active)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      return lastActive > oneDayAgo
    }).length || 0

    const appVersions = users?.reduce((acc, user) => {
      acc[user.app_version] = (acc[user.app_version] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    const deviceTypes = users?.reduce((acc, user) => {
      acc[user.device_type] = (acc[user.device_type] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    return {
      totalUsers,
      activeUsers,
      appVersions,
      deviceTypes,
      averageSessionTime: 15, // Placeholder - would calculate from session data
      crashRate: 0.02 // Placeholder - would calculate from crash reports
    }
  } catch (error) {
    console.error('Error fetching mobile analytics:', error)
    throw error
  }
}

// Mobile App Features
export async function getMobileFeatures(organizationId: string): Promise<string[]> {
  try {
    const config = await getMobileAppConfig(organizationId)
    return config?.features || []
  } catch (error) {
    console.error('Error fetching mobile features:', error)
    return []
  }
}

export async function updateMobileFeatures(
  organizationId: string, 
  features: string[]
): Promise<void> {
  try {
    await updateMobileAppConfig(organizationId, { features })
  } catch (error) {
    console.error('Error updating mobile features:', error)
    throw error
  }
}

// Mobile App API Class
export class MobileAppAPI {
  static async getMobileAppConfig(organizationId: string): Promise<MobileAppConfig | null> {
    return getMobileAppConfig(organizationId)
  }

  static async updateMobileAppConfig(
    organizationId: string, 
    config: Partial<MobileAppConfig>
  ): Promise<MobileAppConfig> {
    return updateMobileAppConfig(organizationId, config)
  }

  static async getMobileUsers(organizationId: string): Promise<MobileUser[]> {
    return getMobileUsers(organizationId)
  }

  static async registerMobileUser(
    userId: string,
    deviceId: string,
    deviceType: 'ios' | 'android',
    appVersion: string,
    organizationId: string
  ): Promise<MobileUser> {
    return registerMobileUser(userId, deviceId, deviceType, appVersion, organizationId)
  }

  static async updateMobileUserActivity(
    userId: string,
    deviceId: string,
    organizationId: string
  ): Promise<void> {
    return updateMobileUserActivity(userId, deviceId, organizationId)
  }

  static async getPushNotifications(organizationId: string): Promise<PushNotification[]> {
    return getPushNotifications(organizationId)
  }

  static async createPushNotification(
    notification: Omit<PushNotification, 'id' | 'sentAt'>
  ): Promise<PushNotification> {
    return createPushNotification(notification)
  }

  static async sendPushNotification(notificationId: string): Promise<void> {
    return sendPushNotification(notificationId)
  }

  static async getMobileAnalytics(organizationId: string): Promise<MobileAnalytics> {
    return getMobileAnalytics(organizationId)
  }

  static async getMobileFeatures(organizationId: string): Promise<string[]> {
    return getMobileFeatures(organizationId)
  }

  static async updateMobileFeatures(
    organizationId: string, 
    features: string[]
  ): Promise<void> {
    return updateMobileFeatures(organizationId, features)
  }
}

export default MobileAppAPI
