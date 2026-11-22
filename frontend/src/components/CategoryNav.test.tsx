import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { jsonResponse, mockApi } from '../test/mockApi';
import { CategoryNav } from './CategoryNav';

const renderNav = () =>
  render(
    <MemoryRouter>
      <CategoryNav />
    </MemoryRouter>,
  );

describe('CategoryNav', () => {
  it('shows a link to each category', async () => {
    mockApi({
      '/api/categories': () =>
        jsonResponse({
          items: [
            { slug: 'electronics', name: 'Electronics' },
            { slug: 'mens-clothing', name: "Men's clothing" },
          ],
        }),
    });

    renderNav();

    const nav = screen.getByRole('navigation', { name: 'Categories' });
    expect(await screen.findByRole('link', { name: 'Electronics' })).toHaveAttribute('href', '/categories/electronics');
    expect(nav).toContainElement(screen.getByRole('link', { name: "Men's clothing" }));
  });

  it('shows an error and recovers when the user tries again', async () => {
    let healthy = false;
    mockApi({
      '/api/categories': () =>
        healthy
          ? jsonResponse({ items: [{ slug: 'electronics', name: 'Electronics' }] })
          : jsonResponse({ error: { code: 'product_source_unavailable', message: 'Down.' } }, 503),
    });

    renderNav();
    expect(await screen.findByRole('alert')).toHaveTextContent('Categories are unavailable.');

    healthy = true;
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('link', { name: 'Electronics' })).toBeInTheDocument();
  });
});
