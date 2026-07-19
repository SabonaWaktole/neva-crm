import { Request, Response } from 'express';
import { CreateProductUseCase } from '../../application/use-cases/CreateProductUseCase';
import { UpdateProductUseCase } from '../../application/use-cases/UpdateProductUseCase';
import { AdjustStockUseCase } from '../../application/use-cases/AdjustStockUseCase';
import { TransferStockUseCase } from '../../application/use-cases/TransferStockUseCase';
import { SearchProductsUseCase } from '../../application/use-cases/SearchProductsUseCase';
import { GetProductStockBreakdownUseCase } from '../../application/use-cases/GetProductStockBreakdownUseCase';
import { CreateWarehouseUseCase } from '../../application/use-cases/CreateWarehouseUseCase';
import { UpdateWarehouseUseCase } from '../../application/use-cases/UpdateWarehouseUseCase';
import { DeleteWarehouseUseCase } from '../../application/use-cases/DeleteWarehouseUseCase';
import { CreateCategoryUseCase } from '../../application/use-cases/CreateCategoryUseCase';
import { UpdateCategoryUseCase } from '../../application/use-cases/UpdateCategoryUseCase';
import { DeleteCategoryUseCase } from '../../application/use-cases/DeleteCategoryUseCase';
import { GetWarehousesUseCase } from '../../application/use-cases/GetWarehousesUseCase';
import { GetCategoriesUseCase } from '../../application/use-cases/GetCategoriesUseCase';
import { AvailabilityStatus } from '../../domain/repositories';
import { NegativeStockError } from '../../domain/errors';
import { WarehouseInUseError, CategoryInUseError } from '../../domain/inUseErrors';
import { 
  createProductSchema, updateProductSchema, adjustStockSchema, transferStockSchema, 
  createWarehouseSchema, updateWarehouseSchema, createCategorySchema, updateCategorySchema 
} from './schemas';

export class InventoryController {
  constructor(
    private createProductUseCase: CreateProductUseCase,
    private updateProductUseCase: UpdateProductUseCase,
    private adjustStockUseCase: AdjustStockUseCase,
    private transferStockUseCase: TransferStockUseCase,
    private searchProductsUseCase: SearchProductsUseCase,
    private getProductStockBreakdownUseCase: GetProductStockBreakdownUseCase,
    private createWarehouseUseCase: CreateWarehouseUseCase,
    private updateWarehouseUseCase: UpdateWarehouseUseCase,
    private deleteWarehouseUseCase: DeleteWarehouseUseCase,
    private getWarehousesUseCase: GetWarehousesUseCase,
    private createCategoryUseCase: CreateCategoryUseCase,
    private updateCategoryUseCase: UpdateCategoryUseCase,
    private deleteCategoryUseCase: DeleteCategoryUseCase,
    private getCategoriesUseCase: GetCategoriesUseCase
  ) {}

  // ======================
  // PRODUCTS
  // ======================
  searchProducts = async (req: Request, res: Response) => {
    try {
      const results = await this.searchProductsUseCase.execute({
        tenantId: req.user!.tenantId!,
        name: req.query.name as string | undefined,
        categoryId: req.query.categoryId as string | undefined,
        warehouseId: req.query.warehouseId as string | undefined,
        availability: req.query.availability as AvailabilityStatus | undefined,
        authorRole: req.user!.role as any,
      });
      res.json(results);
    } catch (error: any) {
      if (error.message.includes('Unauthorized')) return res.status(403).json({ error: error.message });
      res.status(500).json({ error: error.message });
    }
  };

  createProduct = async (req: Request, res: Response) => {
    try {
      const parsed = createProductSchema.parse(req.body);
      const result = await this.createProductUseCase.execute({
        tenantId: req.user!.tenantId!,
        authorRole: req.user!.role as any,
        ...parsed,
        categoryId: parsed.categoryId ?? null,
      });
      res.status(201).json(result);
    } catch (error: any) {
      if (error.name === 'ZodError') return res.status(400).json({ error: error.errors });
      if (error.message.includes('Unauthorized')) return res.status(403).json({ error: error.message });
      res.status(400).json({ error: error.message });
    }
  };

