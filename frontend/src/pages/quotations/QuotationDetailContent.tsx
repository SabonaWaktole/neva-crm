import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Download, Edit, CheckCircle, XCircle, Send, ArrowLeft, Archive } from 'lucide-react';
import { Button } from '../../components/ui/Button/Button';
import { Card } from '../../components/ui/Card/Card';
import styles from './QuotationDetailContent.module.css';

import { useQuotations, useQuotationActions } from '../../hooks/useQuotations';

export const QuotationDetailContent: React.FC = () => {
  const navigate = useNavigate();
  const { tenantSlug, id } = useParams();
  
  const { fetchQuotationDetail, loading } = useQuotations();
  const actionHooks = useQuotationActions();
  
  const [data, setData] = useState<any>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadData = async () => {
    if (id) {
      try {
        const detail = await fetchQuotationDetail(id);
        setData(detail);
      } catch (err) {
        console.error(err);
      }
    }
  };

  useEffect(() => {
    loadData();
  }, [id, fetchQuotationDetail]);

  if (loading || !data) {
    return <div className="p-xl text-center">Loading...</div>;
  }

  const { quotation, lineItems, history, permittedActions } = data;

  const handleAction = async (action: string) => {
    if (!id) return;
    setActionError(null);
    try {
      if (action === 'SUBMIT') await actionHooks.submitQuotation(id);
      if (action === 'APPROVE') await actionHooks.approveQuotation(id);
      if (action === 'RETURN_TO_DRAFT') await actionHooks.returnQuotationToDraft(id, 'Returned to draft by owner');
      if (action === 'MARK_ACCEPTED') await actionHooks.markQuotationAccepted(id);
      if (action === 'MARK_REJECTED') await actionHooks.markQuotationRejected(id);
      if (action === 'EXPIRE') await actionHooks.expireQuotation(id);
      await loadData();
    } catch (err: any) {
      setActionError(err.message || 'An error occurred while performing this action.');
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'DRAFT': return { bg: 'bg-outline-variant/10', text: 'text-on-surface-variant', border: 'border-outline-variant/20' };
      case 'PENDING_APPROVAL': return { bg: 'bg-tertiary-container/10', text: 'text-tertiary-container', border: 'border-tertiary-container/20' };
      case 'SENT': return { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/20' };
      case 'ACCEPTED': return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' };
      case 'REJECTED': return { bg: 'bg-error/10', text: 'text-error', border: 'border-error/20' };
      case 'EXPIRED': return { bg: 'bg-surface-bright', text: 'text-on-surface-variant', border: 'border-outline-variant' };
      default: return { bg: 'bg-outline-variant/10', text: 'text-on-surface-variant', border: 'border-outline-variant/20' };
    }
  };

  const getStatusLabel = (status: string) => {
    if (status === 'PENDING_APPROVAL') return 'Pending Approval';
    if (status === 'MARK_ACCEPTED') return 'Accepted';
    if (status === 'MARK_REJECTED') return 'Rejected';
    return status.charAt(0) + status.slice(1).toLowerCase();
  };

  const style = getStatusBadgeStyle(quotation.status);

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <div className={styles.breadcrumb} onClick={() => navigate(`/${tenantSlug}/quotations`)} style={{ cursor: 'pointer' }}>
            <ArrowLeft size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
            CRM &gt; Quotations &gt; {quotation.id.split('-')[0].toUpperCase()}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
            <h1 className={styles.title}>Quotation {quotation.id.split('-')[0].toUpperCase()}</h1>
            <span className={`px-sm py-1 rounded-full text-[11px] font-bold uppercase tracking-widest border ${style.bg} ${style.text} ${style.border}`}>
              {getStatusLabel(quotation.status)}
            </span>
          </div>
        </div>
        <div className={styles.headerActions}>
          {permittedActions.includes('EDIT') && (
            <Button variant="outline" icon={<Edit size={16} />} onClick={() => navigate(`/${tenantSlug}/quotations/${id}/edit`)}>Edit</Button>
          )}
          {permittedActions.includes('RETURN_TO_DRAFT') && (
            <Button variant="outline" icon={<ArrowLeft size={16} />} onClick={() => handleAction('RETURN_TO_DRAFT')}>Return to Draft</Button>
          )}
          {permittedActions.includes('SUBMIT') && (
            <Button variant="primary" icon={<Send size={16} />} onClick={() => handleAction('SUBMIT')}>Submit</Button>
          )}
          {permittedActions.includes('APPROVE') && (
            <Button variant="primary" icon={<CheckCircle size={16} />} onClick={() => handleAction('APPROVE')}>Approve</Button>
          )}
          {permittedActions.includes('MARK_ACCEPTED') && (
            <Button variant="primary" style={{ backgroundColor: 'var(--color-emerald-600)' }} icon={<CheckCircle size={16} />} onClick={() => handleAction('MARK_ACCEPTED')}>Mark Accepted</Button>
          )}
          {permittedActions.includes('MARK_REJECTED') && (
            <Button variant="outline" style={{ color: 'var(--color-error)', borderColor: 'var(--color-error)' }} icon={<XCircle size={16} />} onClick={() => handleAction('MARK_REJECTED')}>Mark Rejected</Button>
          )}
          {permittedActions.includes('EXPIRE') && (
            <Button variant="outline" icon={<Archive size={16} />} onClick={() => handleAction('EXPIRE')}>Expire</Button>
          )}
          
          {/* Always show Download PDF as a placeholder */}
          <Button variant="outline" icon={<Download size={16} />} onClick={() => alert('PDF generation coming soon')}>Download PDF</Button>
        </div>
      </div>
      
      {actionError && (
        <div style={{ padding: '12px 16px', background: 'var(--color-error-container, #fdecea)', color: 'var(--color-on-error-container, #b71c1c)', borderRadius: '8px', marginBottom: '16px' }}>
          {actionError}
        </div>
      )}

      <div className={styles.grid}>
        {/* Main Content */}
        <div className={styles.mainCol}>
          <Card padding="lg">
            <h2 className={styles.sectionTitle}>Quotation Details</h2>
            <div className={styles.summaryGrid}>
              <div>
                <div className={styles.summaryLabel}>Client</div>
                <div className={styles.summaryValue}>{quotation.clientName || 'Unknown'}</div>
              </div>
              <div>
                <div className={styles.summaryLabel}>Date Created</div>
                <div className={styles.summaryValue}>{new Date(quotation.createdAt).toLocaleDateString()}</div>
              </div>
              <div>
                <div className={styles.summaryLabel}>Created By</div>
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
            <div className="p-lg border-b border-outline-variant">
              <h2 className={styles.sectionTitle}>Line Items</h2>
            </div>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th style={{ textAlign: 'right' }}>Line Total</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item: any, idx: number) => (
                  <tr key={idx}>
                    <td>
                      <div>{item.productName || item.productId}</div>
                      <div style={{ fontSize: '12px', color: 'var(--color-on-surface-variant)' }}>Warehouse: {item.warehouseName || item.warehouseId}</div>
                    </td>
                    <td>{item.quantity}</td>
                    <td>${item.unitPrice.toFixed(2)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 500 }}>
                      ${(item.quantity * item.unitPrice).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className={styles.totalsSection} style={{ padding: 'var(--spacing-lg)' }}>
              <div className={styles.totalsCard}>
                <div className={styles.totalRow}>
                  <span>Subtotal</span>
                  <span>${quotation.grandTotal?.toFixed(2) || '0.00'}</span>
                </div>
                <div className={styles.grandTotalRow}>
                  <span>Grand Total</span>
                  <span>${quotation.grandTotal?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar Content */}
        <div className={styles.sidebarCol}>
          <Card padding="lg">
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Status History</h2>
            </div>
            <div className={styles.timeline}>
              {history.map((event: any, idx: number) => (
                <div key={idx} className={styles.timelineItem}>
                  <div className={styles.timelineDot} />
                  <div className={styles.timelineContent}>
                    <span className={styles.timelineStatus}>{getStatusLabel(event.status)}</span>
                    <span className={styles.timelineDate}>{new Date(event.changedAt).toLocaleString()}</span>
                    <span className={styles.timelineUser}>By User: {event.changedByUserId.substring(0, 8)}</span>
                    {event.reason && <span style={{ fontSize: '12px', fontStyle: 'italic', color: 'var(--color-on-surface-variant)' }}>Reason: {event.reason}</span>}
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
