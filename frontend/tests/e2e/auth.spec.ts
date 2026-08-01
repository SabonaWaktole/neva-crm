import { test, expect } from '@playwright/test';
import { provisionTenant } from './support/provision';

/*
 * Formerly "Authentication & Onboarding Flow". The onboarding half is gone with
 * public self-signup — a workspace is provisioned by a platform administrator,
 * so there is no wizard for a visitor to walk through. What remains is the part
 * that still exists and still matters: a provisioned owner can sign in, sign
 * out, and cannot walk back in afterwards.
 */
test.describe('Authentication Flow', () => {
  let slug = '';
  let email = '';
  let password = '';

  test.beforeAll(async ({ request }) => {
    const provisioned = await provisionTenant(request, { namePrefix: 'testcorp' });
    slug = provisioned.tenantSlug;
    email = provisioned.ownerEmail;
    password = provisioned.ownerPassword;
  });

  test('a provisioned owner logs in, logs out, and stays out', async ({ page }) => {
    page.on('console', msg => console.log(`PAGE LOG: ${msg.text()}`));
    page.on('pageerror', err => console.log(`PAGE ERROR: ${err.message}`));
    page.on('response', response => console.log(`<< ${response.status()} ${response.url()}`));

    await page.goto(`/${slug}/login`);
    await expect(page).toHaveTitle(/Neva CRM/);
    await page.getByPlaceholder('name@company.com').fill(email);
    await page.getByPlaceholder('••••••••').fill(password);
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Dashboard (Business Owner Shell)
    await expect(page).toHaveURL(new RegExp(`/${slug}`));
    await expect(page.getByRole('heading', { name: 'Welcome to Neva CRM' })).toBeVisible();
    await expect(page.getByText('Add your first client')).toBeVisible();

    // Test Logout
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
