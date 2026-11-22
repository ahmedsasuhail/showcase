import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import { useApi } from '../api/useApi';
import type { Product } from '../api/types';
import { EnquiryForm } from '../components/EnquiryForm';
import { ErrorMessage, LoadingMessage } from '../components/StatusMessage';

export function EnquiryPage() {
  const { id = '' } = useParams();
  const { state, retry } = useApi<Product>(`/products/${encodeURIComponent(id)}`);
  const [sent, setSent] = useState(false);

  if (state.status === 'loading') return <LoadingMessage>Loading product…</LoadingMessage>;

  if (state.status === 'error') {
    if (state.error.status === 404) {
      return (
        <>
          <h1>Product not found</h1>
          <p>
            <Link to="/">Back to the catalogue</Link>
          </p>
        </>
      );
    }
    return <ErrorMessage message="We couldn’t load this product." onRetry={retry} />;
  }

  const product = state.data;
  return (
    <>
      <p>
        <Link to={`/products/${product.id}`}>Back to {product.title}</Link>
      </p>
      <h1>Enquire about {product.title}</h1>
      {sent ? (
        <ThankYou productTitle={product.title} />
      ) : (
        <EnquiryForm productId={product.id} onSent={() => setSent(true)} />
      )}
    </>
  );
}

function ThankYou({ productTitle }: { productTitle: string }) {
  const heading = useRef<HTMLHeadingElement>(null);
  // Move focus to the confirmation so screen reader and keyboard users know the form was sent.
  useEffect(() => heading.current?.focus(), []);

  return (
    <section className="thank-you">
      <h2 ref={heading} tabIndex={-1}>
        Thank you
      </h2>
      <p>Your enquiry about {productTitle} has been sent to our sales team. They will reply to you by email.</p>
      <p>
        <Link to="/">Continue browsing</Link>
      </p>
    </section>
  );
}
