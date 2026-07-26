import request from 'supertest';
import { createApp } from '../../../src/main/app';
import { PrismaClient } from '@prisma/client';
import { JwtTokenService } from '../../../src/auth/infrastructure/JwtTokenService';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

/**
 * Interface language: a workspace default plus a per-user override.
 *
 * The two settings that must not be conflated are language and locale. Locale
 * governs how values are FORMATTED (separators, date order, currency digits);
 * language governs what words the interface is written in. A user reading the
 * app in Albanian while their workspace records money in US conventions is a
 * supported, ordinary combination — several tests below exist to keep it that
 * way, because merging the two would be an easy and quiet mistake.
 */
describe('Interface language', () => {
  let app: any;
  let prisma: PrismaClient;
  let tokenService: JwtTokenService;

  const runId = uuidv4().slice(0, 8);
  const slug = `lang-${runId}`;
  const PASSWORD = 'Password1';

  let tenantId: string;
  let ownerId: string;
  let staffId: string;
  let ownerToken: string;
  let staffToken: string;

  beforeAll(async () => {
    prisma = new PrismaClient();
    await prisma.$connect();
    app = createApp();
    tokenService = new JwtTokenService();
  }, 60000);

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    tenantId = uuidv4();
    ownerId = uuidv4();
    staffId = uuidv4();

    await prisma.tenant.create({
      data: { id: tenantId, name: 'Lang T1', urlSlug: slug },
    });

    const hashed = await bcrypt.hash(PASSWORD, 10);
    await prisma.user.createMany({
      data: [
        { id: ownerId, email: `owner-${runId}@t.com`, hashedPassword: hashed, role: 'BUSINESS_OWNER', tenantId },
        { id: staffId, email: `staff-${runId}@t.com`, hashedPassword: hashed, role: 'STAFF', tenantId },
      ],
    });

    ownerToken = tokenService.sign({ userId: ownerId, role: 'BUSINESS_OWNER', tenantId, tenantSlug: slug, warehouseId: null });
    staffToken = tokenService.sign({ userId: staffId, role: 'STAFF', tenantId, tenantSlug: slug, warehouseId: null });
  });

  afterEach(async () => {
    await prisma.user.deleteMany({ where: { tenantId } });
    await prisma.tenant.deleteMany({ where: { id: tenantId } });
  });

  const putSettings = (token: string, body: any) =>
    request(app).put(`/api/${slug}/settings`).set('Cookie', [`jwt=${token}`]).send(body);

  const putProfile = (token: string, body: any) =>
    request(app).put('/api/auth/me').set('Cookie', [`jwt=${token}`]).send(body);

  const getMe = (token: string) =>
    request(app).get('/api/auth/me').set('Cookie', [`jwt=${token}`]);

  describe('defaults', () => {
    it('starts every workspace in English with no user override', async () => {
      const res = await getMe(staffToken);

      expect(res.status).toBe(200);
      expect(res.body.user.tenantDefaultLanguage).toBe('en');
      // Null, not 'en': the user has expressed no preference, which is a
      // different state from having chosen English.
      expect(res.body.user.userLanguage).toBeNull();
    });
  });

  describe('workspace default', () => {
    it('lets a Business Owner change it', async () => {
      await putSettings(ownerToken, { defaultLanguage: 'sq' }).expect(200);

      const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
      expect(tenant?.defaultLanguage).toBe('sq');
    });

    it('refuses a Staff change', async () => {
      await putSettings(staffToken, { defaultLanguage: 'sq' }).expect(403);

      const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
      expect(tenant?.defaultLanguage).toBe('en');
    });

    it('rejects a language that is not supported', async () => {
      await putSettings(ownerToken, { defaultLanguage: 'fr' }).expect(400);
      await putSettings(ownerToken, { defaultLanguage: 'klingon' }).expect(400);

      const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
      expect(tenant?.defaultLanguage).toBe('en');
    });

    it('rejects a formatting locale passed as a language', async () => {
      // 'sq-AL' is a valid FORMATTING locale but not a language. Accepting it
      // here would be the first step to conflating the two settings.
      await putSettings(ownerToken, { defaultLanguage: 'sq-AL' }).expect(400);
    });

    it('reaches every user who has expressed no preference', async () => {
      await putSettings(ownerToken, { defaultLanguage: 'sq' }).expect(200);

      const res = await getMe(staffToken);
      expect(res.body.user.tenantDefaultLanguage).toBe('sq');
      expect(res.body.user.userLanguage).toBeNull();
    });
  });

  describe('personal override', () => {
    it('lets any user set their own, including Staff', async () => {
      // Unlike workspace settings, this is a personal preference — it is not
      // Business-Owner-gated.
      await putProfile(staffToken, { language: 'sq' }).expect(200);

      const user = await prisma.user.findUnique({ where: { id: staffId } });
      expect(user?.language).toBe('sq');
    });

    it('survives a workspace default change', async () => {
      await putProfile(staffToken, { language: 'en' }).expect(200);
      await putSettings(ownerToken, { defaultLanguage: 'sq' }).expect(200);

      const res = await getMe(staffToken);
      // The decisive case: an explicit 'en' must NOT be treated the same as
      // "no preference", or a workspace switch would silently override a
      // deliberate personal choice.
      expect(res.body.user.userLanguage).toBe('en');
      expect(res.body.user.tenantDefaultLanguage).toBe('sq');
    });

    it('can be cleared with null to follow the workspace again', async () => {
      await putProfile(staffToken, { language: 'sq' }).expect(200);
      await putProfile(staffToken, { language: null }).expect(200);

      const user = await prisma.user.findUnique({ where: { id: staffId } });
      expect(user?.language).toBeNull();
    });

    it('is left untouched when the field is absent', async () => {
      // Omitting the key must not clear the override — absent and null mean
      // different things, all the way down to the column.
      await putProfile(staffToken, { language: 'sq' }).expect(200);
      await putProfile(staffToken, { firstName: 'Ada' }).expect(200);

      const user = await prisma.user.findUnique({ where: { id: staffId } });
      expect(user?.language).toBe('sq');
      expect(user?.firstName).toBe('Ada');
    });

    it('rejects an unsupported language', async () => {
      await putProfile(staffToken, { language: 'de' }).expect(400);

      const user = await prisma.user.findUnique({ where: { id: staffId } });
      expect(user?.language).toBeNull();
    });

    it('cannot be set on another user', async () => {
      // updateMe only ever acts on the caller; there is no user id in the body
      // that could redirect it.
      await putProfile(staffToken, { language: 'sq' }).expect(200);

      const owner = await prisma.user.findUnique({ where: { id: ownerId } });
      expect(owner?.language).toBeNull();
    });
  });

  describe('language and formatting stay independent', () => {
    it('does not change the formatting locale when the language changes', async () => {
      await putSettings(ownerToken, { defaultLanguage: 'sq' }).expect(200);

      const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
      expect(tenant?.locale).toBe('en-US');
      expect(tenant?.currency).toBe('USD');
    });

    it('does not change the language when the formatting locale changes', async () => {
      await putSettings(ownerToken, { locale: 'sq-AL', currency: 'ALL' }).expect(200);

      const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
      expect(tenant?.defaultLanguage).toBe('en');
    });

    it('supports an Albanian interface with US formatting', async () => {
      // The combination most likely to be broken by conflating the two.
      await putSettings(ownerToken, { defaultLanguage: 'sq' }).expect(200);
      await putProfile(staffToken, { language: 'sq' }).expect(200);

      const res = await getMe(staffToken);
      expect(res.body.user.userLanguage).toBe('sq');
      expect(res.body.user.tenantLocale).toBe('en-US');
      expect(res.body.user.tenantCurrency).toBe('USD');
    });
  });
});
