import { supabase } from '@/lib/supabase/client'
import { 
  Account, 
  AccountInsert, 
  AccountUpdate, 
  AccountWithBalance,
  AccountSummary,
  AccountLimits,
  FamilyAccountLimits,
  SubscriptionPlan,
  AccountType,
  CurrencyType,
  FamilyMember
} from '@/types'

// ==============================================
// Account CRUD Operations
// ==============================================

/**
 * Get all accounts for a user with enhanced display properties
 */
export async function getUserAccounts(userId: string): Promise<AccountWithBalance[]> {
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching user accounts:', error)
    throw new Error('Failed to fetch accounts')
  }

  return data?.map(account => ({
    ...account,
    formatted_balance: formatAccountBalance(account.balance, account.currency as CurrencyType),
    account_type_display: getAccountTypeDisplay(account.type as AccountType),
    can_delete: !account.is_default && data.length > 1
  })) || []
}

/**
 * Get account by ID with validation
 */
export async function getAccountById(accountId: string, userId: string): Promise<AccountWithBalance | null> {
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('id', accountId)
    .eq('user_id', userId)
    .eq('is_active', true)
    .single()

  if (error) {
    console.error('Error fetching account:', error)
    return null
  }

  if (!data) return null

  return {
    ...data,
    formatted_balance: formatAccountBalance(data.balance, data.currency as CurrencyType),
    account_type_display: getAccountTypeDisplay(data.type as AccountType),
    can_delete: !data.is_default
  }
}

/**
 * Create a new account with validation
 */
export async function createAccount(accountData: Omit<AccountInsert, 'id' | 'created_at' | 'updated_at'>): Promise<Account> {
  // Validate if user can create more accounts
  const canCreate = await canUserCreateAccount(accountData.user_id!)
  if (!canCreate.canCreate) {
    throw new Error(`Account limit reached. ${canCreate.planType} plan allows maximum ${canCreate.limit} accounts.`)
  }

  // Validate account type for user's plan
  const canCreateType = await canUserCreateAccountType(accountData.user_id!, accountData.type as AccountType)
  if (!canCreateType) {
    throw new Error(`Account type '${accountData.type}' is not available for your current plan.`)
  }

  // Set display order
  const { count } = await supabase
    .from('accounts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', accountData.user_id!)
    .eq('is_active', true)

  const displayOrder = (count || 0) + 1

  const { data, error } = await supabase
    .from('accounts')
    .insert({
      ...accountData,
      display_order: displayOrder,
      icon: accountData.icon || getDefaultAccountIcon(accountData.type as AccountType),
      color: accountData.color || getDefaultAccountColor(accountData.type as AccountType)
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating account:', error)
    throw new Error('Failed to create account')
  }

  return data
}

/**
 * Update an existing account
 */
export async function updateAccount(accountId: string, userId: string, updates: AccountUpdate): Promise<Account> {
  // Prevent updating critical fields
  const { user_id, created_at, ...safeUpdates } = updates

  const { data, error } = await supabase
    .from('accounts')
    .update({
      ...safeUpdates,
      updated_at: new Date().toISOString()
    })
    .eq('id', accountId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error updating account:', error)
    throw new Error('Failed to update account')
  }

  return data
}

/**
 * Delete an account (soft delete)
 */
export async function deleteAccount(accountId: string, userId: string): Promise<boolean> {
  // Check if account can be deleted
  const account = await getAccountById(accountId, userId)
  if (!account) {
    throw new Error('Account not found')
  }

  if (account.is_default) {
    throw new Error('Cannot delete default account')
  }

  // Check if there are any transactions linked to this account
  const { count } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true })
    .eq('account_id', accountId)

  if (count && count > 0) {
    throw new Error('Cannot delete account with existing transactions')
  }

  const { error } = await supabase
    .from('accounts')
    .update({ is_active: false })
    .eq('id', accountId)
    .eq('user_id', userId)

  if (error) {
    console.error('Error deleting account:', error)
    throw new Error('Failed to delete account')
  }

  return true
}

/**
 * Set an account as default
 */
