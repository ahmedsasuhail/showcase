import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { App } from './App';
import { jsonResponse, mockApi } from './test/mockApi';

const jacket = {
  id: '3',
  title: 'Mens Cotton Jacket',
  description: 'Great outerwear.',
  price: 55.99,
  currency: 'AUD',
  imageUrl: 'https://images.test/3.png',
  rating: 4.7,
  category: { slug: 'mens-clothing', name: "Men's clothing" },
};

const renderApp = () =>
  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>,
  );

describe('App', () => {
  it('lets a customer search from the header and see only the matching products', async () => {
    mockApi({
      '/api/categories': () => jsonResponse({ items: [] }),
      '/api/products/featured': () => jsonResponse({ items: [] }),
      '/api/products?q=cotton%20jacket': () => jsonResponse({ query: 'cotton jacket', items: [jacket] }),
    });

    renderApp();
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search products' }), 'cotton jacket');
    await userEvent.click(screen.getByRole('button', { name: 'Search' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Results for “cotton jacket”' })).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: /Mens Cotton Jacket/ })).toHaveAttribute('href', '/products/3');
    expect(screen.getByText('1 product found')).toBeInTheDocument();
  });

  it('opens the product details page when a customer clicks a product tile', async () => {
    mockApi({
      '/api/categories': () => jsonResponse({ items: [] }),
      '/api/products/featured': () => jsonResponse({ items: [jacket] }),
      '/api/products/3': () => jsonResponse(jacket),
    });

    renderApp();
    await userEvent.click(await screen.findByRole('link', { name: /Mens Cotton Jacket/ }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Mens Cotton Jacket' })).toBeInTheDocument();
    expect(screen.getByText('Great outerwear.')).toBeInTheDocument();
  });

  it('lets a customer enquire about a product and see "Thank you"', async () => {
    const posted: unknown[] = [];
    mockApi({
      '/api/categories': () => jsonResponse({ items: [] }),
      '/api/products/3': () => jsonResponse(jacket),
      '/api/enquiries': (init) => {
        posted.push(JSON.parse(String(init?.body)));
        return jsonResponse({ enquiryId: 'ref-1' }, 201);
      },
    });
    render(
      <MemoryRouter initialEntries={['/products/3']}>
        <App />
      </MemoryRouter>,
    );

    await userEvent.click(await screen.findByRole('link', { name: 'Enquire' }));
    await userEvent.type(await screen.findByLabelText('Name'), 'Ada Lovelace');
    await userEvent.type(screen.getByLabelText('Email'), 'ada@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Send enquiry' }));

    expect(await screen.findByRole('heading', { name: 'Thank you' })).toBeInTheDocument();
    expect(posted).toEqual([{ productId: '3', name: 'Ada Lovelace', email: 'ada@example.com' }]);
  });
});
