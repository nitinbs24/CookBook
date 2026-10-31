import { Heart } from 'lucide-react';
import { Link } from 'react-router';
import Rating from './Rating.jsx';
import VegMark from './VegMark.jsx';

/**
 * The title link stretches over the whole card (after:inset-0); the dish link sits above it,
 * so the card is clickable without nesting <a> tags.
 */
export default function RecipeCard({ recipe }) {
  const { id, title, dishName, image, foodType, category, avgRating, reviewCount, likeCount, author } = recipe;
  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-lg border border-line bg-bg transition-colors duration-150 hover:border-fg/20 hover:shadow-[0_1px_2px_rgb(0_0_0/0.06)]">
      <img src={image.url} alt={title} loading="lazy" className="aspect-[4/3] w-full bg-surface object-cover" />
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="line-clamp-2 text-base leading-6">
          <Link to={`/recipes/${id}`} className="after:absolute after:inset-0">{title}</Link>
        </h3>
        <Link
          to={`/category/${category}?${new URLSearchParams({ dish: dishName })}`}
          className="relative z-10 w-fit text-sm text-muted hover:text-accent"
        >
          {dishName}
        </Link>
        <p className="truncate text-xs text-muted">by {author.name}</p>
        <div className="mt-auto flex items-center gap-4 pt-3 text-xs text-muted">
          <VegMark foodType={foodType} />
          <Rating avg={avgRating} count={reviewCount} />
          <span className="inline-flex items-center gap-1" aria-label={`${likeCount} likes`}>
            <Heart size={14} strokeWidth={1.75} aria-hidden="true" />
            <span>{likeCount}</span>
          </span>
        </div>
      </div>
    </article>
  );
}
