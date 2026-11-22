import { useSearchParams } from 'react-router';
import { useApi } from '../api/useApi';
import type { SearchResults as SearchResultsData } from '../api/types';
import { ProductGrid } from '../components/ProductGrid';
import { EmptyMessage, ErrorMessage, LoadingMessage } from '../components/StatusMessage';

export function SearchPage() {
  const [params] = useSearchParams();
  const term = (params.get('q') ?? '').trim();

  if (term === '') {
    return (
      <>
        <h1>Search</h1>
        <EmptyMessage>Enter a search term to find products.</EmptyMessage>
      </>
    );
  }
  // The key restarts the request state when the term changes.
  return <SearchResults key={term} term={term} />;
}

function SearchResults({ term }: { term: string }) {
  const { state, retry } = useApi<SearchResultsData>(`/products?q=${encodeURIComponent(term)}`);

  return (
    <>
      <h1>Results for “{term}”</h1>
      {state.status === 'loading' && <LoadingMessage>Searching…</LoadingMessage>}
      {state.status === 'error' && (
        <ErrorMessage
          message={state.error.status === 400 ? state.error.message : 'We couldn’t run that search.'}
          onRetry={retry}
        />
      )}
      {state.status === 'success' &&
        (state.data.items.length === 0 ? (
          <EmptyMessage>{`No products match “${term}”. Try a different word.`}</EmptyMessage>
        ) : (
          <>
            <p role="status">
              {state.data.items.length} {state.data.items.length === 1 ? 'product' : 'products'} found
            </p>
            <ProductGrid products={state.data.items} />
          </>
        ))}
    </>
  );
}
