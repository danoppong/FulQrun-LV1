import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import AuthWrapper from '@/components/auth/AuthWrapper';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock Supabase client (shared singleton across calls)
const mockClient = {
  auth: {
    getUser: jest.fn().mockResolvedValue({ 
      data: { user: { id: 'test-user', email: 'test@example.com' } }, 
      error: null 
    }),
    onAuthStateChange: jest.fn(() => ({
      data: { subscription: { unsubscribe: jest.fn() } }
    }))
  }
}

jest.mock('@/lib/auth', () => ({
  createClientComponentClient: () => mockClient
}))

describe('AuthWrapper', () => {
  const mockPush = jest.fn()
  
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    })
  })

  it('renders children when user is authenticated', async () => {
    render(
      <AuthWrapper>
        <div>Protected Content</div>
      </AuthWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })
  })

  it('shows loading spinner initially', () => {
    render(
      <AuthWrapper>
        <div>Protected Content</div>
      </AuthWrapper>
    )

    expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument()
  })

  it('redirects to login when user is not authenticated', async () => {
    // Mock unauthenticated user
    const { createClientComponentClient } = await import('@/lib/auth')
    const client = createClientComponentClient() as unknown as { auth: { getUser: jest.Mock } }
    client.auth.getUser.mockResolvedValueOnce({ data: { user: null }, error: null })

    render(
      <AuthWrapper>
        <div>Protected Content</div>
      </AuthWrapper>
    )

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/auth/login')
    })
  })

  it('redirects to custom route when specified', async () => {
    // Mock unauthenticated user
    const { createClientComponentClient } = await import('@/lib/auth')
    const client = createClientComponentClient() as unknown as { auth: { getUser: jest.Mock } }
    client.auth.getUser.mockResolvedValueOnce({ data: { user: null }, error: null })

    render(
      <AuthWrapper redirectTo="/custom-login">
        <div>Protected Content</div>
      </AuthWrapper>
    )

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/custom-login')
    })
  })

  it('does not require auth when requireAuth is false', async () => {
    // Mock unauthenticated user
    const { createClientComponentClient } = await import('@/lib/auth')
    const client = createClientComponentClient() as unknown as { auth: { getUser: jest.Mock } }
    client.auth.getUser.mockResolvedValueOnce({ data: { user: null }, error: null })

    render(
      <AuthWrapper requireAuth={false}>
        <div>Public Content</div>
      </AuthWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('Public Content')).toBeInTheDocument()
    })
    expect(mockPush).not.toHaveBeenCalled()
  })
})
