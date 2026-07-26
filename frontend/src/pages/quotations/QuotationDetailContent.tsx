import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { Download, Edit, CheckCircle, XCircle, Send, ArrowLeft, Archive } from 'lucide-react';
import { Button } from '../../components/ui/Button/Button';
import { Card } from '../../components/ui/Card/Card';
import { Badge } from '../../components/ui/Badge/Badge';
import type { BadgeProps } from '../../components/ui/Badge/Badge';
import styles from './QuotationDetailContent.module.css';

import { useQuotations, useQuotationActions } from '../../hooks/useQuotations';
import { useMoneyFormat } from '../../hooks/useMoneyFormat';
import { useStatusLabel } from '../../hooks/useStatusLabel';
import { useDateFormat } from '../../hooks/useDateFormat';

export const QuotationDetailContent: React.FC = () => {
  const dates = useDateFormat();
  const { t } = useTranslation('quotations');
  const { format: formatMoney } = useMoneyFormat();
  const statusLabel = useStatusLabel();
  const navigate = useNavigate();
  const { tenantSlug, id } = useParams();
  
  const { fetchQuotationDetail, loading } = useQuotations();
  const actionHooks = useQuotationActions();
  
  const [data, setData] = useState<any>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  /*
   * useCallback is load-bearing, not decoration. `loadData` is used by the
   * effect below and by handleAction; listing it as a dependency without
   * memoising it would give the effect a new function identity every render and
   * refetch forever. Memoised on its own inputs, the effect runs exactly when
   * the quotation being viewed changes.
   */
  const loadData = useCallback(async () => {
    if (id) {
      try {
        const detail = await fetchQuotationDetail(id);
        setData(detail);
      } catch (err) {
        console.error(err);
      }
    }
  }, [id, fetchQuotationDetail]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading || !data) {
    return <div className={styles.loadingState}>{t('detail.loading')}</div>;
  }

  const { quotation, lineItems, history, permittedActions } = data;

  const handleAction = async (action: string) => {
    if (!id) return;
    setActionError(null);
    try {
      if (action === 'SUBMIT') await actionHooks.submitQuotation(id);
      if (action === 'APPROVE') await actionHooks.approveQuotation(id);
      if (action === 'RETURN_TO_DRAFT') await actionHooks.returnQuotationToDraft(id, t('detail.returnReason'));
      if (action === 'MARK_ACCEPTED') await actionHooks.markQuotationAccepted(id);
      if (action === 'MARK_REJECTED') await actionHooks.markQuotationRejected(id);
      if (action === 'EXPIRE') await actionHooks.expireQuotation(id);
      await loadData();
    } catch (err: any) {
      setActionError(err.message || 'An error occurred while performing this action.');
    }
  };

  const getStatusBadgeVariant = (status: string): BadgeProps['variant'] => {
    switch (status) {
      case 'DRAFT': return 'secondary';
      case 'PENDING_APPROVAL': return 'warning';
      case 'SENT': return 'primary';
      case 'ACCEPTED': return 'success';
      case 'REJECTED': return 'error';
      case 'EXPIRED': return 'secondary';
      default: return 'secondary';
    }
  };


  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <button
            type="button"
            className={styles.breadcrumb}
            onClick={() => navigate(`/${tenantSlug}/quotations`)}
          >
            <ArrowLeft size={14} />
            {t('detail.breadcrumb', { reference: quotation.id.split('-')[0].toUpperCase() })}
          </button>
          <div className={styles.headerTitleRow}>
            <h1 className={styles.title}>
            {t('detail.title', { reference: quotation.id.split('-')[0].toUpperCase() })}
          </h1>
            <Badge variant={getStatusBadgeVariant(quotation.status)}>
              {statusLabel.quotation(quotation.status)}
            </Badge>
          </div>
        </div>
        <div className={styles.headerActions}>
          {permittedActions.includes('EDIT') && (
            <Button variant="outline" icon={<Edit size={16} />} onClick={() => navigate(`/${tenantSlug}/quotations/${id}/edit`)}>{t('detail.edit')}</Button>
          )}
          {permittedActions.includes('RETURN_TO_DRAFT') && (
            <Button variant="outline" icon={<ArrowLeft size={16} />} onClick={() => handleAction('RETURN_TO_DRAFT')}>{t('detail.returnToDraft')}</Button>
          )}
          {permittedActions.includes('SUBMIT') && (
            <Button variant="primary" icon={<Send size={16} />} onClick={() => handleAction('SUBMIT')}>{t('detail.submit')}</Button>
          )}
          {permittedActions.includes('APPROVE') && (
            <Button variant="primary" icon={<CheckCircle size={16} />} onClick={() => handleAction('APPROVE')}>{t('detail.approve')}</Button>
          )}
          {permittedActions.includes('MARK_ACCEPTED') && (
            <Button variant="success" icon={<CheckCircle size={16} />} onClick={() => handleAction('MARK_ACCEPTED')}>{t('detail.markAccepted')}</Button>
          )}
          {permittedActions.includes('MARK_REJECTED') && (
            <Button variant="danger" icon={<XCircle size={16} />} onClick={() => handleAction('MARK_REJECTED')}>{t('detail.markRejected')}</Button>
          )}
          {permittedActions.includes('EXPIRE') && (
            <Button variant="outline" icon={<Archive size={16} />} onClick={() => handleAction('EXPIRE')}>{t('detail.expire')}</Button>
          )}
          
          {/* Always show Download PDF as a placeholder */}
          <Button variant="outline" icon={<Download size={16} />} onClick={() => alert(t('detail.pdfComingSoon'))}>{t('detail.downloadPdf')}</Button>
        </div>
      </div>
      
      {actionError && (
        <div className={styles.errorBanner} role="alert">
          {actionError}
        </div>
      )}

      <div className={styles.grid}>
        {/* Main Content */}
        <div className={styles.mainCol}>
          <Card padding="lg">
            <h2 className={styles.sectionTitle}>{t('detail.detailsHeading')}</h2>
            <div className={styles.summaryGrid}>
              <div>
                <div className={styles.summaryLabel}>{t('detail.client')}</div>
                <div className={styles.summaryValue}>{quotation.clientName || 'Unknown'}</div>
              </div>
              <div>
                <div className={styles.summaryLabel}>{t('detail.dateCreated')}</div>
                <div className={styles.summaryValue}>{dates.date(quotation.createdAt)}</div>
              </div>
              <div>
                <div className={styles.summaryLabel}>{t('detail.createdBy')}</div>
                <div className={styles.summaryValue}>{quotation.createdByUserId}</div>
              </div>
            </div>
            {quotation.notes && (
              <div style={{ marginTop: 'var(--spacing-md)' }}>
                <div className={styles.summaryLabel}>Notes</div>
                <div className={styles.summaryValue}>{quotation.notes}</div>
              </div>
            )}
          </Card>

          <Card padding="none">
            <div className={styles.lineItemsHeader}>
              <h2 className={styles.sectionTitle}>{t('detail.lineItems')}</h2>
            </div>
            <div className="table-scroll">
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>{t('detail.columnProduct')}</th>
                    <th>{t('detail.columnQuantity')}</th>
                    <th>{t('detail.columnUnitPrice')}</th>
                    <th style={{ textAlign: 'right' }}>{t('detail.columnLineTotal')}</th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item: any, idx: number) => (
                    <tr key={idx}>
                      <td>
                        <div>{item.productName || item.productId}</div>
                        <div style={{ fontSize: '12px', color: 'var(--color-on-surface-variant)' }}>
                          {t('detail.warehouse', { warehouse: item.warehouseName || item.warehouseId })}
                        </div>
                      </td>
                      <td>{item.quantity}</td>
                      <td>{formatMoney(item.unitPrice)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 500 }}>
                        {formatMoney(item.quantity * item.unitPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={styles.totalsSection} style={{ padding: 'var(--spacing-lg)' }}>
              <div className={styles.totalsCard}>
                <div className={styles.totalRow}>
                  <span>{t('detail.subtotal')}</span>
                  <span>{formatMoney(quotation.grandTotal ?? 0)}</span>
                </div>
                <div className={styles.grandTotalRow}>
                  <span>{t('detail.grandTotal')}</span>
                  <span>{formatMoney(quotation.grandTotal ?? 0)}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar Content */}
        <div className={styles.sidebarCol}>
          <Card padding="lg">
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>{t('detail.statusHistory')}</h2>
            </div>
            <div className={styles.timeline}>
              {history.map((event: any, idx: number) => (
                <div key={idx} className={styles.timelineItem}>
                  <div className={styles.timelineDot} />
                  <div className={styles.timelineContent}>
                    <span className={styles.timelineStatus}>{statusLabel.quotation(event.status)}</span>
                    <span className={styles.timelineDate}>{dates.dateTime(event.changedAt)}</span>
                    <span className={styles.timelineUser}>
                      {t('detail.byUser', { user: event.changedByUserId.substring(0, 8) })}
                    </span>
                    {event.reason && <span style={{ fontSize: '12px', fontStyle: 'italic', color: 'var(--color-on-surface-variant)' }}>
                        {t('detail.reason', { reason: event.reason })}
                      </span>}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
