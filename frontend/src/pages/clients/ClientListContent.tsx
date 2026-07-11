import { useState } from 'react';
import {} from 'react';
import { 
  Plus, 
  Filter, 
  Search, 
  MoreVertical, 
  ChevronLeft, 
  ChevronRight, 
  Mail, 
  Phone, 
  Edit, 
  Trash2
} from 'lucide-react';
import { Button } from '../../components/ui/Button/Button';
import { Badge } from '../../components/ui/Badge/Badge';
import { Avatar } from '../../components/ui/Avatar/Avatar';
import { TextInput } from '../../components/ui/TextInput/TextInput';
import { DropdownMenu } from '../../components/ui/DropdownMenu/DropdownMenu';
import styles from './ClientListContent.module.css';

const MOCK_CLIENTS = [
  {
    id: 'CL-1001',
    name: 'Acme Corporation',
    email: 'contact@acmecorp.com',
    avatar: 'https://i.pravatar.cc/150?u=1001',
    status: 'active',
    assignedTo: {
      name: 'Sarah Jenkins',
      avatar: 'https://i.pravatar.cc/150?u=sarah',
    },
    recentActivity: 'Email sent 2 hrs ago',
  },
  {
    id: 'CL-1002',
    name: 'Globex Inc',
    email: 'info@globex.com',
    avatar: undefined,
    fallback: 'GI',
    status: 'prospect',
    assignedTo: {
      name: 'Mike Ross',
      avatar: 'https://i.pravatar.cc/150?u=mike',
    },
    recentActivity: 'Meeting scheduled',
  },
  {
    id: 'CL-1003',
    name: 'Initech',
    email: 'billing@initech.com',
    avatar: 'https://i.pravatar.cc/150?u=1003',
    status: 'inactive',
    assignedTo: {
      name: 'Sarah Jenkins',
      avatar: 'https://i.pravatar.cc/150?u=sarah',
    },
    recentActivity: 'Account suspended',
  },
  {
    id: 'CL-1004',
    name: 'Stark Industries',
    email: 'tony@stark.com',
    avatar: 'https://i.pravatar.cc/150?u=1004',
    status: 'active',
    assignedTo: {
      name: 'Mike Ross',
      avatar: 'https://i.pravatar.cc/150?u=mike',
    },
    recentActivity: 'Contract renewed',
  }
];

export const ClientListContent: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

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
          <Button variant="primary" icon={<Plus size={18} />}>
            Add Client
          </Button>
        </div>
      </div>

      {/* Table Card */}
      <div className={styles.tableCard}>
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
              {MOCK_CLIENTS.map((client) => (
                <tr key={client.id}>
                  <td>
                    <div className={styles.clientCell}>
                      <Avatar 
                        src={client.avatar} 
                        fallback={client.fallback || client.name.substring(0, 2).toUpperCase()} 
                        size="md" 
                      />
                      <div className={styles.clientInfo}>
                        <span className={styles.clientName}>{client.name}</span>
                        <span className={styles.clientEmail}>{client.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <Badge variant={getStatusBadgeVariant(client.status) as any}>
                      {getStatusLabel(client.status)}
                    </Badge>
                  </td>
                  <td>
                    <div className={styles.assigneeCell}>
                      <Avatar src={client.assignedTo.avatar} size="sm" />
                      <span className={styles.assigneeName}>{client.assignedTo.name}</span>
                    </div>
                  </td>
                  <td>
                    <span className={styles.recentActivity}>{client.recentActivity}</span>
                  </td>
                  <td className={styles.tdAction}>
                    <DropdownMenu
                      trigger={
                        <button className={styles.actionButton}>
                          <MoreVertical size={18} />
                        </button>
                      }
                      items={[
                        { id: 'view', label: 'View Details', icon: <Edit size={16} />, onClick: () => {} },
                        { id: 'email', label: 'Send Email', icon: <Mail size={16} />, onClick: () => {} },
                        { id: 'call', label: 'Log Call', icon: <Phone size={16} />, onClick: () => {} },
                        { id: 'delete', label: 'Delete', icon: <Trash2 size={16} />, danger: true, onClick: () => {} },
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
          <span className={styles.paginationText}>Showing 1 to {MOCK_CLIENTS.length} of {MOCK_CLIENTS.length} entries</span>
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
