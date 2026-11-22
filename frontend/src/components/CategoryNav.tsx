import { NavLink } from 'react-router';
import { useApi } from '../api/useApi';
import type { Category } from '../api/types';

export function CategoryNav() {
  const { state, retry } = useApi<{ items: Category[] }>('/categories');

  return (
    <nav aria-label="Categories" className="category-nav">
      {state.status === 'loading' && <p role="status">Loading categories…</p>}
      {state.status === 'error' && (
        <p role="alert" className="error-text">
          Categories are unavailable.{' '}
          <button type="button" className="status-retry" onClick={retry}>
            Try again
          </button>
        </p>
      )}
      {state.status === 'success' && (
        <ul>
          {state.data.items.map((category) => (
            <li key={category.slug}>
              <NavLink to={`/categories/${category.slug}`}>{category.name}</NavLink>
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
}
