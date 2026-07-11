const fs = require('fs');
const path = require('path');

function readFile(f) { return fs.readFileSync(f, 'utf8'); }
function writeFile(f, c) { fs.writeFileSync(f, c); console.log('Fixed: ' + f); }

// ============================================================
// 1. Avatar.tsx - needs React, ImgHTMLAttributes
// ============================================================
{
  const f = 'src/components/ui/Avatar/Avatar.tsx';
  let c = readFile(f);
  c = c.replace("import {} from 'react';", "import React from 'react';\nimport type { ImgHTMLAttributes } from 'react';");
  writeFile(f, c);
}

// ============================================================
// 2. Badge.tsx - needs HTMLAttributes, ReactNode
// ============================================================
{
  const f = 'src/components/ui/Badge/Badge.tsx';
  let c = readFile(f);
  if (c.includes("import {} from 'react'")) {
    c = c.replace("import {} from 'react';", "import React from 'react';\nimport type { HTMLAttributes, ReactNode } from 'react';");
  } else if (!c.includes('HTMLAttributes')) {
    c = "import React from 'react';\nimport type { HTMLAttributes, ReactNode } from 'react';\n" + c;
  }
  writeFile(f, c);
}

// ============================================================
// 3. Card.tsx - needs HTMLAttributes, ReactNode, forwardRef
// ============================================================
{
  const f = 'src/components/ui/Card/Card.tsx';
  let c = readFile(f);
  if (c.includes("import {} from 'react'")) {
    c = c.replace("import {} from 'react';", "import React, { forwardRef } from 'react';\nimport type { HTMLAttributes, ReactNode } from 'react';");
  } else if (!c.includes('forwardRef')) {
    c = "import React, { forwardRef } from 'react';\nimport type { HTMLAttributes, ReactNode } from 'react';\n" + c;
  }
  writeFile(f, c);
}

// ============================================================
// 4. CustomFieldInput.tsx - needs forwardRef
// ============================================================
{
  const f = 'src/components/ui/CustomFieldInput/CustomFieldInput.tsx';
  let c = readFile(f);
  if (c.includes("import {} from 'react'")) {
    c = c.replace("import {} from 'react';", "import React, { forwardRef } from 'react';");
  } else if (!c.includes('forwardRef') && !c.includes('{ forwardRef }')) {
    c = c.replace("import React from 'react'", "import React, { forwardRef } from 'react'");
  }
  writeFile(f, c);
}

// ============================================================
// 5. DropdownMenu.tsx - needs ReactNode, useState, useRef, useEffect
// ============================================================
{
  const f = 'src/components/ui/DropdownMenu/DropdownMenu.tsx';
  let c = readFile(f);
  if (c.includes("import {} from 'react'")) {
    c = c.replace("import {} from 'react';", "import React, { useState, useRef, useEffect } from 'react';\nimport type { ReactNode } from 'react';");
  } else {
    // Ensure all hooks are imported
    if (!c.includes('useState')) c = c.replace("import React", "import React, { useState, useRef, useEffect }").replace(", {, {", ", {");
  }
  writeFile(f, c);
}

// ============================================================
// 6. SlideOver.tsx - needs useEffect
// ============================================================
{
  const f = 'src/components/ui/SlideOver/SlideOver.tsx';
  let c = readFile(f);
  if (c.includes("import {} from 'react'")) {
    c = c.replace("import {} from 'react';", "import React, { useEffect } from 'react';\nimport type { ReactNode } from 'react';");
  } else if (!c.includes('useEffect')) {
    if (c.includes("import React from 'react'")) {
      c = c.replace("import React from 'react'", "import React, { useEffect } from 'react'");
    } else if (c.includes("import React, {")) {
      if (!c.includes('useEffect')) {
        c = c.replace("import React, {", "import React, { useEffect,");
      }
    }
  }
  writeFile(f, c);
}

