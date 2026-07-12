# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: clients.spec.ts >> Client Module E2E >> full client lifecycle: custom fields, create, view, add interaction
- Location: tests\e2e\clients.spec.ts:35:3

# Error details

```
Error: locator.fill: Target page, context or browser has been closed
Call log:
  - waiting for getByPlaceholder('name@company.com')

```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('Client Module E2E', () => {
  4   |   test.setTimeout(120000);
  5   | 
  6   |   let tenantSlug = '';
  7   |   let userEmail = `owner@e2e-${Date.now()}.com`;
  8   |   const password = 'Password123!';
  9   | 
  10  |   test.beforeAll(async ({ request }) => {
  11  |     // Create a tenant via API to bypass UI flakiness
  12  |     tenantSlug = `e2e-client-${Date.now()}`;
  13  |     userEmail = `owner@e2e-${Date.now()}.com`;
  14  |     
  15  |     const tenantRes = await request.post('http://localhost:3000/api/auth/register', {
  16  |       data: {
  17  |         companyName: `E2E Client Test Tenant ${Date.now()}`,
  18  |         urlSlug: tenantSlug,
  19  |         ownerEmail: userEmail,
  20  |         ownerPassword: password,
  21  |       }
  22  |     });
  23  |     expect(tenantRes.ok()).toBeTruthy();
  24  |   });
  25  | 
  26  |   test.beforeEach(async ({ page }) => {
  27  |     // Login before each test
  28  |     await page.goto(`/${tenantSlug}/login`);
> 29  |     await page.getByPlaceholder('name@company.com').fill(userEmail);
      |                                                     ^ Error: locator.fill: Target page, context or browser has been closed
  30  |     await page.getByPlaceholder('••••••••').fill(password);
  31  |     await page.getByRole('button', { name: 'Sign In' }).click();
  32  |     await expect(page).toHaveURL(`/${tenantSlug}`);
  33  |   });
  34  | 
  35  |   test('full client lifecycle: custom fields, create, view, add interaction', async ({ page }) => {
  36  |     // 1. Navigate to Settings and add a custom field
  37  |     await page.click('text=Settings');
  38  |     await expect(page).toHaveURL(`/${tenantSlug}/settings`);
  39  |     
  40  |     await page.click('text=Client Management');
  41  |     await expect(page).toHaveURL(`/${tenantSlug}/settings/client-management`);
  42  |     
  43  |     // Add custom field
  44  |     await page.click('text=Add Field');
  45  |     await page.fill('input[placeholder="e.g. Industry"]', 'Industry');
  46  |     await page.selectOption('select', { label: 'Text' });
  47  |     await page.click('button:has-text("Save")');
  48  |     
  49  |     // Verify field was added
  50  |     await expect(page.locator('table')).toContainText('Industry');
  51  | 
  52  |     // 2. Add an Outcome Category
  53  |     await page.click('button:has-text("Outcome Categories")');
  54  |     await page.click('text=Add Category');
  55  |     await page.fill('input[placeholder="e.g. Positive"]', 'Positive');
  56  |     await page.click('button:has-text("Save")');
  57  |     
  58  |     // Verify category was added
  59  |     await expect(page.locator('table')).toContainText('Positive');
  60  | 
  61  |     // 3. Navigate to Clients page and create a new client
  62  |     await page.getByRole('link', { name: 'Clients', exact: true }).click();
  63  |     await expect(page).toHaveURL(`/${tenantSlug}/clients`);
  64  |     
  65  |     await page.click('text=Add Client');
  66  |     await expect(page).toHaveURL(`/${tenantSlug}/clients/new`);
  67  | 
  68  |     const clientName = `Acme Corp ${Date.now()}`;
  69  |     await page.fill('input[placeholder="e.g. Acme Corp"]', clientName);
  70  |     await page.fill('input[placeholder="contact@example.com"]', 'contact@acme.com');
  71  |     await page.fill('input[placeholder="(555) 123-4567"]', '555-123-4567');
  72  |     await page.selectOption('select', { label: 'Prospect' });
  73  |     
  74  |     // Fill the dynamic custom field
  75  |     await page.fill('input[placeholder="Enter Industry"]', 'Software');
  76  |     
  77  |     await page.click('button:has-text("Save Client")');
  78  | 
  79  |     // Should navigate to detail page after creation
  80  |     await expect(page).toHaveURL(new RegExp(`/${tenantSlug}/clients/[0-9a-fA-F-]+$`));
  81  | 
  82  |     // Verify client name and custom field are visible
  83  |     await expect(page.getByText(clientName).first()).toBeVisible({ timeout: 10000 });
  84  |     await expect(page.getByText('Software').first()).toBeVisible({ timeout: 10000 });
  85  | 
  86  |     // 4. Add an interaction
  87  |     await page.click('button:has-text("Log Call")');
  88  |     
  89  |     // Fill the interaction form in the slide-over
  90  |     await page.fill('textarea[placeholder="Add details about this interaction..."]', 'Discussed the new software requirements.');
  91  |     // Target the Outcome select specifically by its label
  92  |     await page.getByLabel('Outcome').selectOption({ label: 'Positive' });
  93  |     
  94  |     // Wait for the save API call and history refresh
  95  |     await Promise.all([
  96  |       page.waitForResponse(resp => resp.url().includes('/interactions') && resp.status() === 201),
  97  |       page.click('button:has-text("Save Interaction")'),
  98  |     ]);
  99  | 
  100 |     // Wait for history to re-fetch after save
  101 |     await page.waitForResponse(resp => resp.url().includes('/history') && resp.ok());
  102 | 
  103 |     // Verify interaction appears in timeline
  104 |     await expect(page.getByText('Discussed the new software requirements.').first()).toBeVisible({ timeout: 15000 });
  105 |   });
  106 | });
  107 | 
```