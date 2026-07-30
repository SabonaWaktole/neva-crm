import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Download, FileWarning } from 'lucide-react';
import styles from './PublicQuotationPage.module.css';
import { API_BASE_URL } from '../../api/baseUrl';

interface PublicLine {
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

interface PublicQuotation {
  reference: string;
  status: string;
  issuedAt: string;
  sentAt: string | null;
  clientName: string;
  company: {
    name: string;
    logoUrl: string | null;
    address: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
  };
  currency: string;
  locale: string;
  lines: PublicLine[];
  subtotal: number;
}

const apiBase = API_BASE_URL;

/**
 * The quotation as the customer sees it (§6.5).
 *
 * Deliberately outside the authenticated app shell — no sidebar, no tenant
 * routing, no auth store. The person opening this has no account and never
 * will; rendering them a chrome they cannot use, or bouncing them to a login
 * they cannot pass, is what "Sent" meant before this page existed.
 *
 * It fetches with plain `fetch` rather than the shared `apiClient` for the same
 * reason: that client sends credentials and carries interceptors that redirect
 * on 401. Neither is wanted here, and a customer must never be logged out of
 * something by viewing a quotation.
 */
export const PublicQuotationPage = () => {
  const { token } = useParams();
  const { t } = useTranslation('quotations');

  const [quotation, setQuotation] = useState<PublicQuotation | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const response = await fetch(`${apiBase}/public/quotations/${token}`);
        if (!response.ok) {
          if (!cancelled) setNotFound(true);
          return;
        }
        const data = (await response.json()) as PublicQuotation;
        if (!cancelled) setQuotation(data);
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    // Guards against a state update after the customer navigates away mid-fetch.
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (loading) {
    return <div className={styles.centered}>{t('public.loading')}</div>;
  }

  if (notFound || !quotation) {
    /*
     * One message for every failure — unknown token, withdrawn quotation, still
     * a draft. The server deliberately does not distinguish them (telling a
     * probing caller which tokens are real defeats the token length), so the
     * page must not invent a distinction the API refused to make.
     */
    return (
      <div className={styles.centered}>
        <FileWarning size={32} strokeWidth={1.5} />
        <h1 className={styles.errorTitle}>{t('public.notFound')}</h1>
        <p className={styles.errorHint}>{t('public.notFoundHint')}</p>
      </div>
    );
  }

  const money = (amount: number) => formatMoney(amount, quotation.currency, quotation.locale);
  const date = (value: string) => new Date(value).toLocaleDateString(quotation.locale);

  return (
    <div className={styles.page}>
      <article className={styles.sheet}>
        <header className={styles.header}>
          <div className={styles.issuer}>
            {quotation.company.logoUrl && (
              <img
                src={quotation.company.logoUrl}
                alt={quotation.company.name}
                className={styles.logo}
              />
            )}
            <div>
              <h1 className={styles.companyName}>{quotation.company.name}</h1>
              {quotation.company.address && (
                <p className={styles.meta}>{quotation.company.address}</p>
              )}
              {(quotation.company.contactEmail || quotation.company.contactPhone) && (
                <p className={styles.meta}>
                  {[quotation.company.contactEmail, quotation.company.contactPhone]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              )}
            </div>
          </div>

          <a
            className={styles.downloadButton}
            href={`${apiBase}/public/quotations/${token}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Download size={16} />
            {t('public.download')}
          </a>
        </header>

        <section className={styles.summary}>
          <div>
            <span className={styles.label}>{t('public.reference')}</span>
            <span className={styles.value}>{quotation.reference}</span>
          </div>
          <div>
            <span className={styles.label}>{t('public.preparedFor')}</span>
            <span className={styles.value}>{quotation.clientName}</span>
          </div>
          <div>
            <span className={styles.label}>{t('public.issued')}</span>
            <span className={styles.value}>{date(quotation.issuedAt)}</span>
          </div>
          {quotation.sentAt && (
            <div>
              <span className={styles.label}>{t('public.sent')}</span>
              <span className={styles.value}>{date(quotation.sentAt)}</span>
            </div>
          )}
        </section>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">{t('public.description')}</th>
                <th scope="col">{t('public.quantity')}</th>
                <th scope="col">{t('public.unitPrice')}</th>
                <th scope="col">{t('public.lineTotal')}</th>
              </tr>
            </thead>
            <tbody>
              {quotation.lines.map((line, index) => (
                // Index keys are safe here: the list is read-only, never
                // reordered and never filtered.
                <tr key={index}>
                  <td>{line.description}</td>
                  <td>{line.quantity}</td>
                  <td>{money(line.unitPrice)}</td>
                  <td>{money(line.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3}>{t('public.subtotal')}</td>
                <td>
                  <strong>{money(quotation.subtotal)}</strong>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <footer className={styles.footer}>{t('public.privateNotice')}</footer>
      </article>
    </div>
  );
};

/**
 * Formats in the issuing workspace's currency and locale — not the viewer's.
 *
 * A quotation priced in EUR must read as EUR to a customer whose browser is set
 * to en-US. This page cannot use `useMoneyFormat`, which reads the *logged-in
 * tenant's* settings from the auth store; there is no logged-in tenant here.
 */
function formatMoney(amount: number, currency: string, locale: string): string {
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
  } catch {
    // An unknown locale or currency code must not blank the customer's total.
    return amount.toFixed(2);
  }
}
