import { getUser, getOrganization } from '@/lib/auth-server'
import { createServerComponentClient } from '@/lib/auth-server'

const DebugAuthPage = async () => {
  const supabase = createServerComponentClient()
  
  // Test auth session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  
  // Test user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  // Test our getUser function
  const ourUser = await getUser()
  
  // Test organization
  const organization = await getOrganization()

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Authentication Debug</h1>
        
        <div className="space-y-6">
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

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Our getUser() Function</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify({ ourUser }, null, 2)}
            </pre>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Organization Info</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify({ organization }, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DebugAuthPage
