import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import type { Product } from '../api/types';
import { jsonResponse, mockApi } from '../test/mockApi';
import { EnquiryPage } from './EnquiryPage';

const jacket: Product = {
  id: '3',
  title: 'Mens Cotton Jacket',
  description: 'Great outerwear.',
  price: 55.99,
  currency: 'AUD',
  imageUrl: 'https://images.test/3.png',
  rating: 4.7,
  category: { slug: 'mens-clothing', name: "Men's clothing" },
};

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/products/3/enquire']}>
      <Routes>
        <Route path="/products/:id/enquire" element={<EnquiryPage />} />
      </Routes>
    </MemoryRouter>,
  );

async function fillRequired(user = userEvent.setup()) {
  await user.type(await screen.findByLabelText('Name'), 'Ada Lovelace');
  await user.type(screen.getByLabelText('Email'), 'ada@example.com');
  return user;
}

const sendButton = () => screen.getByRole('button', { name: /Send enquiry|Sending/ });

describe('EnquiryPage', () => {
  it('sends the contact details and only then shows "Thank you"', async () => {
    let sentBody: unknown;
    mockApi({
      '/api/products/3': () => jsonResponse(jacket),
      '/api/enquiries': (init) => {
        sentBody = JSON.parse(String(init?.body));
        return jsonResponse({ enquiryId: 'ref-1' }, 201);
      },
    });

    renderPage();
    expect(await screen.findByRole('heading', { level: 1, name: 'Enquire about Mens Cotton Jacket' })).toBeInTheDocument();
    const user = await fillRequired();
    await user.type(screen.getByLabelText('Phone (optional)'), '0400 000 000');
    await user.type(screen.getByLabelText('Message (optional)'), 'In large?');
    await user.click(sendButton());

    const thanks = await screen.findByRole('heading', { name: 'Thank you' });
    expect(thanks).toHaveFocus();
    expect(sentBody).toEqual({
      productId: '3',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      phone: '0400 000 000',
      message: 'In large?',
    });
    expect(screen.queryByRole('button', { name: 'Send enquiry' })).not.toBeInTheDocument();
  });

  it('checks the form before sending, and focuses the first problem', async () => {
    const fetchMock = mockApi({ '/api/products/3': () => jsonResponse(jacket) });

    renderPage();
    await screen.findByLabelText('Name');
    await userEvent.type(screen.getByLabelText('Email'), 'not-an-email');
    await userEvent.click(sendButton());

    expect(screen.getByLabelText('Name')).toHaveFocus();
    expect(screen.getByLabelText('Name')).toHaveAccessibleDescription('Enter your name.');
    expect(screen.getByLabelText('Email')).toHaveAccessibleDescription('Enter a valid email address.');
    expect(fetchMock).toHaveBeenCalledTimes(1); // only the product lookup; nothing was sent
  });

  it('shows the API’s field errors when it rejects the details', async () => {
    mockApi({
      '/api/products/3': () => jsonResponse(jacket),
      '/api/enquiries': () =>
        jsonResponse(
          {
            error: {
              code: 'invalid_request',
              message: 'The request was not valid.',
              details: [{ field: 'email', message: 'Enter a valid email address.' }],
            },
          },
          400,
        ),
    });

    renderPage();
    await userEvent.click(await fillRequired().then(() => sendButton()));

    expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.queryByRole('heading', { name: 'Thank you' })).not.toBeInTheDocument();
  });

  it('never says thank you when sending fails, keeps what was typed, and can try again', async () => {
    let emailWorking = false;
    mockApi({
      '/api/products/3': () => jsonResponse(jacket),
      '/api/enquiries': () =>
        emailWorking
          ? jsonResponse({ enquiryId: 'ref-1' }, 201)
          : jsonResponse({ error: { code: 'email_unavailable', message: 'Down.' } }, 503),
    });

    renderPage();
    const user = await fillRequired();
    await user.click(sendButton());

    expect(await screen.findByRole('alert')).toHaveTextContent('We couldn’t send your enquiry. Please try again.');
    expect(screen.queryByRole('heading', { name: 'Thank you' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveValue('Ada Lovelace');

    emailWorking = true;
    await user.click(sendButton());
    expect(await screen.findByRole('heading', { name: 'Thank you' })).toBeInTheDocument();
  });

  it('explains when the product is no longer available', async () => {
    mockApi({
      '/api/products/3': () => jsonResponse(jacket),
      '/api/enquiries': () =>
        jsonResponse({ error: { code: 'unprocessable', message: 'This product is no longer available.' } }, 422),
    });

    renderPage();
    await userEvent.click(await fillRequired().then(() => sendButton()));

    expect(await screen.findByRole('alert')).toHaveTextContent('This product is no longer available.');
  });

  it('disables the button while sending, so the enquiry is not sent twice', async () => {
    let release: (response: Response) => void = () => {};
    mockApi({
      '/api/products/3': () => jsonResponse(jacket),
      '/api/enquiries': () => new Promise<Response>((resolve) => (release = resolve)),
    });

    renderPage();
    const user = await fillRequired();
    await user.click(sendButton());

    expect(sendButton()).toBeDisabled();
    expect(sendButton()).toHaveTextContent('Sending…');

    release(jsonResponse({ enquiryId: 'ref-1' }, 201));
    expect(await screen.findByRole('heading', { name: 'Thank you' })).toBeInTheDocument();
  });

  it('says so when the product does not exist', async () => {
    mockApi({
      '/api/products/3': () => jsonResponse({ error: { code: 'not_found', message: 'Product not found.' } }, 404),
    });

    renderPage();

    expect(await screen.findByRole('heading', { name: 'Product not found' })).toBeInTheDocument();
  });
});
