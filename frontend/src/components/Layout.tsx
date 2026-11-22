import { Link, Outlet } from 'react-router';
import { CategoryNav } from './CategoryNav';
import { SearchForm } from './SearchForm';

export function Layout() {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <div className="container">
          <div className="header-row">
            <Link to="/" className="brand">
              Product Catalogue
            </Link>
            <SearchForm />
          </div>
          <CategoryNav />
        </div>
      </header>
      <main id="main" className="container" tabIndex={-1}>
        <Outlet />
      </main>
    </>
  );
}
