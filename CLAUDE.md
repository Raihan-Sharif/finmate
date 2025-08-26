# CLAUDE.md - FinMate Project Context

## Project Overview
**FinMate** is a comprehensive personal finance management application built with modern web technologies. This is a professional-grade financial platform designed for expense tracking, budget management, investment monitoring, and AI-powered financial insights.

### Key Capabilities
- **Core Finance**: Transaction tracking, budgeting, investment portfolio, EMI/loan management, borrow or give loan to personal management,and bill reminders.
- **AI Features**: Smart categorization, financial insights, spending analysis, budget recommendations, investment suggestions,suggestions for savings and investments
- **Modern Architecture**: Next.js 15 with App Router, TypeScript, Supabase backend, PWA support
- **Security**: Row-level security, JWT authentication, end-to-end encryption

## Technology Stack

### Frontend
- **Next.js 15**: React framework with App Router, SSR/SSG
- **React 18**: Latest React features with concurrent rendering
- **TypeScript 5**: Full type safety throughout the codebase
- **Tailwind CSS**: Utility-first styling with custom design system
- **ShadCN UI**: Modern, accessible component library
- **Framer Motion**: Smooth animations and transitions
- **React Hook Form**: Form management with Zod validation
- **next-intl**: Internationalization (i18n) with Bengali and English support

### Backend & Database
- **Supabase**: Backend-as-a-Service with PostgreSQL
- **PostgreSQL**: Robust relational database with advanced features
- **Row Level Security**: Fine-grained access control
- **Real-time Subscriptions**: Live data updates

### Development Tools
- **ESLint**: Code linting with Next.js config
- **Prettier**: Code formatting with Tailwind plugin
- **TypeScript Config**: Strict mode with path aliases
- **PWA**: Progressive Web App with service worker

## Project Structure

```
finmate/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── auth/              # Authentication (signin, signup, callback)
│   │   ├── dashboard/         # Main app (overview, transactions, budget)
│   │   ├── admin/             # Admin panel
│   │   ├── emi/              # EMI calculator
│   │   └── layout.tsx         # Root layout with providers
│   ├── components/            # Reusable React components
│   │   ├── ui/               # Base UI components (buttons, cards, inputs)
│   │   ├── dashboard/        # Dashboard-specific components
│   │   ├── auth/             # Authentication components
│   │   ├── providers/        # Context providers (Theme, Query, Auth)
│   │   └── layout/           # Layout components
│   ├── hooks/                # Custom React hooks
│   │   ├── useAuth.tsx       # Authentication state management
│   │   ├── useTransactions.ts # Transaction data management
│   │   └── useDashboard.ts   # Dashboard data aggregation
│   ├── lib/                  # Utility libraries
│   │   ├── supabase/        # Database client configuration
│   │   ├── services/        # API service functions
│   │   └── utils.ts         # Helper functions (cn, formatters)
│   └── types/               # TypeScript type definitions
│       ├── database_professional.ts # Generated Supabase types
│       └── index.ts         # Exported types and enums
├── database/                # Database schema and migrations
├── public/                  # Static assets (PWA icons, manifest)
└── config files            # Next.js, TypeScript, Tailwind configs
```

## Database Schema
The application uses a comprehensive PostgreSQL schema with these core tables:

### Core Tables
- **profiles**: User profiles with settings and preferences
- **categories**: Transaction categories with icons and colors
- **accounts**: Bank accounts, credit cards, wallets
- **transactions**: Income/expense records with full details
- **budgets**: Monthly/yearly budget tracking with alerts

### Advanced Features
- **roles & permissions**: Role-based access control system
- **user_sessions**: Session management and tracking
- **admin_audit_logs**: Comprehensive audit trail
- **loans & emi_payments**: Complete loan and EMI management system
- **lending**: Personal lending/borrowing management
- **cron_job_logs**: Auto-transaction system monitoring and logs

