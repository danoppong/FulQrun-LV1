import { IntegrationConnectionData as _IntegrationConnectionData } from '@/lib/api/integrations'

export interface SlackBlock {
  type: string
  text?: {
    type: string
    text: string
  }
  elements?: SlackBlock[]
}

export interface SlackAttachment {
  color?: string
  title?: string
  text?: string
  fields?: Array<{
    title: string
    value: string
    short: boolean
  }>
}

export interface SlackMessage {
  channel: string
  text: string
  blocks?: SlackBlock[]
  attachments?: SlackAttachment[]
  thread_ts?: string
}

export interface SlackChannel {
  id: string
  name: string
  is_private: boolean
  is_member: boolean
  topic?: {
    value: string
  }
  purpose?: {
    value: string
  }
  num_members?: number
}

export interface SlackUser {
  id: string
  name: string
  real_name: string
  profile: {
    email: string
    image_24: string
    image_32: string
    image_48: string
    image_72: string
    image_192: string
    image_512: string
  }
  is_admin: boolean
  is_owner: boolean
  is_bot: boolean
}

export interface SlackNotification {
  id: string
  type: 'opportunity_update' | 'lead_assigned' | 'meeting_reminder' | 'deal_closed' | 'task_due'
  title: string
  message: string
  channel: string
  user_id?: string
  data: Record<string, unknown>
  sent_at: string
}

interface SlackChannelResponse {
  id: string
  name: string
  is_private: boolean
  is_member: boolean
  topic?: {
    value: string
  }
  purpose?: {
    value: string
  }
  num_members?: number
}

interface SlackUserResponse {
  id: string
  name: string
  real_name: string
  deleted: boolean
  is_bot: boolean
  profile: {
    email: string
    display_name: string
    image_24: string
    image_32: string
    image_48: string
    image_72: string
    image_192: string
  }
}

interface SlackTeamResponse {
  id: string
  name: string
  domain: string
  url?: string
}

interface OpportunityData {
  id: string
  name: string
  deal_value: number
  probability: number
  close_date: string
  stage: string
}

interface LeadData {
  id: string
  first_name: string
  last_name: string
  company: string
  email: string
  score: number
}

interface MeetingData {
  id: string
  subject: string
  start_time: string
  end_time: string
  attendees: string[]
}

interface TaskData {
  id: string
  subject: string
  due_date: string
  priority: string
  status: string
}

