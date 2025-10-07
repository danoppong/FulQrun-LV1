import { IntegrationConnectionData as _IntegrationConnectionData } from '@/lib/api/integrations';

export interface StripeCustomer {
  id: string
  email: string
  name: string
  created: number
  balance: number
  currency: string
}

export interface StripeInvoice {
  id: string
  customer: string
  amount: number
  currency: string
  status: string
  created: number
  due_date: number
  paid: boolean
}

export interface StripePayment {
  id: string
  amount: number
  currency: string
  status: string
  created: number
  customer: string
  invoice: string
}

export class StripeIntegration {
  private apiKey: string
  private baseUrl: string = 'https://api.stripe.com/v1'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async createCustomer(email: string, name: string): Promise<StripeCustomer> {
    const response = await fetch(`${this.baseUrl}/customers`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        email,
        name
      })
    })

    if (!response.ok) {
      throw new Error('Failed to create customer')
    }

    return await response.json()
  }

  async createInvoice(customerId: string, amount: number, currency: string = 'usd'): Promise<StripeInvoice> {
    const response = await fetch(`${this.baseUrl}/invoices`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        customer: customerId,
        amount: amount.toString(),
        currency
      })
    })

    if (!response.ok) {
      throw new Error('Failed to create invoice')
    }

    return await response.json()
  }

  async getCustomer(customerId: string): Promise<StripeCustomer> {
    const response = await fetch(`${this.baseUrl}/customers/${customerId}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    })

    if (!response.ok) {
      throw new Error('Failed to get customer')
    }

    return await response.json()
  }

  async getInvoice(invoiceId: string): Promise<StripeInvoice> {
    const response = await fetch(`${this.baseUrl}/invoices/${invoiceId}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    })

    if (!response.ok) {
      throw new Error('Failed to get invoice')
    }

    return await response.json()
  }
}
