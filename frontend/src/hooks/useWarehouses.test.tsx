import { renderHook, waitFor, act } from '@testing-library/react';
import { useWarehouses, useCreateWarehouse, useUpdateWarehouse, useDeleteWarehouse } from './useWarehouses';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import React from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

const mockWarehouses = [
  { id: '1', tenantId: 'tenant-1', name: 'Main Hub', address: '123 Street' }
];

let callCount = 0;

const server = setupServer(
  http.get('*/api/tenant-1/inventory/warehouses', () => {
    callCount++;
    return HttpResponse.json(mockWarehouses);
  }),
  http.post('*/api/tenant-1/inventory/warehouses', async ({ request }) => {
    const body = await request.clone().json() as any;
    return HttpResponse.json({ id: '2', tenantId: 'tenant-1', ...body }, { status: 201 });
  }),
  http.put('*/api/tenant-1/inventory/warehouses/1', async ({ request }) => {
    const body = await request.clone().json() as any;
    return HttpResponse.json({ id: '1', tenantId: 'tenant-1', ...body });
  }),
  http.delete('*/api/tenant-1/inventory/warehouses/1', () => {
    return new HttpResponse(null, { status: 204 });
  })
);

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  callCount = 0;
});
afterAll(() => server.close());

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter initialEntries={['/tenant-1/inventory']}>
    <Routes>
      <Route path="/:tenantSlug/inventory" element={children} />
    </Routes>
  </MemoryRouter>
);

describe('useWarehouses hooks', () => {
  beforeEach(() => {
    callCount = 0;
  });

  it('should fetch warehouses and handle MSW stability', async () => {
    const { result, rerender } = renderHook(() => useWarehouses(), { wrapper });

    act(() => {
      result.current.fetchWarehouses();
    });
    
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.warehouses).toEqual(mockWarehouses);
  });

  it('should create warehouse', async () => {
    const { result } = renderHook(() => useCreateWarehouse(), { wrapper });
    let created;
    await waitFor(async () => {
      created = await result.current.createWarehouse({ name: 'New Hub', address: '456 Ave' });
    });
    expect(created).toMatchObject({ id: '2', name: 'New Hub' });
  });

  it('should update warehouse', async () => {
    const { result } = renderHook(() => useUpdateWarehouse(), { wrapper });
    let updated;
    await waitFor(async () => {
      updated = await result.current.updateWarehouse('1', { name: 'Updated Hub' });
    });
    expect(updated).toMatchObject({ id: '1', name: 'Updated Hub' });
  });

  it('should delete warehouse', async () => {
    const { result } = renderHook(() => useDeleteWarehouse(), { wrapper });
    await waitFor(async () => {
      await result.current.deleteWarehouse('1');
    });
    expect(result.current.error).toBeNull();
  });
});
