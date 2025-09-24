#!/bin/bash

# Script to clean up unused imports and variables
echo "Cleaning up unused imports and variables..."

# Find all TypeScript files
find src -name "*.ts" -o -name "*.tsx" | while read file; do
    echo "Processing: $file"
    
    # Remove unused imports (this is a simplified approach)
    # We'll focus on common patterns first
    
    # Remove unused React imports that are only used for JSX
    if grep -q "import React" "$file" && ! grep -q "React\." "$file" && ! grep -q "React," "$file"; then
        echo "  - Removing unused React import"
        sed -i '' '/^import React from/d' "$file"
    fi
    
    # Remove unused useState/useEffect imports if not used
    if grep -q "import.*useState.*from 'react'" "$file" && ! grep -q "useState" "$file"; then
        echo "  - Removing unused useState import"
        sed -i '' 's/useState, //' "$file"
        sed -i '' 's/, useState//' "$file"
    fi
    
    if grep -q "import.*useEffect.*from 'react'" "$file" && ! grep -q "useEffect" "$file"; then
        echo "  - Removing unused useEffect import"
        sed -i '' 's/useEffect, //' "$file"
        sed -i '' 's/, useEffect//' "$file"
    fi
done

echo "Unused imports cleanup completed!"
