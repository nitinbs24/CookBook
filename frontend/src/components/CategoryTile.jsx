import { Link } from 'react-router';

export default function CategoryTile({ category }) {
  const { slug, name, imageUrl, recipeCount } = category;
  return (
    <Link to={`/category/${slug}`} className="group flex flex-col gap-3">
      {imageUrl ? (
        <img src={imageUrl} alt="" className="aspect-square w-full rounded-lg bg-surface object-cover" />
      ) : (
        <span aria-hidden="true" className="flex aspect-square w-full items-center justify-center rounded-lg border border-line bg-surface text-4xl font-semibold text-muted transition-colors duration-150 group-hover:border-fg/20">
          {name[0]}
        </span>
      )}
      <span>
        <span className="block font-semibold">{name}</span>
        <span className="block text-sm text-muted">{recipeCount} {recipeCount === 1 ? 'recipe' : 'recipes'}</span>
      </span>
    </Link>
  );
}
