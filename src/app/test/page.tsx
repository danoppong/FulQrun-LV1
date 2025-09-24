import Link from 'next/link'

export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Test Page</h1>
        <p className="text-gray-600">If you can see this, Next.js is working correctly!</p>
        <div className="mt-4">
          <Link href="/" className="text-blue-600 hover:text-blue-800">Go to Home</Link>
        </div>
      </div>
    </div>
  )
}
