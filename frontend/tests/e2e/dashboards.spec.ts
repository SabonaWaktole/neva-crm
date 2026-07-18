import { test, expect } from '@playwright/test';

test.describe('Dashboard Dashboards Wiring E2E', () => {
  const uniqueId = Date.now();
  const companyName = `DashCorp ${uniqueId}`;
  const slug = `dashcorp-${uniqueId}`;
  const email = `owner${uniqueId}@dashcorp.com`;
  const password = 'Password123!';

  test('Business Owner Dashboard renders real data', async ({ page }) => {
    // 1. Register a new business owner
    await page.goto('/register-business');
    await page.getByPlaceholder('e.g. Acme Corp').fill(companyName);
    await page.getByPlaceholder('you@company.com').fill(email);
    await page.getByPlaceholder('••••••••').fill(password);
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('button', { name: 'Complete Setup' }).click();
    
    // 2. Go to Login
    await expect(page.getByText('Workspace Created!')).toBeVisible();
    await page.getByRole('button', { name: 'Go to Login' }).click();

    // 3. Login
    await expect(page).toHaveURL(new RegExp(`/${slug}/login`));
    await page.getByPlaceholder('name@company.com').fill(email);
    await page.getByPlaceholder('••••••••').fill(password);
    await page.getByRole('button', { name: 'Sign In' }).click();

    // 4. Verify Business Owner Dashboard KPIs (Real Data -> 0 clients)
    await expect(page).toHaveURL(new RegExp(`/${slug}`));
    await expect(page.getByText('Welcome back')).toBeVisible();
    
    // The metric KPICard should have "0" total clients initially
    await expect(page.getByRole('heading', { name: '0', exact: true })).toBeVisible();
    await expect(page.getByText('No recent activity.')).toBeVisible();

    // 5. Navigate to Clients and Create a Client to trigger data changes
    await page.getByRole('link', { name: 'Clients' }).click();
    await expect(page).toHaveURL(new RegExp(`/${slug}/clients`));
    await page.getByRole('button', { name: 'Add Client' }).click();
    await page.getByLabel('First Name').fill('John');
    await page.getByLabel('Last Name').fill('Doe');
    await page.getByLabel('Email Address').fill('john.doe@example.com');
    await page.getByRole('button', { name: 'Create' }).click();

    // 6. Go back to Dashboard and verify metrics and feed updated
    await page.getByRole('link', { name: 'Dashboard' }).click();
    await expect(page).toHaveURL(new RegExp(`/${slug}`));
    
    // Total clients should now be 1
    await expect(page.getByRole('heading', { name: '1', exact: true })).toBeVisible();
    
    // Activity feed should show the client creation
    await expect(page.getByText('No recent activity.')).not.toBeVisible();
    await expect(page.getByText('Client Added')).toBeVisible();
  });
});