export async function setDefaultAccount(accountId: string, userId: string): Promise<boolean> {
  // First, unset all other default accounts for this user
  await supabase
    .from('accounts')
    .update({ is_default: false })
    .eq('user_id', userId)

  // Then set the new default account
  const { error } = await supabase
    .from('accounts')
    .update({ is_default: true })
    .eq('id', accountId)
    .eq('user_id', userId)

  if (error) {
    console.error('Error setting default account:', error)
    throw new Error('Failed to set default account')
  }

  return true
}

// ==============================================
// Account Validation & Limits
// ==============================================

/**
 * Check if user can create more accounts (with family support)
 */
export async function canUserCreateAccount(userId: string): Promise<AccountLimits> {
  try {
    // Get user profile for subscription info
    const profile = await getUserProfile(userId)
    const currentCount = await getCurrentAccountCount(userId)
    const limit = getAccountLimitForPlan(profile?.subscription_plan || 'free')
    const allowedTypes = await getAllowedAccountTypes(profile?.subscription_plan || 'free')
    
    return {
      current: currentCount,
      limit: limit,
      canCreate: currentCount < limit,
      planType: (profile?.subscription_plan as SubscriptionPlan) || 'free',
      allowedTypes
    }
  } catch (error) {
    console.error('Error checking account limits:', error)
    return { 
      current: 0, 
      limit: 3, 
      canCreate: true, 
      planType: 'free', 
      allowedTypes: ['cash', 'bank'] 
    }
  }
}

/**
 * Check if user can create specific account type
 */
export async function canUserCreateAccountType(userId: string, accountType: AccountType): Promise<boolean> {
  try {
    // Get user profile for subscription info
    const profile = await getUserProfile(userId)
    const allowedTypes = await getAllowedAccountTypes(profile?.subscription_plan || 'free')
    
    return allowedTypes.includes(accountType)
  } catch (error) {
    console.error('Error checking account type:', error)
    // Default to allowing basic account types
    return ['cash', 'bank'].includes(accountType)
  }
}

/**
 * Get user account summary with subscription info
 */
export async function getUserAccountSummary(userId: string): Promise<AccountSummary> {
  try {
    // Get accounts data
    const { data: accounts, error: accountsError } = await supabase
      .from('accounts')
      .select('id, balance, currency, is_default, include_in_total')
      .eq('user_id', userId)
      .eq('is_active', true)

    if (accountsError) {
      console.error('Error fetching accounts:', accountsError)
      throw new Error('Failed to fetch accounts')
    }

    // Get user profile for subscription info
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_plan')
      .eq('user_id', userId)
      .single()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
    }

    // Calculate summary
    const accountCount = accounts?.length || 0
    const totalBalance = accounts?.reduce((sum, account) => {
      return account.include_in_total ? sum + (account.balance || 0) : sum
    }, 0) || 0
    
    const defaultAccount = accounts?.find(acc => acc.is_default)
    const subscriptionPlan = profile?.subscription_plan || 'free'
    const maxAccounts = getAccountLimitForPlan(subscriptionPlan as any)

    return {
      account_count: accountCount,
      total_balance: totalBalance,
      default_account_id: defaultAccount?.id || null,
      default_currency: 'BDT',
      subscription_plan: subscriptionPlan,
      max_accounts: maxAccounts,
      can_create_more: accountCount < maxAccounts
    }
  } catch (error) {
    console.error('Error in getUserAccountSummary:', error)
    // Return fallback data
    return {
      account_count: 0,
      total_balance: 0,
      default_account_id: null,
      default_currency: 'BDT',
      subscription_plan: 'free',
      max_accounts: 3,
      can_create_more: true
    }
  }
}

/**
 * Get enhanced account limits for family plans
 */
export async function getFamilyAccountLimits(userId: string): Promise<FamilyAccountLimits> {
  const basicLimits = await canUserCreateAccount(userId)
  const profile = await getUserProfile(userId)
  
  let familyAccountCount = 0
  let familyMembers: FamilyMember[] = []
  let isFamilyPrimary = false

  if (profile?.subscription_plan === 'max') {
    // For now, use mock data as family functionality requires database setup
    familyAccountCount = 0
    familyMembers = await getFamilyMembers(userId)
    isFamilyPrimary = true // Assume primary for now
  }

  return {
    ...basicLimits,
    familyAccountCount,
    isFamilyPrimary,
    familyMembers
  }
}

