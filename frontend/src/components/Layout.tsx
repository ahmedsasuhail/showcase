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
      <Footer />
    </>
  );
}

/** Static placeholder content until the business supplies its real details. */
function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-row">
          <div>
            <p className="footer-brand">Product Catalogue</p>
            <p>Quality products, hand-picked for you.</p>
          </div>
          <div>
            <p className="footer-heading">Contact</p>
            <p>sales@example.com</p>
            <p>+61 2 9000 0000</p>
          </div>
          <div>
            <p className="footer-heading">Hours</p>
            <p>Mon–Fri, 9am–5pm AEST</p>
          </div>
        </div>
        <p className="footer-legal">© {new Date().getFullYear()} Product Catalogue. Proof of concept.</p>
      </div>
    </footer>
  );
}
