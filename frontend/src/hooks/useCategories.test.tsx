import { renderHook, waitFor, act } from '@testing-library/react';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from './useCategories';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import React from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

const mockCategories = [
  { id: '1', tenantId: 'tenant-1', name: 'Electronics' }
];

let callCount = 0;

const server = setupServer(
  http.get('*/api/tenant-1/inventory/categories', () => {
    callCount++;
    return HttpResponse.json(mockCategories);
  }),
  http.post('*/api/tenant-1/inventory/categories', async ({ request }) => {
    const body = await request.clone().json() as any;
    return HttpResponse.json({ id: '2', tenantId: 'tenant-1', ...body }, { status: 201 });
  }),
  http.put('*/api/tenant-1/inventory/categories/1', async ({ request }) => {
    const body = await request.clone().json() as any;
    return HttpResponse.json({ id: '1', tenantId: 'tenant-1', ...body });
  }),
  http.delete('*/api/tenant-1/inventory/categories/1', () => {
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

describe('useCategories hooks', () => {
  beforeEach(() => {
    callCount = 0;
  });

  it('should fetch categories and handle MSW stability', async () => {
    const { result, rerender } = renderHook(() => useCategories(), { wrapper });

    act(() => {
      result.current.fetchCategories();
    });
    
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.categories).toEqual(mockCategories);
  });

  it('should create category', async () => {
    const { result } = renderHook(() => useCreateCategory(), { wrapper });
    let created;
    await waitFor(async () => {
      created = await result.current.createCategory({ name: 'Furniture' });
    });
    expect(created).toMatchObject({ id: '2', name: 'Furniture' });
  });

  it('should update category', async () => {
    const { result } = renderHook(() => useUpdateCategory(), { wrapper });
    let updated;
    await waitFor(async () => {
      updated = await result.current.updateCategory('1', { name: 'Updated Electronics' });
    });
    expect(updated).toMatchObject({ id: '1', name: 'Updated Electronics' });
  });

  it('should delete category', async () => {
    const { result } = renderHook(() => useDeleteCategory(), { wrapper });
    await waitFor(async () => {
      await result.current.deleteCategory('1');
    });
    expect(result.current.error).toBeNull();
  });
});
