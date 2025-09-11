import {getRequestConfig} from 'next-intl/server';
import {headers} from 'next/headers';

// Function to load section-wise translations
async function loadMessages(locale: string) {
  try {
    // Try to load the full translation file first (fallback)
    const fullMessages = (await import(`../../messages/${locale}.json`)).default;
    
    // Try to load section files and merge them
    const sections = [
      'common', 'navigation', 'tags', 'home', 'auth', 'dashboard', 
      'transactions', 'accounts', 'budget', 'investments', 'credit', 'calculators', 
      'settings', 'subscription', 'admin', 'theme', 'errors', 'actions', 'forms', 'dateTime', 'pwa'
    ];
    const sectionMessages: any = {};
    
    for (const section of sections) {
      try {
        const sectionData = (await import(`../../messages/sections/${locale}/${section}.json`)).default;
        Object.assign(sectionMessages, sectionData);
        console.log(`✅ Loaded section: ${section}`);
      } catch (error) {
        console.warn(`⚠️ Could not load section ${section}:`, error instanceof Error ? error.message : String(error));
      }
    }
    
    // If we have section messages, use them, otherwise fallback to full messages
    if (Object.keys(sectionMessages).length > 0) {
      console.log('✅ Using section-wise translations');
      return sectionMessages;
    } else {
      console.log('⚠️ Falling back to full translation file');
      return fullMessages;
    }
  } catch (error) {
    console.error('Error loading messages:', error);
    throw error;
  }
}

export default getRequestConfig(async (params) => {
  // CRITICAL: In Next.js 15, requestLocale is a Promise that must be awaited!
  const locale = await params.requestLocale;

  // Ensure locale is valid and not undefined
  const validatedLocale = (locale && ['en', 'bn'].includes(locale)) ? locale : 'en';
  
  try {
    const messages = await loadMessages(validatedLocale);
    
    return {
      locale: validatedLocale as string,
      messages
    };
  } catch (error) {
    console.error('Error loading messages:', error);
    // Fallback to English full file
    return {
      locale: 'en' as string,
      messages: (await import(`../../messages/en.json`)).default
    };
  }
});