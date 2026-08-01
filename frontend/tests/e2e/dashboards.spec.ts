import { test, expect } from '@playwright/test';
import { provisionTenant } from './support/provision';

test.describe('Dashboard Dashboards Wiring E2E', () => {
  let slug = '';
  let email = '';
  let password = '';

  test.beforeAll(async ({ request }) => {
    // The onboarding wizard this test used to drive is gone with public
    // self-signup. Provisioning through the platform console instead keeps the
    // test about the dashboard, which is what it is named for.
    const provisioned = await provisionTenant(request, { namePrefix: 'dashcorp' });
    slug = provisioned.tenantSlug;
    email = provisioned.ownerEmail;
    password = provisioned.ownerPassword;
  });

  test('Business Owner Dashboard renders real data', async ({ page }) => {
    page.on('console', msg => console.log(`PAGE LOG: ${msg.text()}`));
    page.on('pageerror', err => console.log(`PAGE ERROR: ${err.message}`));
    page.on('response', response => console.log(`<< ${response.status()} ${response.url()}`));

    await page.goto(`/${slug}/login`);
    await page.getByPlaceholder('name@company.com').fill(email);
    await page.getByPlaceholder('••••••••').fill(password);
    await page.getByRole('button', { name: 'Sign In' }).click();

    // 4. Verify Business Owner Dashboard KPIs (Real Data -> 0 clients)
    await expect(page).toHaveURL(new RegExp(`/${slug}`));
    await expect(page.getByText('Welcome back')).toBeVisible();
    
    // The metric KPICard should have "0" total clients initially
    try {
      await expect(page.getByText('0', { exact: true })).toBeVisible({ timeout: 5000 });
    } catch (err) {
      console.log('PAGE CONTENT DUMP:');
      console.log(await page.content());
      throw err;
    }
    await expect(page.getByText('No recent activity.')).toBeVisible();

    // 5. Navigate to Clients and Create a Client to trigger data changes
    await page.getByRole('link', { name: 'Clients' }).click();
    await expect(page).toHaveURL(new RegExp(`/${slug}/clients`));
    await page.getByRole('button', { name: 'Add Client' }).click();
    await page.getByLabel('Client Name').fill('John Doe');
    await page.getByLabel('Email').fill('john.doe@example.com');
    await page.getByRole('button', { name: 'Save Client' }).click();

    // 6. Go back to Dashboard and verify metrics and feed updated
    await page.getByRole('link', { name: 'Dashboard' }).click();
    await expect(page).toHaveURL(new RegExp(`/${slug}`));
    
    // Total clients should now be 1
    await expect(page.getByText('1', { exact: true })).toBeVisible();
    
    // Activity feed should show the client creation
    await expect(page.getByText('No recent activity.')).not.toBeVisible();
    await expect(page.getByText('Client Added')).toBeVisible();
  });
});