### Auto-Transaction System (pg_cron)
- **Automated EMI Processing**: Daily automated loan payment creation using PostgreSQL pg_cron extension
- **Budget Auto-Update**: EMI payments automatically update relevant budget categories
- **Payment Reminders**: User-configurable reminder notifications sent before due dates
- **Comprehensive Logging**: All automated processes logged with detailed monitoring
- **Admin Monitoring**: Real-time cron job status monitoring in admin dashboard
- **Manual Triggers**: Admin ability to manually trigger payment processing
- **Error Handling**: Robust error handling with detailed error logging and reporting

### Security
- Row Level Security (RLS) policies on all tables
- User data isolation by `user_id`
- JWT-based authentication with Supabase Auth
- `SECURITY DEFINER` functions for controlled database access

## Development Guidelines

### Code Standards
- **TypeScript First**: All new code must use TypeScript
- **Component Patterns**: Follow established ShadCN UI patterns. and try to use clean and readable code. and shareable component were possible.
- **Hooks Pattern**: Use custom hooks for data fetching and state management
- **Service Layer**: Business logic in `src/lib/services/`
- **Type Safety**: Leverage strict TypeScript configuration

### File Conventions
- **Components**: PascalCase (e.g., `TransactionCard.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useTransactions.ts`)
- **Services**: camelCase (e.g., `transactions.ts`)
- **Types**: PascalCase (e.g., `Transaction`, `DashboardStats`)

### Import Aliases
```typescript
@/*            → ./src/*
@/components/* → ./src/components/*
@/lib/*        → ./src/lib/*
@/hooks/*      → ./src/hooks/*
@/types/*      → ./src/types/*
@/app/*        → ./src/app/*
```

## Key Features & Implementation

### Authentication
- Supabase Auth with Google and GitHub OAuth
- Protected routes with middleware.ts
- User profiles with role-based permissions
- Session management and audit logging

### Transaction Management
- CRUD operations with optimistic updates
- Real-time sync across devices
- Smart categorization with AI integration
- Multi-currency support (USD, EUR, GBP, INR, BDT, JPY, CAD, AUD) deafualt BDT.
- CSV import/export functionality and also need pdf export of report.

### Budget System
- Monthly/yearly budget creation (reccuring budget will be helpful specially monthly budget)
- Category-wise budget allocation
- Real-time progress tracking
- Overspending alerts and notifications
- AI-powered budget recommendations
- **Auto Budget Integration**: EMI and loan payments automatically update budget spending

### EMI & Loan Management
- **Auto-Transaction System**: Automated EMI payment processing with pg_cron scheduler
- **Budget Integration**: Auto-generated transactions update relevant budget categories
- **Payment Reminders**: User-configurable reminder notifications before due dates
- **Loan Tracking**: Complete EMI payment history and outstanding balance management
- **Multiple Loan Types**: Personal, home, car, education, business, purchase EMI, credit card loans

### Dashboard & Analytics
- Interactive charts with Recharts
- Real-time financial metrics
- Category breakdown analysis
- Monthly trends and comparisons
- AI-generated insights

### PWA Features
- Service worker for offline functionality
- Install prompts for native-like experience
- Push notifications for budget alerts
- Background sync for offline transactions

## Environment Configuration

### Required Environment Variables
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional AI Features
OPENAI_API_KEY=your-openai-key
GOOGLE_AI_API_KEY=your-google-ai-key
ADMIN_AI_API_KEY=shared-ai-key-for-all-users
```

### Development Commands
```bash
# Development
npm run dev              # Start development server
npm run build           # Production build
npm run start           # Production server

# Code Quality
npm run lint            # ESLint checking
npm run type-check      # TypeScript checking
npm run preview         # Build and start for testing

