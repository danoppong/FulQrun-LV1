import { cookies } from 'next/headers'
import { createServerComponentClient } from '@/lib/auth-server';

const TestSessionPage = async () => {
  const cookieStore = cookies()
  const supabase = createServerComponentClient()
  
  // Get all cookies
  const allCookies = cookieStore.getAll()
  
  // Test session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  
  // Test user
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Session Debug (Server-Side)</h1>
        
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">All Cookies</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(allCookies, null, 2)}
            </pre>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Session Info</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify({ session, sessionError }, null, 2)}
            </pre>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">User Info</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify({ user, userError }, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TestSessionPage
