// Email synchronization with Microsoft Graph
// This module handles email sync functionality separately from the main Graph API

import { microsoftGraphAPI, GraphEmail } from './microsoft-graph'

export interface EmailSyncResult {
  imported: number
  updated: number
  errors: number
  details: {
    totalEmails: number
    processedEmails: number
    skippedEmails: number
    errorMessages: string[]
  }
}

export interface EmailActivity {
  id: string
  type: 'email'
  subject: string
  description: string
  contact_id?: string
  opportunity_id?: string
  organization_id: string
  created_by: string
  email_data: {
    from: string
    to: string[]
    receivedDateTime: string
    isRead: boolean
    body: string
    attachments?: number
  }
}

export class EmailSyncService {
  private graphAPI = microsoftGraphAPI

  /**
   * Sync emails from Microsoft Graph to FulQrun activities
   */
  async syncEmails(
    folder: 'inbox' | 'sent' = 'inbox',
    limit: number = 50,
    organizationId: string,
    userId: string
  ): Promise<EmailSyncResult> {
    const result: EmailSyncResult = {
      imported: 0,
      updated: 0,
      errors: 0,
      details: {
        totalEmails: 0,
        processedEmails: 0,
        skippedEmails: 0,
        errorMessages: []
      }
    }

    try {
      // Get emails from Microsoft Graph
      const emails = await this.graphAPI.getEmails(folder, limit)
      result.details.totalEmails = emails.length

      // Process each email
      for (const email of emails) {
        try {
          result.details.processedEmails++
          
          // Check if email already exists as activity
          const existingActivity = await this.findExistingEmailActivity(email.id, organizationId)
          
          if (existingActivity) {
            // Update existing activity if needed
            const shouldUpdate = await this.shouldUpdateEmailActivity(existingActivity, email)
            if (shouldUpdate) {
              await this.updateEmailActivity(existingActivity.id, email)
              result.updated++
            } else {
              result.details.skippedEmails++
            }
          } else {
            // Create new activity
            await this.createEmailActivity(email, organizationId, userId)
            result.imported++
          }
        } catch (error) {
          result.errors++
          result.details.errorMessages.push(
            `Failed to process email ${email.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
          )
        }
      }

      return result
    } catch (error) {
      result.errors++
      result.details.errorMessages.push(
        `Email sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
      return result
    }
  }

  /**
   * Convert Graph email to FulQrun activity format
   */
  private async createEmailActivity(
    email: GraphEmail,
    organizationId: string,
    userId: string
  ): Promise<void> {
    // In a real implementation, this would:
    // 1. Create an activity record in the database
    // 2. Link to contacts if email addresses match
    // 3. Link to opportunities if subject/body contains opportunity references
    // 4. Store email metadata

    // Mock implementation for MVP
    const activity: EmailActivity = {
      id: `email-${email.id}`,
      type: 'email',
      subject: email.subject,
      description: this.extractEmailDescription(email),
      organization_id: organizationId,
      created_by: userId,
      email_data: {
        from: (email as any).from?.emailAddress?.address || '',
        to: (email as { toRecipients?: Array<{ emailAddress?: { address: string } }> }).toRecipients?.map((r: { emailAddress?: { address: string } }) => r.emailAddress?.address) || [],
        receivedDateTime: email.receivedDateTime,
        isRead: email.isRead,
        body: email.body.content,
        attachments: 0 // Would count actual attachments
      }
    }

    // Here you would save to database using your API
    // await activityAPI.createActivity(activity)
  }

  /**
   * Find existing email activity by Graph email ID
   */
  private async findExistingEmailActivity(
    emailId: string,
    organizationId: string
  ): Promise<EmailActivity | null> {
    // In a real implementation, this would query the database
    // for an activity with the email ID in metadata
    return null // Mock: no existing activities
  }

  /**
   * Check if email activity should be updated
   */
  private async shouldUpdateEmailActivity(
    existing: EmailActivity,
    email: GraphEmail
  ): Promise<boolean> {
    // Check if email has been read status changed or content updated
    return existing.email_data.isRead !== email.isRead
  }

  /**
   * Update existing email activity
   */
  private async updateEmailActivity(
    activityId: string,
    email: GraphEmail
  ): Promise<void> {
    // In a real implementation, this would update the database record
  }

  /**
   * Extract meaningful description from email body
   */
  private extractEmailDescription(email: GraphEmail): string {
    // Remove HTML tags and extract first 200 characters
    const plainText = email.body.contentType === 'html' 
      ? email.body.content.replace(/<[^>]*>/g, '')
      : email.body.content
    
    return plainText.substring(0, 200) + (plainText.length > 200 ? '...' : '')
  }

  /**
   * Sync emails for a specific contact
   */
  async syncContactEmails(
    contactEmail: string,
    organizationId: string,
    userId: string,
    limit: number = 20
  ): Promise<EmailSyncResult> {
    // In a real implementation, this would:
    // 1. Search for emails from/to the contact email
    // 2. Filter by date range
    // 3. Process and sync those emails
    
    
    // Mock implementation
    return {
      imported: 0,
      updated: 0,
      errors: 0,
      details: {
        totalEmails: 0,
        processedEmails: 0,
        skippedEmails: 0,
        errorMessages: []
      }
    }
  }

  /**
   * Sync emails for a specific opportunity
   */
  async syncOpportunityEmails(
    opportunityId: string,
    organizationId: string,
    userId: string,
    limit: number = 20
  ): Promise<EmailSyncResult> {
    // In a real implementation, this would:
    // 1. Get opportunity details (contact, company)
    // 2. Search for emails related to that contact/company
    // 3. Filter by opportunity keywords in subject/body
    // 4. Process and sync those emails
    
    
    // Mock implementation
    return {
      imported: 0,
      updated: 0,
      errors: 0,
      details: {
        totalEmails: 0,
        processedEmails: 0,
        skippedEmails: 0,
        errorMessages: []
      }
    }
  }

  /**
   * Get email sync statistics
   */
  async getSyncStats(organizationId: string): Promise<{
    totalEmails: number
    syncedEmails: number
    lastSyncDate: string | null
    errorCount: number
  }> {
    // In a real implementation, this would query the database
    // for email sync statistics
    
    return {
      totalEmails: 0,
      syncedEmails: 0,
      lastSyncDate: null,
      errorCount: 0
    }
  }
}

// Export a default instance
export const emailSyncService = new EmailSyncService()