# Utilities  
npm run clean           # Clean build artifacts
```

## Security Considerations

### Data Protection
- All sensitive data is encrypted at rest
- JWT tokens for secure authentication
- HTTPS-only communication
- CORS protection enabled
- Input validation with Zod schemas

### Access Control
- Row Level Security on all database tables
- Role-based permissions system
- User data isolation
- Admin audit logging
- Session management with automatic cleanup

## Performance Optimizations

### Frontend
- Code splitting with Next.js dynamic imports
- Image optimization with Next.js Image component
- Bundle analysis and optimization
- Aggressive caching strategies
- PWA caching with service worker

### Database
- Proper indexing on frequently queried columns
- Query optimization with selective data fetching
- Real-time subscriptions only where needed
- Connection pooling through Supabase

## Testing & Quality Assurance

### Code Quality Tools
- ESLint with Next.js and TypeScript configs
- Prettier with Tailwind CSS plugin
- TypeScript strict mode enabled
- Husky pre-commit hooks (if configured)

### Performance Monitoring
- Core Web Vitals tracking
- Lighthouse performance auditing
- Bundle size monitoring
- Error tracking and reporting

## Deployment & Production

### Recommended Platform
- **Vercel**: Seamless Next.js deployment with automatic previews
- **Database**: Supabase hosted PostgreSQL
- **CDN**: Vercel Edge Network for global performance
- **Monitoring**: Built-in Vercel analytics

### Production Checklist
- Environment variables configured
- Database schema deployed
- RLS policies enabled
- SSL/HTTPS enforced
- Error monitoring setup
- Performance monitoring active

## AI Integration

### Current AI Features
- Transaction categorization
- Spending pattern analysis
- Budget recommendations
- Financial insights generation

### AI Service Integration
- OpenAI GPT models for insights
- Google AI for additional processing
- Fallback to admin-provided shared keys
- Rate limiting and cost management

## Common Development Tasks

### Adding New Features
1. Define types in `src/types/`
2. Create database schema changes
3. Implement service functions in `src/lib/services/`
4. Create custom hooks in `src/hooks/`
5. Build UI components in `src/components/`
6. Create pages in `src/app/`
7. Add proper TypeScript types throughout
8. Make professionally and follow the world's best practice and scalabel adn clean code in simple way.

### Database Changes
**IMPORTANT**: Always maintain database schema consistency and create migration files for production.

#### Schema Management Process:
1. **Update Main Schema**: Always update `database/finmate_final_schema.sql` - this is the single source of truth
2. **Create Migration Files**: For any changes, create separate migration files in `database/` folder with naming pattern:
   - `migration_[feature_name]_[date].sql` (e.g., `migration_budget_templates_and_paid_users.sql`)
3. **Migration File Requirements**:
   - Must be safe to run multiple times (use IF NOT EXISTS, DO $$ blocks)
   - Include detailed comments and descriptions
   - Handle existing data carefully
   - Include rollback instructions if needed
4. **Deployment Process**:
   - For new deployments: Use main schema file
   - For existing databases: Use migration files only
5. **After Schema Changes**:
   - Regenerate TypeScript types with Supabase CLI
   - Update service functions to match schema changes
   - Update UI components to reflect new data structure
   - Test with proper data isolation and RLS policies
   - Update documentation and comments

#### Schema Change Checklist:
- [ ] Updated `database/finmate_final_schema.sql`
- [ ] Created migration file for existing databases
- [ ] Tested migration script for safety
- [ ] Updated TypeScript types
- [ ] Updated service functions
- [ ] Updated UI components
- [ ] Tested RLS policies work correctly
- [ ] Updated documentation

**Never exclude current features when making database changes.**

### Database Query Guidelines for Joined Data

**CRITICAL RULE**: Always use custom database functions for fetching data that requires joins, especially when Row Level Security (RLS) policies are involved.

#### Why Use Custom Functions:
1. **RLS Bypass**: Custom functions with `SECURITY DEFINER` can access restricted tables (like `roles`) that have blocking RLS policies
2. **Performance**: Single function call vs multiple round trips for joins
3. **Consistency**: Centralized logic for complex queries
4. **Security**: Controlled access to sensitive data through well-defined interfaces

#### Available Custom Functions:
1. **`get_user_profile(p_user_id UUID)`** - Get user profile with role information
   - Returns flattened data: `role_name`, `role_display_name`
   - Bypasses RLS policies on roles table
   - Use instead of: `profiles.select('*, role:roles(*)')`

2. **`get_user_permissions(p_user_id UUID)`** - Get user's aggregated permissions
   - Returns role-based + user-specific permissions
   - Use for permission checks and authorization

3. **`get_financial_summary(p_user_id UUID, p_currency VARCHAR(3))`** - Get user's financial overview
   - Aggregated financial data across multiple tables
   - Use for dashboard summaries

#### Implementation Rules:

**❌ NEVER DO THIS:**
```typescript
// Direct join with roles (will fail due to RLS)
const { data } = await supabase
  .from('profiles')
  .select('*, role:roles(*)')
  .eq('user_id', userId);
