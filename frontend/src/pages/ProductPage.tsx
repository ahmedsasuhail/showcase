import { Link, useParams } from 'react-router';
import { useApi } from '../api/useApi';
import type { Product } from '../api/types';
import { Price } from '../components/Price';
import { ErrorMessage, LoadingMessage } from '../components/StatusMessage';

export function ProductPage() {
  const { id = '' } = useParams();
  const { state, retry } = useApi<Product>(`/products/${encodeURIComponent(id)}`);

  if (state.status === 'loading') return <LoadingMessage>Loading product…</LoadingMessage>;

  if (state.status === 'error') {
    if (state.error.status === 404) {
      return (
        <>
          <h1>Product not found</h1>
          <p>
            <Link to="/">Back to the catalogue</Link>
          </p>
        </>
      );
    }
    return <ErrorMessage message="We couldn’t load this product." onRetry={retry} />;
  }

  const product = state.data;
  return (
    <article className="product-detail">
      <img src={product.imageUrl} alt={product.title} />
      <div>
        <p>
          <Link to={`/categories/${product.category.slug}`}>{product.category.name}</Link>
        </p>
        <h1>{product.title}</h1>
        <p className="product-meta">
          <Price amount={product.price} currency={product.currency} />
          {product.rating !== null && <span>Rated {product.rating} out of 5</span>}
        </p>
        <p>{product.description}</p>
      </div>
    </article>
  );
}
