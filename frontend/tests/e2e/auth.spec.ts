import { test, expect } from '@playwright/test';

test.describe('Authentication & Onboarding Flow', () => {
  const uniqueId = Date.now();
  const companyName = `TestCorp ${uniqueId}`;
  const slug = `testcorp-${uniqueId}`;
  const email = `owner${uniqueId}@testcorp.com`;
  const password = 'Password123!';

  test('registers a new business, logs out, and logs back in', async ({ page }) => {
    page.on('console', msg => console.log(`PAGE LOG: ${msg.text()}`));
    page.on('pageerror', err => console.log(`PAGE ERROR: ${err.message}`));
    page.on('response', response => console.log(`<< ${response.status()} ${response.url()}`));

    page.on('console', msg => console.log(`PAGE LOG: ${msg.text()}`));
    page.on('pageerror', err => console.log(`PAGE ERROR: ${err.message}`));
    page.on('response', response => console.log(`<< ${response.status()} ${response.url()}`));

    // 1. Go to Onboarding page
    await page.goto('/register-business');
    await expect(page).toHaveTitle(/Neva CRM/);

    // Step 1: Organization
    await page.getByPlaceholder('e.g. Acme Corp').fill(companyName);
    await page.getByPlaceholder('you@company.com').fill(email);
    await page.getByPlaceholder('••••••••').fill(password);
    await page.getByRole('button', { name: 'Continue' }).click();

    // Step 2: Branding (skip for now)
    await page.getByRole('button', { name: 'Continue' }).click();

    // Step 3: Localization (accept defaults)
    await page.getByRole('button', { name: 'Complete Setup' }).click();

    // Verify Success Screen
    await expect(page.getByText('Workspace Created!')).toBeVisible();
    await page.getByRole('button', { name: 'Go to Login' }).click();

    // 2. Login Page
    await expect(page).toHaveURL(new RegExp(`/${slug}/login`));
    await page.getByPlaceholder('name@company.com').fill(email);
    await page.getByPlaceholder('••••••••').fill(password);
    await page.getByRole('button', { name: 'Sign In' }).click();

    // 3. Dashboard (Business Owner Shell)
    await expect(page).toHaveURL(new RegExp(`/${slug}`));
    await expect(page.getByRole('heading', { name: 'Welcome to Neva CRM' })).toBeVisible();
    await expect(page.getByText('Add your first client')).toBeVisible();

    // 4. Test Logout
    // The AppLayout has a profile button, but the Sidebar also has a "Log Out" button
    // Let's use the Sidebar one to avoid viewport issues with fixed headers in Playwright
    await page.getByRole('link', { name: 'Log Out' }).click();

    // Verify we are back on the login page
    await expect(page).toHaveURL(new RegExp(`/${slug}/login`));
    
    // Check auth protection by trying to force navigate back to dashboard
    await page.goto(`/${slug}`);
    await expect(page).toHaveURL(new RegExp(`/${slug}/login`)); // Should redirect
  });
});
