import QuickBooksSetup from '@/components/integrations/QuickBooksSetup'
import AuthWrapper from '@/components/auth/AuthWrapper'

export default function SettingsPage() {
  return (
    <AuthWrapper>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your integrations and preferences
          </p>
        </div>

        <div className="space-y-6">
          <QuickBooksSetup />
        </div>
      </div>
    </AuthWrapper>
  )
}
