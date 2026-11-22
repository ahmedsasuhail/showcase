import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { jsonResponse, mockApi } from '../test/mockApi';
import { Layout } from './Layout';

describe('Layout', () => {
  it('has the header, main content and a footer with contact details on every page', () => {
    mockApi({ '/api/categories': () => jsonResponse({ items: [] }) });

    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>,
    );

    expect(within(screen.getByRole('banner')).getByRole('link', { name: 'Product Catalogue' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('main')).toBeInTheDocument();
    const footer = screen.getByRole('contentinfo');
    expect(within(footer).getByText('sales@example.com')).toBeInTheDocument();
    expect(within(footer).getByText(/© \d{4} Product Catalogue/)).toBeInTheDocument();
  });
});
