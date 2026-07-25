import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  ChevronLeft, 
  ChevronRight, 
  Edit,
  FileText
} from 'lucide-react';
import { Button } from '../../components/ui/Button/Button';
import { TextInput } from '../../components/ui/TextInput/TextInput';
import { DropdownMenu } from '../../components/ui/DropdownMenu/DropdownMenu';
import { Badge } from '../../components/ui/Badge/Badge';
import type { BadgeProps } from '../../components/ui/Badge/Badge';
import styles from './QuotationListContent.module.css';

import { useQuotations, usePendingApprovals } from '../../hooks/useQuotations';
import { useDebounce } from '../../hooks/useDebounce';
import { useAuthStore } from '../../store/useAuthStore';

export const QuotationListContent: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'DRAFT' | 'PENDING_APPROVAL' | 'SENT' | 'COMPLETED'>('ALL');
  const { tenantSlug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const isOwner = user?.role === 'BUSINESS_OWNER';

  const { fetchQuotations, loading: loadingAll } = useQuotations();
  const { fetchPendingApprovals, loading: loadingPending } = usePendingApprovals();
  
  const [quotations, setQuotations] = useState<any[]>([]);
  const [total, setTotal] = useState(0);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    const loadData = async () => {
      try {
        if (activeTab === 'PENDING_APPROVAL') {
          const data = await fetchPendingApprovals();
          // Filter locally if there's a search term (simple fallback)
          const filtered = debouncedSearchTerm 
            ? data.filter((q: any) => q.clientName?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) || q.id.includes(debouncedSearchTerm))
            : data;
          setQuotations(filtered);
          setTotal(filtered.length);
        } else {
          const response = await fetchQuotations({ query: debouncedSearchTerm });
          
          let filteredList = response.data || [];
          if (activeTab === 'DRAFT') filteredList = filteredList.filter((q: any) => q.status === 'DRAFT');
          if (activeTab === 'SENT') filteredList = filteredList.filter((q: any) => q.status === 'SENT');
          if (activeTab === 'COMPLETED') filteredList = filteredList.filter((q: any) => ['ACCEPTED', 'REJECTED', 'EXPIRED'].includes(q.status));
          
          setQuotations(filteredList);
          // If we filter locally, total might be off, but for MVP it's acceptable
          setTotal(activeTab === 'ALL' ? response.total : filteredList.length);
        }
      } catch (error) {
        console.error('Failed to load quotations', error);
      }
    };
    loadData();
  }, [fetchQuotations, fetchPendingApprovals, debouncedSearchTerm, activeTab]);

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

  const getStatusLabel = (status: string) => {
    if (status === 'PENDING_APPROVAL') return 'Pending Approval';
    if (status === 'MARK_ACCEPTED') return 'Accepted';
    if (status === 'MARK_REJECTED') return 'Rejected';
    return status.charAt(0) + status.slice(1).toLowerCase();
  };

  const isLoading = loadingAll || loadingPending;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <div className={styles.breadcrumb}>CRM &gt; Quotations</div>
          <h1 className={styles.title}>Quotations</h1>
        </div>
        <div className={styles.headerActions}>
          <Button variant="primary" icon={<Plus size={18} />} onClick={() => navigate(`/${tenantSlug}/quotations/new`)}>
            Create Quotation
          </Button>
        </div>
      </div>

      {/* Table Card */}
      <div className={styles.tableCard}>
        {/* Toolbar */}
        <div className={styles.tableToolbar}>
          <div className={styles.tabs}>
            <button 
              className={`${styles.tab} ${activeTab === 'ALL' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('ALL')}
            >
              All Quotations
            </button>
            <button 
              className={`${styles.tab} ${activeTab === 'DRAFT' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('DRAFT')}
            >
              Draft
            </button>
            {isOwner && (
              <button 
                className={`${styles.tab} ${activeTab === 'PENDING_APPROVAL' ? styles.tabActive : ''}`}
                onClick={() => setActiveTab('PENDING_APPROVAL')}
              >
                Pending Approvals
              </button>
            )}
            <button 
              className={`${styles.tab} ${activeTab === 'SENT' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('SENT')}
            >
              Sent
            </button>
            <button 
              className={`${styles.tab} ${activeTab === 'COMPLETED' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('COMPLETED')}
            >
              Completed
            </button>
          </div>
          <div className={styles.searchWrapper}>
            <TextInput 
              placeholder="Filter by client or quote ID..." 
              iconLeft={<Search size={18} />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Content */}
        <div className={styles.tableContainer}>
          {!isLoading && quotations.length === 0 ? (
            <div className={styles.emptyState}>
              <FileText className={styles.emptyStateIcon} size={48} />
              <h3 className={styles.emptyStateTitle}>
                {searchTerm ? 'No search results' : 'No quotations yet'}
              </h3>
              <p className={styles.emptyStateMessage}>
                {searchTerm 
                  ? 'Try adjusting your search filters to find what you are looking for.' 
                  : 'Create your first quotation to start sending proposals to clients.'}
              </p>
              {!searchTerm && (
                <Button variant="primary" icon={<Plus size={18} />} onClick={() => navigate(`/${tenantSlug}/quotations/new`)}>
                  Create Quotation
                </Button>
              )}
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Quotation ID</th>
                  <th>Client</th>
                  <th>Date Created</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th className={styles.tdAction}></th>
                </tr>
              </thead>
              <tbody>
                {isLoading && <tr><td colSpan={6} style={{textAlign:'center', padding:'20px'}}>Loading...</td></tr>}
                {!isLoading && quotations.map((quotation) => {
                  return (
                    <tr key={quotation.id}>
                      <td>
                        <span className={styles.quoteIdLink} onClick={() => navigate(`/${tenantSlug}/quotations/${quotation.id}`)}>
                          {quotation.id.split('-')[0].toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <span className={styles.clientName}>{quotation.clientName || 'Unknown Client'}</span>
                      </td>
                      <td>
                        <span className={styles.mutedText}>
                          {new Date(quotation.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td>
                        <span className={styles.amountText}>
                          ${quotation.grandTotal?.toLocaleString() || '0.00'}
                        </span>
                      </td>
                      <td>
                        <Badge variant={getStatusBadgeVariant(quotation.status)}>
                          {getStatusLabel(quotation.status)}
                        </Badge>
                      </td>
                      <td className={styles.tdAction}>
                        <DropdownMenu
                          trigger={
                            <button className={styles.actionButton}>
                              <MoreVertical size={18} />
                            </button>
                          }
                          items={[
                            { id: 'view', label: 'View Details', icon: <FileText size={16} />, onClick: () => navigate(`/${tenantSlug}/quotations/${quotation.id}`) },
                            { id: 'edit', label: 'Edit', icon: <Edit size={16} />, onClick: () => navigate(`/${tenantSlug}/quotations/${quotation.id}/edit`) },
                          ]}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        {quotations.length > 0 && (
          <div className={styles.pagination}>
            <span className={styles.paginationText}>Showing {quotations.length} of {total} entries</span>
            <div className={styles.paginationControls}>
              <Button variant="outline" disabled icon={<ChevronLeft size={18} />}>
                Prev
              </Button>
              <Button variant="outline" disabled icon={<ChevronRight size={18} />} iconPosition="right">
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
