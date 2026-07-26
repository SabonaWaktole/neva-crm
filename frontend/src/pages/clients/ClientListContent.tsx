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
  Users,
} from 'lucide-react';
import { Button } from '../../components/ui/Button/Button';
import { Badge } from '../../components/ui/Badge/Badge';
import { Avatar } from '../../components/ui/Avatar/Avatar';
import { TextInput } from '../../components/ui/TextInput/TextInput';
import { DataTable } from '../../components/ui/DataTable';
import type { DataTableColumn } from '../../components/ui/DataTable';
import { DropdownMenu } from '../../components/ui/DropdownMenu/DropdownMenu';
import styles from './ClientListContent.module.css';

import { useClients } from '../../hooks/useClients';
import { useTeam } from '../../hooks/useTeam';
import { findPersonById, getStaffDisplayName, getStaffInitials } from '../../utils/userUtils';
import { useDebounce } from '../../hooks/useDebounce';

export const ClientListContent: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { tenantSlug } = useParams();
  const navigate = useNavigate();
  const { clients, total, isLoading, fetchClients } = useClients();
  // Only the staff list is needed here; fetchPendingInvitations is a
  // Business-Owner-only endpoint and is deliberately not called.
  const { staff, fetchStaff } = useTeam();
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  useEffect(() => {
    // One box, matched across name / email / phone — SRS §6.2.
    fetchClients({ search: debouncedSearchTerm });
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

  type ClientRow = (typeof clients)[number];

  const columns: DataTableColumn<ClientRow>[] = [
    {
      id: 'client',
      header: 'Client',
      cardLabel: null,
      render: (client) => (
        <div className={styles.clientCell}>
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
      ),
    },
    {
      id: 'status',
      header: 'Status',
      render: (client) => (
        <Badge variant={getStatusBadgeVariant(client.status.toLowerCase()) as any}>
          {getStatusLabel(client.status.toLowerCase())}
        </Badge>
      ),
    },
    {
      id: 'assigned',
      header: 'Assigned To',
      render: (client) => {
        // Resolve the stored id to a person; previously both the avatar and the
        // label rendered raw UUID fragments.
        const assignee = findPersonById(staff, client.assignedUserId);
        return (
          <div className={styles.assigneeCell}>
            <Avatar src={undefined} size="sm" fallback={getStaffInitials(assignee)} />
            <span className={styles.assigneeName}>{getStaffDisplayName(assignee)}</span>
          </div>
        );
      },
    },
    {
      id: 'activity',
      header: 'Recent Activity',
      render: () => <span className={styles.recentActivity}>-</span>,
    },
    {
      id: 'actions',
      header: '',
      align: 'right',
      width: '64px',
      cardLabel: null,
      render: (client) => (
        <DropdownMenu
          trigger={
            <button className={styles.actionButton} aria-label={`Actions for ${client.name}`}>
              <MoreVertical size={18} />
            </button>
          }
          items={[
            {
              id: 'view',
              label: 'View Details',
              icon: <Edit size={16} />,
              onClick: () => navigate(`/${tenantSlug}/clients/${client.id}`),
            },
          ]}
        />
      ),
    },
  ];

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
              placeholder="Search by name, email or phone..."
              iconLeft={<Search size={18} />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          rows={clients}
          rowKey={(client) => client.id}
          isLoading={isLoading}
          caption="Client directory"
          className={styles.table}
          onRowClick={(client) => navigate(`/${tenantSlug}/clients/${client.id}`)}
          empty={{
            icon: <Users size={20} />,
            title: searchTerm ? 'No matching clients' : 'No clients yet',
            description: searchTerm
              ? `No clients match "${searchTerm}". Try a different search.`
              : 'Clients you add will appear here.',
            action: searchTerm ? undefined : (
              <Button
                variant="primary"
                icon={<Plus size={18} />}
                onClick={() => navigate(`/${tenantSlug}/clients/new`)}
              >
                Add Client
              </Button>
            ),
          }}
        />

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
