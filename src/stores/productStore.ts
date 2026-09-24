import { create } from 'zustand';
import { Product, Category, SortOption, PriceRange, ProductSize } from '../types';
import { MOCK_PRODUCTS, CATEGORIES } from '../mockData';
import {
  listenProducts,
  saveProduct,
  deleteProduct as deleteProductFromFirestore,
  seedProductsIfEmpty,
} from '../services/firestoreProducts';

interface ProductState {
  // Data
  products: Product[];
  categories: Category[];
  isLoaded: boolean; // true once Firestore has responded

  // Filters
  selectedCategory: string;
  searchQuery: string;
  priceRange: PriceRange;
  selectedSize: ProductSize | 'ALL';
  sortBy: SortOption;
  inStockOnly: boolean;

  // Derived
  filteredProducts: Product[];

  // UI
  activeDetailProduct: Product | null;
  activeQuickViewProduct: Product | null;
  isProductGridLoading: boolean;

  // Actions — Data
  initFirestoreSync: () => () => void;
  addProduct: (product: Product) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  resetProducts: () => void;

  // Actions — Filters
  setSelectedCategory: (slug: string) => void;
  setSearchQuery: (q: string) => void;
  setPriceRange: (range: PriceRange) => void;
  setSelectedSize: (size: ProductSize | 'ALL') => void;
  setSortBy: (sort: SortOption) => void;
  setInStockOnly: (v: boolean) => void;
  resetFilters: () => void;

  // Actions — UI
  setActiveDetailProduct: (p: Product | null) => void;
  setActiveQuickViewProduct: (p: Product | null) => void;
  setIsProductGridLoading: (v: boolean) => void;
}

const applyFilters = (
  products: Product[],
  selectedCategory: string,
  searchQuery: string,
  priceRange: PriceRange,
  selectedSize: ProductSize | 'ALL',
  sortBy: SortOption,
  inStockOnly: boolean
): Product[] => {
  let list = products.filter((p) => {
    if (selectedCategory !== 'all' && p.categoryId !== selectedCategory) return false;
    if (p.price < priceRange.min || p.price > priceRange.max) return false;
    if (selectedSize !== 'ALL' && !p.availableSizes.includes(selectedSize)) return false;
    if (inStockOnly && !p.inStock) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (
        !p.title.en.toLowerCase().includes(q) &&
        !p.title.np.toLowerCase().includes(q) &&
        !p.tags.some((t) => t.toLowerCase().includes(q))
      )
        return false;
    }
    return true;
  });

  return list.sort((a, b) => {
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'newest') return (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0);
    return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
  });
};

