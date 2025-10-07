/**
 * Risk Assessment Engine
 * 
 * Analyzes authentication context to determine risk level and
 * recommend appropriate security measures.
 */

import { SupabaseClient } from '@supabase/supabase-js';

export interface AuthContext {
  userId?: string
  email: string
  ipAddress: string
  userAgent: string
  deviceInfo: DeviceInfo
  timestamp: number
  geolocation?: GeoLocation
}

export interface DeviceInfo {
  userAgent: string
  screenResolution?: string
  timezone?: string
  language?: string
  platform?: string
  isTrusted?: boolean
}

export interface GeoLocation {
  country: string
  region?: string
  city?: string
  latitude?: number
  longitude?: number
}

export interface RiskFactor {
  name: string
  score: number
  weight: number
  details: unknown
}

export interface RiskScore {
  score: number
  level: 'low' | 'medium' | 'high' | 'critical'
  factors: RiskFactor[]
  recommendation: MFARecommendation
}

export interface MFARecommendation {
  required: boolean
  suggestedFactors: string[]
  requireMultiple?: number
}

export class RiskAssessmentEngine {
  private readonly weights = {
    device: 0.25,
    location: 0.25,
    behavioral: 0.20,
    velocity: 0.15,
    threat: 0.15
  }

  constructor(private supabase: SupabaseClient) {}

  /**
   * Calculate comprehensive risk score
   */
  async calculateRiskScore(context: AuthContext): Promise<RiskScore> {
    const factors = await Promise.all([
      this.assessDeviceRisk(context),
      this.assessLocationRisk(context),
      this.assessBehavioralRisk(context),
      this.assessVelocityRisk(context),
      this.assessThreatIntelligence(context)
    ])

    // Weighted risk calculation
    const totalScore = factors.reduce((sum, factor) => {
      return sum + (factor.score * factor.weight)
    }, 0)

    const level = this.determineRiskLevel(totalScore)
    const recommendation = this.getAuthRecommendation(totalScore)

    // Cache risk assessment
    if (context.userId) {
      await this.cacheRiskAssessment(context.userId, {
        score: totalScore,
        level,
        factors,
        timestamp: new Date()
      })
    }

    return {
      score: Math.round(totalScore),
      level,
      factors,
      recommendation
    }
  }

  /**
   * Assess device risk
   */
  private async assessDeviceRisk(context: AuthContext): Promise<RiskFactor> {
    let score = 0
    const details: unknown = {}

    if (!context.userId) {
      // New user, no device history
      score = 30
      details.reason = 'new_user'
      return { name: 'device', score, weight: this.weights.device, details }
    }

    // Check if device is known
    const deviceFingerprint = await this.createDeviceFingerprint(context.deviceInfo)
    const isKnownDevice = await this.isDeviceKnown(context.userId, deviceFingerprint)
    
    details.deviceFingerprint = deviceFingerprint
    details.isKnownDevice = isKnownDevice

    if (!isKnownDevice) {
      score += 40
      details.newDevice = true
    }

    // Check device age (if known)
    if (isKnownDevice) {
      const deviceAge = await this.getDeviceAge(context.userId, deviceFingerprint)
      details.deviceAgeDays = deviceAge

      if (deviceAge < 7) {
        score += 20
        details.recentDevice = true
      }
    }

    // Check if device is trusted
    if (context.deviceInfo.isTrusted === false) {
      score += 25
      details.untrusted = true
    }

    return {
      name: 'device',
      score: Math.min(score, 100),
      weight: this.weights.device,
      details
    }
  }

  /**
   * Assess location risk
   */
  private async assessLocationRisk(context: AuthContext): Promise<RiskFactor> {
    let score = 0
    const details: unknown = {}

    if (!context.userId) {
      score = 20
      details.reason = 'new_user'
      return { name: 'location', score, weight: this.weights.location, details }
    }

    // Get user's typical locations
    const userLocations = await this.getUserLocations(context.userId)
    const currentLocation = await this.getIPLocation(context.ipAddress)

    details.currentLocation = currentLocation
    details.typicalLocations = userLocations.length

    // New country
    if (!userLocations.some(loc => loc.country === currentLocation.country)) {
      score += 40
      details.newCountry = true
    }

    // Check for impossible travel
    const lastLocation = await this.getLastLocation(context.userId)
    if (lastLocation) {
      const isImpossible = this.isImpossibleTravel(lastLocation, currentLocation, context.timestamp)
      if (isImpossible) {
        score += 50
        details.impossibleTravel = true
      }
    }

    // High-risk country check
    if (this.isHighRiskCountry(currentLocation.country)) {
      score += 30
      details.highRiskCountry = true
    }

    return {
      name: 'location',
      score: Math.min(score, 100),
      weight: this.weights.location,
      details
    }
  }

