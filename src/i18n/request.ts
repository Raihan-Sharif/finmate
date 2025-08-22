import {getRequestConfig} from 'next-intl/server';
import {headers} from 'next/headers';

export default getRequestConfig(async (params) => {
  // CRITICAL: In Next.js 15, requestLocale is a Promise that must be awaited!
  const locale = await params.requestLocale;

  // Ensure locale is valid and not undefined
  const validatedLocale = (locale && ['en', 'bn'].includes(locale)) ? locale : 'en';
  
  try {
    const messages = (await import(`../../messages/${validatedLocale}.json`)).default;
    
    return {
      locale: validatedLocale as string,
      messages
    };
  } catch (error) {
    console.error('Error loading messages:', error);
    // Fallback to English
    return {
      locale: 'en' as string,
      messages: (await import(`../../messages/en.json`)).default
    };
  }
});