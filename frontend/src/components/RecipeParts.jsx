import { Clock, Lightbulb } from 'lucide-react';
import { useState } from 'react';

/** Large 4:3 cover plus thumbnails that swap it (PRD F-40). */
export function ImageGallery({ images, title }) {
  const [index, setIndex] = useState(0);
  return (
    <div className="flex flex-col gap-3">
      <img src={images[index].url} alt={title} className="aspect-[4/3] w-full rounded-lg bg-surface object-cover" />
      {images.length > 1 && (
        <div className="flex gap-3">
          {images.map((img, i) => (
            <button
              key={img.publicId}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show photo ${i + 1}`}
              aria-pressed={i === index}
              className={`w-24 cursor-pointer overflow-hidden rounded-md border-2 ${i === index ? 'border-accent' : 'border-transparent'}`}
            >
              <img src={img.url} alt="" className="aspect-[4/3] w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Quantity + unit, name, note (PRD F-42). */
export function IngredientList({ ingredients }) {
  return (
    <ul className="divide-y divide-line">
      {ingredients.map((ing, i) => (
        <li key={i} className="grid grid-cols-[88px_1fr] gap-4 py-2.5">
          <span className="text-right font-medium tabular-nums">{[ing.quantity, ing.unit].filter((v) => v != null).join(' ')}</span>
          <span>
            {ing.name}
            {ing.note && <span className="ml-2 text-sm text-muted italic">{ing.note}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Steps grouped into sections, each with optional duration and tip (PRD F-43). */
export function InstructionSections({ instructions }) {
  return (
    <div className="flex flex-col gap-8">
      {instructions.map((section, s) => (
        <section key={s}>
          {section.section && <h3 className="mb-4 text-xl">{section.section}</h3>}
          <ol className="flex flex-col gap-5">
            {section.steps.map((step, i) => (
              <li key={i} className="grid grid-cols-[28px_1fr] gap-4">
                <span className="flex size-7 items-center justify-center rounded-full border border-line text-sm font-medium">{i + 1}</span>
                <div className="flex flex-col gap-2">
                  <p>{step.text}</p>
                  {step.durationMin != null && (
                    <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-line px-2.5 py-0.5 text-xs text-muted">
                      <Clock size={14} strokeWidth={1.75} aria-hidden="true" />
                      {step.durationMin} min
                    </span>
                  )}
                  {step.tip && (
                    <p className="flex gap-2 rounded-md bg-surface px-3 py-2 text-sm">
                      <Lightbulb size={16} strokeWidth={1.75} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
                      <span>{step.tip}</span>
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
