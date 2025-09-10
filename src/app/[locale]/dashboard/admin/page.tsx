import { Metadata } from 'next';
import AdminDashboard from '@/components/admin/AdminDashboard';

export const metadata: Metadata = {
  title: 'Admin Dashboard - FinMate',
  description: 'Administrative dashboard for FinMate application management',
};

export default function AdminPage() {
  return <AdminDashboard />;
}