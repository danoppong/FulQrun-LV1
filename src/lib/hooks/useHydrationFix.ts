'use client'

import { useEffect } from 'react';

export function useHydrationFix() {
  useEffect(() => {
    // Remove browser extension attributes that cause hydration mismatches
    const removeExtensionAttributes = () => {
      const body = document.body
      if (body) {
        // Remove Grammarly attributes
        body.removeAttribute('data-new-gr-c-s-check-loaded')
        body.removeAttribute('data-gr-ext-installed')
        
        // Remove other common extension attributes
        body.removeAttribute('data-grammarly-shadow-root')
        body.removeAttribute('data-gramm')
        
        // Remove LastPass attributes
        body.removeAttribute('data-lastpass-icon-root')
        
        // Remove 1Password attributes
        body.removeAttribute('data-1p-ignore')
        
        // Remove other password manager attributes
        body.removeAttribute('data-bitwarden-watching')
        body.removeAttribute('data-dashlane-ignore')
      }
    }

    // Run immediately and also after a short delay to catch extensions that load later
    removeExtensionAttributes()
    const timeoutId = setTimeout(removeExtensionAttributes, 100)
    const timeoutId2 = setTimeout(removeExtensionAttributes, 500)
    const timeoutId3 = setTimeout(removeExtensionAttributes, 1000)
    
    // Also run when DOM mutations occur (for extensions that modify the DOM later)
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.target === document.body) {
          removeExtensionAttributes()
        }
      })
    })
    
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: [
        'data-new-gr-c-s-check-loaded',
        'data-gr-ext-installed',
        'data-grammarly-shadow-root',
        'data-gramm',
        'data-lastpass-icon-root',
        'data-1p-ignore',
        'data-bitwarden-watching',
        'data-dashlane-ignore'
      ]
    })

    return () => {
      clearTimeout(timeoutId)
      clearTimeout(timeoutId2)
      clearTimeout(timeoutId3)
      observer.disconnect()
    }
  }, [])
}