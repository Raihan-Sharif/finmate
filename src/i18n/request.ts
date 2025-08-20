import {getRequestConfig} from 'next-intl/server';
import {headers} from 'next/headers';

export default getRequestConfig(async (params) => {
  let locale: string;
  
  // Try to get locale from different sources
  if (params.locale) {
    locale = params.locale;
  } else if (params.requestLocale) {
    // CRITICAL: In Next.js 15, requestLocale is a Promise that must be awaited!
    locale = (await params.requestLocale) || 'en';
  } else {
    // Fallback: extract from headers
    const headersList = await headers();
    
    // Try to get from various header sources
    const possibleHeaders = ['x-pathname', 'x-invoke-path', 'x-middleware-rewrite', 'referer'];
    
    let foundLocale = null;
    for (const headerName of possibleHeaders) {
      const headerValue = headersList.get(headerName) || '';
      
      if (headerValue.includes('/bn')) {
        foundLocale = 'bn';
        break;
      } else if (headerValue.includes('/en')) {
        foundLocale = 'en';
        break;
      }
    }
    
    locale = foundLocale || 'en';
  }

  // Ensure locale is valid
  if (!['en', 'bn'].includes(locale)) {
    locale = 'en';
  }
  
  try {
    const messages = (await import(`../../messages/${locale}.json`)).default;
    
    return {
      locale,
      messages
    };
  } catch (error) {
    // Fallback to English
    return {
      locale: 'en',
      messages: (await import(`../../messages/en.json`)).default
    };
  }
});