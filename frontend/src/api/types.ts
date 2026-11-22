// Mirrors the API contract in PLAN.md. Grows one feature at a time.
export interface Category {
  slug: string;
  name: string;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  imageUrl: string;
  rating: number | null;
  category: Category;
}
