import { Router, Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { GetPublicQuotationUseCase } from '../../application/GetPublicQuotationUseCase';
import { QuotationPdfRenderer } from '../../infrastructure/QuotationPdfRenderer';

/**
 * The customer-facing quotation view (§6.5).
 *
 * Mounted at `/api/public/quotations` — outside `/api/:tenantSlug` and
 * therefore outside `authenticate` and `resolveTenant`. That is the point:
 * the recipient of a quotation is not a user of the system and has no account
 * to log into, so the previous design ("Sent" flips a status and nothing
 * reaches anyone) had no way to actually deliver.
 *
 * What replaces authentication:
 *
 *  - a 256-bit token that only exists once a quotation is Sent
 *    (`generateShareToken`, `Quotation.issueShareToken`);
 *  - a use case that refuses to serve Draft or Pending Approval even when the
 *    token is valid;
 *  - the rate limit below, which is what makes brute force pointless rather
 *    than merely expensive;
 *  - `noindex`, so a link pasted somewhere public does not end up in a search
 *    engine.
 */
export const createPublicQuotationRouter = (
  getPublicQuotation: GetPublicQuotationUseCase,
  pdfRenderer: QuotationPdfRenderer
): Router => {
  const router = Router();

  /*
   * Tighter than the auth limiter and keyed by IP, because there is no account
   * to lock. 60/hour is generous for a customer refreshing a quotation and
   * useless for enumerating a 43-character token space.
   */
  const limiter = rateLimit({
    windowMs: 60 * 60_000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests. Please try again later.' },
  });

  router.use(limiter);

  router.use((_req: Request, res: Response, next: NextFunction) => {
    // Customer pricing must never be indexed or cached by an intermediary.
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    res.setHeader('Cache-Control', 'no-store');
    next();
  });

  router.get('/:token', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const view = await getPublicQuotation.execute(String(req.params.token));
      // 404 for every failure mode — unknown token, still a draft, wrong
      // shape. Distinguishing them would tell a probing caller which tokens
      // are real, which is exactly the signal the token length exists to deny.
      if (!view) return res.status(404).json({ error: 'Quotation not found' });

      res.json({
        reference: view.reference,
        status: view.status,
        issuedAt: view.issuedAt,
        sentAt: view.sentAt,
        respondedAt: view.respondedAt,
        clientName: view.clientName,
        company: {
          name: view.companyName,
          logoUrl: view.companyLogoUrl,
          address: view.companyAddress,
          contactEmail: view.companyContactEmail,
          contactPhone: view.companyContactPhone,
        },
        currency: view.currency,
        locale: view.locale,
        lines: view.lines,
        subtotal: view.subtotal,
      });
    } catch (error) {
      next(error);
    }
  });

  router.get('/:token/pdf', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const view = await getPublicQuotation.execute(String(req.params.token));
      if (!view) return res.status(404).json({ error: 'Quotation not found' });

      const pdf = await pdfRenderer.render(view);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Length', pdf.length);
      // `inline` so a customer clicking the link reads it in the browser
      // rather than being handed a download they then have to find.
      res.setHeader(
        'Content-Disposition',
        `inline; filename="quotation-${view.reference}.pdf"`
      );
      res.send(pdf);
    } catch (error) {
      next(error);
    }
  });

  return router;
};
