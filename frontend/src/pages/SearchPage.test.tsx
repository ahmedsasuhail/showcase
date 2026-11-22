import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import type { Product } from '../api/types';
import { jsonResponse, mockApi } from '../test/mockApi';
import { SearchPage } from './SearchPage';

const product = (id: string, title: string): Product => ({
  id,
  title,
  description: `About ${title}`,
  price: 20,
  currency: 'AUD',
  imageUrl: `https://images.test/${id}.png`,
  rating: 4,
  category: { slug: 'mens-clothing', name: "Men's clothing" },
});

const renderAt = (url: string) =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <SearchPage />
    </MemoryRouter>,
  );

describe('SearchPage', () => {
  it('shows the matching products and how many were found', async () => {
    mockApi({
      '/api/products?q=jacket': () =>
        jsonResponse({ query: 'jacket', items: [product('1', 'Red Jacket'), product('2', 'Blue Jacket')] }),
    });

    renderAt('/search?q=jacket');

    expect(screen.getByRole('heading', { level: 1, name: 'Results for “jacket”' })).toBeInTheDocument();
    expect(await screen.findByText('2 products found')).toBeInTheDocument();
    expect(screen.getAllByRole('link').map((l) => l.textContent)).toEqual([
      expect.stringContaining('Red Jacket'),
      expect.stringContaining('Blue Jacket'),
    ]);
  });

  it('sends the term URL-encoded', async () => {
    const fetchMock = mockApi({
      '/api/products?q=coat%20%26%20hat': () => jsonResponse({ query: 'coat & hat', items: [product('1', 'Coat')] }),
    });

    renderAt('/search?q=coat%20%26%20hat');

    expect(await screen.findByText('1 product found')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/products?q=coat%20%26%20hat', expect.anything());
  });

  it('says so when nothing matches', async () => {
    mockApi({ '/api/products?q=laptop': () => jsonResponse({ query: 'laptop', items: [] }) });

    renderAt('/search?q=laptop');

    expect(await screen.findByText('No products match “laptop”. Try a different word.')).toBeInTheDocument();
  });

  it('asks for a term, without calling the API, when there is none', () => {
    const fetchMock = mockApi({});

    renderAt('/search?q=%20%20');

    expect(screen.getByText('Enter a search term to find products.')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('shows an error and searches again when the customer tries again', async () => {
    let healthy = false;
    mockApi({
      '/api/products?q=jacket': () =>
        healthy
          ? jsonResponse({ query: 'jacket', items: [product('1', 'Red Jacket')] })
          : jsonResponse({ error: { code: 'product_source_unavailable', message: 'Down.' } }, 503),
    });

    renderAt('/search?q=jacket');
    expect(await screen.findByRole('alert')).toHaveTextContent('We couldn’t run that search.');

    healthy = true;
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('1 product found')).toBeInTheDocument();
  });
});
