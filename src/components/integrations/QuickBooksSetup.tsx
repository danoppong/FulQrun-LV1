'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle, ExternalLink, AlertCircle } from 'lucide-react'

export default function QuickBooksSetup() {
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)

  const handleConnect = async () => {
    setIsConnecting(true)
    // Simulate connection process
    setTimeout(() => {
      setIsConnecting(false)
      setIsConnected(true)
    }, 2000)
  }

  const handleDisconnect = () => {
    setIsConnected(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <img 
            src="https://quickbooks.intuit.com/content/dam/intuit/quickbooks/logos/quickbooks-logo.svg" 
            alt="QuickBooks" 
            className="h-6 w-6"
          />
          QuickBooks Integration
        </CardTitle>
        <CardDescription>
          Connect your QuickBooks account to sync customer and financial data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConnected ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-amber-600">
              <AlertCircle className="h-4 w-4" />
              <span>QuickBooks integration is currently in development</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-id">Company ID (Optional)</Label>
              <Input 
                id="company-id" 
                placeholder="Enter your QuickBooks Company ID"
                disabled
              />
            </div>
            <Button 
              onClick={handleConnect} 
              disabled={isConnecting}
              className="w-full"
            >
              {isConnecting ? 'Connecting...' : 'Connect to QuickBooks'}
            </Button>
            <p className="text-xs text-gray-500">
              This feature will be available in a future update. 
              <a 
                href="https://developer.intuit.com/app/developer/qbo/docs/get-started" 
                target="_blank" 
                rel="noopener noreferrer"
                className="ml-1 text-blue-600 hover:underline inline-flex items-center gap-1"
              >
                Learn more <ExternalLink className="h-3 w-3" />
              </a>
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span>Connected to QuickBooks</span>
            </div>
            <div className="text-sm text-gray-600">
              <p>• Customer data sync enabled</p>
              <p>• Invoice tracking available</p>
              <p>• Payment status updates</p>
            </div>
            <Button 
              variant="outline" 
              onClick={handleDisconnect}
              className="w-full"
            >
              Disconnect
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}