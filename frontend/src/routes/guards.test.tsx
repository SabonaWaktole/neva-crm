import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleGuard } from './RoleGuard';
import { TenantGuard } from './TenantGuard';
import { useAuthStore } from '../store/useAuthStore';

describe('Route Guards', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, isAuthenticated: false, isInitializing: false });
  });

  describe('ProtectedRoute', () => {
    it('shows loading if initializing', () => {
      useAuthStore.setState({ isInitializing: true });
      render(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route path="/protected" element={<ProtectedRoute><p>Protected Content</p></ProtectedRoute>} />
          </Routes>
        </MemoryRouter>
      );
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      // Assume we render null or a loading spinner
    });

    it('redirects to /login if unauthenticated', () => {
      render(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route path="/protected" element={<ProtectedRoute><p>Protected Content</p></ProtectedRoute>} />
            <Route path="/login" element={<p>Login Page</p>} />
          </Routes>
        </MemoryRouter>
      );
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });

    it('renders children if authenticated', () => {
      useAuthStore.setState({ 
        isAuthenticated: true, 
        user: { userId: '1', role: 'STAFF', tenantId: 'tenant-1', tenantSlug: 'tenant-1', email: 'test@example.com' } 
      });
      render(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route path="/protected" element={<ProtectedRoute><p>Protected Content</p></ProtectedRoute>} />
          </Routes>
        </MemoryRouter>
      );
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  describe('RoleGuard', () => {
    it('blocks user without required role and renders fallback', () => {
      useAuthStore.setState({ 
        isAuthenticated: true, 
        user: { userId: '1', role: 'STAFF', tenantId: 'tenant-1', tenantSlug: 'tenant-1', email: 'test@example.com' } 
      });
      render(
        <MemoryRouter initialEntries={['/admin-only']}>
          <Routes>
            <Route path="/admin-only" element={
              <RoleGuard allowedRoles={['BUSINESS_OWNER', 'SUPER_ADMIN']}>
                <p>Admin Content</p>
              </RoleGuard>
            } />
          </Routes>
        </MemoryRouter>
      );
      expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
    });

    it('allows user with required role', () => {
      useAuthStore.setState({ 
        isAuthenticated: true, 
        user: { userId: '1', role: 'BUSINESS_OWNER', tenantId: 'tenant-1', tenantSlug: 'tenant-1', email: 'test@example.com' } 
      });
      render(
        <MemoryRouter initialEntries={['/admin-only']}>
          <Routes>
            <Route path="/admin-only" element={
              <RoleGuard allowedRoles={['BUSINESS_OWNER', 'SUPER_ADMIN']}>
                <p>Admin Content</p>
              </RoleGuard>
            } />
          </Routes>
        </MemoryRouter>
      );
      expect(screen.getByText('Admin Content')).toBeInTheDocument();
    });
  });

  describe('TenantGuard', () => {
    it('blocks user authenticated for a different tenant', () => {
      useAuthStore.setState({ 
        isAuthenticated: true, 
        user: { userId: '1', role: 'STAFF', tenantId: 'id-A', tenantSlug: 'tenant-A', email: 'test@example.com' } 
      });
      render(
        <MemoryRouter initialEntries={['/tenant-B/dashboard']}>
          <Routes>
            <Route path="/:tenantSlug" element={<TenantGuard />}>
              <Route path="dashboard" element={<p>Tenant B Dashboard</p>} />
            </Route>
            <Route path="/unauthorized" element={<p>Unauthorized</p>} />
          </Routes>
        </MemoryRouter>
      );
      expect(screen.queryByText('Tenant B Dashboard')).not.toBeInTheDocument();
      expect(screen.getByText('Unauthorized')).toBeInTheDocument();
    });

    it('allows user authenticated for the same tenant', () => {
      useAuthStore.setState({ 
        isAuthenticated: true, 
        user: { userId: '1', role: 'STAFF', tenantId: 'id-A', tenantSlug: 'tenant-A', email: 'test@example.com' } 
      });
      render(
        <MemoryRouter initialEntries={['/tenant-A/dashboard']}>
          <Routes>
            <Route path="/:tenantSlug" element={<TenantGuard />}>
              <Route path="dashboard" element={<p>Tenant A Dashboard</p>} />
            </Route>
          </Routes>
        </MemoryRouter>
      );
      expect(screen.getByText('Tenant A Dashboard')).toBeInTheDocument();
    });
  });
});
