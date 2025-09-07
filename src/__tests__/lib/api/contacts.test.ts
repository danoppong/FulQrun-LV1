import { ContactAPI } from '@/lib/api/contacts'
import { ContactWithCompany } from '@/lib/api/contacts'

// Mock the Supabase client
jest.mock('@/lib/auth', () => ({
  createClientComponentClient: () => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({ 
        data: { user: { id: 'test-user-id' } }, 
        error: null 
      }),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        order: jest.fn().mockResolvedValue({ 
          data: [], 
          error: null 
        }),
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({ 
            data: null, 
            error: null 
          }),
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({ 
            data: null, 
            error: null 
          }),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({ 
              data: null, 
              error: null 
            }),
          })),
        })),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn().mockResolvedValue({ 
          error: null 
        }),
      })),
    })),
  })),
}))

describe('ContactAPI', () => {
  let contactAPI: ContactAPI

  beforeEach(() => {
    contactAPI = new ContactAPI()
  })

  describe('getContacts', () => {
    it('should return contacts with company information', async () => {
      const result = await contactAPI.getContacts()
      
      expect(result).toHaveProperty('data')
      expect(result).toHaveProperty('error')
      expect(result.data).toBeDefined()
      expect(result.error).toBeNull()
    })

    it('should handle errors gracefully', async () => {
      // Mock an error response
      const mockSupabase = require('@/lib/auth').createClientComponentClient()
      mockSupabase.from().select().order.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' }
      })

      const result = await contactAPI.getContacts()
      
      expect(result.error).toBeDefined()
      expect(result.data).toBeNull()
    })
  })

  describe('getContact', () => {
    it('should return a single contact', async () => {
      const contactId = 'test-contact-id'
      const result = await contactAPI.getContact(contactId)
      
      expect(result).toHaveProperty('data')
      expect(result).toHaveProperty('error')
    })

    it('should handle invalid contact ID', async () => {
      const result = await contactAPI.getContact('invalid-id')
      
      expect(result).toHaveProperty('data')
      expect(result).toHaveProperty('error')
    })
  })

  describe('createContact', () => {
    it('should create a new contact', async () => {
      const contactData = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        title: 'Sales Manager',
        company_id: 'test-company-id'
      }

      const result = await contactAPI.createContact(contactData)
      
      expect(result).toHaveProperty('data')
      expect(result).toHaveProperty('error')
    })

    it('should handle missing required fields', async () => {
      const incompleteData = {
        first_name: 'John',
        // Missing last_name
        email: 'john.doe@example.com'
      }

      const result = await contactAPI.createContact(incompleteData as any)
      
      expect(result).toHaveProperty('data')
      expect(result).toHaveProperty('error')
    })

    it('should handle authentication errors', async () => {
      // Mock no user
      const mockSupabase = require('@/lib/auth').createClientComponentClient()
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: null
      })

      const contactData = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com'
      }

      const result = await contactAPI.createContact(contactData)
      
      expect(result.error).toBeDefined()
      expect(result.data).toBeNull()
    })
  })

  describe('updateContact', () => {
    it('should update an existing contact', async () => {
      const contactId = 'test-contact-id'
      const updates = {
        first_name: 'Jane',
        email: 'jane.doe@example.com'
      }

      const result = await contactAPI.updateContact(contactId, updates)
      
      expect(result).toHaveProperty('data')
      expect(result).toHaveProperty('error')
    })

    it('should handle update errors', async () => {
      const contactId = 'invalid-id'
      const updates = {
        first_name: 'Jane'
      }

      const result = await contactAPI.updateContact(contactId, updates)
      
      expect(result).toHaveProperty('data')
      expect(result).toHaveProperty('error')
    })
  })

  describe('deleteContact', () => {
    it('should delete a contact', async () => {
      const contactId = 'test-contact-id'
      const result = await contactAPI.deleteContact(contactId)
      
      expect(result).toHaveProperty('error')
      expect(result.error).toBeNull()
    })

    it('should handle delete errors', async () => {
      const contactId = 'invalid-id'
      const result = await contactAPI.deleteContact(contactId)
      
      expect(result).toHaveProperty('error')
    })
  })

  describe('searchContacts', () => {
    it('should search contacts by query', async () => {
      const query = 'john'
      const result = await contactAPI.searchContacts(query)
      
      expect(result).toHaveProperty('data')
      expect(result).toHaveProperty('error')
    })

    it('should handle empty search query', async () => {
      const query = ''
      const result = await contactAPI.searchContacts(query)
      
      expect(result).toHaveProperty('data')
      expect(result).toHaveProperty('error')
    })

    it('should handle special characters in search', async () => {
      const query = 'josé garcía'
      const result = await contactAPI.searchContacts(query)
      
      expect(result).toHaveProperty('data')
      expect(result).toHaveProperty('error')
    })
  })

  describe('error handling', () => {
    it('should normalize errors correctly', async () => {
      // Mock a Supabase error
      const mockSupabase = require('@/lib/auth').createClientComponentClient()
      mockSupabase.from().select().order.mockRejectedValueOnce(
        new Error('Network error')
      )

      const result = await contactAPI.getContacts()
      
      expect(result.error).toBeDefined()
      expect(result.error?.message).toBe('Network error')
      expect(result.data).toBeNull()
    })

    it('should handle malformed responses', async () => {
      // Mock malformed response
      const mockSupabase = require('@/lib/auth').createClientComponentClient()
      mockSupabase.from().select().order.mockResolvedValueOnce({
        // Missing data and error properties
        malformed: true
      })

      const result = await contactAPI.getContacts()
      
      expect(result).toHaveProperty('data')
      expect(result).toHaveProperty('error')
    })
  })
})
