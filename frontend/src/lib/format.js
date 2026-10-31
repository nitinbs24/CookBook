/** "fish-seafood" → "Fish Seafood": a display name when only the category slug is at hand. */
export const titleCase = (slug) => slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
