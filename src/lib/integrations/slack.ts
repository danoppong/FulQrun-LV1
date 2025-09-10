import { IntegrationConnectionData } from '@/lib/api/integrations'

export interface SlackMessage {
  channel: string
  text: string
  blocks?: any[]
  attachments?: any[]
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
  data: any
  sent_at: string
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
      console.error('Slack sendMessage error:', error)
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

      return data.channels.map((channel: any) => ({
        id: channel.id,
        name: channel.name,
        is_private: channel.is_private,
        is_member: channel.is_member,
        topic: channel.topic,
        purpose: channel.purpose,
        num_members: channel.num_members
      }))
    } catch (error) {
      console.error('Slack getChannels error:', error)
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
        .filter((user: any) => !user.deleted && !user.is_bot)
        .map((user: any) => ({
          id: user.id,
          name: user.name,
          real_name: user.real_name,
          profile: user.profile,
          is_admin: user.is_admin,
          is_owner: user.is_owner,
          is_bot: user.is_bot
        }))
    } catch (error) {
      console.error('Slack getUsers error:', error)
      throw new Error('Failed to fetch Slack users')
    }
  }

  /**
   * Send opportunity update notification
   */
  async sendOpportunityUpdate(opportunity: any, channel: string): Promise<{ success: boolean; error?: string }> {
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
            text: `*Value:* $${opportunity.value?.toLocaleString() || 'N/A'}`
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
          text: `*Company:* ${opportunity.company_name || 'N/A'}\n*Contact:* ${opportunity.contact_name || 'N/A'}`
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
  async sendLeadAssignment(lead: any, assignee: string, channel: string): Promise<{ success: boolean; error?: string }> {
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
            text: `*Lead:* ${lead.name}`
          },
          {
            type: 'mrkdwn',
            text: `*Company:* ${lead.company_name || 'N/A'}`
          },
          {
            type: 'mrkdwn',
            text: `*Email:* ${lead.email || 'N/A'}`
          },
          {
            type: 'mrkdwn',
            text: `*Phone:* ${lead.phone || 'N/A'}`
          }
        ]
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Assigned to:* <@${assignee}>\n*Source:* ${lead.source || 'N/A'}\n*Score:* ${lead.ai_score || 'N/A'}`
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
      text: `New Lead Assignment: ${lead.name}`,
      blocks
    })
  }

  /**
   * Send meeting reminder
   */
  async sendMeetingReminder(meeting: any, channel: string): Promise<{ success: boolean; error?: string }> {
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
            text: `*Meeting:* ${meeting.title}`
          },
          {
            type: 'mrkdwn',
            text: `*Time:* ${new Date(meeting.start_time).toLocaleString()}`
          },
          {
            type: 'mrkdwn',
            text: `*Duration:* ${meeting.duration || 30} minutes`
          },
          {
            type: 'mrkdwn',
            text: `*Type:* ${meeting.type || 'Meeting'}`
          }
        ]
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Description:* ${meeting.description || 'No description'}\n*Location:* ${meeting.location || 'TBD'}`
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
            url: meeting.meeting_url || '#',
            style: 'primary'
          }
        ]
      }
    ]

    return await this.sendMessage({
      channel,
      text: `Meeting Reminder: ${meeting.title}`,
      blocks
    })
  }

  /**
   * Send deal closed notification
   */
  async sendDealClosed(opportunity: any, channel: string): Promise<{ success: boolean; error?: string }> {
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
            text: `*Value:* $${opportunity.value?.toLocaleString() || 'N/A'}`
          },
          {
            type: 'mrkdwn',
            text: `*Company:* ${opportunity.company_name || 'N/A'}`
          },
          {
            type: 'mrkdwn',
            text: `*Closed by:* ${opportunity.owner_name || 'N/A'}`
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
  async sendTaskDueReminder(task: any, channel: string): Promise<{ success: boolean; error?: string }> {
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
            text: `*Task:* ${task.title}`
          },
          {
            type: 'mrkdwn',
            text: `*Due:* ${new Date(task.due_date).toLocaleString()}`
          },
          {
            type: 'mrkdwn',
            text: `*Priority:* ${task.priority || 'Medium'}`
          },
          {
            type: 'mrkdwn',
            text: `*Status:* ${task.status || 'Pending'}`
          }
        ]
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Description:* ${task.description || 'No description'}\n*Assigned to:* ${task.assigned_to || 'Unassigned'}`
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
      text: `Task Due Soon: ${task.title}`,
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
  async getChannelHistory(channel: string, limit: number = 100): Promise<any[]> {
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
    } catch (error) {
      console.error('Slack getChannelHistory error:', error)
      throw new Error('Failed to fetch channel history')
    }
  }

  /**
   * Test the connection
   */
  async testConnection(): Promise<{ success: boolean; error?: string; team?: any }> {
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
          url: data.url
        }
      }
    } catch (error) {
      console.error('Slack testConnection error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed'
      }
    }
  }
}
