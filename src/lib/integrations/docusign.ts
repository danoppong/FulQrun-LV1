import { IntegrationConnectionData as _IntegrationConnectionData } from '@/lib/api/integrations';

export interface DocuSignEnvelope {
  envelopeId: string
  status: string
  emailSubject: string
  recipients: DocuSignRecipient[]
  created: string
  sent: string
  completed: string
  documents: DocuSignDocument[]
}

export interface DocuSignRecipient {
  email: string
  name: string
  role: string
  status: string
  recipientId: string
}

export interface DocuSignDocument {
  documentId: string
  name: string
  uri: string
  pages: number
}

export class DocuSignIntegration {
  private accessToken: string
  private accountId: string
  private baseUrl: string

  constructor(accessToken: string, accountId: string, baseUrl: string) {
    this.accessToken = accessToken
    this.accountId = accountId
    this.baseUrl = baseUrl
  }

  async createEnvelope(templateId: string, recipients: DocuSignRecipient[], emailSubject: string): Promise<DocuSignEnvelope> {
    const response = await fetch(`${this.baseUrl}/v2.1/accounts/${this.accountId}/envelopes`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        templateId,
        emailSubject,
        recipients: {
          signers: recipients
        }
      })
    })

    if (!response.ok) {
      throw new Error('Failed to create envelope')
    }

    return await response.json()
  }

  async getEnvelopeStatus(envelopeId: string): Promise<DocuSignEnvelope> {
    const response = await fetch(`${this.baseUrl}/v2.1/accounts/${this.accountId}/envelopes/${envelopeId}`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      }
    })

    if (!response.ok) {
      throw new Error('Failed to get envelope status')
    }

    return await response.json()
  }

  async sendEnvelope(envelopeId: string): Promise<boolean> {
    const response = await fetch(`${this.baseUrl}/v2.1/accounts/${this.accountId}/envelopes/${envelopeId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: 'sent' })
    })

    return response.ok
  }
}
