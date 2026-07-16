import { test, expect } from '@playwright/test';

test.describe('Appointment Scheduling Flow', () => {
  test.setTimeout(120000);

  let tenantSlug = '';
  let userEmail = `owner@e2e-${Date.now()}.com`;
  const password = 'Password123!';

  test.beforeAll(async ({ request }) => {
    // Create a tenant via API to bypass UI flakiness
    tenantSlug = `e2e-appt-${Date.now()}`;
    userEmail = `owner@e2e-${Date.now()}.com`;
    
    const tenantRes = await request.post('http://localhost:3000/api/auth/register', {
      data: {
        companyName: `E2E Appt Test Tenant ${Date.now()}`,
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

  // Use a unique client name to avoid collisions
  const uniqueId = Date.now().toString();
  const clientFirstName = `E2EApptClient${uniqueId}`;
  const clientLastName = 'Test';
  const clientFullName = `${clientFirstName} ${clientLastName}`;
  const appointmentNote = `Follow-up for ${uniqueId}`;

  test('create client -> schedule -> calendar -> confirm -> complete -> timeline', async ({ page }) => {
    // 2. Create a client
    await page.goto(`/${tenantSlug}/clients`);
    await page.click('button:has-text("Add Client")');
    await page.fill('input[placeholder="e.g. Acme Corp"]', clientFullName);
    await page.fill('input[placeholder="contact@example.com"]', `${clientFirstName.toLowerCase()}@test.com`);
    await page.click('button:has-text("Save Client")');

    // Wait to navigate to the new client's detail page
    await expect(page).toHaveURL(new RegExp(`/${tenantSlug}/clients/[0-9a-fA-F-]+$`));

    // 3. Schedule an appointment from the Client Detail page (locked-client mode)
    await page.click('button:has-text("Appointments")'); // Switch to Appointments tab
    await page.click('button:has-text("New Appointment")');
    
    // Fill out the appointment form in the slide-over
    // It should be locked to this client, so we don't need to search for the client
    page.on('response', resp => {
      if (resp.url().includes('/appointments')) {
        console.log('Appointment response:', resp.status(), resp.url());
        resp.text().then(text => console.log('Body:', text)).catch(() => {});
      }
    });

    const future = new Date();
    future.setHours(future.getHours() + 2);
    // Use local strings for the inputs to match browser timezone
    const year = future.getFullYear();
    const month = String(future.getMonth() + 1).padStart(2, '0');
    const day = String(future.getDate()).padStart(2, '0');
    const hours = String(future.getHours()).padStart(2, '0');
    const mins = String(future.getMinutes()).padStart(2, '0');

    await page.fill('input[type="date"]', `${year}-${month}-${day}`);
    await page.fill('input[type="time"]', `${hours}:${mins}`);
    await page.fill('textarea[placeholder="Briefly describe the objective of this meeting..."]', appointmentNote);
    await Promise.all([
      page.waitForResponse(resp => resp.url().includes('/appointments') && (resp.status() === 201 || resp.status() >= 400)),
      page.click('button:has-text("Confirm Appointment")')
    ]);

    // Slide-over should close
    await expect(page.locator('text="Schedule Appointment"').first()).not.toBeVisible();

    // 4. Confirm it appears on the Calendar
    await page.goto(`/${tenantSlug}/appointments`);
    
    // Look for the appointment in the Queue or Agenda
    const appointmentLocator = page.locator(`text=${appointmentNote}`).first();
    await expect(appointmentLocator).toBeVisible();

    // The status should initially be SCHEDULED (represented by the token/badge)
    // Click on the appointment to open the detail panel
    await appointmentLocator.click();

    // Detail panel should open
    const detailPanel = page.locator('text="Appointment Detail"');
    await expect(detailPanel).toBeVisible();

    // Assert initial status is SCHEDULED
    // We use getByText since Badges are spans
    const statusBadge = page.locator('span').filter({ hasText: 'SCHEDULED' }).first();
    await expect(statusBadge).toBeVisible();

    // 5. Confirm it
    await Promise.all([
      page.waitForResponse(resp => resp.url().includes('/status') && resp.status() === 200),
      page.click('button:has-text("Mark as Confirmed")')
    ]);
    
    // Assert status changes to CONFIRMED
    const confirmedBadge = page.locator('span').filter({ hasText: 'CONFIRMED' }).first();
    await expect(confirmedBadge).toBeVisible({ timeout: 10000 });

    // 6. Mark it completed
    await Promise.all([
      page.waitForResponse(resp => resp.url().includes('/status') && resp.status() === 200),
      page.click('button:has-text("Mark as Completed")')
    ]);

    // Assert status changes to COMPLETED
    const completedBadge = page.locator('span').filter({ hasText: 'COMPLETED' }).first();
    await expect(completedBadge).toBeVisible({ timeout: 10000 });

    // 7. Confirm the Client Detail timeline shows the appointment with the correct final status
    await page.goto(`/${tenantSlug}/clients`);
    await page.click(`text=${clientFullName}`);
    
    // 7. Confirm the Client Detail page shows the appointment with the correct final status
    await page.goto(`/${tenantSlug}/clients`);
    await page.click(`text=${clientFullName}`);
    
    // Switch to Appointments tab
    await page.click('button:has-text("Appointments")');

    // Wait for appointments to load and assert the note text is visible
    const appointmentEntry = page.locator(`text=${appointmentNote}`).first();
    await expect(appointmentEntry).toBeVisible({ timeout: 10000 });
    
    // Assert it shows COMPLETED status on the appointments list
    const appointmentCompleted = page.locator('span').filter({ hasText: 'COMPLETED' }).first();
    await expect(appointmentCompleted).toBeVisible({ timeout: 10000 });
  });
});
