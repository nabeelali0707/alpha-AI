# AlphaAI Terminal - Next.js 15 Conversion

A modern, AI-powered stock market analyzer dashboard built with **Next.js 15**, **TypeScript**, **Tailwind CSS**, and the **App Router**. This conversion transforms the original React HTML application into a production-ready Next.js application with improved performance, maintainability, and scalability.

## 🎯 Features

- ✅ **Modern Next.js 15** with App Router
- ✅ **TypeScript** for type safety
- ✅ **Tailwind CSS** with custom design system
- ✅ **Responsive Design** for mobile and desktop
- ✅ **Reusable Component Library**
- ✅ **Real-time Market Data Dashboard**
- ✅ **AI-Powered Trading Signals**
- ✅ **Portfolio Management**
- ✅ **Market Intelligence Terminal**
- ✅ **Production Optimized**

## 📁 Project Structure

```
alphaai-next/
├── app/
│   ├── dashboard/          # Dashboard page
│   ├── portfolio/          # Portfolio management page
│   ├── ai-insights/        # AI insights terminal page
│   ├── signals/            # Trading signals page
│   ├── market-map/         # Market overview page
│   ├── layout.tsx          # Root layout with metadata
│   ├── page.tsx            # Landing/home page
│   └── globals.css         # Global styles
├── components/
│   ├── TopNavBar.tsx       # Header navigation
│   ├── SideNav.tsx         # Sidebar navigation
│   ├── MainLayout.tsx      # Main page layout wrapper
│   ├── GlassCard.tsx       # Market card component
│   └── AISignalCard.tsx    # AI signal card component
├── public/                 # Static assets
├── tailwind.config.ts      # Tailwind configuration with design tokens
├── tsconfig.json           # TypeScript configuration
├── package.json            # Dependencies and scripts
└── next.config.ts          # Next.js configuration
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
cd alphaai-next
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm run start
```

## 📋 Available Routes

| Route | Page | Description |
|-------|------|-------------|
| `/` | Home/Landing | Marketing & feature showcase |
| `/dashboard` | Dashboard | Real-time market data & trading charts |
| `/portfolio` | Portfolio | Holdings, performance, risk analysis |
| `/ai-insights` | AI Insights | AI-generated trading signals & analysis |
| `/signals` | Signals | Detailed signal history & metrics |
| `/market-map` | Market Map | Sector overview & correlations |

## 🎨 Design System

The application uses a **Cyber-Terminal Aesthetic** with custom Tailwind CSS configuration including 70+ custom colors, responsive spacing, custom fonts, and effects.

## 🧩 Reusable Components

1. **TopNavBar.tsx** - Header navigation with search
2. **SideNav.tsx** - Sidebar with active route highlighting
3. **MainLayout.tsx** - Consistent layout wrapper
4. **GlassCard.tsx** - Market overview card
5. **AISignalCard.tsx** - AI signal display

## ✨ Key Improvements

- ✅ Full TypeScript type safety
- ✅ File-based App Router
- ✅ Optimized performance (SSG)
- ✅ Responsive mobile design
- ✅ Modular component architecture
- ✅ Production-ready build
- ✅ SEO optimized

## 📝 License

Proprietary - All rights reserved.

**Version**: 1.0.0  
**Last Updated**: May 14, 2026  
**Next.js**: 16.2.6  
**React**: 19.x


This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
