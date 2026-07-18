const fs = require('fs');

function fixUseState(file) {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('useState(') && !content.includes('useState,') && !content.includes('{ useState }')) {
    if (content.includes('import React from \'react\'')) {
      content = content.replace('import React from \'react\'', 'import React, { useState } from \'react\'');
    } else if (content.includes('import React, {')) {
      content = content.replace('import React, {', 'import React, { useState,');
    }
    fs.writeFileSync(file, content);
  }
}

[
  'src/pages/auth/ForgotPasswordPage.tsx',
  'src/pages/auth/LoginPage.tsx',
  'src/pages/auth/ResetPasswordPage.tsx',
  'src/pages/auth/StaffInvitationPage.tsx',
  'src/pages/clients/ClientListContent.tsx',
  'src/pages/onboarding/OnboardingPage.tsx',
  'src/pages/settings/ClientSettingsContent.tsx'
].forEach(fixUseState);

const avatarFile = 'src/components/ui/Avatar/Avatar.tsx';
let avatarContent = fs.readFileSync(avatarFile, 'utf8');
if (!avatarContent.includes('ImgHTMLAttributes')) {
  avatarContent = avatarContent.replace('export interface AvatarProps {', 'export interface AvatarProps extends React.ImgHTMLAttributes<HTMLImageElement> {');
  fs.writeFileSync(avatarFile, avatarContent);
}

const slideOverFile = 'src/components/ui/SlideOver/SlideOver.tsx';
let slideOverContent = fs.readFileSync(slideOverFile, 'utf8');
if (slideOverContent.includes('useEffect(') && !slideOverContent.includes('useEffect,') && !slideOverContent.includes('{ useEffect }') && !slideOverContent.includes('{ useEffect,')) {
  if (slideOverContent.includes('import React from \'react\'')) {
    slideOverContent = slideOverContent.replace('import React from \'react\'', 'import React, { useEffect } from \'react\'');
  } else if (slideOverContent.includes('import React, {')) {
    slideOverContent = slideOverContent.replace('import React, {', 'import React, { useEffect,');
  }
  fs.writeFileSync(slideOverFile, slideOverContent);
}
