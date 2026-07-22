import { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { warehouseService } from '../services/warehouseService';
import type { Warehouse } from '../types/inventory';

export const useWarehouses = () => {
  const { tenantSlug } = useParams();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWarehouses = useCallback(async () => {
    if (!tenantSlug) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await warehouseService.getWarehouses(tenantSlug);
      setWarehouses(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch warehouses');
    } finally {
      setIsLoading(false);
    }
  }, [tenantSlug]);

  return { warehouses, isLoading, error, fetchWarehouses };
};

export const useCreateWarehouse = () => {
  const { tenantSlug } = useParams();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createWarehouse = async (data: { name: string; address?: string }) => {
    if (!tenantSlug) throw new Error('Missing tenant context');
    setIsPending(true);
    setError(null);
    try {
      return await warehouseService.createWarehouse(tenantSlug, data);
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to create warehouse';
      setError(msg);
      throw err;
    } finally {
      setIsPending(false);
    }
  };

  return { createWarehouse, isPending, error };
};

export const useUpdateWarehouse = () => {
  const { tenantSlug } = useParams();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateWarehouse = async (warehouseId: string, data: { name?: string; address?: string }) => {
    if (!tenantSlug) throw new Error('Missing tenant context');
    setIsPending(true);
    setError(null);
    try {
      return await warehouseService.updateWarehouse(tenantSlug, warehouseId, data);
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to update warehouse';
      setError(msg);
      throw err;
    } finally {
      setIsPending(false);
    }
  };

  return { updateWarehouse, isPending, error };
};

export const useDeleteWarehouse = () => {
  const { tenantSlug } = useParams();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteWarehouse = async (warehouseId: string) => {
    if (!tenantSlug) throw new Error('Missing tenant context');
    setIsPending(true);
    setError(null);
    try {
      return await warehouseService.deleteWarehouse(tenantSlug, warehouseId);
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to delete warehouse';
      setError(msg);
      throw err;
    } finally {
      setIsPending(false);
    }
  };

  return { deleteWarehouse, isPending, error };
};
