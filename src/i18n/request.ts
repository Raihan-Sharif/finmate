import {getRequestConfig} from 'next-intl/server';

export default getRequestConfig(async ({locale}) => {
  // Simple fallback approach
  const selectedLocale = locale || 'en';
  
  // Ensure the locale is valid
  if (!['en', 'bn'].includes(selectedLocale)) {
    console.warn(`Invalid locale: ${selectedLocale}, using 'en'`);
    return {
      locale: 'en',
      messages: (await import(`../../messages/en.json`)).default
    };
  }

  try {
    return {
      locale: selectedLocale,
      messages: (await import(`../../messages/${selectedLocale}.json`)).default
    };
  } catch (error) {
    console.error(`Failed to load messages for locale: ${selectedLocale}`, error);
    // Fallback to English
    return {
      locale: 'en',
      messages: (await import(`../../messages/en.json`)).default
    };
  }
});