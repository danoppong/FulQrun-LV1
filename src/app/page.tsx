import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/supabase";

export default function Home() {
  // If Supabase is not configured, redirect to setup
  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Welcome to <span className="text-indigo-600">FulQrun</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              The sales operations platform that embeds PEAK + MEDDPICC methodology 
              to accelerate your sales process and close more deals.
            </p>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8 max-w-2xl mx-auto">
              <div className="flex items-center justify-center mb-4">
                <svg className="h-8 w-8 text-yellow-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <h2 className="text-lg font-semibold text-yellow-800">Setup Required</h2>
              </div>
              <p className="text-yellow-700 mb-4">
                FulQrun needs to be configured with your Supabase database before you can start using it.
              </p>
              <Link
                href="/setup"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                </svg>
                Configure FulQrun
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Welcome to <span className="text-indigo-600">FulQrun</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            The sales operations platform that embeds PEAK + MEDDPICC methodology 
            to accelerate your sales process and close more deals.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              href="/auth/login"
              className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold border-2 border-indigo-600 hover:bg-indigo-50 transition-colors"
            >
              Get Started
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-indigo-600 text-3xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold mb-2">PEAK Methodology</h3>
              <p className="text-gray-600">
                Prospecting, Engaging, Advancing, and Key Decision stages 
                to guide your sales process.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-indigo-600 text-3xl mb-4">📊</div>
              <h3 className="text-xl font-semibold mb-2">MEDDPICC Qualification</h3>
              <p className="text-gray-600">
                Metrics, Economic Buyer, Decision Criteria, and more 
                to qualify opportunities effectively.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-indigo-600 text-3xl mb-4">🔗</div>
              <h3 className="text-xl font-semibold mb-2">Seamless Integration</h3>
              <p className="text-gray-600">
                Microsoft Graph, QuickBooks, and more integrations 
                to streamline your workflow.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}