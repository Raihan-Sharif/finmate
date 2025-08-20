// Root page - redirect to localized content
import { redirect } from 'next/navigation';
import { routing } from '@/i18n/routing';

// This page only handles the redirect from root to default locale
export default function RootPage() {
  // Redirect to default locale
  redirect(`/${routing.defaultLocale}`);
}