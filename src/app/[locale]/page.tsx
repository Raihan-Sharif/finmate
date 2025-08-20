import { setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import LandingPageClient from './landing-page-client';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  
  // Enable static rendering
  setRequestLocale(locale);

  return <LandingPageClient />;
}