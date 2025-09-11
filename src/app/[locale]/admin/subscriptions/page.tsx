import { Metadata } from 'next'
import { AdminSubscriptionManager } from '@/components/admin/AdminSubscriptionManager'

export const metadata: Metadata = {
  title: 'Subscription Management - Admin Panel',
  description: 'Manage subscriptions, payments, and coupons'
}

export default function AdminSubscriptionsPage() {
  return <AdminSubscriptionManager />
}