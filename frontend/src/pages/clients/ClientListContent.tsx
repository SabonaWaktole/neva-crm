import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Plus, 
  Filter, 
  Search, 
  MoreVertical, 
  ChevronLeft, 
  ChevronRight, 
  Edit, 
} from 'lucide-react';
import { Button } from '../../components/ui/Button/Button';
import { Badge } from '../../components/ui/Badge/Badge';
import { Avatar } from '../../components/ui/Avatar/Avatar';
import { TextInput } from '../../components/ui/TextInput/TextInput';
import { DropdownMenu } from '../../components/ui/DropdownMenu/DropdownMenu';
import styles from './ClientListContent.module.css';

import { useClients } from '../../hooks/useClients';
import { useDebounce } from '../../hooks/useDebounce';

export const ClientListContent: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { tenantSlug } = useParams();
  const navigate = useNavigate();
  const { clients, total, isLoading, fetchClients } = useClients();
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    fetchClients({ name: debouncedSearchTerm });
  }, [fetchClients, debouncedSearchTerm]);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'primary';
      case 'prospect': return 'outline';
      case 'inactive': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <div className={styles.breadcrumb}>CRM &gt; Clients</div>
          <h1 className={styles.title}>Client Directory</h1>
        </div>
        <div className={styles.headerActions}>
          <Button variant="outline" icon={<Filter size={18} />}>
            Filter
          </Button>
          <Button variant="primary" icon={<Plus size={18} />} onClick={() => navigate(`/${tenantSlug}/clients/new`)}>
            Add Client
          </Button>
        </div>
      </div>

      {/* Table Card */}
      <div className={`${styles.tableCard} premium-card`}>
        {/* Toolbar */}
        <div className={styles.tableToolbar}>
          <div className={styles.searchWrapper}>
            <TextInput 
              placeholder="Search clients..." 
              iconLeft={<Search size={18} />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Client</th>
                <th>Status</th>
                <th>Assigned To</th>
                <th>Recent Activity</th>
                <th className={styles.thAction}></th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={5} style={{textAlign:'center', padding:'20px'}}>Loading...</td></tr>}
              {!isLoading && clients.map((client) => (
                <tr key={client.id}>
                  <td>
                    <div className={styles.clientCell} style={{ cursor: 'pointer' }} onClick={() => navigate(`/${tenantSlug}/clients/${client.id}`)}>
                      <Avatar 
                        src={undefined} 
                        fallback={client.name.substring(0, 2).toUpperCase()} 
                        size="md" 
                      />
                      <div className={styles.clientInfo}>
                        <span className={styles.clientName}>{client.name}</span>
                        <span className={styles.clientEmail}>{client.contactInfo?.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <Badge variant={getStatusBadgeVariant(client.status.toLowerCase()) as any}>
                      {getStatusLabel(client.status.toLowerCase())}
                    </Badge>
                  </td>
                  <td>
                    <div className={styles.assigneeCell}>
                      <Avatar src={undefined} size="sm" fallback={client.assignedUserId?.substring(0,2).toUpperCase() || 'UN'} />
                      <span className={styles.assigneeName}>{client.assignedUserId || 'Unassigned'}</span>
                    </div>
                  </td>
                  <td>
                    <span className={styles.recentActivity}>-</span>
                  </td>
                  <td className={styles.tdAction}>
                    <DropdownMenu
                      trigger={
                        <button className={styles.actionButton}>
                          <MoreVertical size={18} />
                        </button>
                      }
                      items={[
                        { id: 'view', label: 'View Details', icon: <Edit size={16} />, onClick: () => navigate(`/${tenantSlug}/clients/${client.id}`) },
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className={styles.pagination}>
          <span className={styles.paginationText}>Showing {clients.length} of {total} entries</span>
          <div className={styles.paginationControls}>
            <Button variant="outline" disabled icon={<ChevronLeft size={18} />}>
              Prev
            </Button>
            <Button variant="outline" disabled icon={<ChevronRight size={18} />} iconPosition="right">
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