export const useProductStore = create<ProductState>((set, get) => ({
  products: MOCK_PRODUCTS,
  categories: CATEGORIES,
  isLoaded: false,
  selectedCategory: 'all',
  searchQuery: '',
  priceRange: { min: 0, max: 100000 },
  selectedSize: 'ALL',
  sortBy: 'featured',
  inStockOnly: false,
  filteredProducts: applyFilters(MOCK_PRODUCTS, 'all', '', { min: 0, max: 100000 }, 'ALL', 'featured', false),
  activeDetailProduct: null,
  activeQuickViewProduct: null,
  isProductGridLoading: false,

  initFirestoreSync: () => {
    // Seed Firestore if empty, then start listener
    seedProductsIfEmpty(MOCK_PRODUCTS);

    const unsubscribe = listenProducts((remoteProducts) => {
      const { selectedCategory, searchQuery, priceRange, selectedSize, sortBy, inStockOnly } = get();
      const source = remoteProducts.length > 0 ? remoteProducts : MOCK_PRODUCTS;
      set({
        products: source,
        isLoaded: true,
        filteredProducts: applyFilters(source, selectedCategory, searchQuery, priceRange, selectedSize, sortBy, inStockOnly),
      });
    });

    return unsubscribe;
  },

  addProduct: (product) => {
    const updated = [product, ...get().products];
    const { selectedCategory, searchQuery, priceRange, selectedSize, sortBy, inStockOnly } = get();
    set({
      products: updated,
      filteredProducts: applyFilters(updated, selectedCategory, searchQuery, priceRange, selectedSize, sortBy, inStockOnly),
    });
    saveProduct(product);
  },

  updateProduct: (id, updates) => {
    const updated = get().products.map((p) => (p.id === id ? { ...p, ...updates } : p));
    const { selectedCategory, searchQuery, priceRange, selectedSize, sortBy, inStockOnly } = get();
    set({
      products: updated,
      filteredProducts: applyFilters(updated, selectedCategory, searchQuery, priceRange, selectedSize, sortBy, inStockOnly),
    });
    const target = updated.find((p) => p.id === id);
    if (target) saveProduct(target);
  },

  deleteProduct: (id) => {
    const updated = get().products.filter((p) => p.id !== id);
    const { selectedCategory, searchQuery, priceRange, selectedSize, sortBy, inStockOnly } = get();
    set({
      products: updated,
      filteredProducts: applyFilters(updated, selectedCategory, searchQuery, priceRange, selectedSize, sortBy, inStockOnly),
    });
    deleteProductFromFirestore(id);
  },

  resetProducts: () => {
    const { selectedCategory, searchQuery, priceRange, selectedSize, sortBy, inStockOnly } = get();
    set({
      products: MOCK_PRODUCTS,
      filteredProducts: applyFilters(MOCK_PRODUCTS, selectedCategory, searchQuery, priceRange, selectedSize, sortBy, inStockOnly),
    });
  },

  setSelectedCategory: (slug) => {
    const { products, searchQuery, priceRange, selectedSize, sortBy, inStockOnly } = get();
    set({ selectedCategory: slug, filteredProducts: applyFilters(products, slug, searchQuery, priceRange, selectedSize, sortBy, inStockOnly) });
  },
  setSearchQuery: (q) => {
    const { products, selectedCategory, priceRange, selectedSize, sortBy, inStockOnly } = get();
    set({ searchQuery: q, filteredProducts: applyFilters(products, selectedCategory, q, priceRange, selectedSize, sortBy, inStockOnly) });
  },
  setPriceRange: (range) => {
    const { products, selectedCategory, searchQuery, selectedSize, sortBy, inStockOnly } = get();
    set({ priceRange: range, filteredProducts: applyFilters(products, selectedCategory, searchQuery, range, selectedSize, sortBy, inStockOnly) });
  },
  setSelectedSize: (size) => {
    const { products, selectedCategory, searchQuery, priceRange, sortBy, inStockOnly } = get();
    set({ selectedSize: size, filteredProducts: applyFilters(products, selectedCategory, searchQuery, priceRange, size, sortBy, inStockOnly) });
  },
  setSortBy: (sort) => {
    const { products, selectedCategory, searchQuery, priceRange, selectedSize, inStockOnly } = get();
    set({ sortBy: sort, filteredProducts: applyFilters(products, selectedCategory, searchQuery, priceRange, selectedSize, sort, inStockOnly) });
  },
  setInStockOnly: (v) => {
    const { products, selectedCategory, searchQuery, priceRange, selectedSize, sortBy } = get();
    set({ inStockOnly: v, filteredProducts: applyFilters(products, selectedCategory, searchQuery, priceRange, selectedSize, sortBy, v) });
  },
  resetFilters: () => {
    const { products } = get();
    set({
      selectedCategory: 'all', searchQuery: '', priceRange: { min: 0, max: 100000 },
      selectedSize: 'ALL', sortBy: 'featured', inStockOnly: false,
      filteredProducts: applyFilters(products, 'all', '', { min: 0, max: 100000 }, 'ALL', 'featured', false),
    });
  },

  setActiveDetailProduct: (p) => set({ activeDetailProduct: p }),
  setActiveQuickViewProduct: (p) => set({ activeQuickViewProduct: p }),
  setIsProductGridLoading: (v) => set({ isProductGridLoading: v }),
}));
