# Premium Dashboard - Quick Start Guide

## 🎉 What's New?

Your pharmaceutical sales dashboard has been completely revamped with:

### ✨ **Premium Dark Mode**
- Toggle between light and dark themes with the sun/moon icon
- Persistent across sessions (saved to localStorage)
- Premium gradients and color schemes
- All widgets and charts adapt automatically

### 📊 **Sophisticated Charts (Recharts)**
Three new premium chart components:
- **Line Charts**: Revenue trends, prescription growth
- **Bar Charts**: Team performance comparisons
- **Donut Charts**: Pipeline stage distribution

### 📈 **Three New Pharmaceutical KPIs**
1. **KOL Engagement Rate**: Track strategic relationships with Key Opinion Leaders
2. **Formulary Win Rate**: Measure market access success
3. **Sample Efficiency Index**: ROI on sample distribution programs

### 🎨 **Enhanced Visual Design**
- Gradient backgrounds and shadows
- Smooth animations and hover effects
- Icon indicators for different metrics
- Responsive grid system (mobile-first)
- Premium card designs with depth

## 🚀 How to Use

### Access the Dashboard
Navigate to: **http://localhost:3000/dashboard**

### Toggle Dark Mode
1. Look for the **sun/moon icon** in the top-right corner
2. Click to switch between light and dark themes
3. Your preference is saved automatically

### Customize Your Layout (If Authorized)
1. Click **"✨ Customize"** button
2. See drag handles (⋮⋮) on each widget
3. Rearrange widgets as needed
4. Click **"💾 Save Layout"** to persist changes

### Preview Other Roles (Admin Only)
1. Use the **role dropdown** next to the controls
2. View dashboards for any role (Salesman, Manager, Director, Admin)
3. See how layouts and widgets differ by role

### Configure Auto-Refresh
- Check **"Auto refresh"** to enable periodic updates
- Select refresh interval: 5 min, 15 min, 30 min, or 1 hour
- Great for monitoring live metrics

## 🎨 Widget Types

### **KPI Cards**
- Show key metrics with trend indicators
- Dynamic icons based on metric type
- Hover effects for emphasis
- Color-coded trends (green = up, red = down)

### **Sales Performance Chart**
- 6-month revenue vs. target line chart
- 4 summary statistics
- Month-over-month growth badge
- Interactive tooltips on hover

### **Team Performance**
- Bar chart comparing individual performance
- 3 team-level statistics
- Visual performance bars
- Easy to spot top performers

### **Pipeline Overview**
- PEAK methodology stages
- Donut chart showing distribution
- Total pipeline value
- Conversion rate metric

### **Recent Activity**
- Timeline of last 24 hours
- Emoji icons for quick identification
- Relative timestamps
- Hover animations

### **Quota Tracker**
- Progress bar with gradient
- Dollar achievement vs. target
- Days remaining in period
- Visual percentage indicator

### **Pharmaceutical KPI Cards**
- Specialized for pharma metrics (TRx, NRx, Market Share)
- Product/territory filters (when customized)
- High confidence scores
- Purple/violet gradient theme

## 📱 Responsive Design

The dashboard automatically adapts to your screen size:
- **Mobile**: Single column layout
- **Tablet**: 2-column grid
- **Desktop**: 12-column grid with flexible widget spanning

## 🎯 Chart Interactions

### Hover Over Chart Elements
- See detailed tooltips with exact values
- Color-coded legends
- Formatted numbers (thousands separator)

### Charts Update with Theme
- Dark mode changes grid colors
- Tooltips adapt to theme
- Text remains readable in both modes

## 🔧 For Developers

### File Locations
- **Main Dashboard**: `/src/components/dashboard/PremiumEnhancedDashboard.tsx`
- **Chart Components**: `/src/components/charts/`
  - `PremiumLineChart.tsx`
  - `PremiumBarChart.tsx`
  - `PremiumDonutChart.tsx`
- **KPI Engine**: `/src/lib/bi/kpi-engine.ts` (includes 3 new KPIs)

### Using Charts Elsewhere

```typescript
import { PremiumLineChart } from '@/components/charts/PremiumLineChart'

<PremiumLineChart
  data={[
    { name: 'Jan', revenue: 120000, target: 100000 },
    { name: 'Feb', revenue: 150000, target: 120000 }
  ]}
  dataKeys={[
    { key: 'revenue', color: '#3B82F6', name: 'Revenue' },
    { key: 'target', color: '#10B981', name: 'Target' }
  ]}
  height={300}
  darkMode={isDarkMode}
/>
```

### Accessing New KPIs

```typescript
import { kpiEngine } from '@/lib/bi/kpi-engine'

const kolEngagement = await kpiEngine.calculateKOLEngagement({
  organizationId: 'org-123',
  territoryId: 'terr-456',
  productId: 'prod-789',
  periodStart: new Date('2024-01-01'),
  periodEnd: new Date('2024-12-31')
})

console.log(`KOL Engagement: ${kolEngagement.value.toFixed(1)}%`)
```

## 🎨 Theme Colors

### Dark Mode Palette
- Background: Deep grays (#111827, #1F2937, #374151)
- Accent: Vibrant blues, greens, purples
- Text: White with gray tones
- Shadows: Subtle with blue/purple tints

### Light Mode Palette
- Background: Soft grays and whites
- Accent: Professional blues and greens
- Text: Dark grays
- Shadows: Neutral with slight blue tint

## 🌟 Best Practices

1. **Use Dark Mode** for extended viewing sessions (reduces eye strain)
2. **Enable Auto-Refresh** when monitoring live metrics
3. **Customize Your Layout** to prioritize your most important KPIs
4. **Hover Over Charts** to see detailed breakdowns
5. **Save Changes** after customizing to preserve your layout

## 📊 Mock Data Note

Current implementation uses **realistic mock data** for demonstration. In production:
- Connect to live KPI APIs
- Enable real-time updates
- Add drill-down capabilities
- Implement data export features

## 🔐 Role-Based Logic Maintained

All existing role-based dashboard features are preserved:
- ✅ Admin overlay geometry for consistency
- ✅ Personal layout persistence
- ✅ Role template fallback system
- ✅ Auto-publish Admin default template
- ✅ Admin role preview selector
- ✅ Organization-scoped data (RLS)
- ✅ Metadata persistence for filters

## 🐛 Troubleshooting

**Dark mode not persisting?**
- Check browser localStorage is enabled
- Clear cache if needed

**Charts not rendering?**
- Ensure JavaScript is enabled
- Check browser console for errors
- Verify Recharts library loaded

**Layout changes not saving?**
- Must click "💾 Save Layout" button
- Check network tab for API call
- Verify authentication

**Role selector not visible?**
- Only available to Admin and Super Admin users
- Check your user profile role

## 📚 Additional Resources

- Full documentation: `PREMIUM_DASHBOARD_ENHANCEMENT.md`
- KPI definitions: `src/lib/bi/kpi-engine.ts`
- Chart examples: `src/components/charts/`
- Dashboard logic: `src/components/dashboard/PremiumEnhancedDashboard.tsx`

---

**Enjoy your premium pharmaceutical sales dashboard! 🎉**

For questions or feature requests, refer to the comprehensive documentation or inspect the component implementations.
