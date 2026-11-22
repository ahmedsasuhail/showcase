import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import type { Product } from '../api/types';
import { jsonResponse, mockApi } from '../test/mockApi';
import { CategoryPage } from './CategoryPage';

const electronics = { slug: 'electronics', name: 'Electronics' };
const product = (id: string, title: string): Product => ({
  id,
  title,
  description: `About ${title}`,
  price: 10,
  currency: 'AUD',
  imageUrl: `https://images.test/${id}.png`,
  rating: 4,
  category: electronics,
});

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/categories/:slug" element={<CategoryPage />} />
      </Routes>
    </MemoryRouter>,
  );

describe('CategoryPage', () => {
  it('shows the top rated products, then the additional products', async () => {
    mockApi({
      '/api/categories/electronics/products': () =>
        jsonResponse({
          category: electronics,
          topRated: [product('1', 'Best SSD'), product('2', 'Good SSD')],
          additional: [product('3', 'Okay Monitor')],
        }),
    });

    renderAt('/categories/electronics');

    expect(await screen.findByRole('heading', { level: 1, name: 'Electronics' })).toBeInTheDocument();
    const topRated = screen.getByRole('region', { name: 'Top rated in Electronics' });
    expect(within(topRated).getAllByRole('link').map((l) => l.textContent)).toEqual([
      expect.stringContaining('Best SSD'),
      expect.stringContaining('Good SSD'),
    ]);
    const more = screen.getByRole('region', { name: 'More in Electronics' });
    expect(within(more).getByRole('link', { name: /Okay Monitor/ })).toHaveAttribute('href', '/products/3');
  });

  it('leaves out the additional section when there are no additional products', async () => {
    mockApi({
      '/api/categories/electronics/products': () =>
        jsonResponse({ category: electronics, topRated: [product('1', 'Only SSD')], additional: [] }),
    });

    renderAt('/categories/electronics');

    expect(await screen.findByRole('region', { name: 'Top rated in Electronics' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'More in Electronics' })).not.toBeInTheDocument();
  });

  it('says so when the category does not exist', async () => {
    mockApi({
      '/api/categories/toys/products': () =>
        jsonResponse({ error: { code: 'not_found', message: 'Category not found.' } }, 404),
    });

    renderAt('/categories/toys');

    expect(await screen.findByRole('heading', { name: 'Category not found' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to the catalogue' })).toHaveAttribute('href', '/');
  });

  it('shows an error and loads the products when the customer tries again', async () => {
    let healthy = false;
    mockApi({
      '/api/categories/electronics/products': () =>
        healthy
          ? jsonResponse({ category: electronics, topRated: [product('1', 'Best SSD')], additional: [] })
          : jsonResponse({ error: { code: 'product_source_unavailable', message: 'Down.' } }, 503),
    });

    renderAt('/categories/electronics');
    expect(await screen.findByRole('alert')).toHaveTextContent('We couldn’t load this category.');

    healthy = true;
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('link', { name: /Best SSD/ })).toBeInTheDocument();
  });
});
