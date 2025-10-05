export interface GraphEmail {
  id: string
  subject: string
  from: string
  to: string[]
  body: {
    contentType: string
    content: string
  }
  receivedDateTime: string
  isRead: boolean
  hasAttachments: boolean
}

export interface MicrosoftGraphAPI {
  getEmails(folder?: string, limit?: number): Promise<GraphEmail[]>
  sendEmail(to: string[], subject: string, body: string): Promise<void>
  markAsRead(emailId: string): Promise<void>
  getFolders(): Promise<string[]>
}

class MicrosoftGraphAPIImpl implements MicrosoftGraphAPI {
  async getEmails(_folder?: string, _limit?: number): Promise<GraphEmail[]> {
    // Mock implementation
    return []
  }

  async sendEmail(_to: string[], _subject: string, _body: string): Promise<void> {
    // Mock implementation
  }

  async markAsRead(_emailId: string): Promise<void> {
    // Mock implementation
  }

  async getFolders(): Promise<string[]> {
    // Mock implementation
    return ['Inbox', 'Sent', 'Drafts']
  }
}

export const microsoftGraphAPI = new MicrosoftGraphAPIImpl()
