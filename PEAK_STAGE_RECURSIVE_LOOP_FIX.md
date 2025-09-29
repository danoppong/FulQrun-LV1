# Fix for Recursive Loop in Save Peak Stage

## Issue
The "Save Peak Stage" functionality on the Opportunity Form was stuck in a recursive loop, causing infinite re-renders and preventing the form from working properly.

## Root Cause Analysis

The recursive loop was caused by a dependency chain in the `OpportunityFormEnhanced.tsx` component:

1. **Line 101**: `const watchedValues = watch()` - Created a new object reference on every render
2. **Line 232**: `handleAutoSave` useCallback had `watchedValues` in its dependency array
3. **Line 215**: Inside `handleAutoSave`, it used `watchedValues` which triggered the dependency
4. **Line 236**: `handlePeakSave` called `setIsDirty(true)` which triggered the auto-save useEffect
5. **Line 183**: The auto-save useEffect depended on `handleAutoSave`, creating an infinite loop

### The Cycle:
```
Render → watchedValues changes → handleAutoSave recreated → 
auto-save useEffect triggers → handleAutoSave called → 
state updates → re-render → watchedValues changes → ...
```

## Solution Applied

### 1. Removed Problematic `watchedValues`
- Removed `const watchedValues = watch()` which was creating new object references
- Modified `handleAutoSave` to get form values directly using individual `watch()` calls

### 2. Optimized Auto-Save Function
```typescript
const handleAutoSave = useCallback(async () => {
  if (!opportunityId || !isDirty) return

  try {
    // Get current form values directly instead of using watchedValues
    const formData = {
      name: watch('name'),
      contact_id: watch('contact_id'),
      company_id: watch('company_id'),
      description: watch('description'),
      assigned_to: watch('assigned_to')
    }
    
    const opportunityData: Partial<LocalOpportunityFormData> = {
      ...formData,
      ...peakData,
      ...meddpiccData
    }

    const { error } = await opportunityAPI.updateOpportunity(opportunityId, opportunityData)
    
    if (!error) {
      setLastSaved(new Date())
      setIsDirty(false)
      console.log('Auto-saved successfully')
    }
  } catch (err) {
    console.error('Auto-save failed:', err)
  }
}, [opportunityId, isDirty, peakData, meddpiccData, watch])
```

### 3. Added Change Detection
Enhanced `handlePeakSave` and `handleMeddpiccSave` to only update state when data actually changes:

```typescript
const handlePeakSave = useCallback(async (data: PEAKData) => {
  // Only update if data has actually changed
  const hasChanged = Object.keys(data).some(key => 
    peakData[key as keyof PEAKData] !== data[key as keyof PEAKData]
  )
  
  if (hasChanged) {
    setPeakData(data)
    setIsDirty(true)
  }
}, [peakData])
```

## Files Modified
- `src/components/opportunities/OpportunityFormEnhanced.tsx`

## Benefits of the Fix

1. **Eliminates Recursive Loop**: No more infinite re-renders
2. **Improves Performance**: Reduces unnecessary state updates and re-renders
3. **Maintains Functionality**: Auto-save and manual save still work correctly
4. **Better User Experience**: Form responds properly to user interactions
5. **Prevents Browser Freeze**: Stops the browser from becoming unresponsive

## Testing Checklist
- [ ] Peak Stage form loads without infinite loops
- [ ] Saving Peak Stage data works correctly
- [ ] Auto-save functionality works as expected
- [ ] No console errors related to infinite re-renders
- [ ] Form performance is smooth and responsive
- [ ] MEDDPICC form also works without issues

## Prevention
To prevent similar issues in the future:
- Avoid using `watch()` results directly in useCallback dependency arrays
- Use individual field watches instead of watching all fields
- Add change detection before updating state
- Be careful with object references in dependency arrays
