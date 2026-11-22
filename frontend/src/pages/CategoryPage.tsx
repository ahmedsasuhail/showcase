import { Link, useParams } from 'react-router';
import { useApi } from '../api/useApi';
import type { CategoryProducts } from '../api/types';
import { ProductGrid } from '../components/ProductGrid';
import { ErrorMessage, LoadingMessage } from '../components/StatusMessage';

export function CategoryPage() {
  const { slug = '' } = useParams();
  const { state, retry } = useApi<CategoryProducts>(`/categories/${encodeURIComponent(slug)}/products`);

  if (state.status === 'loading') return <LoadingMessage>Loading products…</LoadingMessage>;

  if (state.status === 'error') {
    if (state.error.status === 404) {
      return (
        <>
          <h1>Category not found</h1>
          <p>
            <Link to="/">Back to the catalogue</Link>
          </p>
        </>
      );
    }
    return <ErrorMessage message="We couldn’t load this category." onRetry={retry} />;
  }

  const { category, topRated, additional } = state.data;
  return (
    <>
      <h1>{category.name}</h1>
      {topRated.length > 0 && (
        <section aria-labelledby="top-rated-heading">
          <h2 id="top-rated-heading">Top rated in {category.name}</h2>
          <ProductGrid products={topRated} />
        </section>
      )}
      {additional.length > 0 && (
        <section aria-labelledby="more-heading">
          <h2 id="more-heading">More in {category.name}</h2>
          <ProductGrid products={additional} />
        </section>
      )}
      {topRated.length === 0 && additional.length === 0 && <p role="status">There are no products in this category yet.</p>}
    </>
  );
}
