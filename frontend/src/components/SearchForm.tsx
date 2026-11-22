import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';

export function SearchForm() {
  const navigate = useNavigate();
  const [term, setTerm] = useState('');

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = term.trim();
    if (trimmed === '') return;
    void navigate(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <form role="search" className="search-form" onSubmit={handleSubmit}>
      <label htmlFor="search-term" className="visually-hidden">
        Search products
      </label>
      <input
        id="search-term"
        type="search"
        placeholder="Search products"
        maxLength={100}
        value={term}
        onChange={(event) => setTerm(event.target.value)}
      />
      <button type="submit">Search</button>
    </form>
  );
}
