# AlphaAI Terminal - Quick Reference

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Development server
npm run dev
# → http://localhost:3000

# Production build
npm run build

# Start production server
npm start
```

---

## 📋 File Structure

```
alphaai-next/
├── app/
│   ├── dashboard/page.tsx         # /dashboard
│   ├── portfolio/page.tsx         # /portfolio
│   ├── ai-insights/page.tsx       # /ai-insights
│   ├── signals/page.tsx           # /signals
│   ├── market-map/page.tsx        # /market-map
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # / Home
│   └── globals.css                # Global styles
├── components/
│   ├── TopNavBar.tsx
│   ├── SideNav.tsx
│   ├── MainLayout.tsx
│   ├── GlassCard.tsx
│   └── AISignalCard.tsx
└── tailwind.config.ts             # Design tokens
```

---

## 🛣️ Routes

| Path | Component | Purpose |
|------|-----------|---------|
| `/` | Home | Landing page |
| `/dashboard` | Dashboard | Market data & trading |
| `/portfolio` | Portfolio | Holdings & P&L |
| `/ai-insights` | AI Insights | AI signals & analysis |
| `/signals` | Signals | Signal history |
| `/market-map` | Market Map | Sectors & correlations |

---

## 🎨 Color Tokens

### Primary Colors
```tsx
className="text-primary"              // #72ff70 (Neon Green)
className="text-primary-fixed"        // #72ff70
className="bg-primary-container"      // #00ff41
```

### Background
```tsx
className="bg-background"             // #0b1326 (Deep Navy)
className="bg-surface"                // #0b1326
className="bg-surface-container"      // #171f33
```

### Text
```tsx
className="text-on-surface"           // #dae2fd (Light Blue)
className="text-on-surface-variant"   // #b9ccb2
```

### Status
```tsx
className="text-secondary"            // #ffb4ab (Red)
className="text-error"                // #ffb4ab
className="text-tertiary"             // #f9f8ff (Purple)
```

---

## 📏 Spacing Scale

```tsx
className="p-xs"    // 4px
className="p-sm"    // 12px
className="p-base"  // 8px
className="p-md"    // 24px
className="p-lg"    // 40px
className="p-xl"    // 64px
```

---

## 📝 Typography

```tsx
// Headline
className="font-headline-lg text-headline-lg"    // 48px
className="font-headline-md text-headline-md"    // 32px
className="font-headline-sm text-headline-sm"    // 24px

// Body
className="font-body-lg text-body-lg"            // 18px
className="font-body-md text-body-md"            // 16px

// Label
className="font-label-md text-label-md"          // 14px
className="font-label-sm text-label-sm"          // 12px

// Data (monospace)
className="font-data-mono"                        // 14px
```

---

## 🎭 Components

### MainLayout Wrapper
```tsx
import MainLayout from '@/components/MainLayout';

export default function Page() {
  return (
    <MainLayout>
      {/* Your content */}
    </MainLayout>
  );
}
```

### GlassCard
```tsx
import GlassCard from '@/components/GlassCard';

<GlassCard 
  label="S&P 500" 
  value="5,248.40" 
  change="1.24%" 
  changeColor="positive"
>
  {/* Optional chart */}
</GlassCard>
```

### AISignalCard
```tsx
import AISignalCard from '@/components/AISignalCard';

<AISignalCard
  symbol="NVDA"
  signal="BUY"
  confidence={89}
  description="Strong bullish..."
/>
```

---

## 🎨 Custom Styles

### Glass Effect
```tsx
className="glass"        // Frosted glass
className="glass-card"   // Glass card variant
```

### Effects
```tsx
className="neon-glow-green"           // Green shadow
className="trading-chart-bg"          // Grid background
```

### Common Patterns
```tsx
// Buttons
className="px-md py-sm rounded-lg bg-primary text-on-primary hover:opacity-90 transition-opacity"

// Cards
className="glass rounded-xl p-md border border-outline-variant/30"

// Text
className="font-headline-lg text-on-surface"
```

---

## 🔧 Common Tasks

### Add New Page
1. Create `app/new-page/page.tsx`
2. Add route link in navigation
3. Use MainLayout wrapper

### Add New Component
1. Create `components/NewComponent.tsx`
2. Add TypeScript props interface
3. Export component
4. Import in pages

### Update Colors
Edit `tailwind.config.ts` theme.extend.colors

### Change Fonts
Edit `tailwind.config.ts` theme.extend.fontFamily

### Responsive Design
```tsx
// Mobile first
className="w-full md:w-1/2 lg:w-1/3"
className="hidden lg:flex"
className="flex flex-col md:flex-row"
```

---

## 🚀 Deploy

### Vercel (Easiest)
```bash
# Push to GitHub
git push origin main

# Go to vercel.com → Import project
# Done! Auto-deploys on push
```

### Netlify
```bash
npm run build
# Connect GitHub to netlify.com
# Done!
```

### Docker
```bash
docker build -t alphaai .
docker run -p 3000:3000 alphaai
```

---

## 🐛 Troubleshooting

### Build Fails
```bash
rm -rf .next node_modules
npm install
npm run build
```

### Dev Server Won't Start
```bash
# Kill existing process on port 3000
# Or use different port:
npm run dev -- -p 3001
```

### CSS Not Loading
```bash
# Rebuild Tailwind
rm -rf .next
npm run dev
```

### TypeScript Errors
```bash
# Check types
npx tsc --noEmit
```

---

## 📚 Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [React Docs](https://react.dev)
- [TypeScript Docs](https://www.typescriptlang.org/docs)

---

## 🔑 Key Features

✅ Next.js 15 App Router  
✅ TypeScript type safety  
✅ Tailwind CSS + custom theme  
✅ 5 reusable components  
✅ 6 page routes  
✅ Responsive design  
✅ Static generation  
✅ Optimized images  
✅ Production ready  

---

**Version**: 1.0.0  
**Last Updated**: May 14, 2026