// ==============================================
// Default Account Creation
// ==============================================

/**
 * Create default accounts for a new user
 */
export async function createDefaultAccounts(userId: string): Promise<void> {
  try {
    // Create a default cash wallet
    await createAccount({
      user_id: userId,
      name: 'Cash Wallet',
      description: 'Default cash wallet',
      type: 'cash',
      currency: 'BDT',
      balance: 0,
      icon: 'wallet',
      color: '#10B981',
      is_default: true,
      is_active: true
    })
  } catch (error) {
    console.error('Error creating default accounts:', error)
    throw new Error('Failed to create default accounts')
  }
}

// ==============================================
// Family Account Management
// ==============================================

/**
 * Get family members (for Max plan)
 */
export async function getFamilyMembers(userId: string): Promise<FamilyMember[]> {
  try {
    // For now, return empty array as family functionality requires database setup
    // This can be implemented when the family tables are available
    console.log('Family members functionality not yet implemented')
    return []
  } catch (error) {
    console.error('Error fetching family members:', error)
    return []
  }
}

/**
 * Create family group (for Max plan primary users)
 */
export async function createFamilyGroup(userId: string, familyName: string = 'My Family'): Promise<string> {
  try {
    // For now, return a mock group ID as family functionality requires database setup
    console.log('Family group creation not yet implemented')
    return 'mock-family-group-id'
  } catch (error) {
    console.error('Error creating family group:', error)
    throw new Error('Failed to create family group')
  }
}

/**
 * Invite family member (for Max plan primary users)
 */
export async function inviteFamilyMember(userId: string, email: string, role: string = 'member'): Promise<string> {
  try {
    // For now, return a mock invitation code as family functionality requires database setup
    console.log('Family member invitation not yet implemented')
    return 'INVITE-' + Math.random().toString(36).substr(2, 9).toUpperCase()
  } catch (error) {
    console.error('Error inviting family member:', error)
    throw new Error('Failed to invite family member')
  }
}

/**
 * Accept family invitation
 */
export async function acceptFamilyInvitation(userId: string, invitationCode: string): Promise<boolean> {
  try {
    // For now, return true as family functionality requires database setup
    console.log('Family invitation acceptance not yet implemented')
    return true
  } catch (error) {
    console.error('Error accepting family invitation:', error)
    throw new Error('Failed to accept family invitation')
  }
}

// ==============================================
// Utility Functions
// ==============================================

/**
 * Get account limit for a subscription plan
 */
export function getAccountLimitForPlan(plan: SubscriptionPlan): number {
  switch (plan) {
    case 'free': return 3
    case 'pro': return 15
    case 'max': return 50
    default: return 3
  }
}

/**
 * Get allowed account types for a subscription plan
 */
export async function getAllowedAccountTypes(plan: SubscriptionPlan): Promise<AccountType[]> {
  // Define allowed account types based on subscription plan
  switch (plan) {
    case 'free':
      return ['cash', 'bank']
    case 'pro':
      return ['cash', 'bank', 'credit_card', 'savings', 'investment', 'wallet']
    case 'max':
      return ['cash', 'bank', 'credit_card', 'savings', 'investment', 'wallet', 'other']
    default:
      return ['cash', 'bank']
  }
}

/**
 * Get current account count for user
 */
export async function getCurrentAccountCount(userId: string): Promise<number> {
  const { count } = await supabase
    .from('accounts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_active', true)

  return count || 0
}

/**
 * Format account balance with currency symbol
 */
export function formatAccountBalance(balance: number, currency: CurrencyType): string {
  const symbols = {
    USD: '$',
    BDT: '৳',
    INR: '₹',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    CAD: 'C$',
    AUD: 'A$'
  }

  const symbol = symbols[currency] || currency
  return `${symbol}${Math.abs(balance).toLocaleString()}`
}

/**
 * Get display name for account type
 */
