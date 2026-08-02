import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Users } from 'lucide-react';
import { Button } from '../../components/ui/Button/Button';
import { TextInput } from '../../components/ui/TextInput';
import { SelectInput } from '../../components/ui/SelectInput';
import { Badge } from '../../components/ui/Badge';
import { DataTable } from '../../components/ui/DataTable';
import type { DataTableColumn } from '../../components/ui/DataTable';
import { CreateUserModal } from './CreateUserModal';
import { useTenants } from '../../hooks/useDashboard';
import { usePlatformUsers, useCreatePlatformUser } from '../../hooks/usePlatformUsers';
import { useDateFormat } from '../../hooks/useDateFormat';
import type { CreatePlatformUserInput, PlatformUser } from '../../services/dashboardService';
import styles from './PeoplePage.module.css';

/**
 * Everyone on the platform, across every workspace.
 *
 * The console's counterpart to per-workspace Team Settings. It deliberately does
 * NOT duplicate deactivation and role changes: those already exist inside a
 * workspace, complete with the reassignment-impact warning, and an administrator
 * reaches them by entering the workspace from the Tenants page. Two
 * implementations of "who still holds this person's clients" is how the two
 * would drift apart.
 */
export const PeoplePage = () => {
  const { t } = useTranslation('dashboard');
  const dates = useDateFormat();
  const { tenants } = useTenants();
  const { users, total, isLoading, error, filters, setFilters, refresh } = usePlatformUsers();
  const {
    createUser,
    isSubmitting,
    error: createError,
    clearError,
  } = useCreatePlatformUser();

  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const handleCreate = async (
    tenantId: string,
    input: CreatePlatformUserInput
  ): Promise<boolean> => {
    const created = await createUser(tenantId, input);
    if (!created) return false;
    refresh();
    return true;
  };

  const columns: DataTableColumn<PlatformUser>[] = [
    {
      id: 'person',
      header: t('superAdmin.columnPerson'),
      cardLabel: null,
      render: (user) => {
        const name = [user.firstName, user.lastName].filter(Boolean).join(' ');
        return (
          <div className={styles.personCell}>
            {/* Name when there is one, email otherwise — an account created
                without a name still has to be identifiable in this list. */}
            <span className={styles.personName}>{name || user.email}</span>
            {name && <span className={styles.personEmail}>{user.email}</span>}
          </div>
        );
      },
    },
    {
      id: 'workspace',
      header: t('superAdmin.columnWorkspace'),
      render: (user) =>
        // Null means the platform role, which belongs to no workspace. Saying so
        // is more useful than an empty cell.
        user.tenantName ?? <span className={styles.platformCell}>{t('superAdmin.platform')}</span>,
    },
    {
      id: 'role',
      header: t('superAdmin.columnRole'),
      nowrap: true,
      render: (user) => t(`superAdmin.role${roleKey(user.role)}`),
    },
    {
      id: 'status',
      header: t('superAdmin.columnStatus'),
      nowrap: true,
      render: (user) =>
        user.isActive ? (
          <Badge variant="success">{t('superAdmin.userActive')}</Badge>
        ) : (
          <Badge variant="error">{t('superAdmin.userDeactivated')}</Badge>
        ),
    },
    {
      id: 'joined',
      header: t('superAdmin.columnDateJoined'),
      nowrap: true,
      render: (user) => (
        <span className={styles.dateCell}>
          {dates.custom(user.createdAt, { year: 'numeric', month: 'short', day: 'numeric' })}
        </span>
      ),
    },
  ];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{t('superAdmin.peopleTitle')}</h1>
          <p className={styles.subtitle}>{t('superAdmin.peopleSubtitle', { count: total })}</p>
        </div>
        <Button
          icon={<Plus size={20} />}
          onClick={() => {
            clearError();
            setIsCreateOpen(true);
          }}
          disabled={tenants.length === 0}
        >
          {t('superAdmin.newUser')}
        </Button>
      </header>

      <div className={styles.filters}>
        <TextInput
          label={t('superAdmin.filterSearch')}
          value={filters.q ?? ''}
          // Replaces the whole filter object so the effect in usePlatformUsers
          // refetches; `skip` resets because the previous page number means
          // nothing against a different result set.
          onChange={(e) => setFilters({ ...filters, q: e.target.value || undefined, skip: 0 })}
          placeholder={t('superAdmin.filterSearchPlaceholder')}
        />

        <SelectInput
          label={t('superAdmin.filterWorkspace')}
          value={filters.tenantId ?? ''}
          onChange={(e) => setFilters({ ...filters, tenantId: e.target.value || undefined, skip: 0 })}
        >
          <option value="">{t('superAdmin.filterAllWorkspaces')}</option>
          {tenants.map((tenant) => (
            <option key={tenant.id} value={tenant.id}>
              {tenant.name}
            </option>
          ))}
        </SelectInput>

        <SelectInput
          label={t('superAdmin.filterRole')}
          value={filters.role ?? ''}
          onChange={(e) => setFilters({ ...filters, role: e.target.value || undefined, skip: 0 })}
        >
          <option value="">{t('superAdmin.filterAllRoles')}</option>
          <option value="BUSINESS_OWNER">{t('superAdmin.roleBusinessOwner')}</option>
          <option value="STAFF">{t('superAdmin.roleStaff')}</option>
          <option value="SUPER_ADMIN">{t('superAdmin.roleSuperAdmin')}</option>
        </SelectInput>
      </div>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <DataTable
        columns={columns}
        rows={users}
        rowKey={(user) => user.id}
        isLoading={isLoading}
        caption={t('superAdmin.peopleTableCaption')}
        empty={{
          icon: <Users size={20} />,
          title: t('superAdmin.peopleEmptyTitle'),
          description: t('superAdmin.peopleEmptyDescription'),
        }}
      />

      <CreateUserModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        tenants={tenants}
        onSubmit={handleCreate}
        isSubmitting={isSubmitting}
        serverError={createError}
      />
    </div>
  );
};

/** Maps a stored role onto the `superAdmin.role*` translation keys. */
const roleKey = (role: PlatformUser['role']) =>
  role === 'BUSINESS_OWNER' ? 'BusinessOwner' : role === 'STAFF' ? 'Staff' : 'SuperAdmin';