export class SlackIntegration {
  private accessToken: string
  private baseUrl: string = 'https://slack.com/api'

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  /**
   * Send a message to a Slack channel
   */
  async sendMessage(message: SlackMessage): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/chat.postMessage`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
      })

      const data = await response.json()

      if (!data.ok) {
        return {
          success: false,
          error: data.error || 'Failed to send message'
        }
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send message'
      }
    }
  }

  /**
   * Get list of channels
   */
  async getChannels(): Promise<SlackChannel[]> {
    try {
      const response = await fetch(`${this.baseUrl}/conversations.list?types=public_channel,private_channel`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!data.ok) {
        throw new Error(data.error || 'Failed to fetch channels')
      }

      return data.channels.map((channel: SlackChannelResponse) => ({
        id: channel.id,
        name: channel.name,
        is_private: channel.is_private,
        is_member: channel.is_member,
        topic: channel.topic,
        purpose: channel.purpose,
        num_members: channel.num_members
      }))
    } catch (_error) {
      throw new Error('Failed to fetch Slack channels')
    }
  }

  /**
   * Get list of users
   */
  async getUsers(): Promise<SlackUser[]> {
    try {
      const response = await fetch(`${this.baseUrl}/users.list`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!data.ok) {
        throw new Error(data.error || 'Failed to fetch users')
      }

      return data.members
        .filter((user: SlackUserResponse) => !user.deleted && !user.is_bot)
        .map((user: SlackUserResponse) => ({
          id: user.id,
          name: user.name,
          real_name: user.real_name,
          profile: user.profile,
          is_admin: (user as Record<string, unknown>).is_admin || false,
          is_owner: (user as Record<string, unknown>).is_owner || false,
          is_bot: (user as Record<string, unknown>).is_bot || false
        }))
    } catch (_error) {
      throw new Error('Failed to fetch Slack users')
    }
  }

  /**
   * Send opportunity update notification
   */
  async sendOpportunityUpdate(opportunity: OpportunityData, channel: string): Promise<{ success: boolean; error?: string }> {
    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `🎯 Opportunity Update: ${opportunity.name}`
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Stage:* ${opportunity.stage}`
          },
          {
            type: 'mrkdwn',
            text: `*Value:* $${(opportunity as Record<string, unknown>).value?.toLocaleString() || 'N/A'}`
          },
          {
            type: 'mrkdwn',
            text: `*Probability:* ${opportunity.probability || 0}%`
          },
          {
            type: 'mrkdwn',
            text: `*Close Date:* ${opportunity.close_date || 'N/A'}`
          }
        ]
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Company:* ${(opportunity as Record<string, unknown>).company_name || 'N/A'}\n*Contact:* ${(opportunity as Record<string, unknown>).contact_name || 'N/A'}`
        }
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'View Opportunity'
            },
            url: `${process.env.NEXT_PUBLIC_APP_URL}/opportunities/${opportunity.id}`,
            style: 'primary'
          }
        ]
      }
    ]

    return await this.sendMessage({
      channel,
      text: `Opportunity Update: ${opportunity.name}`,
      blocks
    })
  }

  /**
   * Send lead assignment notification
   */
  async sendLeadAssignment(lead: LeadData, assignee: string, channel: string): Promise<{ success: boolean; error?: string }> {
    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `👤 New Lead Assignment`
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Lead:* ${(lead as Record<string, unknown>).name || 'N/A'}`
          },
          {
            type: 'mrkdwn',
            text: `*Company:* ${(lead as Record<string, unknown>).company_name || 'N/A'}`
          },
          {
            type: 'mrkdwn',
            text: `*Email:* ${(lead as Record<string, unknown>).email || 'N/A'}`
          },
          {
            type: 'mrkdwn',
            text: `*Phone:* ${(lead as Record<string, unknown>).phone || 'N/A'}`
          }
        ]
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Assigned to:* <@${assignee}>\n*Source:* ${(lead as Record<string, unknown>).source || 'N/A'}\n*Score:* ${(lead as Record<string, unknown>).ai_score || 'N/A'}`
        }
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'View Lead'
            },
            url: `${process.env.NEXT_PUBLIC_APP_URL}/leads/${lead.id}`,
            style: 'primary'
          }
        ]
      }
    ]

    return await this.sendMessage({
      channel,
      text: `New Lead Assignment: ${(lead as Record<string, unknown>).name || 'N/A'}`,
      blocks
    })
  }

  /**
   * Send meeting reminder
   */
  async sendMeetingReminder(meeting: MeetingData, channel: string): Promise<{ success: boolean; error?: string }> {
    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `📅 Meeting Reminder`
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Meeting:* ${(meeting as Record<string, unknown>).title || 'N/A'}`
          },
          {
            type: 'mrkdwn',
            text: `*Time:* ${new Date((meeting as Record<string, unknown>).start_time).toLocaleString()}`
          },
          {
            type: 'mrkdwn',
            text: `*Duration:* ${(meeting as Record<string, unknown>).duration || 30} minutes`
          },
          {
            type: 'mrkdwn',
            text: `*Type:* ${(meeting as Record<string, unknown>).type || 'Meeting'}`
          }
        ]
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Description:* ${(meeting as Record<string, unknown>).description || 'No description'}\n*Location:* ${(meeting as Record<string, unknown>).location || 'TBD'}`
        }
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Join Meeting'
            },
            url: (meeting as Record<string, unknown>).meeting_url || '#',
            style: 'primary'
          }
        ]
      }
    ]

    return await this.sendMessage({
      channel,
      text: `Meeting Reminder: ${(meeting as Record<string, unknown>).title || 'N/A'}`,
      blocks
    })
  }

  /**
   * Send deal closed notification
   */
  async sendDealClosed(opportunity: OpportunityData, channel: string): Promise<{ success: boolean; error?: string }> {
    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `🎉 Deal Closed!`
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Opportunity:* ${opportunity.name}`
          },
          {
            type: 'mrkdwn',
            text: `*Value:* $${(opportunity as Record<string, unknown>).value?.toLocaleString() || 'N/A'}`
          },
          {
            type: 'mrkdwn',
            text: `*Company:* ${(opportunity as Record<string, unknown>).company_name || 'N/A'}`
          },
          {
            type: 'mrkdwn',
            text: `*Closed by:* ${(opportunity as Record<string, unknown>).owner_name || 'N/A'}`
          }
        ]
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Congratulations!* This deal has been successfully closed.`
        }
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'View Opportunity'
            },
            url: `${process.env.NEXT_PUBLIC_APP_URL}/opportunities/${opportunity.id}`,
            style: 'primary'
          }
        ]
      }
    ]

    return await this.sendMessage({
      channel,
      text: `Deal Closed: ${opportunity.name}`,
      blocks
    })
  }

  /**
   * Send task due reminder
   */
  async sendTaskDueReminder(task: TaskData, channel: string): Promise<{ success: boolean; error?: string }> {
    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `⏰ Task Due Soon`
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Task:* ${(task as { title?: string }).title || 'N/A'}`
          },
          {
            type: 'mrkdwn',
            text: `*Due:* ${new Date((task as { due_date: string }).due_date).toLocaleString()}`
          },
          {
            type: 'mrkdwn',
            text: `*Priority:* ${(task as { priority?: string }).priority || 'Medium'}`
          },
          {
            type: 'mrkdwn',
            text: `*Status:* ${(task as { status?: string }).status || 'Pending'}`
          }
        ]
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Description:* ${(task as { description?: string }).description || 'No description'}\n*Assigned to:* ${(task as { assigned_to?: string }).assigned_to || 'Unassigned'}`
        }
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'View Task'
            },
            url: `${process.env.NEXT_PUBLIC_APP_URL}/activities/${task.id}`,
            style: 'primary'
          }
        ]
      }
    ]

    return await this.sendMessage({
      channel,
      text: `Task Due Soon: ${(task as { title?: string }).title || 'N/A'}`,
      blocks
    })
  }

  /**
   * Create a thread in a channel
   */
  async createThread(channel: string, message: string, threadTs: string): Promise<{ success: boolean; error?: string }> {
    return await this.sendMessage({
      channel,
      text: message,
      thread_ts: threadTs
    })
  }

  /**
   * Get channel history
   */
  async getChannelHistory(channel: string, limit: number = 100): Promise<unknown[]> {
    try {
      const response = await fetch(`${this.baseUrl}/conversations.history?channel=${channel}&limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!data.ok) {
        throw new Error(data.error || 'Failed to fetch channel history')
      }

      return data.messages
    } catch (_error) {
      throw new Error('Failed to fetch channel history')
    }
  }

  /**
   * Test the connection
   */
  async testConnection(): Promise<{ success: boolean; error?: string; team?: SlackTeamResponse }> {
    try {
      const response = await fetch(`${this.baseUrl}/auth.test`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!data.ok) {
        return {
          success: false,
          error: data.error || 'Connection test failed'
        }
      }

      return {
        success: true,
        team: {
          id: data.team_id,
          name: data.team,
          domain: (data as { domain?: string }).domain || '',
          url: data.url || ''
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed'
      }
    }
  }
}
