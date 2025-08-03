#!/bin/bash

echo "🔧 FinMate Setup Fix Script"
echo "============================"

# Clean up existing files
echo "📁 Cleaning up old files..."
rm -f next.config.ts
rm -f tailwind.config.ts
rm -rf node_modules
rm -f package-lock.json

# Rename config files if they exist
if [ -f "next.config.ts" ]; then
    echo "🔄 Converting next.config.ts to next.config.js..."
    mv next.config.ts next.config.js
fi

if [ -f "tailwind.config.ts" ]; then
    echo "🔄 Converting tailwind.config.ts to tailwind.config.js..."
    mv tailwind.config.ts tailwind.config.js
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check for vulnerabilities and fix them
echo "🛡️ Fixing security vulnerabilities..."
npm audit fix

# Type check
echo "🔍 Running type check..."
npm run type-check

# Lint check
echo "✅ Running lint check..."
npm run lint

echo ""
echo "✨ Setup fix completed!"
echo ""
echo "Next steps:"
echo "1. Copy .env.example to .env.local"
echo "2. Add your Supabase credentials to .env.local"
echo "3. Run the database schema in your Supabase dashboard"
echo "4. Start development with: npm run dev"
echo ""
echo "🚀 Happy coding!"