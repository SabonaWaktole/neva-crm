import { IProductImageRepository, IProductRepository } from '../../domain/repositories';
import { ProductInUseError } from '../../domain/inUseErrors';
import { IProductImageStorage } from '../ports/IProductImageStorage';
import { UserRole } from '../../../auth/domain/enums/UserRole';

export interface DeleteProductDTO {
  tenantId: string;
  id: string;
  authorRole: UserRole;
}

/**
 * Hard-deletes a product along with its stock levels, movement history and
 * image files.
 *
 * Products cited by a quotation are refused instead: those are financial
 * records that must keep resolving, so the caller is pointed at archiving.
 */
export class DeleteProductUseCase {
  constructor(
    private productRepo: IProductRepository,
    private imageRepo: IProductImageRepository,
    private imageStorage: IProductImageStorage
  ) {}

  async execute(dto: DeleteProductDTO): Promise<void> {
    // Deleting is destructive and unscoped by warehouse, so unlike editing it
    // stays with the business owner.
    if (dto.authorRole !== UserRole.BUSINESS_OWNER) {
      throw new Error('Unauthorized: Only Business Owners can delete products.');
    }

    const product = await this.productRepo.findById(dto.tenantId, dto.id);
    if (!product) {
      throw new Error(`Product ${dto.id} not found`);
    }

    const quotationCount = await this.productRepo.countQuotationReferences(dto.tenantId, dto.id);
    if (quotationCount > 0) {
      throw new ProductInUseError(product.name, quotationCount);
    }

    // Read the gallery before the rows go, so the files can still be found.
    const images = await this.imageRepo.findByProductId(dto.tenantId, dto.id);

    await this.productRepo.delete(dto.tenantId, dto.id);

    // Files are cleaned up only once the database has committed. An orphaned
    // file wastes disk; a missing file behind a live row breaks a page.
    await Promise.all(images.map((image) => this.imageStorage.remove(image.url)));
  }
}
