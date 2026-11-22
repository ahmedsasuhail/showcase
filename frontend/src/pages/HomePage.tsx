import { useApi } from '../api/useApi';
import type { Product } from '../api/types';
import { ProductGrid } from '../components/ProductGrid';
import { EmptyMessage, ErrorMessage, LoadingMessage } from '../components/StatusMessage';

export function HomePage() {
  const { state, retry } = useApi<{ items: Product[] }>('/products/featured');

  return (
    <>
      <h1>Top rated</h1>
      <p className="lead">Our five favourites, hand-picked by the team.</p>
      {state.status === 'loading' && <LoadingMessage>Loading top rated products…</LoadingMessage>}
      {state.status === 'error' && (
        <ErrorMessage message="We couldn’t load the top rated products." onRetry={retry} />
      )}
      {state.status === 'success' &&
        (state.data.items.length === 0 ? (
          <EmptyMessage>No top rated products are available right now.</EmptyMessage>
        ) : (
          <ProductGrid products={state.data.items} />
        ))}
    </>
  );
}
