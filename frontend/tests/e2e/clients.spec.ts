import { test, expect } from '@playwright/test';

test.describe('Client Module E2E', () => {
  test.setTimeout(120000);

  let tenantSlug = '';
  let userEmail = `owner@e2e-${Date.now()}.com`;
  const password = 'Password123!';

  test.beforeAll(async ({ request }) => {
    // Create a tenant via API to bypass UI flakiness
    tenantSlug = `e2e-client-${Date.now()}`;
    userEmail = `owner@e2e-${Date.now()}.com`;
    
    const tenantRes = await request.post('http://localhost:3000/api/auth/register', {
      data: {
        companyName: `E2E Client Test Tenant ${Date.now()}`,
        urlSlug: tenantSlug,
        ownerEmail: userEmail,
        ownerPassword: password,
      }
    });
    expect(tenantRes.ok()).toBeTruthy();
  });

  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto(`/${tenantSlug}/login`);
    await page.getByPlaceholder('name@company.com').fill(userEmail);
    await page.getByPlaceholder('••••••••').fill(password);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL(`/${tenantSlug}`);
  });

  test('full client lifecycle: custom fields, create, view, add interaction', async ({ page }) => {
    // 1. Navigate to Settings and add a custom field
    await page.click('text=Settings');
    await expect(page).toHaveURL(`/${tenantSlug}/settings`);
    
    await page.click('text=Client Management');
    await expect(page).toHaveURL(`/${tenantSlug}/settings/client-management`);
    
    // Add custom field
    await page.click('text=Add Field');
    await page.fill('input[placeholder="e.g. Industry"]', 'Industry');
    await page.selectOption('select', { label: 'Text' });
    await page.click('button:has-text("Save")');
    
    // Verify field was added
    await expect(page.locator('table')).toContainText('Industry');

    // 2. Add an Outcome Category
    await page.click('button:has-text("Outcome Categories")');
    await page.click('text=Add Category');
    await page.fill('input[placeholder="e.g. Positive"]', 'Positive');
    await page.click('button:has-text("Save")');
    
    // Verify category was added
    await expect(page.locator('table')).toContainText('Positive');

    // 3. Navigate to Clients page and create a new client
    await page.getByRole('link', { name: 'Clients', exact: true }).click();
    await expect(page).toHaveURL(`/${tenantSlug}/clients`);
    
    await page.click('text=Add Client');
    await expect(page).toHaveURL(`/${tenantSlug}/clients/new`);

    const clientName = `Acme Corp ${Date.now()}`;
    await page.fill('input[placeholder="e.g. Acme Corp"]', clientName);
    await page.fill('input[placeholder="contact@example.com"]', 'contact@acme.com');
    await page.fill('input[placeholder="(555) 123-4567"]', '555-123-4567');
    await page.selectOption('select', { label: 'Prospect' });
    
    // Fill the dynamic custom field
    await page.fill('input[placeholder="Enter Industry"]', 'Software');
    
    await page.click('button:has-text("Save Client")');

    // Should navigate to detail page after creation
    await expect(page).toHaveURL(new RegExp(`/${tenantSlug}/clients/[0-9a-fA-F-]+$`));

    // Verify client name and custom field are visible
    await expect(page.getByText(clientName).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Software').first()).toBeVisible({ timeout: 10000 });

    // 4. Add an interaction
    await page.click('button:has-text("Log Call")');
    
    // Fill the interaction form in the slide-over
    await page.fill('textarea[placeholder="Add details about this interaction..."]', 'Discussed the new software requirements.');
    // Target the Outcome select specifically by its label
    await page.getByLabel('Outcome').selectOption({ label: 'Positive' });
    
    // Wait for the save API call and history refresh
    await Promise.all([
      page.waitForResponse(resp => resp.url().includes('/interactions') && resp.status() === 201),
      page.click('button:has-text("Save Interaction")'),
    ]);

    // Wait for history to re-fetch after save
    await page.waitForResponse(resp => resp.url().includes('/history') && resp.ok());

    // Verify interaction appears in timeline
    await expect(page.getByText('Discussed the new software requirements.').first()).toBeVisible({ timeout: 15000 });
  });
});
