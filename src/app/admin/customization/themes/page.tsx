// Administration Module - Theme Customizer Interface
// Simple and effective theme switching

'use client';

import React from 'react';
import ThemeSelector from '@/components/admin/ThemeSelector';

export default function ThemesPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Theme Customization</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Customize the appearance of your FulQrun platform
        </p>
      </div>

      {/* Theme Selector */}
      <div className="bg-card rounded-lg border border-border p-6">
        <ThemeSelector />
      </div>

      {/* Theme Information */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h2 className="text-lg font-semibold text-foreground mb-3">Theme Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h3 className="font-medium text-foreground mb-2">✨ Available Themes</h3>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Light - Clean and bright interface</li>
              <li>• Dark - Easy on the eyes</li>
              <li>• Ocean Blue - Professional blue tones</li>
              <li>• Royal Purple - Elegant purple scheme</li>
              <li>• Forest Green - Nature-inspired colors</li>
              <li>• Sunset Orange - Warm and energetic</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-foreground mb-2">🎯 Features</h3>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Instant theme switching</li>
              <li>• Automatic persistence</li>
              <li>• Responsive design support</li>
              <li>• Accessible color contrast</li>
              <li>• Consistent across all pages</li>
              <li>• Mobile-optimized themes</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}