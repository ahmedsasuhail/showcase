import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router';
import { describe, expect, it } from 'vitest';
import { SearchForm } from './SearchForm';

function CurrentUrl() {
  const { pathname, search } = useLocation();
  return <p data-testid="url">{pathname + search}</p>;
}

function renderForm() {
  render(
    <MemoryRouter initialEntries={['/']}>
      <SearchForm />
      <CurrentUrl />
    </MemoryRouter>,
  );
}

describe('SearchForm', () => {
  it('goes to the search page with the trimmed, encoded term when Search is clicked', async () => {
    renderForm();

    await userEvent.type(screen.getByRole('searchbox', { name: 'Search products' }), '  mens jacket & coat ');
    await userEvent.click(screen.getByRole('button', { name: 'Search' }));

    expect(screen.getByTestId('url')).toHaveTextContent('/search?q=mens%20jacket%20%26%20coat');
  });

  it('keeps the Search button disabled until a term is entered', async () => {
    renderForm();
    const button = screen.getByRole('button', { name: 'Search' });
    expect(button).toBeDisabled();

    await userEvent.type(screen.getByRole('searchbox'), '   ');
    expect(button).toBeDisabled();

    await userEvent.type(screen.getByRole('searchbox'), 'hat');
    expect(button).toBeEnabled();
  });

  it('does nothing when Enter is pressed on a blank term', async () => {
    renderForm();

    await userEvent.type(screen.getByRole('searchbox'), '   {Enter}');

    expect(screen.getByTestId('url')).toHaveTextContent(/^\/$/);
  });
});
