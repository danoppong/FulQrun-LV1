import { IntegrationConnectionData as _IntegrationConnectionData } from '@/lib/api/integrations'

export interface GongCall {
  id: string
  title: string
  startTime: string
  endTime: string
  duration: number
  participants: GongParticipant[]
  recordingUrl?: string
  transcript?: string
  insights: GongInsight[]
}

export interface GongParticipant {
  id: string
  name: string
  email: string
  role: string
  talkTime: number
  talkPercentage: number
}

export interface GongInsight {
  type: string
  content: string
  timestamp: number
  confidence: number
}

export class GongIntegration {
  private accessToken: string
  private baseUrl: string = 'https://api.gong.io/v2'

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  async getCalls(startDate: string, endDate: string): Promise<GongCall[]> {
    const response = await fetch(`${this.baseUrl}/calls?fromDateTime=${startDate}&toDateTime=${endDate}`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch calls')
    }

    const data = await response.json()
    return data.calls || []
  }

  async getCall(callId: string): Promise<GongCall> {
    const response = await fetch(`${this.baseUrl}/calls/${callId}`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch call')
    }

    return await response.json()
  }

  async getCallTranscript(callId: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/calls/${callId}/transcript`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch transcript')
    }

    const data = await response.json()
    return data.transcript || ''
  }

  async getCallInsights(callId: string): Promise<GongInsight[]> {
    const response = await fetch(`${this.baseUrl}/calls/${callId}/insights`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch insights')
    }

    const data = await response.json()
    return data.insights || []
  }
}
