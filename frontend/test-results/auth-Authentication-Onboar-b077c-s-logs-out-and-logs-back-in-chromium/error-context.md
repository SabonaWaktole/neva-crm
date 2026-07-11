# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Authentication & Onboarding Flow >> registers a new business, logs out, and logs back in
- Location: tests\e2e\auth.spec.ts:10:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Workspace Created!')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('Workspace Created!')

```

```yaml
- main:
  - heading "Nexus CRM" [level=1]
  - paragraph: Let's set up your workspace.
  - text: 1 Organization 2 Branding 3 Localization
  - heading "What's your company name?" [level=2]
  - paragraph: This will be used to generate your dedicated workspace URL.
  - text: An unexpected error occurred Company Name
  - textbox "Company Name":
    - /placeholder: e.g. Acme Corp
    - text: TestCorp 1783733175361
  - text: Your Email
  - textbox "Your Email":
    - /placeholder: you@company.com
    - text: owner1783733175361@testcorp.com
  - text: Create Password
  - textbox "Create Password":
    - /placeholder: ••••••••
    - text: Password123!
  - button "visibility_off"
  - paragraph: Min 8 chars, 1 uppercase, 1 lowercase, 1 digit.
  - text: link nexus.crm/testcorp-1783733175361
  - heading "Upload your logo" [level=2]
  - paragraph: Personalize your workspace for your team and clients.
  - text: cloud_upload Click to upload or drag and drop SVG, PNG, JPG (max. 5MB)
  - heading "Set your region" [level=2]
  - paragraph: This helps us configure date, time, and currency formats correctly.
  - text: Region / Locale
  - combobox "Region / Locale":
    - option "Select a region..." [disabled]
    - option "United States (USD)" [selected]
    - option "United Kingdom (GBP)"
    - option "European Union (EUR)"
    - option "Australia (AUD)"
    - option "Canada (CAD)"
  - text: expand_more System Language
  - combobox "System Language":
    - option "English (US)" [selected]
    - option "Español"
    - option "Français"
    - option "Deutsch"
  - text: expand_more
  - button "arrow_back Back"
  - button "Continue arrow_forward"
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Authentication & Onboarding Flow', () => {
  4  |   const uniqueId = Date.now();
  5  |   const companyName = `TestCorp ${uniqueId}`;
  6  |   const slug = `testcorp-${uniqueId}`;
  7  |   const email = `owner${uniqueId}@testcorp.com`;
  8  |   const password = 'Password123!';
  9  | 
  10 |   test('registers a new business, logs out, and logs back in', async ({ page }) => {
  11 |     // 1. Go to Onboarding page
  12 |     await page.goto('/register-business');
  13 |     await expect(page).toHaveTitle(/Nexus CRM/);
  14 | 
  15 |     // Step 1: Organization
  16 |     await page.getByPlaceholder('e.g. Acme Corp').fill(companyName);
  17 |     await page.getByPlaceholder('you@company.com').fill(email);
  18 |     await page.getByPlaceholder('••••••••').fill(password);
  19 |     await page.getByRole('button', { name: 'Continue' }).click();
  20 | 
  21 |     // Step 2: Branding (skip for now)
  22 |     await page.getByRole('button', { name: 'Continue' }).click();
  23 | 
  24 |     // Step 3: Localization (accept defaults)
  25 |     await page.getByRole('button', { name: 'Complete Setup' }).click();
  26 | 
  27 |     // Verify Success Screen
> 28 |     await expect(page.getByText('Workspace Created!')).toBeVisible();
     |                                                        ^ Error: expect(locator).toBeVisible() failed
  29 |     await page.getByRole('button', { name: 'Go to Login' }).click();
  30 | 
  31 |     // 2. Login Page
  32 |     await expect(page).toHaveURL(new RegExp(`/${slug}/login`));
  33 |     await page.getByPlaceholder('jane@example.com').fill(email);
  34 |     await page.getByPlaceholder('••••••••').fill(password);
  35 |     await page.getByRole('button', { name: 'Sign In' }).click();
  36 | 
  37 |     // 3. Dashboard (Business Owner Shell)
  38 |     await expect(page).toHaveURL(new RegExp(`/${slug}`));
  39 |     await expect(page.getByRole('heading', { name: 'Welcome to Nexus CRM' })).toBeVisible();
  40 |     await expect(page.getByText('Add your first client')).toBeVisible();
  41 | 
  42 |     // 4. Test Logout
  43 |     // The AppLayout has a profile button we can click
  44 |     await page.getByLabel('User Profile').click();
  45 |     await page.getByRole('button', { name: 'Log Out' }).click();
  46 | 
  47 |     // Verify we are back on the login page
  48 |     await expect(page).toHaveURL(new RegExp(`/${slug}/login`));
  49 |     
  50 |     // Check auth protection by trying to force navigate back to dashboard
  51 |     await page.goto(`/${slug}`);
  52 |     await expect(page).toHaveURL(new RegExp(`/${slug}/login`)); // Should redirect
  53 |   });
  54 | });
  55 | 
```