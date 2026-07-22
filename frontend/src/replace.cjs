const fs = require('fs');
const { execSync } = require('child_process');

const files = execSync('git grep -l "onSettingsClick"').toString().split('\n').filter(Boolean);

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  const newContent = content.replace(/navigate\(\`\/\$\{tenantSlug\}\/settings\`\)/g, 'navigate(`/${tenantSlug}/settings/profile`)');
  fs.writeFileSync(f, newContent);
});
console.log('done');