// ============================================================
// 7. SettingsLayout.tsx - needs ReactNode
// ============================================================
{
  const f = 'src/components/layout/SettingsLayout/SettingsLayout.tsx';
  let c = readFile(f);
  if (c.includes("import {} from 'react'")) {
    c = c.replace("import {} from 'react';", "import React from 'react';\nimport type { ReactNode } from 'react';");
  } else if (!c.includes('ReactNode')) {
    if (c.includes("from 'react'")) {
      // Add type import after existing react import
      c = c.replace(/(import.*from 'react';)/, "$1\nimport type { ReactNode } from 'react';");
    } else {
      c = "import React from 'react';\nimport type { ReactNode } from 'react';\n" + c;
    }
  }
  writeFile(f, c);
}

// ============================================================
// 8. Remove unused 'React' imports where verbatimModuleSyntax complains
//    (PasswordInput, SelectInput, TextareaInput, TextInput, TimelineItem)
//    These use forwardRef from React but don't use React directly
// ============================================================
const removeUnusedReact = [
  'src/components/ui/PasswordInput/PasswordInput.tsx',
  'src/components/ui/SelectInput/SelectInput.tsx',
  'src/components/ui/TextareaInput/TextareaInput.tsx',
  'src/components/ui/TextInput/TextInput.tsx',
  'src/components/ui/TimelineItem/TimelineItem.tsx',
];
for (const f of removeUnusedReact) {
  let c = readFile(f);
  // Replace "import React, { hooks } from 'react'" with "import { hooks } from 'react'"
  c = c.replace(/import React, \{([^}]+)\} from 'react';/, "import {$1} from 'react';");
  writeFile(f, c);
}

// ============================================================
// 9. Remove unused AlertCircle in SelectInput and TextInput
// ============================================================
{
  const f = 'src/components/ui/SelectInput/SelectInput.tsx';
  let c = readFile(f);
  c = c.replace("import { AlertCircle, ChevronDown } from 'lucide-react';", "import { ChevronDown } from 'lucide-react';");
  writeFile(f, c);
}
{
  const f = 'src/components/ui/TextInput/TextInput.tsx';
  let c = readFile(f);
  // Only remove if AlertCircle is imported but not used in the template
  if (c.includes("import { AlertCircle }") && !c.includes('<AlertCircle')) {
    c = c.replace("import { AlertCircle } from 'lucide-react';\n", "");
  }
  writeFile(f, c);
}

// ============================================================
// 10. Stepper.tsx - remove unused isFuture
// ============================================================
{
  const f = 'src/components/ui/Stepper/Stepper.tsx';
  let c = readFile(f);
  // Remove the isFuture variable assignment
  c = c.replace(/\s*const isFuture = .*;\n?/, '\n');
  writeFile(f, c);
}

// ============================================================
// 11. Auth pages - add useState import
// ============================================================
const authPages = [
  'src/pages/auth/ForgotPasswordPage.tsx',
  'src/pages/auth/LoginPage.tsx',
  'src/pages/auth/ResetPasswordPage.tsx',
  'src/pages/auth/StaffInvitationPage.tsx',
];
for (const f of authPages) {
  let c = readFile(f);
  if (c.includes('useState(') && !c.includes('{ useState }') && !c.includes('{ useState,') && !c.includes(', useState }') && !c.includes(', useState,')) {
    if (c.includes("import React from 'react'")) {
      c = c.replace("import React from 'react'", "import React, { useState } from 'react'");
    } else if (!c.match(/import\s.*useState/)) {
      // Add import at top
      c = "import { useState } from 'react';\n" + c;
    }
  }
  writeFile(f, c);
}

// ============================================================
// 12. OnboardingPage.tsx - add useState
// ============================================================
{
  const f = 'src/pages/onboarding/OnboardingPage.tsx';
  let c = readFile(f);
  if (c.includes('useState(') && !c.includes('{ useState }') && !c.includes('{ useState,') && !c.includes(', useState }') && !c.includes(', useState,')) {
    if (c.includes("import React from 'react'")) {
      c = c.replace("import React from 'react'", "import React, { useState } from 'react'");
    } else if (!c.match(/import\s.*useState/)) {
      c = "import { useState } from 'react';\n" + c;
    }
  }
  writeFile(f, c);
}