```

**✅ ALWAYS DO THIS:**
```typescript
// Use custom function
const { data: profileData } = await supabase
  .rpc('get_user_profile', { p_user_id: userId });

// Reconstruct role object from flattened data
const role = profileData[0]?.role_name ? {
  name: profileData[0].role_name,
  display_name: profileData[0].role_display_name,
  // ... other fields
} : null;
```

#### When to Create New Custom Functions:
- When you need to join multiple tables
- When accessing tables with restrictive RLS policies
- When performing complex aggregations
- When the same query pattern is used in multiple places
- When performance optimization is needed

#### Function Creation Guidelines:
- Always use `SECURITY DEFINER` for functions that need to bypass RLS
- Include proper parameter validation
- Return consistent, well-documented data structures
- Add appropriate error handling
- Use meaningful function names: `get_[entity]_[context]`

#### Examples of When to Use Custom Functions:
- User profiles with roles ✅ `get_user_profile()`
- User permissions ✅ `get_user_permissions()`
- Financial summaries ✅ `get_financial_summary()`
- Category hierarchies ✅ `get_categories_with_subcategories()`
- Budget analytics ✅ `get_budget_analysis()`

**Remember**: If you find yourself writing complex SELECT queries with JOINs in TypeScript, create a database function instead!

### Component Development
1. Follow ShadCN UI patterns
2. Use Tailwind CSS for styling
3. Implement proper accessibility
4. Add TypeScript interfaces
5. Handle loading and error states
6. Add proper form validation
7. Aesthetic design and ui/ux experience
8. Fully responsive and modern design.
9. Modular based component design and try to reuse.
10. Make aesthetic and beautiful design with best professional ui/ux.
11. Use smoth animation, gradient color, shadow, 3d effect where best fit.

## Auto-Transaction System Implementation

### Overview
The FinMate application includes a sophisticated auto-transaction system powered by PostgreSQL's pg_cron extension. This system automates EMI payments, integrates with budgets, and provides comprehensive monitoring capabilities.

### System Architecture

#### Core Components
1. **pg_cron Scheduler**: PostgreSQL extension for scheduled jobs
2. **Database Functions**: Secure, server-side processing functions
3. **Logging System**: Comprehensive audit trail and monitoring
4. **Admin Dashboard**: Real-time monitoring and manual controls
5. **Frontend Integration**: React hooks for manual payment processing

#### Key Database Functions
- `create_loan_payment_transaction()` - Processes individual EMI payments
- `update_budget_for_expense()` - Updates budget categories automatically
- `process_daily_auto_payments()` - Main daily processing function
- `create_payment_reminders()` - Generates payment reminder notifications
- `trigger_auto_payments_now()` - Manual trigger for admin users
- `get_cron_job_status()` - Monitors cron job health and status

### Implementation Details

#### Auto EMI Processing Flow
1. **Daily Trigger**: pg_cron runs `process_daily_auto_payments()` at 9:00 AM daily
2. **User Identification**: Finds users with auto-debit loans due today
3. **Payment Creation**: Creates expense transactions for each due loan
4. **Budget Update**: Automatically updates relevant budget categories
5. **Loan Update**: Updates outstanding balance and next due date
6. **EMI Record**: Creates detailed EMI payment history record
7. **Logging**: Comprehensive logging of all operations and errors

#### Budget Integration
- EMI payments automatically update budget `spent_amount`
- Budget `remaining_amount` recalculated in real-time  
- Category-specific budget tracking ensures accurate financial monitoring
- Monthly/yearly budget periods properly handled

#### Payment Reminders
- User-configurable reminder days (e.g., 3 days before due date)
- Automatic notification creation in notifications table
- Reminder content includes loan details and due dates
- Flexible scheduling based on individual loan settings

### pg_cron Setup & Configuration

#### Production Setup Steps
1. **Enable Extension** (requires superuser privileges):
   ```sql
   CREATE EXTENSION IF NOT EXISTS pg_cron;
   ```

2. **Schedule Daily Processing**:
   ```sql
   SELECT cron.schedule(
     'auto-payment-processing',
     '0 9 * * *',  -- Daily at 9:00 AM
     'SELECT process_daily_auto_payments();'
   );
   ```

3. **Optional Health Monitoring**:
   ```sql
   SELECT cron.schedule(
     'auto-payment-health-check',
     '0 */6 * * *',  -- Every 6 hours
     'SELECT check_auto_payment_health();'
   );
   ```

4. **Log Cleanup**:
   ```sql
   SELECT cron.schedule(
     'cleanup-old-logs',
     '0 2 * * 0',  -- Weekly on Sunday at 2:00 AM
     'DELETE FROM cron_job_logs WHERE started_at < NOW() - INTERVAL ''30 days'';'
   );
   ```

### Monitoring & Administration

#### Admin Dashboard Features
- **Real-time Status**: View current cron job status and schedules
- **Execution History**: Last 50 job executions with detailed results
- **Performance Metrics**: Success rates, processing times, error counts
- **Manual Triggers**: Admin ability to manually process payments
- **Error Monitoring**: Detailed error logs and notifications

#### Frontend Integration
- **Manual Processing**: `useAutoTransactions` hook for manual payment processing
- **Status Monitoring**: Real-time job status display in admin panel
- **Error Handling**: Proper error handling with user-friendly messages
- **Performance Tracking**: Payment processing statistics and metrics

#### Database Views for Monitoring
- `recent_cron_jobs`: Last 50 job executions with status and metrics
- `cron_job_stats`: 30-day statistics including success rates and performance

### Security Considerations

#### Function Security
- All functions use `SECURITY DEFINER` for controlled database access
- Proper user_id validation and data isolation
- Input validation and sanitization
- Exception handling with detailed error logging

#### Access Control
- Functions granted to `authenticated` role only
- RLS policies maintain user data isolation
- Admin functions require proper role permissions
- Audit logging for all automated operations

### Error Handling & Recovery

#### Comprehensive Error Management
- Transaction-level error handling with rollback capabilities
- Detailed error logging with context and user information
- Graceful degradation for partial failures
- Retry mechanisms for transient errors
- Administrative alerts for critical failures

#### Monitoring & Alerting
- Real-time error tracking in cron_job_logs table
- Performance metrics and success rate monitoring
- Administrative dashboard for immediate issue visibility
- Automated log cleanup to prevent storage issues

### Development Guidelines

#### Working with Auto-Transactions
1. **Testing**: Always test with manual triggers before relying on scheduled execution
2. **Logging**: Extensive logging for debugging and monitoring
3. **Validation**: Validate loan status and user permissions before processing
4. **Budget Integration**: Ensure all EMI payments update relevant budgets
5. **Error Handling**: Implement proper exception handling with detailed messages

#### Database Function Development
- Use `SECURITY DEFINER` for functions that need elevated privileges
- Implement proper input validation and sanitization
- Include comprehensive error handling with detailed logging
- Test functions thoroughly with edge cases
- Document function parameters and return values

#### Frontend Integration Best Practices
- Use React hooks for consistent data fetching patterns
- Implement proper loading states and error handling
- Provide user feedback for manual operations
- Display real-time status updates for long-running operations
- Handle network errors and retry mechanisms gracefully

## Troubleshooting

### Common Issues
- **Build Errors**: Check TypeScript configuration and imports
- **Database Errors**: Verify RLS policies and user permissions  
- **Authentication Issues**: Check Supabase configuration and environment variables
- **Performance Issues**: Review bundle size and optimize imports

### Debug Commands
```bash
npm run type-check      # Find TypeScript errors
npm run lint           # Find linting issues  
npm run build          # Test production build
```

## Support & Maintenance

### Regular Maintenance
- Keep dependencies updated
- Monitor security advisories
- Review and optimize database queries
- Monitor performance metrics
- Review and update documentation

### Monitoring
- Application performance metrics
- Database performance and usage
- User authentication and session health
- Error rates and crash reporting

## Contributing

### Before Making Changes
1. Read this CLAUDE.md file thoroughly
2. Understand the project structure and patterns
3. Check existing similar implementations
4. Follow established code conventions
5. Test changes thoroughly
6. Update documentation when needed
7. Do not break or exclude existing functionality/feautures.

### Code Review Checklist
- TypeScript types are properly defined
- Security implications considered
- Performance impact assessed
- Error handling implemented
- Tests added where appropriate
- Documentation updated

## Code Quality & Build Verification

### **MANDATORY: Build Check After Implementation**
**CRITICAL RULE**: After completing any code generation, modification, or implementation:

1. **Always run build check**: `npm run build`
2. **Verify no compilation errors**: All TypeScript and build errors must be resolved
3. **Check linting**: `npm run lint` - All ESLint warnings must be resolved
4. **Type checking**: `npm run type-check` - All type errors must be fixed
5. **Test functionality**: Ensure new features work as expected
6. **No broken builds**: Never leave the codebase in a broken state

### Build Commands to Run:
```bash
npm run type-check  # Check TypeScript types
npm run lint       # Check code quality
npm run build      # Full production build
```

### Quality Standards:
- ✅ Build must pass without errors
- ✅ No TypeScript compilation errors
- ✅ No ESLint warnings or errors
- ✅ All new code follows project conventions
- ✅ No broken functionality
- ✅ Performance optimizations maintained

**If build fails or has errors, immediately fix them before considering the task complete.**

## Internationalization (i18n) - CRITICAL IMPLEMENTATION NOTES

### **VERY IMPORTANT: Section-Based Translation System**

**⚠️ MEMORY LIMITATION SOLUTION**: Due to Claude's memory constraints with large translation files, FinMate uses a **section-wise translation system** instead of monolithic translation files.

### **New Translation Architecture:**
```
messages/
├── en.json                    # Original full file (fallback only)
├── bn.json                    # Original full file (fallback only)  
└── sections/                  # 📁 ACTIVE TRANSLATION SYSTEM
    ├── en/
    │   ├── common.json        # Shared UI elements, actions, status
    │   ├── navigation.json    # Menu items, navigation labels  
    │   ├── dashboard.json     # Dashboard translations
    │   ├── transactions.json  # Transaction management
    │   ├── budget.json        # Budget management
    │   ├── investments.json   # Investment portfolio
    │   ├── credit.json        # Credit & lending (loans, EMI, etc.)
    │   ├── calculators.json   # Financial calculators
    │   ├── settings.json      # Application settings
    │   └── [other sections]   # Additional feature sections
    └── bn/
        ├── common.json        # Bengali shared elements
        ├── navigation.json    # Bengali navigation
        ├── dashboard.json     # Bengali dashboard
        ├── transactions.json  # Bengali transactions
        ├── budget.json        # Bengali budget
        ├── investments.json   # Bengali investments
        ├── credit.json        # Bengali credit & lending
        ├── calculators.json   # Bengali calculators
        ├── settings.json      # Bengali settings
        └── [other sections]   # Bengali feature sections
