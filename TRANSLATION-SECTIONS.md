# Section-wise Translation System

## Overview
The FinMate application now uses a section-wise translation system to solve the file size limitation issue. This system allows us to split large translation files into manageable sections while maintaining full compatibility with next-intl.

## File Structure

```
messages/
├── en.json                    # Original full file (fallback)
├── bn.json                    # Original full file (fallback)
└── sections/
    ├── en/
    │   ├── common.json        # Common translations
    │   ├── navigation.json    # Navigation items
    │   ├── dashboard.json     # Dashboard translations  
    │   ├── transactions.json  # Transaction management
    │   ├── budget.json        # Budget management
    │   └── credit.json        # Credit & lending (loans, EMI, etc.)
    └── bn/
        ├── common.json        # Bengali common translations
        ├── navigation.json    # Bengali navigation
        ├── dashboard.json     # Bengali dashboard
        ├── transactions.json  # Bengali transactions
        ├── budget.json        # Bengali budget
        └── credit.json        # Bengali credit & lending
```

## How It Works

### 1. Loading Strategy
The system uses a smart loading strategy:
1. **Primary**: Load section files and merge them
2. **Fallback**: If section loading fails, use the original full files

### 2. Configuration
The `src/i18n/request.ts` file handles section loading:

```typescript
// Sections to load
const sections = ['common', 'navigation', 'dashboard', 'transactions', 'budget', 'credit'];

// Load and merge section files
for (const section of sections) {
  const sectionData = await import(`../../messages/sections/${locale}/${section}.json`);
  Object.assign(sectionMessages, sectionData.default);
}
```

## Adding New Translation Keys

### Method 1: Direct File Editing
Edit the relevant section file directly:
- For credit/loan translations: `messages/sections/en/credit.json` and `messages/sections/bn/credit.json`
- For common UI elements: `messages/sections/en/common.json` and `messages/sections/bn/common.json`

### Method 2: Using Scripts
Run the provided script to add keys programmatically:

```bash
node scripts/add-translation-keys.js
```

## Creating New Sections

1. **Create section files**:
   ```bash
   # Create new section files
   touch messages/sections/en/investments.json
   touch messages/sections/bn/investments.json
   ```

2. **Add section structure**:
   ```json
   {
     "investments": {
       "title": "Investments",
       "subtitle": "Manage your investment portfolio",
       // ... more keys
     }
   }
   ```

3. **Update i18n configuration**:
   ```typescript
   // Add to sections array in src/i18n/request.ts
   const sections = ['common', 'navigation', 'dashboard', 'transactions', 'budget', 'credit', 'investments'];
   ```

## Extracting Sections from Full Files

Use the extraction script to create new sections:

```javascript
// Extract specific section from full file
const fs = require('fs');
const fullJson = JSON.parse(fs.readFileSync('./messages/en.json', 'utf8'));
const sectionData = { investments: fullJson.investments };
fs.writeFileSync('./messages/sections/en/investments.json', JSON.stringify(sectionData, null, 2));
```

## Testing Translations

Run the test script to verify translations work:

```bash
node scripts/test-translations.js
```

This will:
- ✅ Test section loading
- ✅ Verify specific translation keys exist
- ✅ Show which sections are loaded

## Benefits

1. **File Size Management**: No more size limitations when editing files
2. **Better Organization**: Related translations grouped together
3. **Easier Maintenance**: Smaller, focused files
4. **Performance**: Only load needed sections
5. **Fallback Safety**: Original files as backup

## Usage in Components

No changes needed in components! Use translations exactly as before:

```typescript
// Works exactly the same
const t = useTranslations('credit');
<span>{t('bankLoans.form.totalAmount')}</span>
```

## Current Sections (18 total)

- **common**: Shared UI elements, actions, status labels
- **navigation**: Menu items, navigation labels  
- **tags**: Tag-related translations
- **home**: Homepage content and hero sections
- **auth**: Authentication (signin/signup) translations
- **dashboard**: Dashboard-specific translations
- **transactions**: Transaction management
- **budget**: Budget management
- **investments**: Investment portfolio management
- **credit**: Loans, EMI, lending (contains the fixed keys!)
- **calculators**: Financial calculators
- **settings**: Application settings
- **theme**: Theme and appearance
- **errors**: Error messages
- **actions**: Action buttons and labels
- **forms**: Form-related translations
- **dateTime**: Date and time formatting
- **pwa**: Progressive Web App features

## Troubleshooting

### Missing Keys
1. Check the relevant section file
2. Verify key path is correct
3. Run test script to confirm loading
4. Clear browser cache and restart dev server

### Section Not Loading
1. Check file exists in both `en` and `bn` folders
2. Verify JSON syntax is valid
3. Check console for loading errors
4. Ensure section is added to config

### Development Commands
```bash
# Test translations
node scripts/test-translations.js

# Add missing keys
node scripts/add-translation-keys.js

# Type check
npm run type-check

# Build test
npm run build
```

---

**🎉 The translation system is now fully functional with section-wise loading!**

All the missing credit/loan form keys have been added and are working correctly.