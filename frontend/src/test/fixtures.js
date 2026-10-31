// Response shapes from TRD §6.2, for mocking the API modules.
export const card = (overrides = {}) => ({
  id: 'r1',
  title: 'Dhaba-style Paneer Butter Masala',
  dishName: 'Paneer Butter Masala',
  image: { url: 'https://img.test/pbm.jpg', publicId: 'recipebook/pbm' },
  foodType: 'veg',
  category: 'paneer',
  avgRating: 4.5,
  reviewCount: 12,
  likeCount: 31,
  author: { id: 'u1', name: 'Asha Rao' },
  createdAt: '2026-10-28T09:12:00.000Z',
  ...overrides,
});

export const page = (items, overrides = {}) => ({ items, page: 1, limit: 12, total: items.length, ...overrides });

export const fullRecipe = (overrides = {}) => ({
  ...card(),
  description: 'Smoky, buttery paneer.',
  difficulty: 'medium',
  servings: 4,
  prepTimeMin: 20,
  cookTimeMin: 35,
  images: [
    { url: 'https://img.test/pbm.jpg', publicId: 'recipebook/pbm' },
    { url: 'https://img.test/pbm2.jpg', publicId: 'recipebook/pbm2' },
  ],
  ingredients: [
    { name: 'Paneer', quantity: 250, unit: 'g', note: '1-inch cubes' },
    { name: 'Salt', quantity: null, unit: null, note: 'to taste' },
  ],
  instructions: [
    { section: 'Gravy', steps: [{ text: 'Cook tomatoes until mushy.', durationMin: 8, tip: 'Do not rush.' }] },
    { section: null, steps: [{ text: 'Add paneer and simmer.', durationMin: null, tip: null }] },
  ],
  updatedAt: '2026-10-30T14:40:00.000Z',
  likedByMe: false,
  ...overrides,
});

export const review = (overrides = {}) => ({
  id: 'rv1',
  rating: 5,
  comment: 'Perfect gravy.',
  user: { id: 'u2', name: 'Ravi Kumar' },
  createdAt: '2026-10-31T04:10:00.000Z',
  ...overrides,
});

/** Logs a user in for a test: stored token + mocked /auth/me. */
export function loginAs(authApi, user = { id: 'u9', name: 'Meera', email: 'm@x.co', role: 'user', createdAt: '' }) {
  localStorage.setItem('rb_token', 't');
  authApi.me.mockResolvedValue(user);
  return user;
}
