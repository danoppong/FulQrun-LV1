# 🚨 QUICK FIX - Apply Migration NOW

## Current Status: ❌ 403 ERROR ACTIVE

Your app is getting a 403 error because the database policies aren't applied yet.

---

## ⚡ 3-STEP FIX (Takes 30 seconds)

### Step 1: Open Supabase Dashboard
Click this link: **https://app.supabase.com/project/_/sql/new**

(You'll be asked to select your project - choose it)

### Step 2: Paste & Run
The migration is **ALREADY IN YOUR CLIPBOARD**!

1. Press **Cmd+V** (paste)
2. Press **Cmd+Enter** (run)

### Step 3: Refresh Your App
Go back to http://localhost:3000 and try again

---

## ✅ Expected Results

**In Supabase Dashboard:**
```
✓ DROP POLICY ... OK
✓ CREATE POLICY "metric_templates_select_policy" ... OK  
✓ CREATE POLICY "metric_templates_insert_policy" ... OK
✓ CREATE POLICY "metric_templates_update_policy" ... OK
✓ CREATE POLICY "metric_templates_delete_policy" ... OK
✓ (same for custom_metric_fields)
```

**In Your App:**
- No more 403 errors ✅
- Metric templates create successfully ✅

---

## 🔍 Verify It Worked (Optional)

After applying, you can verify by running this in Supabase SQL Editor:

\`\`\`bash
cat verify-rls-fix.sql | pbcopy
\`\`\`

Then paste and run in Supabase. Should show 8 total policies (4 for each table).

---

## 🆘 Troubleshooting

**If you get an error about policies not existing:**
- That's OK! The DROP POLICY IF EXISTS will just skip them
- The CREATE POLICY statements should still work

**If you still get 403 after applying:**
1. Hard refresh your app (Cmd+Shift+R)
2. Check browser console for the exact error
3. Run verify-rls-fix.sql to confirm policies exist

---

**The migration is in your clipboard - PASTE IT NOW!** 🚀
