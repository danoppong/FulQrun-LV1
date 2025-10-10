// src/app/ai-agent-guide/page.tsx
// Renders the AI Agent Guide from .github/copilot-instructions.md as an internal doc page

import fs from 'node:fs/promises'
import path from 'node:path'
import { AuthService } from '@/lib/auth-unified'

export const metadata = {
  title: 'AI Agent Guide',
  description: 'FulQrun Sales Operations Platform - AI Agent Guide',
}

async function getGuideContent() {
  const filePath = path.join(process.cwd(), '.github', 'copilot-instructions.md')
  try {
    const content = await fs.readFile(filePath, 'utf8')
    return content
  } catch (_err) {
    return 'Guide file not found. Ensure .github/copilot-instructions.md exists in the repository.'
  }
}

export default async function AIAgentGuidePage() {
  const user = await AuthService.getCurrentUserServer()
  const role = (user?.profile?.role || '').toString().toLowerCase()
  const isAllowed = role === 'admin' || role === 'super_admin'

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication required</h2>
          <p className="text-gray-600">Please log in to view this internal documentation.</p>
        </div>
      </div>
    )
  }

  if (!isAllowed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Access denied</h2>
          <p className="text-gray-600">This page is restricted to administrators.</p>
        </div>
      </div>
    )
  }

  const content = await getGuideContent()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI Agent Guide</h1>
              <p className="text-gray-600">FulQrun Sales Operations Platform — Engineering reference</p>
            </div>
            <a
              className="text-sm text-indigo-600 hover:text-indigo-800"
              href="https://github.com/danoppong/FulQrun-LV1/blob/NewBranch/.github/copilot-instructions.md"
              target="_blank"
              rel="noreferrer"
            >
              View in GitHub
            </a>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
        <article className="bg-white border rounded-lg shadow-sm p-4 sm:p-6">
          <pre className="whitespace-pre-wrap text-sm leading-6 text-gray-900 font-mono overflow-x-auto">{content}</pre>
        </article>
      </main>
    </div>
  )
}
