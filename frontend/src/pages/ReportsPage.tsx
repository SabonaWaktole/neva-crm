import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { AlertCircle, BarChart3 } from 'lucide-react';
import { useReports } from '../hooks/useReports';
import { Sidebar } from '../components/layout/Sidebar/Sidebar';
import { AppLayout } from '../components/layout/AppLayout/AppLayout';
import { Button } from '../components/ui/Button/Button';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNavigation } from '../hooks/useNavigation';
import { useMoneyFormat } from '../hooks/useMoneyFormat';
import styles from './ReportsPage.module.css';

/**
 * Fixed categorical order, read from the validated chart tokens. Slots are
 * assigned by index and never cycled — see the note in tokens.css.
 */
const COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--chart-6)',
];

/** Shared tooltip so every chart on the page reads identically. */
const ChartTooltip: React.FC<{
  active?: boolean;
  payload?: any[];
  label?: string;
  format?: (value: number) => string;
}> = ({ active, payload, label, format }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.tooltip}>
      {label !== undefined && <div className={styles.tooltipLabel}>{label}</div>}
      {payload.map((entry, index) => (
        <div className={styles.tooltipRow} key={`${entry.name}-${index}`}>
          <span className={styles.tooltipName}>
            <span
              className={styles.tooltipSwatch}
              style={{ backgroundColor: entry.color ?? entry.payload?.fill }}
            />
            {entry.name}
          </span>
          <span className={styles.tooltipValue}>
            {format ? format(Number(entry.value)) : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

const EmptyChart: React.FC<{ message: string }> = ({ message }) => (
  <div className={styles.emptyChart}>
    <BarChart3 size={22} strokeWidth={1.5} />
    <span>{message}</span>
  </div>
);

const axisProps = {
  stroke: 'var(--chart-axis)',
  tickLine: false,
  axisLine: false,
  tick: { fontSize: 12 },
} as const;

export const ReportsPage: React.FC = () => {
  const { t } = useTranslation('dashboard');
  const user = useAuthStore(state => state.user);
  const tenantSlug = user?.tenantSlug;
  const roleName = user?.role;
  const userName = user?.firstName ? `${user.firstName} ${user.lastName || ''}` : user?.email || 'User';

  const logout = useAuthStore(state => state.logout);
  // Both the tooltip amounts and the axis ticks come from here, so the tenant's
  // currency drives the whole page rather than just the tooltips.
  const { formatWhole: formatCurrency, formatCompact: compactCurrency } = useMoneyFormat();
  const { revenue, clients, inventory, loading, error, refresh } = useReports();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = useNavigation(user, location.pathname);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const sidebarElement = (
    <Sidebar
      orgName={tenantSlug || 'Workspace'}
      orgTier={roleName || ''}
      navItems={navItems}
      onNavItemClick={(id) => navigate(`/${tenantSlug}/${id}`)}
      onLogoutClick={handleLogout}
    />
  );

  if (loading) {
    return (
      <AppLayout
        userName={userName}
        onLogout={handleLogout}
        onSettingsClick={() => navigate(`/${tenantSlug}/settings/profile`)}
        sidebar={sidebarElement}
      >
        <div className={styles.page}>
          <div className={styles.header}>
            <div className={styles.headerContent}>
              <h1 className={styles.title}>{t('reports.title')}</h1>
              <p className={styles.subtitle}>{t('reports.loading')}</p>
            </div>
          </div>
          {/* Skeletons in the final layout, so nothing jumps when data lands. */}
          <div className={styles.loadingGrid} aria-busy="true" aria-label={t('reports.loadingAria')}>
            <div className={`${styles.skeletonCard} skeleton`} />
            <div className={`${styles.skeletonCard} skeleton`} />
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      userName={userName}
      onLogout={handleLogout}
      onSettingsClick={() => navigate(`/${tenantSlug}/settings/profile`)}
      sidebar={sidebarElement}
    >
      <div className={styles.page}>
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <h1 className={styles.title}>{t('reports.title')}</h1>
            <p className={styles.subtitle}>{t('reports.subtitle')}</p>
          </div>
          <Button variant="outline" onClick={refresh}>
            {t('reports.refresh')}
          </Button>
        </header>

        <main className={styles.main}>
          {error && (
            <div className={styles.errorBanner} role="alert">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className={styles.grid}>
            {/* Revenue Chart */}
            <div className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <h2 className={styles.chartTitle}>{t('reports.monthlyRevenue')}</h2>
                <p className={styles.chartCaption}>{t('reports.monthlyRevenueCaption')}</p>
              </div>
              <div className={styles.chartBody}>
                {revenue.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenue} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                      <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
                      <XAxis dataKey="month" {...axisProps} />
                      <YAxis tickFormatter={compactCurrency} width={56} {...axisProps} />
                      <Tooltip
                        content={<ChartTooltip format={(v) => formatCurrency(v)} />}
                        cursor={{ stroke: 'var(--border-strong)', strokeWidth: 1 }}
                      />
                      {/* Single series: the card title names it, so no legend box. */}
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        name="Revenue"
                        stroke="var(--chart-1)"
                        strokeWidth={2}
                        dot={{ r: 3, strokeWidth: 0, fill: 'var(--chart-1)' }}
                        activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--color-surface-container-lowest)' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart message={t('reports.noRevenue')} />
                )}
              </div>
            </div>

            {/* Client Status Chart */}
            <div className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <h2 className={styles.chartTitle}>{t('reports.clientDistribution')}</h2>
                <p className={styles.chartCaption}>{t('reports.clientDistributionCaption')}</p>
              </div>
              <div className={styles.chartBody}>
                {clients.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={clients}
                        cx="50%"
                        cy="50%"
                        innerRadius={68}
                        outerRadius={104}
                        paddingAngle={2}
                        dataKey="count"
                        nameKey="status"
                        stroke="var(--color-surface-container-lowest)"
                        strokeWidth={2}
                      >
                        {clients.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                      <Legend
                        verticalAlign="bottom"
                        iconType="circle"
                        iconSize={8}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart message={t('reports.noClients')} />
                )}
              </div>
            </div>

            {/*
              Inventory was one chart with two y-axes (dollars on the left,
              item counts on the right). Two scales on one plot make the
              series look comparable when they are not, so the same data is
              now shown as two charts sharing an x-axis.
            */}
            <div className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <h2 className={styles.chartTitle}>{t('reports.inventoryValue')}</h2>
                <p className={styles.chartCaption}>{t('reports.inventoryValueCaption')}</p>
              </div>
              <div className={styles.chartBody}>
                {inventory.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={inventory} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                      <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
                      <XAxis dataKey="warehouseName" {...axisProps} />
                      <YAxis tickFormatter={compactCurrency} width={56} {...axisProps} />
                      <Tooltip
                        content={<ChartTooltip format={(v) => formatCurrency(v)} />}
                        cursor={{ fill: 'var(--color-primary-a10)' }}
                      />
                      <Bar
                        dataKey="totalValue"
                        name="Total value"
                        fill="var(--chart-1)"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={44}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart message="No inventory data yet" />
                )}
              </div>
            </div>

            <div className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <h2 className={styles.chartTitle}>{t('reports.itemsHeld')}</h2>
                <p className={styles.chartCaption}>{t('reports.itemsHeldCaption')}</p>
              </div>
              <div className={styles.chartBody}>
                {inventory.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={inventory} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                      <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
                      <XAxis dataKey="warehouseName" {...axisProps} />
                      <YAxis width={48} {...axisProps} />
                      <Tooltip
                        content={<ChartTooltip />}
                        cursor={{ fill: 'var(--color-primary-a10)' }}
                      />
                      <Bar
                        dataKey="totalItems"
                        name="Total items"
                        fill="var(--chart-2)"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={44}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart message="No inventory data yet" />
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </AppLayout>
  );
};
