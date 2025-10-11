import QuickBooksSetup from '@/components/integrations/QuickBooksSetup'
import AuthWrapper from '@/components/auth/AuthWrapper';
import SupabaseDiagnostic from '@/components/SupabaseDiagnostic'
import ThemeSelector from '@/components/ThemeSelector';
import Link from 'next/link'
import { Cog6ToothIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

export default function SettingsPage() {
  return (
    <AuthWrapper>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Settings</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Manage your integrations and preferences
            </p>
          </div>
          <Link
            href="/admin"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            <Cog6ToothIcon className="h-4 w-4 mr-2" />
            Advanced Administration
            <ArrowRightIcon className="h-4 w-4 ml-2" />
          </Link>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <Cog6ToothIcon className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                New Administration Module Available
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  We&apos;ve launched a comprehensive administration module with advanced features including:
                </p>
                <ul className="mt-2 list-disc list-inside space-y-1">
                  <li>User & Role Management</li>
                  <li>Module Configuration</li>
                  <li>Security & Compliance</li>
                  <li>System Administration</li>
                  <li>Customization Tools</li>
                </ul>
                <p className="mt-2">
                  <Link href="/admin" className="font-medium underline hover:text-blue-600">
                    Access the new Administration Module →
                  </Link>
                </p>
              </div>
            </div>
          </div>
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
