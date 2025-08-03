module.exports = {
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'es5',
  printWidth: 80,
  bracketSpacing: true,
  arrowParens: 'always',
  endOfLine: 'lf',
  plugins: ['prettier-plugin-tailwindcss'],
  tailwindConfig: './tailwind.config.js',
}

// .prettierignore
node_modules
.next
out
build
dist
*.log
.env*
.vercel
.DS_Store
public/sw.js
*.min.js
*.min.css