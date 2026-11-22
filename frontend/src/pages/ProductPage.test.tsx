import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import type { Product } from '../api/types';
import { jsonResponse, mockApi } from '../test/mockApi';
import { ProductPage } from './ProductPage';

const jacket: Product = {
  id: '3',
  title: 'Mens Cotton Jacket',
  description: 'Great outerwear jackets for all seasons.',
  price: 55.99,
  currency: 'AUD',
  imageUrl: 'https://images.test/3.png',
  rating: 4.7,
  category: { slug: 'mens-clothing', name: "Men's clothing" },
};

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/products/:id" element={<ProductPage />} />
      </Routes>
    </MemoryRouter>,
  );

describe('ProductPage', () => {
  it('shows the product details', async () => {
    mockApi({ '/api/products/3': () => jsonResponse(jacket) });

    renderAt('/products/3');

    expect(await screen.findByRole('heading', { level: 1, name: 'Mens Cotton Jacket' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Mens Cotton Jacket' })).toHaveAttribute('src', 'https://images.test/3.png');
    expect(screen.getByText('$55.99')).toBeInTheDocument();
    expect(screen.getByText('Rated 4.7 out of 5')).toBeInTheDocument();
    expect(screen.getByText('Great outerwear jackets for all seasons.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: "Men's clothing" })).toHaveAttribute('href', '/categories/mens-clothing');
  });

  it('leaves out the rating when the product has none', async () => {
    mockApi({ '/api/products/3': () => jsonResponse({ ...jacket, rating: null }) });

    renderAt('/products/3');

    await screen.findByRole('heading', { name: 'Mens Cotton Jacket' });
    expect(screen.queryByText(/Rated/)).not.toBeInTheDocument();
  });

  it('says so when the product does not exist', async () => {
    mockApi({
      '/api/products/999': () => jsonResponse({ error: { code: 'not_found', message: 'Product not found.' } }, 404),
    });

    renderAt('/products/999');

    expect(await screen.findByRole('heading', { name: 'Product not found' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to the catalogue' })).toHaveAttribute('href', '/');
  });

  it('shows an error and loads the product when the customer tries again', async () => {
    let healthy = false;
    mockApi({
      '/api/products/3': () =>
        healthy
          ? jsonResponse(jacket)
          : jsonResponse({ error: { code: 'product_source_unavailable', message: 'Down.' } }, 503),
    });

    renderAt('/products/3');
    expect(await screen.findByRole('alert')).toHaveTextContent('We couldn’t load this product.');

    healthy = true;
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('heading', { name: 'Mens Cotton Jacket' })).toBeInTheDocument();
  });
});