```

### **⚡ CRITICAL RULES FOR TRANSLATION WORK:**

#### 1. **NEVER Edit Original Files**
- ❌ **DO NOT** edit `messages/en.json` or `messages/bn.json`
- ✅ **ALWAYS** edit section files in `messages/sections/[locale]/[section].json`
- Original files serve as fallback only

#### 2. **Section-Wise Development**
- Each feature area has its own translation section
- Credit & lending = `credit.json`
- Investments = `investments.json`
- Budget management = `budget.json`
- Dashboard = `dashboard.json`
- Transactions = `transactions.json`
- And so on...

#### 3. **Translation Implementation Process**
```bash
# 1. Identify the feature section
Feature: Bank Loans → Section: credit.json

# 2. Edit the correct section files
✅ messages/sections/en/credit.json
✅ messages/sections/bn/credit.json

# 3. NEVER edit these (fallback only)
❌ messages/en.json
❌ messages/bn.json

# 4. Test the build
npm run build
```

#### 4. **Available Translation Sections (18 total)**
- **common**: Shared UI elements, actions, status labels
- **navigation**: Menu items, navigation labels  
- **tags**: Tag-related translations
- **home**: Homepage content and hero sections
- **auth**: Authentication (signin/signup) translations
- **dashboard**: Dashboard-specific translations
- **transactions**: Transaction management
- **budget**: Budget management
- **investments**: Investment portfolio management
- **credit**: Loans, EMI, lending (Bank Loans, Purchase EMI, Personal Lending, Analytics)
- **calculators**: Financial calculators
- **settings**: Application settings
- **theme**: Theme and appearance
- **errors**: Error messages
- **actions**: Action buttons and labels
- **forms**: Form-related translations
- **dateTime**: Date and time formatting
- **pwa**: Progressive Web App features

#### 5. **Translation Quality Requirements**
- ✅ **Complete Coverage**: All UI text must have translations
- ✅ **Consistent Keys**: Both English and Bengali files must have identical key structures
- ✅ **No Missing Keys**: Avoid showing property names instead of translations
- ✅ **Valid JSON**: Ensure proper JSON syntax (no trailing commas, proper escaping)
- ✅ **Input Exclusion**: Never translate input field values or dropdown options
- ✅ **Professional Quality**: Use proper Bengali typography and grammar

#### 6. **Testing & Validation**
```bash
# Always run these commands after translation work
npm run build          # Test compilation
npm run type-check     # Check TypeScript types
npm run lint          # Code quality check
```

#### 7. **Section Loading Configuration**
The system automatically loads sections defined in `src/i18n/request.ts`:
```typescript
const sections = [
  'common', 'navigation', 'tags', 'home', 'auth', 
  'dashboard', 'transactions', 'budget', 'investments', 
  'credit', 'calculators', 'settings', 'theme', 
  'errors', 'actions', 'forms', 'dateTime', 'pwa'
];
```

### **Next.js 15 + next-intl Setup**

The FinMate application supports **Bengali (বাংলা)** and **English** localization with section-wise loading.

### **Key Files & Structure:**
```
src/
├── i18n/
│   ├── routing.ts          # Locale configuration
│   ├── navigation.ts       # Internationalized navigation
│   └── request.ts          # Message loading with section merger
├── middleware.ts           # Locale detection middleware
├── messages/
│   ├── sections/           # ACTIVE: Section-wise translations
│   ├── en.json            # FALLBACK: Original full file
│   └── bn.json            # FALLBACK: Original full file
└── app/
    ├── layout.tsx         # Root layout (minimal)
    ├── page.tsx           # Root redirect page
    └── [locale]/          # Localized routes
        ├── layout.tsx     # Main app layout with i18n
        └── page.tsx       # Localized pages
