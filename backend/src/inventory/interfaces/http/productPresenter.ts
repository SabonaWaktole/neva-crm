import { ProductWithStock } from '../../domain/repositories';
import { ProductImage } from '../../domain/ProductImage';
import { srcSetFor } from '../../../media/MediaService';

/**
 * One place that decides the JSON shape of a product.
 *
 * The list, the detail endpoint and the write endpoints all return the same
 * object, so the client never has to reconcile two versions of a product.
 */

export const presentProductImage = (image: ProductImage) => ({
  id: image.id,
  url: image.url,
  url2x: image.url2x,
  // Precomputed here so every consumer gets retina support for free rather
  // than reimplementing the @1x/@2x naming convention.
  srcSet: srcSetFor(image.url),
  width: image.width,
  height: image.height,
  bytes: image.bytes,
  position: image.position,
});

export const presentProduct = (item: ProductWithStock) => {
  const { product } = item;
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    sku: product.sku,
    brand: product.brand,
    categoryId: product.categoryId,
    categoryName: item.categoryName,
    price: product.price,
    cost: product.cost,
    tags: product.tags,
    lowStockThreshold: product.lowStockThreshold,
    isArchived: product.isArchived,
    totalUnits: item.totalStock,
    availability: item.availability,
    status: item.status,
    images: item.images.map(presentProductImage),
    stockBreakdown: item.stockBreakdown ?? [],
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
};

export type PresentedProduct = ReturnType<typeof presentProduct>;