export function getAccountTypeDisplay(type: AccountType): string {
  const displayNames = {
    cash: 'Cash Wallet',
    bank: 'Bank Account',
    credit_card: 'Credit Card',
    savings: 'Savings Account',
    investment: 'Investment Account',
    wallet: 'Digital Wallet',
    other: 'Other Account'
  }

  return displayNames[type] || type
}

/**
 * Get default icon for account type
 */
export function getDefaultAccountIcon(type: AccountType): string {
  const icons = {
    cash: 'wallet',
    bank: 'building-2',
    credit_card: 'credit-card',
    savings: 'piggy-bank',
    investment: 'trending-up',
    wallet: 'smartphone',
    other: 'circle-dollar-sign'
  }

  return icons[type] || 'wallet'
}

/**
 * Get default color for account type
 */
export function getDefaultAccountColor(type: AccountType): string {
  const colors = {
    cash: '#10B981', // green
    bank: '#3B82F6', // blue
    credit_card: '#F59E0B', // amber
    savings: '#8B5CF6', // purple
    investment: '#06B6D4', // cyan
    wallet: '#EC4899', // pink
    other: '#6B7280'  // gray
  }

  return colors[type] || '#3B82F6'
}

// ==============================================
// Account Icons and Colors
// ==============================================

/**
 * Get all available account icons
 */
export function getAvailableAccountIcons(): Array<{value: string, label: string}> {
  return [
    { value: 'wallet', label: 'Wallet' },
    { value: 'building-2', label: 'Bank' },
    { value: 'credit-card', label: 'Credit Card' },
    { value: 'piggy-bank', label: 'Piggy Bank' },
    { value: 'trending-up', label: 'Investment' },
    { value: 'smartphone', label: 'Mobile' },
    { value: 'circle-dollar-sign', label: 'Dollar' },
    { value: 'home', label: 'Home' },
    { value: 'car', label: 'Car' },
    { value: 'shopping-cart', label: 'Shopping' },
  ]
}

/**
 * Get all available account colors
 */
export function getAvailableAccountColors(): Array<{value: string, label: string}> {
  return [
    { value: '#10B981', label: 'Green' },
    { value: '#3B82F6', label: 'Blue' },
    { value: '#F59E0B', label: 'Amber' },
    { value: '#8B5CF6', label: 'Purple' },
    { value: '#06B6D4', label: 'Cyan' },
    { value: '#EC4899', label: 'Pink' },
    { value: '#EF4444', label: 'Red' },
    { value: '#6B7280', label: 'Gray' },
    { value: '#84CC16', label: 'Lime' },
    { value: '#F97316', label: 'Orange' },
  ]
}

// ==============================================
// Helper Functions (Internal)
// ==============================================

/**
 * Get user profile with subscription info
 */
async function getUserProfile(userId: string) {
  const { data } = await supabase
    .from('profiles')
    .select('subscription_plan, family_group_id, family_role')
    .eq('user_id', userId)
    .single()

  return data
}

// ==============================================
// Legacy Support (for existing code)
// ==============================================

/**
 * AccountService class for backward compatibility
 */
export class AccountService {
  static async getAccounts(userId: string) {
    return getUserAccounts(userId)
  }

  static async getAccountById(id: string, userId: string) {
    return getAccountById(id, userId)
  }

  static async createAccount(account: AccountInsert) {
    return createAccount(account)
  }

  static async updateAccount(id: string, updates: AccountUpdate, userId: string) {
    return updateAccount(id, userId, updates)
  }

  static async deleteAccount(id: string, userId: string) {
    return deleteAccount(id, userId)
  }

  static async getAccountsForDropdown(userId: string) {
    return getUserAccounts(userId)
  }

  static async getAccountSummary(userId: string) {
    return getUserAccountSummary(userId)
  }

  static async getAccountTypesSummary(userId: string) {
    const accounts = await getUserAccounts(userId)
    const typesSummary = accounts.reduce((acc: any, account) => {
      const type = account.type
      if (!acc[type]) {
        acc[type] = {
          type,
          count: 0,
          total_balance: 0
        }
      }
      acc[type].count += 1
      acc[type].total_balance += account.balance
      return acc
    }, {})
    
    return Object.values(typesSummary)
  }
}