```

### **CRITICAL CONFIGURATION FIXES:**

#### 1. **Next.js 15 Promise Issue - MUST AWAIT `requestLocale`**
```typescript
// src/i18n/request.ts
export default getRequestConfig(async (params) => {
  // CRITICAL: In Next.js 15, requestLocale is a Promise!
  const locale = await params.requestLocale; // Must await this!
  
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});
```

#### 2. **Middleware Configuration**
```typescript
// src/middleware.ts
export default createMiddleware({
  locales: ['en', 'bn'],
  defaultLocale: 'en'
});
```

#### 3. **Layout Structure**
- **Root layout** (`app/layout.tsx`): Minimal, only for redirect
- **Locale layout** (`app/[locale]/layout.tsx`): Main app with NextIntlClientProvider
- **Both layouts required** for proper App Router routing

#### 4. **Font Support for Bengali**
```typescript
// In app/[locale]/layout.tsx
const notoSansBengali = Noto_Sans_Bengali({ 
  subsets: ['bengali', 'latin'],
  variable: '--font-bengali',
  display: 'swap',
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
});
```

```css
/* In globals.css */
[lang="bn"], [lang="bn"] * {
  font-family: var(--font-bengali), "Noto Sans Bengali", "Kalpurush", "SiyamRupali", sans-serif;
  font-display: swap;
}
```

### **Common Issues & Solutions:**

#### ❌ **Problem**: `requestLocale` is undefined
**Solution**: The `requestLocale` parameter is a Promise in Next.js 15 - you MUST await it!

#### ❌ **Problem**: English text shows on Bengali routes
**Solution**: Check that request.ts is properly awaiting the locale Promise and loading correct messages.

#### ❌ **Problem**: TypeScript errors with RequestConfig
**Solution**: Ensure return type includes both `locale` and `messages`:
```typescript
return {
  locale: validatedLocale,
  messages: messagesObject
};
```

#### ❌ **Problem**: 404 errors on locale routes  
**Solution**: Ensure `generateStaticParams()` is present in both layout.tsx and page.tsx in [locale] folder.

### **Testing Localization:**

#### URLs to Test:
- `http://localhost:3000/` → Redirects to `/en`
- `http://localhost:3000/en` → English content
- `http://localhost:3000/bn` → Bengali content (বাংলা)

#### Debug Verification:
1. Check browser console for locale detection logs
2. Verify HTML `lang` attribute matches URL locale
3. Confirm translation hooks return correct language content
4. Test language switcher functionality

### **Translation Usage:**
```typescript
// In components
const t = useTranslations('home');
const tCommon = useTranslations('common');

// Usage
<h1>{t('hero.title')}</h1>
<button>{tCommon('save')}</button>
```

### **Language Switcher Component:**
Use the `LanguageSwitcher` component which properly handles locale routing:
```typescript
<LanguageSwitcher variant="minimal" size="sm" />
```

### **CRITICAL RULES:**
1. **Always await `requestLocale`** in request.ts for Next.js 15
2. **Never skip the root layout** - both layouts are required
3. **Test both locales** after any i18n changes
4. **Check font rendering** for Bengali characters
5. **Verify URL routing** matches locale content

### **Message Files:**
- `messages/en.json`: Complete English translations
- `messages/bn.json`: Complete Bengali translations (বাংলা)
- Both files must have identical key structure
- All UI text must be translatable - no hardcoded strings

---

**This file serves as the primary context for Claude Code AI assistant when working on the FinMate project. Always refer to this document for project understanding, coding standards, and implementation patterns.**