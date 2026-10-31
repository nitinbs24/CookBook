/** Indian food-label mark: outlined square with a dot, always with a text label (PRD F-13). */
export default function VegMark({ foodType }) {
  const veg = foodType === 'veg';
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap ${veg ? 'text-veg' : 'text-nonveg'}`}>
      <span aria-hidden="true" className="flex size-3.5 items-center justify-center rounded-[3px] border border-current">
        <span className="size-1.5 rounded-full bg-current" />
      </span>
      {veg ? 'Veg' : 'Non-veg'}
    </span>
  );
}