  updateProduct = async (req: Request, res: Response) => {
    try {
      const parsed = updateProductSchema.parse(req.body);
      const result = await this.updateProductUseCase.execute({
        tenantId: req.user!.tenantId!,
        id: req.params.id as string,
        authorRole: req.user!.role as any,
        ...parsed,
        categoryId: parsed.categoryId !== undefined ? (parsed.categoryId ?? null) : undefined,
      });
      res.json(result);
    } catch (error: any) {
      if (error.name === 'ZodError') return res.status(400).json({ error: error.errors });
      if (error.message.includes('Unauthorized')) return res.status(403).json({ error: error.message });
      if (error.message.includes('not found')) return res.status(404).json({ error: error.message });
      res.status(400).json({ error: error.message });
    }
  };

  getProductBreakdown = async (req: Request, res: Response) => {
    try {
      const result = await this.getProductStockBreakdownUseCase.execute({
        tenantId: req.user!.tenantId!,
        productId: req.params.id as string,
        authorRole: req.user!.role as any,
      });
      res.json(result);
    } catch (error: any) {
      if (error.message.includes('Unauthorized')) return res.status(403).json({ error: error.message });
      if (error.message.includes('not found')) return res.status(404).json({ error: error.message });
      res.status(400).json({ error: error.message });
    }
  };

  adjustStock = async (req: Request, res: Response) => {
    try {
      const parsed = adjustStockSchema.parse(req.body);
      const result = await this.adjustStockUseCase.execute({
        tenantId: req.user!.tenantId!,
        productId: req.params.id as string,
        authorUserId: req.user!.userId,
        authorRole: req.user!.role as any,
        warehouseId: parsed.warehouseId,
        quantityChange: parsed.quantityChange,
        reason: parsed.reason || 'Manual adjustment',
      });
      res.json(result);
    } catch (error: any) {
      if (error.name === 'ZodError') return res.status(400).json({ error: error.errors });
      if (error.message.includes('Unauthorized')) return res.status(403).json({ error: error.message });
      if (error.message.includes('not found')) return res.status(404).json({ error: error.message });
      if (error instanceof NegativeStockError) return res.status(400).json({ error: error.message });
      res.status(400).json({ error: error.message });
    }
  };

  transferStock = async (req: Request, res: Response) => {
    try {
      const parsed = transferStockSchema.parse(req.body);
      const result = await this.transferStockUseCase.execute({
        tenantId: req.user!.tenantId!,
        productId: req.params.id as string,
        authorUserId: req.user!.userId,
        authorRole: req.user!.role as any,
        ...parsed,
      });
      res.json(result);
    } catch (error: any) {
      if (error.name === 'ZodError') return res.status(400).json({ error: error.errors });
      if (error.message.includes('Unauthorized')) return res.status(403).json({ error: error.message });
      if (error.message.includes('not found')) return res.status(404).json({ error: error.message });
      if (error instanceof NegativeStockError) return res.status(400).json({ error: error.message });
      res.status(400).json({ error: error.message });
    }
  };

  // ======================
  // WAREHOUSES
  // ======================
  getWarehouses = async (req: Request, res: Response) => {
    try {
      const results = await this.getWarehousesUseCase.execute({
        tenantId: req.user!.tenantId!,
        authorRole: req.user!.role as any,
      });
      res.json(results);
    } catch (error: any) {
      if (error.message.includes('Unauthorized')) return res.status(403).json({ error: error.message });
      res.status(500).json({ error: error.message });
    }
  };

