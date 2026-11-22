import { Link } from 'react-router';
import type { Product } from '../api/types';
import { Price } from './Price';

/** The whole tile is one link to the product page. */
export function ProductCard({ product }: { product: Product }) {
  return (
    <Link to={`/products/${product.id}`} className="product-card">
      <img src={product.imageUrl} alt={product.title} loading="lazy" />
      <span className="product-title">{product.title}</span>
      <p className="product-meta">
        <Price amount={product.price} currency={product.currency} />
        {product.rating !== null && <span>Rated {product.rating} out of 5</span>}
      </p>
    </Link>
  );
}
