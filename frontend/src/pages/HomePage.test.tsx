import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import type { Product } from '../api/types';
import { jsonResponse, mockApi } from '../test/mockApi';
import { HomePage } from './HomePage';

const product = (id: string, title: string, price: number): Product => ({
  id,
  title,
  description: `About ${title}`,
  price,
  currency: 'AUD',
  imageUrl: `https://images.test/${id}.png`,
  rating: 4.5,
  category: { slug: 'electronics', name: 'Electronics' },
});

const renderHome = () =>
  render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  );

describe('HomePage', () => {
  it('shows the 5 featured products with image, title, price and a link to each', async () => {
    const items = ['One', 'Two', 'Three', 'Four', 'Five'].map((t, i) => product(String(i + 1), t, (i + 1) * 10));
    mockApi({ '/api/products/featured': () => jsonResponse({ items }) });

    renderHome();

    expect(screen.getByRole('heading', { level: 1, name: 'Top rated' })).toBeInTheDocument();
    const tiles = await screen.findAllByRole('link');
    expect(tiles).toHaveLength(5);
    const first = tiles[0]!;
    expect(first).toHaveAttribute('href', '/products/1');
    expect(within(first).getByRole('img', { name: 'One' })).toHaveAttribute('src', 'https://images.test/1.png');
    expect(within(first).getByText('$10.00')).toBeInTheDocument();
    expect(within(first).getByText('Rated 4.5 out of 5')).toBeInTheDocument();
  });

  it('tells the customer when there are no featured products', async () => {
    mockApi({ '/api/products/featured': () => jsonResponse({ items: [] }) });

    renderHome();

    expect(await screen.findByText('No top rated products are available right now.')).toBeInTheDocument();
  });

  it('shows an error and loads the products when the customer tries again', async () => {
    let healthy = false;
    mockApi({
      '/api/products/featured': () =>
        healthy
          ? jsonResponse({ items: [product('1', 'One', 10)] })
          : jsonResponse({ error: { code: 'product_source_unavailable', message: 'Down.' } }, 503),
    });

    renderHome();
    expect(await screen.findByRole('alert')).toHaveTextContent('We couldn’t load the top rated products.');

    healthy = true;
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('link', { name: /One/ })).toBeInTheDocument();
  });
});
