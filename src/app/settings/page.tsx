import QuickBooksSetup from '@/components/integrations/QuickBooksSetup'
import AuthWrapper from '@/components/auth/AuthWrapper'
import SupabaseDiagnostic from '@/components/SupabaseDiagnostic'
import ThemeSelector from '@/components/ThemeSelector'

export default function SettingsPage() {
  return (
    <AuthWrapper>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage your integrations and preferences
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-card border border-border rounded-lg p-6">
            <ThemeSelector />
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <SupabaseDiagnostic />
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <QuickBooksSetup />
          </div>
        </div>
      </div>
    </AuthWrapper>
  )
}
