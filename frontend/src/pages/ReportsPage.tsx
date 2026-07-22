import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { useReports } from '../hooks/useReports';
import { Sidebar } from '../components/layout/Sidebar/Sidebar';
import { AppLayout } from '../components/layout/AppLayout/AppLayout';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import type { NavItem } from '../components/layout/Sidebar/Sidebar';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const mockNavItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'clients', label: 'Clients', icon: 'group' },
  { id: 'appointments', label: 'Appointments', icon: 'event' },
  { id: 'inventory', label: 'Products & Stock', icon: 'inventory_2' },
  { id: 'quotations', label: 'Quotations', icon: 'request_quote' },
  { id: 'reports', label: 'Reports', icon: 'bar_chart' },
];

export const ReportsPage: React.FC = () => {
  const user = useAuthStore(state => state.user);
  const tenantSlug = user?.tenantSlug;
  const roleName = user?.role;
  const userName = user?.firstName ? `${user.firstName} ${user.lastName || ''}` : user?.email || 'User';
  
  const logout = useAuthStore(state => state.logout);
  const { revenue, clients, inventory, loading, error, refresh } = useReports();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const sidebarElement = (
    <Sidebar 
      orgName={tenantSlug || 'Workspace'} 
      orgTier={roleName || ''} 
      navItems={mockNavItems} 
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
        <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <div style={{ color: 'var(--color-on-surface-variant)' }}>Loading reports...</div>
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
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <header style={{ 
          backgroundColor: 'var(--color-surface)', 
          borderBottom: '1px solid var(--color-outline-variant)', 
          padding: 'var(--spacing-lg) var(--spacing-xl)', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexShrink: 0 
        }}>
          <h1 style={{ margin: 0, fontSize: 'var(--font-size-headline-sm)', color: 'var(--color-on-surface)' }}>Reports & Analytics</h1>
          <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
            <button 
              onClick={refresh}
              style={{
                backgroundColor: 'transparent',
                border: '1px solid var(--color-outline)',
                color: 'var(--color-on-surface)',
                padding: 'var(--spacing-xs) var(--spacing-sm)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer'
              }}
            >
              Refresh Data
            </button>
          </div>
        </header>

        <main style={{ flex: 1, overflowY: 'auto', padding: 'var(--spacing-xl)' }}>
          {error && (
            <div style={{ backgroundColor: 'var(--color-error-container)', color: 'var(--color-on-error-container)', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--spacing-lg)' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 'var(--spacing-xl)' }}>
            
            {/* Revenue Chart */}
            <div style={{ backgroundColor: 'var(--color-surface)', padding: 'var(--spacing-lg)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-outline-variant)' }}>
              <h2 style={{ fontSize: 'var(--font-size-title-md)', color: 'var(--color-on-surface)', marginBottom: 'var(--spacing-lg)', marginTop: 0 }}>Monthly Revenue</h2>
              <div style={{ height: '320px' }}>
                {revenue.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenue}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value: number) => `$${value}`} />
                      <Tooltip formatter={(value: any) => [`$${value}`, 'Revenue']} />
                      <Legend />
                      <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-on-surface-variant)' }}>No revenue data available</div>
                )}
              </div>
            </div>

            {/* Client Status Chart */}
            <div style={{ backgroundColor: 'var(--color-surface)', padding: 'var(--spacing-lg)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-outline-variant)' }}>
              <h2 style={{ fontSize: 'var(--font-size-title-md)', color: 'var(--color-on-surface)', marginBottom: 'var(--spacing-lg)', marginTop: 0 }}>Client Distribution</h2>
              <div style={{ height: '320px' }}>
                {clients.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={clients}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={120}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="count"
                        nameKey="status"
                        label={(props: any) => `${props.name} ${(props.percent * 100).toFixed(0)}%`}
                      >
                        {clients.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-on-surface-variant)' }}>No client data available</div>
                )}
              </div>
            </div>

            {/* Inventory Chart */}
            <div style={{ gridColumn: '1 / -1', backgroundColor: 'var(--color-surface)', padding: 'var(--spacing-lg)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-outline-variant)' }}>
              <h2 style={{ fontSize: 'var(--font-size-title-md)', color: 'var(--color-on-surface)', marginBottom: 'var(--spacing-lg)', marginTop: 0 }}>Inventory Value by Warehouse</h2>
              <div style={{ height: '320px' }}>
                {inventory.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={inventory} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="warehouseName" />
                      <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" tickFormatter={(value: number) => `$${value}`} />
                      <YAxis yAxisId="right" orientation="right" stroke="#10b981" />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="totalValue" name="Total Value ($)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar yAxisId="right" dataKey="totalItems" name="Total Items" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-on-surface-variant)' }}>No inventory data available</div>
                )}
              </div>
            </div>

          </div>
        </main>
      </div>
    </AppLayout>
  );
};