// ============================================================
// 13. ClientListContent.tsx - add useState
// ============================================================
{
  const f = 'src/pages/clients/ClientListContent.tsx';
  let c = readFile(f);
  if (c.includes('useState(') && !c.includes('{ useState }') && !c.includes('{ useState,') && !c.includes(', useState }') && !c.includes(', useState,')) {
    if (c.includes("import React from 'react'")) {
      c = c.replace("import React from 'react'", "import React, { useState } from 'react'");
    } else if (!c.match(/import\s.*useState/)) {
      c = "import { useState } from 'react';\n" + c;
    }
  }
  writeFile(f, c);
}

// ============================================================
// 14. guards.test.tsx - remove unused Outlet
// ============================================================
{
  const f = 'src/routes/guards.test.tsx';
  let c = readFile(f);
  c = c.replace(/, Outlet/g, '');
  c = c.replace(/Outlet, /g, '');
  writeFile(f, c);
}

// ============================================================
// 15. mocks/handlers.ts - remove unused http
// ============================================================
{
  const f = 'src/mocks/handlers.ts';
  let c = readFile(f);
  // Remove the unused http import
  c = c.replace(/import \{ http \} from 'msw';\n?/, '');
  c = c.replace(/import \{ http, /, 'import { ');
  writeFile(f, c);
}

// ============================================================
// 16. authService.ts - fix duplicate property
// ============================================================
{
  const f = 'src/services/authService.ts';
  let c = readFile(f);
  // Find and remove duplicate properties - look for lines with same property name
  const lines = c.split('\n');
  const seen = new Set();
  const result = [];
  let inObject = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const propMatch = line.match(/^\s+(\w+):/);
    if (propMatch && i > 0 && lines[i-1] && lines[i-1].match(/^\s+(\w+):/) && propMatch[1] === lines[i-1].match(/^\s+(\w+):/)?.[1]) {
      // Skip duplicate consecutive property
      continue;
    }
    result.push(line);
  }
  writeFile(f, result.join('\n'));
}

// ============================================================
// 17. stories/Page.tsx - add React import
// ============================================================
{
  const f = 'src/stories/Page.tsx';
  if (fs.existsSync(f)) {
    let c = readFile(f);
    if (!c.includes("import React")) {
      c = "import React from 'react';\n" + c;
    }
    writeFile(f, c);
  }
}

// ============================================================
// 18. Shell pages - remove unused React import
// ============================================================
const shellPages = [
  'src/pages/shell/BusinessOwnerShell.tsx',
  'src/pages/shell/StaffShell.tsx',
  'src/pages/shell/SuperAdminShell.tsx',
  'src/pages/settings/AccountSettingsPage.tsx',
  'src/routes/index.tsx',
  'src/routes/TenantGuard.tsx',
  'src/routes/ProtectedRoute.tsx',
  'src/stories/Button.tsx',
  'src/stories/Header.tsx',
];
for (const f of shellPages) {
  if (!fs.existsSync(f)) continue;
  let c = readFile(f);
  // Only remove React if it's not used as React.FC, React.createElement, etc.
  if (c.includes("import React from 'react'") && !c.includes('React.') && !c.includes('<React.')) {
    c = c.replace("import React from 'react';\n", '');
  }
  writeFile(f, c);
}

// ============================================================
// 19. useLogout.test.tsx - add missing tenantSlug
// ============================================================
{
  const f = 'src/hooks/useLogout.test.tsx';
  if (fs.existsSync(f)) {
    let c = readFile(f);
    if (c.includes("tenantId: 'tenant-1'") && !c.includes('tenantSlug')) {
      c = c.replace("tenantId: 'tenant-1'", "tenantId: 'tenant-1', tenantSlug: 'test-tenant'");
    }
    writeFile(f, c);
  }
}

console.log('\nAll fixes applied.');
