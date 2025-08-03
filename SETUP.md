# FinMate Setup & Deployment Guide

This guide will walk you through setting up the complete FinMate personal finance application from scratch.

## 🚀 Quick Start (5 minutes)

### Prerequisites
- Node.js 18+ installed
- Git installed
- Supabase account (free tier available)

### 1. Clone and Install
```bash
git clone <your-repo-url>
cd finmate
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Database Setup
- Go to your Supabase dashboard
- Navigate to SQL Editor
- Copy and run the entire `database/schema.sql` file

### 4. Start Development
```bash
npm run dev
```

Visit `http://localhost:3000` and start using FinMate!

## 📋 Detailed Setup Instructions

### Step 1: Create Supabase Project

1. Go to [Supabase](https://app.supabase.com/)
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - Name: `finmate` or your preferred name
   - Database Password: Generate a strong password
   - Region: Choose closest to your users
5. Wait for project creation (2-3 minutes)

### Step 2: Get Supabase Credentials

In your Supabase dashboard:
1. Go to Settings > API
2. Copy these values:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - Anon public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Service role key → `SUPABASE_SERVICE_ROLE_KEY`

### Step 3: Configure Authentication

1. In Supabase dashboard, go to Authentication > Settings
2. Under Site URL, add:
   - `http://localhost:3000` (for development)
   - `https://your-domain.com` (for production)
3. Under Redirect URLs, add:
   - `http://localhost:3000/auth/callback`
   - `https://your-domain.com/auth/callback`

#### Setup OAuth Providers (Optional)

**Google OAuth:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `https://your-project.supabase.co/auth/v1/callback`
6. In Supabase dashboard, go to Authentication > Settings > Auth Providers
7. Enable Google and add your Client ID and Secret

**GitHub OAuth:**
1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create a new OAuth App
3. Set Authorization callback URL:
   - `https://your-project.supabase.co/auth/v1/callback`
4. In Supabase dashboard, enable GitHub provider
5. Add your Client ID and Secret

### Step 4: Set Up Database Schema

1. In Supabase dashboard, go to SQL Editor
2. Copy the entire contents of `database/schema.sql`
3. Paste and run the SQL
4. Verify tables are created in Database > Tables

The schema includes:
- ✅ User profiles and settings
- ✅ Transaction management with categories
- ✅ Budget tracking with alerts
- ✅ Investment portfolio management
- ✅ Loan and EMI tracking
- ✅ Lending/borrowing records
- ✅ Account management
- ✅ Notifications system
- ✅ AI insights storage
- ✅ Row Level Security policies
- ✅ Automatic triggers and functions

### Step 5: Configure Environment Variables

Create `.env.local` file with all required variables:

```env
# Required - Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Optional - AI Features
OPENAI_API_KEY=sk-your-openai-key
GOOGLE_AI_API_KEY=your-google-ai-key
ADMIN_AI_API_KEY=your-shared-ai-key

# Optional - Analytics
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX

# Optional - Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 6: Install Dependencies

```bash
# Install dependencies
npm install

# Verify installation
npm run type-check
npm run lint
```

### Step 7: Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## 🚀 Production Deployment

### Option 1: Deploy to Vercel (Recommended)

1. **Connect to Vercel:**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy
   vercel
   ```

2. **Set Environment Variables:**
   - Go to Vercel dashboard
   - Navigate to your project settings
   - Add all environment variables from `.env.local`
   - Update `NEXT_PUBLIC_APP_URL` to your production domain

3. **Update Supabase Settings:**
   - Add your Vercel domain to Supabase auth settings
   - Update Site URL and Redirect URLs

### Option 2: Deploy to Netlify

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Deploy to Netlify:**
   - Connect your GitHub repository
   - Set build command: `npm run build`
   - Set publish directory: `.next`
   - Add environment variables

### Option 3: Self-hosting with Docker

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t finmate .
docker run -p 3000:3000 finmate
```

## 🔧 Configuration Options

### PWA Configuration

The app is pre-configured as a PWA with:
- ✅ Service worker for offline functionality
- ✅ App manifest for installation
- ✅ Background sync for transactions
- ✅ Push notifications (requires setup)

### Theme Configuration

Default themes available:
- ✅ Light mode
- ✅ Dark mode
- ✅ System preference detection

### Currency Support

Supported currencies:
- USD, EUR, GBP, INR, BDT, JPY, CAD, AUD

### AI Features Configuration

AI features require API keys:
1. **OpenAI (GPT):** For advanced financial insights
2. **Google AI (Gemini):** Alternative AI provider
3. **Admin Key:** Shared key for all users (optional)

## 🛠️ Development Workflow

### File Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Main application
│   ├── globals.css        # Global styles
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # Base UI components
│   ├── layout/           # Layout components
│   └── providers/        # Context providers
├── hooks/                # Custom React hooks
├── lib/                  # Utility libraries
└── types/               # TypeScript definitions
```

### Key Components

1. **Authentication (`src/components/providers/AuthProvider.tsx`)**
   - Handles user authentication
   - Manages user sessions
   - Provides auth context

2. **Database Client (`src/lib/supabase/client.ts`)**
   - Supabase client configuration
   - Type definitions
   - Helper functions

3. **UI Components (`src/components/ui/`)**
   - Reusable UI components
   - Built with Radix UI and Tailwind
   - Fully accessible and themeable

4. **Custom Hooks (`src/hooks/`)**
   - Business logic abstraction
   - Data fetching with React Query
   - Real-time subscriptions

### Adding New Features

1. **Create Database Tables:**
   ```sql
   -- Add to database/schema.sql
   CREATE TABLE your_table (
     id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     -- your columns
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

2. **Add TypeScript Types:**
   ```typescript
   // Add to src/lib/supabase/client.ts
   export interface YourType {
     id: string;
     user_id: string;
     // your properties
     created_at: string;
   }
   ```

3. **Create Custom Hook:**
   ```typescript
   // src/hooks/useYourFeature.ts
   export function useYourFeature() {
     // Implementation with React Query
   }
   ```

4. **Build UI Components:**
   ```typescript
   // src/app/dashboard/your-feature/page.tsx
   export default function YourFeaturePage() {
     // Your page implementation
   }
   ```

## 🔍 Troubleshooting

### Common Issues

**1. Supabase Connection Issues**
```bash
# Check environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# Verify Supabase project status
curl -I $NEXT_PUBLIC_SUPABASE_URL/rest/v1/
```

**2. Authentication Problems**
- Verify redirect URLs in Supabase settings
- Check OAuth provider configuration
- Ensure RLS policies are set up correctly

**3. Build Errors**
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Type check
npm run type-check
```

**4. Database Issues**
```sql
-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies WHERE schemaname = 'public';

-- Verify user profile creation
SELECT * FROM profiles WHERE user_id = 'your-user-id';
```

### Performance Optimization

1. **Enable database indexing:**
   ```sql
   -- Already included in schema.sql
   CREATE INDEX idx_transactions_user_date ON transactions(user_id, date);
   ```

2. **Optimize images:**
   - Use Next.js Image component
   - Implement proper caching headers

3. **Bundle optimization:**
   - Code splitting is automatic with App Router
   - Use dynamic imports for heavy components

### Security Best Practices

1. **Environment Variables:**
   - Never commit `.env.local` to version control
   - Use different keys for development/production
   - Rotate keys regularly

2. **Database Security:**
   - RLS policies are enforced by default
   - All queries are filtered by user_id
   - Service role key should be server-side only

3. **Authentication:**
   - Implement proper session management
   - Use secure OAuth providers
   - Enable 2FA when available

## 📈 Monitoring & Analytics

### Performance Monitoring
- Built-in Web Vitals tracking
- Lighthouse-optimized (95+ score)
- Real-time performance metrics

### Error Tracking
- Error boundaries for graceful failures
- Detailed error logging in development
- Production error reporting (add Sentry)

### User Analytics
- Google Analytics integration
- Custom event tracking
- User behavior insights

## 🔄 Updates & Maintenance

### Updating Dependencies
```bash
# Check for updates
npm outdated

# Update packages
npm update

# Update major versions carefully
npm install package@latest
```

### Database Migrations
```sql
-- Create migration file: migrations/001_add_feature.sql
-- Run migrations through Supabase dashboard
-- Always backup before major changes
```

### Backup Strategy
1. **Database:** Supabase automatic backups
2. **Code:** Git version control
3. **Environment:** Document all configurations

## 🆘 Support & Resources

### Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Query](https://tanstack.com/query/latest)

### Community
- [GitHub Issues](https://github.com/your-repo/issues)
- [Discord Community](https://discord.gg/your-server)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/finmate)

### Professional Support
- Email: support@finmate.app
- Documentation: docs.finmate.app
- Enterprise: enterprise@finmate.app

---

**🎉 Congratulations!** You now have a fully functional personal finance application with enterprise-grade features, security, and scalability. Start managing your finances like a pro!

For questions or support, don't hesitate to reach out to our community or support team.