  /**
   * Assess behavioral risk
   */
  private async assessBehavioralRisk(context: AuthContext): Promise<RiskFactor> {
    let score = 0
    const details: unknown = {}

    if (!context.userId) {
      return { name: 'behavioral', score: 0, weight: this.weights.behavioral, details }
    }

    // Check login time patterns
    const typicalLoginHours = await this.getTypicalLoginHours(context.userId)
    const currentHour = new Date(context.timestamp).getHours()

    if (!typicalLoginHours.includes(currentHour)) {
      score += 25
      details.unusualTime = true
    }

    // Check login frequency
    const recentLogins = await this.getRecentLogins(context.userId, 24) // Last 24 hours
    if (recentLogins > 10) {
      score += 30
      details.highFrequency = true
    }

    // Check for rapid password changes
    const recentPasswordChanges = await this.getRecentPasswordChanges(context.userId, 7) // Last 7 days
    if (recentPasswordChanges > 2) {
      score += 35
      details.frequentPasswordChanges = true
    }

    return {
      name: 'behavioral',
      score: Math.min(score, 100),
      weight: this.weights.behavioral,
      details
    }
  }

  /**
   * Assess velocity risk (rapid actions from different locations)
   */
  private async assessVelocityRisk(context: AuthContext): Promise<RiskFactor> {
    let score = 0
    const details: unknown = {}

    if (!context.userId) {
      return { name: 'velocity', score: 0, weight: this.weights.velocity, details }
    }

    // Check for multiple IPs in short time
    const recentIPs = await this.getRecentIPs(context.userId, 60) // Last 60 minutes
    if (recentIPs.length > 3) {
      score += 40
      details.multipleIPs = recentIPs.length
    }

    // Check for multiple failed attempts
    const failedAttempts = await this.getRecentFailedAttempts(context.userId, 30) // Last 30 minutes
    if (failedAttempts > 5) {
      score += 50
      details.failedAttempts = failedAttempts
    }

    return {
      name: 'velocity',
      score: Math.min(score, 100),
      weight: this.weights.velocity,
      details
    }
  }

  /**
   * Assess threat intelligence
   */
  private async assessThreatIntelligence(context: AuthContext): Promise<RiskFactor> {
    let score = 0
    const details: unknown = {}

    // Check IP reputation
    const ipReputation = await this.checkIPReputation(context.ipAddress)
    details.ipReputation = ipReputation

    if (ipReputation.isVPN || ipReputation.isProxy) {
      score += 30
      details.vpnOrProxy = true
    }

    if (ipReputation.isTor) {
      score += 50
      details.torNetwork = true
    }

    if (ipReputation.threatScore > 70) {
      score += 40
      details.highThreatScore = true
    }

    // Check email domain reputation
    const emailDomain = context.email.split('@')[1]
    const domainReputation = await this.checkDomainReputation(emailDomain)
    details.domainReputation = domainReputation

    if (domainReputation.isDisposable) {
      score += 35
      details.disposableEmail = true
    }

    return {
      name: 'threat',
      score: Math.min(score, 100),
      weight: this.weights.threat,
      details
    }
  }

