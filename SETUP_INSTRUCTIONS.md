# FinMate Setup Instructions

## Authentication & Database Setup

### 1. Apply Database Schema

First, run the main schema in your Supabase SQL editor:

```sql
-- Copy and paste the entire content from database/schema.sql
-- This creates all tables, policies, triggers, and the initial admin user setup
```

### 2. Apply Role-Based Authentication Migration

After the main schema is applied, run the role migration:

```sql
-- Copy and paste the entire content from database/migrations/add_roles.sql
-- This adds role-based authentication with admin/user roles
```

### 3. Environment Variables

Make sure your `.env.local` file has the correct Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Authentication Flow

### Fixed Issues

1. **Profile Fetching**: Fixed the profile lookup to use `user_id` instead of `id` as the foreign key
2. **User Registration**: The `handle_new_user()` trigger automatically creates profiles when users sign up
3. **First User Admin**: The first user to register automatically becomes an admin with full permissions
4. **Role-Based Access**: Implemented proper role-based authentication with granular permissions

### Admin System

#### Admin Roles & Permissions

- **Admin Role**: Users with `role = 'admin'`
- **Granular Permissions**:
  - `can_manage_users`: Promote/demote users, view user details
  - `can_manage_system`: System configuration access
  - `can_view_analytics`: View application analytics and statistics

#### Admin Features

1. **Admin Dashboard** (`/admin`):
   - System statistics
   - User management
   - Admin logs
   - Analytics (coming soon)

2. **User Management**:
   - View all users
   - Promote users to admin
   - Demote admins to regular users
   - Search and filter users

3. **Audit Logging**:
   - All admin actions are logged
   - IP address and user agent tracking
   - Detailed action history

#### Admin Functions

The system includes several database functions for admin operations:

- `promote_to_admin(user_id, permissions)`: Promote user to admin
- `demote_from_admin(user_id)`: Demote admin to regular user
- `is_admin(user_id)`: Check if user is admin
- `has_admin_permission(user_id, permission)`: Check specific permissions

## Testing the Setup

### 1. Test User Registration

1. Go to `/auth/signup`
2. Register the first user - they will automatically become admin
3. Check the profile in the database to verify the role is set to 'admin'

### 2. Test Admin Access

1. Sign in as the first user
2. You should see:
   - "Admin" badge in the user dropdown
   - "Admin Panel" link in the sidebar
   - "Admin Panel" option in the user dropdown
3. Navigate to `/admin` to access the admin dashboard

### 3. Test User Management

1. Register a second user (they will be a regular user)
2. As admin, go to `/admin`
3. Try promoting the second user to admin
4. Check the admin logs to see the action was recorded

## Navigation Updates

The main navigation now includes:

1. **Sidebar**: Admin Panel link (visible only to admins)
2. **User Dropdown**: 
   - Admin badge display
   - Admin Panel quick access
3. **Role Indicators**: Visual indicators throughout the UI

## Security Features

1. **Row Level Security (RLS)**: All tables have proper RLS policies
2. **Admin-Only Access**: Admin functions are protected at the database level
3. **Audit Trail**: All admin actions are logged with timestamps and details
4. **Permission Granularity**: Admins can have different levels of access

## API Services

### AdminService

Located at `src/lib/services/admin.ts`, provides:

- User management functions
- System statistics
- Admin logging
- User activity tracking

### Usage Example

```typescript
import AdminService from '@/lib/services/admin';

// Get all users
const users = await AdminService.getAllUsers();

// Promote user to admin
await AdminService.promoteToAdmin(userId, {
  can_manage_users: true,
  can_manage_system: false,
  can_view_analytics: true
});

// Get system stats
const stats = await AdminService.getSystemStats();
```

## Database Schema Summary

### New Tables

1. **profiles** (enhanced with roles):
   - `role`: 'admin' | 'user'
   - `can_manage_users`: boolean
   - `can_manage_system`: boolean
   - `can_view_analytics`: boolean

2. **admin_logs**:
   - Action logging and audit trail
   - IP address and user agent tracking
   - JSON metadata storage

### Enhanced Security

- Admin-only policies for user management
- Self-protection (admins can't demote themselves)
- Comprehensive logging system

## Development Notes

### Component Structure

```
src/
├── components/
│   ├── admin/
│   │   └── AdminDashboard.tsx    # Main admin interface
│   └── layout/
│       └── MainLayout.tsx        # Updated with admin navigation
├── lib/
│   └── services/
│       └── admin.ts              # Admin service functions
├── hooks/
│   └── useAuth.tsx               # Enhanced with role checking
└── app/
    └── admin/
        └── page.tsx              # Admin route
```

### Type Definitions

All types are properly defined in `src/types/` with role-based permissions and admin log structures.

## Troubleshooting

### Common Issues

1. **Profile not found**: Make sure the database trigger is working properly
2. **Admin access denied**: Verify the user has the correct role in the database
3. **RLS errors**: Check that policies are properly applied

### Verification Steps

1. Check `auth.users` table for user creation
2. Check `profiles` table for profile creation and role assignment
3. Check `admin_logs` table for action logging
4. Verify RLS policies are enabled and working

## Next Steps

1. **Test the complete authentication flow**
2. **Implement remaining dashboard features**
3. **Add more admin management tools**
4. **Enhance UI/UX with better design**
5. **Add comprehensive error handling**

The system is now ready for testing with proper role-based authentication, admin management, and audit logging!