  createWarehouse = async (req: Request, res: Response) => {
    try {
      const parsed = createWarehouseSchema.parse(req.body);
      const result = await this.createWarehouseUseCase.execute({
        tenantId: req.user!.tenantId!,
        authorRole: req.user!.role as any,
        ...parsed,
      });
      res.status(201).json(result);
    } catch (error: any) {
      if (error.name === 'ZodError') return res.status(400).json({ error: error.errors });
      if (error.message.includes('Unauthorized')) return res.status(403).json({ error: error.message });
      res.status(400).json({ error: error.message });
    }
  };

  updateWarehouse = async (req: Request, res: Response) => {
    try {
      const parsed = updateWarehouseSchema.parse(req.body);
      const result = await this.updateWarehouseUseCase.execute({
        tenantId: req.user!.tenantId!,
        id: req.params.id as string,
        authorRole: req.user!.role as any,
        ...parsed,
      });
      res.json(result);
    } catch (error: any) {
      if (error.name === 'ZodError') return res.status(400).json({ error: error.errors });
      if (error.message.includes('Unauthorized')) return res.status(403).json({ error: error.message });
      if (error.message.includes('not found')) return res.status(404).json({ error: error.message });
      res.status(400).json({ error: error.message });
    }
  };

  deleteWarehouse = async (req: Request, res: Response) => {
    try {
      await this.deleteWarehouseUseCase.execute({
        tenantId: req.user!.tenantId!,
        id: req.params.id as string,
        authorRole: req.user!.role as any,
      });
      res.status(204).send();
    } catch (error: any) {
      if (error.message.includes('Unauthorized')) return res.status(403).json({ error: error.message });
      if (error.message.includes('not found')) return res.status(404).json({ error: error.message });
      if (error instanceof WarehouseInUseError) return res.status(409).json({ error: error.message });
      res.status(400).json({ error: error.message });
    }
  };

  // ======================
  // CATEGORIES
  // ======================
  getCategories = async (req: Request, res: Response) => {
    try {
      const results = await this.getCategoriesUseCase.execute({
        tenantId: req.user!.tenantId!,
        authorRole: req.user!.role as any,
      });
      res.json(results);
    } catch (error: any) {
      if (error.message.includes('Unauthorized')) return res.status(403).json({ error: error.message });
      res.status(500).json({ error: error.message });
    }
  };

  createCategory = async (req: Request, res: Response) => {
    try {
      const parsed = createCategorySchema.parse(req.body);
      const result = await this.createCategoryUseCase.execute({
        tenantId: req.user!.tenantId!,
        authorRole: req.user!.role as any,
        ...parsed,
      });
      res.status(201).json(result);
    } catch (error: any) {
      if (error.name === 'ZodError') return res.status(400).json({ error: error.errors });
      if (error.message.includes('Unauthorized')) return res.status(403).json({ error: error.message });
      res.status(400).json({ error: error.message });
    }
  };

  updateCategory = async (req: Request, res: Response) => {
    try {
      const parsed = updateCategorySchema.parse(req.body);
      const result = await this.updateCategoryUseCase.execute({
        tenantId: req.user!.tenantId!,
        id: req.params.id as string,
        authorRole: req.user!.role as any,
        ...parsed,
      });
      res.json(result);
    } catch (error: any) {
      if (error.name === 'ZodError') return res.status(400).json({ error: error.errors });
      if (error.message.includes('Unauthorized')) return res.status(403).json({ error: error.message });
      if (error.message.includes('not found')) return res.status(404).json({ error: error.message });
      res.status(400).json({ error: error.message });
    }
  };

  deleteCategory = async (req: Request, res: Response) => {
    try {
      await this.deleteCategoryUseCase.execute({
        tenantId: req.user!.tenantId!,
        id: req.params.id as string,
        authorRole: req.user!.role as any,
      });
      res.status(204).send();
    } catch (error: any) {
      if (error.message.includes('Unauthorized')) return res.status(403).json({ error: error.message });
      if (error.message.includes('not found')) return res.status(404).json({ error: error.message });
      if (error instanceof CategoryInUseError) return res.status(409).json({ error: error.message });
      res.status(400).json({ error: error.message });
    }
  };
}

