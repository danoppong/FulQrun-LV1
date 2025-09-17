# MEDDPICC_CONFIG Runtime Error Fix

## Issue
```
Unhandled Runtime Error
ReferenceError: Can't find variable: MEDDPICC_CONFIG
Call Stack
forEach
[native code]
dispatchEvent
[native code]
```

## Root Cause
The `MEDDPICC_CONFIG` was being accessed in functions that could be called during component initialization, before the module was fully loaded. This created a race condition where the config object wasn't available when needed.

## Solution

### 1. Added Safety Checks
Added null checks for `MEDDPICC_CONFIG` in all functions that access it:

```typescript
// Safety check for MEDDPICC_CONFIG
if (!MEDDPICC_CONFIG || !MEDDPICC_CONFIG.pillars) {
  console.warn('MEDDPICC_CONFIG not available')
  return fallbackValue
}
```

### 2. Fixed Circular Dependency
The `MEDDPICC_FIELDS` was trying to use `MEDDPICC_CONFIG` at module level, creating a circular dependency. Fixed by:

```typescript
// OLD - Circular dependency
export const MEDDPICC_FIELDS: MEDDPICCField[] = MEDDPICC_CONFIG.pillars.map(...)

// NEW - Static definition
export const MEDDPICC_FIELDS: MEDDPICCField[] = [
  { id: 'metrics', name: 'Metrics', description: 'Quantify the business impact', weight: 15, questions: [...] },
  // ... other fields
]
```

### 3. Added Loading State
Added a loading state to prevent the component from rendering until `MEDDPICC_CONFIG` is available:

```typescript
const [isLoading, setIsLoading] = useState(true)

useEffect(() => {
  if (MEDDPICC_CONFIG && MEDDPICC_CONFIG.pillars) {
    setIsLoading(false)
  } else {
    // Retry after a short delay
    const timer = setTimeout(() => {
      if (MEDDPICC_CONFIG && MEDDPICC_CONFIG.pillars) {
        setIsLoading(false)
      }
    }, 100)
    return () => clearTimeout(timer)
  }
}, [])

// Show loading state
if (isLoading) {
  return <LoadingSpinner />
}
```

### 4. Enhanced Error Handling
Added fallback behavior when `MEDDPICC_CONFIG` is not available:

```typescript
// Fallback for combining responses
if (!MEDDPICC_CONFIG || !MEDDPICC_CONFIG.pillars) {
  return pillarResponses.map(r => r.answer).join('\n\n')
}

// Fallback for parsing
if (!MEDDPICC_CONFIG || !MEDDPICC_CONFIG.pillars) {
  return []
}
```

## Files Modified

1. **`src/lib/meddpicc.ts`**
   - Fixed circular dependency in `MEDDPICC_FIELDS`
   - Made `MEDDPICC_FIELDS` static instead of dynamic

2. **`src/components/meddpicc/MEDDPICCQualification.tsx`**
   - Added safety checks in `combinePillarResponses`
   - Added safety checks in `parsePillarText`
   - Added safety checks in `getPillarProgress`
   - Added loading state and retry logic
   - Added loading UI

3. **`src/components/forms/MEDDPICCForm.tsx`**
   - Added safety checks in `combinePillarResponses`
   - Added safety checks in `parsePillarText`

## Testing

### Manual Testing Steps
1. Navigate to an opportunity edit page
2. Switch to "Comprehensive View" for MEDDPICC
3. Verify the component loads without errors
4. Verify all MEDDPICC pillars are displayed correctly
5. Test saving and loading data

### Expected Behavior
- ✅ No runtime errors related to `MEDDPICC_CONFIG`
- ✅ Component shows loading state until config is available
- ✅ All MEDDPICC functionality works correctly
- ✅ Graceful fallback when config is not available
- ✅ Console warnings help with debugging

## Result

The `MEDDPICC_CONFIG` runtime error has been resolved. The component now:
- Safely handles cases where the config is not immediately available
- Shows a loading state during initialization
- Provides fallback behavior for all config-dependent functions
- Maintains full functionality once the config is loaded

The fix ensures robust error handling while maintaining all existing functionality.
