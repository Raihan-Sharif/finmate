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

### Security
- Row Level Security (RLS) policies on all tables
- User data isolation by `user_id`
- JWT-based authentication with Supabase Auth

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

---

**This file serves as the primary context for Claude Code AI assistant when working on the FinMate project. Always refer to this document for project understanding, coding standards, and implementation patterns.**