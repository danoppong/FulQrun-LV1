#!/bin/bash

# Script to fix React imports in all client components
echo "Fixing React imports in client components..."

# Find all .tsx files with 'use client' that don't import React
find src/components -name "*.tsx" -exec grep -l "^'use client'$" {} \; | while read file; do
    # Check if React is already imported
    if ! grep -q "import React" "$file"; then
        echo "Fixing React import in: $file"
        
        # Get the line after 'use client'
        second_line=$(sed -n '2p' "$file")
        
        # Check if it's an import statement
        if [[ "$second_line" == import* ]]; then
            # Replace the import line to include React
            sed -i '' "2s/^import {/import React, {/" "$file"
            sed -i '' "2s/^import (/import React, (/" "$file"
        else
            # Add React import after 'use client'
            sed -i '' "1a\\
import React from 'react'
" "$file"
        fi
    fi
done

echo "React import fixes completed!"
