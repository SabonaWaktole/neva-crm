/* Throwaway: seeds a tenant + owner that already have a logo and an avatar,
   so the two marked spots in the UI can be checked in a real browser. */
require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'commonjs' } });
require('tsconfig-paths/register');

const path = require('path');
const fs = require('fs/promises');
const bcrypt = require('bcrypt');
const sharp = require('sharp');
const { prisma } = require('./src/shared/infrastructure/prisma/client.ts');

const UPLOADS = path.resolve(process.cwd(), 'uploads');

(async () => {
  const SLUG = 'mediademo';
  const EMAIL = 'owner@mediademo.test';
  const PASSWORD = 'Password123!';

  await prisma.user.deleteMany({ where: { email: EMAIL } });
  await prisma.tenant.deleteMany({ where: { urlSlug: SLUG } });

  const tenantId = 'tenant-mediademo';
  await prisma.tenant.create({
    data: { id: tenantId, name: 'Media Demo Co', urlSlug: SLUG },
  });

  const dir = path.join(UPLOADS, tenantId);
  await fs.mkdir(dir, { recursive: true });

  // A distinctive orange logo and a green avatar, so it is obvious at a glance
  // which image landed in which slot.
  const write = async (name, color, size) => {
    const buf = await sharp({
      create: { width: size, height: size, channels: 3, background: color },
    })
      .webp()
      .toBuffer();
    await fs.writeFile(path.join(dir, `${name}@1x.webp`), buf);
    await fs.writeFile(path.join(dir, `${name}@2x.webp`), buf);
    return `/uploads/${tenantId}/${name}@1x.webp`;
  };

  const logoUrl = await write('logo-demo', { r: 255, g: 138, b: 0 }, 256);
  const avatarUrl = await write('avatar-demo', { r: 16, g: 160, b: 90 }, 256);

  await prisma.tenant.update({ where: { id: tenantId }, data: { logoUrl } });

  await prisma.user.create({
    data: {
      id: 'user-mediademo',
      email: EMAIL,
      hashedPassword: await bcrypt.hash(PASSWORD, 10),
      firstName: 'Ada',
      lastName: 'Lovelace',
      role: 'BUSINESS_OWNER',
      tenantId,
      avatarUrl,
    },
  });

  console.log(JSON.stringify({ SLUG, EMAIL, PASSWORD, logoUrl, avatarUrl }, null, 1));
  await prisma.$disconnect();
})().catch((e) => {
  console.error('SEED FAILED', e.message);
  process.exit(1);
});
