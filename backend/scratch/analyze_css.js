const fs = require('fs');
const path = require('path');

const designDir = 'd:\\nevacrm\\frontend\\design';
const dirs = fs.readdirSync(designDir, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory())
  .map(dirent => dirent.name);

const cssValues = {
  colors: new Set(),
  fontFamilies: new Set(),
  fontSizes: new Set(),
  fontWeights: new Set(),
  spacings: new Set(),
  borderRadii: new Set(),
  boxShadows: new Set()
};

const extractRegex = {
  colors: /(?:color|background-color|border-color|fill|stroke):\s*(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\))/g,
  fontFamilies: /font-family:\s*([^;]+)/g,
  fontSizes: /font-size:\s*([^;]+)/g,
  fontWeights: /font-weight:\s*([^;]+)/g,
  spacings: /(?:margin|padding|gap|margin-[a-z]+|padding-[a-z]+):\s*([^;]+)/g,
  borderRadii: /border-radius:\s*([^;]+)/g,
  boxShadows: /box-shadow:\s*([^;]+)/g
};

dirs.forEach(dir => {
  const htmlPath = path.join(designDir, dir, 'code.html');
  if (fs.existsSync(htmlPath)) {
    const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
    
    Object.keys(extractRegex).forEach(key => {
      let match;
      while ((match = extractRegex[key].exec(htmlContent)) !== null) {
        cssValues[key].add(match[1].trim());
      }
    });
  }
});

console.log("=== Consolidated CSS Analysis ===");
Object.keys(cssValues).forEach(key => {
  console.log(`\n--- ${key.toUpperCase()} ---`);
  console.log(Array.from(cssValues[key]).sort().join('\n'));
});
