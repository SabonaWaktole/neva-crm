const fs = require('fs');
const path = require('path');

function readFile(f) { return fs.readFileSync(f, 'utf8'); }
function writeFile(f, c) { fs.writeFileSync(f, c); console.log('Fixed: ' + f); }

// 1. AppLayout.tsx
{
  const f = 'src/components/layout/AppLayout/AppLayout.tsx';
  let c = readFile(f);
  if (!c.includes('useState')) {
    c = c.replace(/import React(.*?)\\s*from 'react';/, "import React, { useState, useRef, useEffect } from 'react';\nimport type { ReactNode } from 'react';");
  }
  writeFile(f, c);
}

// 2. AuthLayout.tsx
{
  const f = 'src/components/layout/AuthLayout/AuthLayout.tsx';
  let c = readFile(f);
  if (!c.includes('ReactNode')) {
    c = c.replace(/import React(.*?)\\s*from 'react';/, "import React$1 from 'react';\nimport type { ReactNode } from 'react';");
  }
  writeFile(f, c);
}

// 3. SettingsLayout.tsx
{
  const f = 'src/components/layout/SettingsLayout/SettingsLayout.tsx';
  let c = readFile(f);
  c = c.replace("import { LucideIcon } from 'lucide-react';", "import type { LucideIcon } from 'lucide-react';");
  writeFile(f, c);
}

// 4. Card.tsx
{
  const f = 'src/components/ui/Card/Card.tsx';
  let c = readFile(f);
  c = c.replace("import React, { forwardRef } from 'react';", "import { forwardRef } from 'react';");
  writeFile(f, c);
}

// 5. SlideOver.tsx
{
  const f = 'src/components/ui/SlideOver/SlideOver.tsx';
  let c = readFile(f);
  c = c.replace("import type { ReactNode } from 'react';\n", "");
  writeFile(f, c);
}

// 6. authService.ts
{
  const f = 'src/services/authService.ts';
  let c = readFile(f);
  const lines = c.split('\n');
  const result = [];
  let inObject = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.match(/^\s+login:/) && lines[i-1] && lines[i-1].match(/^\s+login:/)) {
      continue;
    }
    result.push(line);
  }
  writeFile(f, result.join('\n'));
}

// 7. vite.config.ts
{
  const f = 'vite.config.ts';
  let c = readFile(f);
  c = c.replace(/name: 'unit',/, "// name: 'unit',");
  writeFile(f, c);
}

// 8. UserRole.ts in backend
{
  const f = '../backend/src/auth/domain/enums/UserRole.ts';
  let c = readFile(f);
  c = c.replace(/export enum UserRole \{[\s\S]*?\}/, `export const UserRole = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  BUSINESS_OWNER: 'BUSINESS_OWNER',
  STAFF: 'STAFF'
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];`);
  writeFile(f, c);
}

// Ensure AppLayout and AuthLayout replacement worked, if they didn't have "import React" we add it at top
{
  const f = 'src/components/layout/AppLayout/AppLayout.tsx';
  let c = readFile(f);
  if (!c.includes('useState')) {
    c = "import React, { useState, useRef, useEffect } from 'react';\nimport type { ReactNode } from 'react';\n" + c.replace(/import \{\} from 'react';\n/, "");
    writeFile(f, c);
  }
}
{
  const f = 'src/components/layout/AuthLayout/AuthLayout.tsx';
  let c = readFile(f);
  if (!c.includes('ReactNode')) {
    c = "import React from 'react';\nimport type { ReactNode } from 'react';\n" + c.replace(/import \{\} from 'react';\n/, "");
    writeFile(f, c);
  }
}