  /**
   * Determine risk level from score
   */
  private determineRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score < 30) return 'low'
    if (score < 60) return 'medium'
    if (score < 80) return 'high'
    return 'critical'
  }

  /**
   * Get authentication recommendation based on risk
   */
  private getAuthRecommendation(riskScore: number): MFARecommendation {
    if (riskScore < 30) {
      return {
        required: false,
        suggestedFactors: []
      }
    } else if (riskScore < 60) {
      return {
        required: true,
        suggestedFactors: ['totp', 'email']
      }
    } else if (riskScore < 80) {
      return {
        required: true,
        suggestedFactors: ['webauthn', 'totp'],
        requireMultiple: 1
      }
    } else {
      return {
        required: true,
        suggestedFactors: ['webauthn', 'totp', 'email'],
        requireMultiple: 2
      }
    }
  }

  /**
   * Helper methods
   */
  private async createDeviceFingerprint(deviceInfo: DeviceInfo): Promise<string> {
    const fingerprintData = {
      userAgent: deviceInfo.userAgent,
      screenResolution: deviceInfo.screenResolution,
      timezone: deviceInfo.timezone,
      language: deviceInfo.language,
      platform: deviceInfo.platform
    }

    const encoder = new TextEncoder()
    const data = encoder.encode(JSON.stringify(fingerprintData))
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    return Buffer.from(hashBuffer).toString('hex')
  }

  private async isDeviceKnown(userId: string, fingerprint: string): Promise<boolean> {
    const { data } = await this.supabase
      .from('trusted_devices')
      .select('id')
      .eq('user_id', userId)
      .eq('device_fingerprint', fingerprint)
      .single()

    return !!data
  }

  private async getDeviceAge(userId: string, fingerprint: string): Promise<number> {
    const { data } = await this.supabase
      .from('trusted_devices')
      .select('created_at')
      .eq('user_id', userId)
      .eq('device_fingerprint', fingerprint)
      .single()

    if (!data) return 0

    const createdAt = new Date(data.created_at)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - createdAt.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    return diffDays
  }

  private async getUserLocations(userId: string): Promise<GeoLocation[]> {
    const { data } = await this.supabase
      .from('user_locations')
      .select('country, region, city')
      .eq('user_id', userId)
      .order('last_seen', { ascending: false })
      .limit(10)

    return data || []
  }

  private async getIPLocation(ipAddress: string): Promise<GeoLocation> {
    // In production, use a geolocation API like MaxMind, IPInfo, or ip-api.com
    // For now, return mock data
    return {
      country: 'US',
      region: 'California',
      city: 'San Francisco'
    }
  }

  private async getLastLocation(userId: string): Promise<(GeoLocation & { timestamp: number }) | null> {
    const { data } = await this.supabase
      .from('user_locations')
      .select('*')
      .eq('user_id', userId)
      .order('last_seen', { ascending: false })
      .limit(1)
      .single()

    if (!data) return null

    return {
      country: data.country,
      region: data.region,
      city: data.city,
      latitude: data.latitude,
      longitude: data.longitude,
      timestamp: new Date(data.last_seen).getTime()
    }
  }

  private isImpossibleTravel(
    lastLocation: GeoLocation & { timestamp: number },
    currentLocation: GeoLocation,
    currentTimestamp: number
  ): boolean {
    // Calculate distance between locations (simplified)
    // In production, use proper geospatial calculations
    if (lastLocation.country !== currentLocation.country) {
      const timeDiff = (currentTimestamp - lastLocation.timestamp) / (1000 * 60 * 60) // hours
      
      // If different country and less than 2 hours, likely impossible
      if (timeDiff < 2) {
        return true
      }
    }

    return false
  }

  private isHighRiskCountry(country: string): boolean {
    // List of countries with higher fraud rates (simplified)
    const highRiskCountries = ['NG', 'GH', 'PK', 'RU', 'CN']
    return highRiskCountries.includes(country)
  }

  private async getTypicalLoginHours(userId: string): Promise<number[]> {
    const { data } = await this.supabase
      .from('auth_audit_log')
      .select('created_at')
      .eq('user_id', userId)
      .eq('event_type', 'login_success')
      .limit(100)

    if (!data) return []

    const hours = data.map(log => new Date(log.created_at).getHours())
    
    // Return most common hours
    const hourCounts = hours.reduce((acc, hour) => {
      acc[hour] = (acc[hour] || 0) + 1
      return acc
    }, {} as Record<number, number>)

    return Object.entries(hourCounts)
      .filter(([_, count]) => count >= 3)
      .map(([hour]) => parseInt(hour))
  }

  private async getRecentLogins(userId: string, hours: number): Promise<number> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000)

    const { count } = await this.supabase
      .from('auth_audit_log')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('event_type', 'login_success')
      .gte('created_at', since.toISOString())

    return count || 0
  }

  private async getRecentPasswordChanges(userId: string, days: number): Promise<number> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const { count } = await this.supabase
      .from('auth_audit_log')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('event_type', 'password_changed')
      .gte('created_at', since.toISOString())

    return count || 0
  }

  private async getRecentIPs(userId: string, minutes: number): Promise<string[]> {
    const since = new Date(Date.now() - minutes * 60 * 1000)

    const { data } = await this.supabase
      .from('auth_audit_log')
      .select('ip_address')
      .eq('user_id', userId)
      .gte('created_at', since.toISOString())

    if (!data) return []

    return [...new Set(data.map(log => log.ip_address).filter(Boolean))]
  }

  private async getRecentFailedAttempts(userId: string, minutes: number): Promise<number> {
    const since = new Date(Date.now() - minutes * 60 * 1000)

    const { count } = await this.supabase
      .from('auth_audit_log')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('event_type', 'login_failed')
      .gte('created_at', since.toISOString())

    return count || 0
  }

  private async checkIPReputation(ipAddress: string): Promise<unknown> {
    // In production, integrate with IP reputation services
    // like IPQualityScore, AbuseIPDB, or similar
    return {
      isVPN: false,
      isProxy: false,
      isTor: false,
      threatScore: 0,
      country: 'US'
    }
  }

  private async checkDomainReputation(domain: string): Promise<unknown> {
    // In production, check against disposable email providers list
    const disposableDomains = [
      'tempmail.com', 'guerrillamail.com', '10minutemail.com',
      'mailinator.com', 'throwaway.email'
    ]

    return {
      isDisposable: disposableDomains.includes(domain),
      trustScore: disposableDomains.includes(domain) ? 0 : 100
    }
  }

  private async cacheRiskAssessment(userId: string, assessment: any): Promise<void> {
    await this.supabase
      .from('risk_assessments')
      .insert({
        user_id: userId,
        risk_score: assessment.score,
        risk_factors: assessment.factors,
        assessed_at: assessment.timestamp.toISOString()
      })
  }
}
