import { ImagePlus, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import * as recipesApi from '../api/recipes.js';
import Field from '../components/Field.jsx';
import { ErrorState } from '../components/States.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { CATEGORIES } from '../lib/categories.js';
import { emptyIngredient, emptyRecipe, emptySection, emptyStep, fromRecipe, recipeErrors, toBody } from '../lib/recipeForm.js';

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024;

/** Immutable set by dotted path: setPath(obj, "ingredients.0.name", "Paneer"). */
function setPath(obj, path, value) {
  const next = structuredClone(obj);
  const keys = path.split('.');
  const last = keys.pop();
  keys.reduce((o, k) => o[k], next)[last] = value;
  return next;
}

// shortcut: photos upload on pick, so removed photos and abandoned forms leave orphaned files in Cloudinary;
// add a DELETE /uploads/:publicId endpoint (both backends) if storage ever matters.
function Photos({ images, error, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState('');

  async function onPick(e) {
    const file = e.target.files[0];
    e.target.value = ''; // let the same file be picked again after removing it
    if (!file) return;
    setPhotoError('');
    if (!IMAGE_TYPES.includes(file.type)) return setPhotoError('Photos must be JPEG, PNG, or WebP');
    if (file.size > MAX_BYTES) return setPhotoError('Each photo must be 5 MB or smaller');
    setUploading(true);
    try {
      onChange([...images, await recipesApi.uploadImage(file)]);
    } catch (err) {
      setPhotoError(err.message);
    } finally {
      setUploading(false);
    }
  }

  const message = photoError || error;
  return (
    <section aria-labelledby="photos-heading" className="flex flex-col gap-3">
      <h2 id="photos-heading" className="text-xl">Photos</h2>
      <p className="text-sm text-muted">1–3 photos, JPEG, PNG, or WebP up to 5 MB. The first is the cover.</p>
      <div className="flex gap-4">
        {images.map((img, i) => (
          <div key={img.publicId} className="relative w-40">
            <img src={img.url} alt={`Photo ${i + 1}${i === 0 ? ' (cover)' : ''}`} className="aspect-[4/3] w-full rounded-md bg-surface object-cover" />
            {i === 0 && <span className="absolute top-2 left-2 rounded-full bg-primary px-2 py-0.5 text-xs text-on-primary">Cover</span>}
            <button
              type="button"
              aria-label={`Remove photo ${i + 1}`}
              onClick={() => onChange(images.filter((_, j) => j !== i))}
              className="absolute top-2 right-2 flex size-7 cursor-pointer items-center justify-center rounded-full bg-bg/90 hover:text-danger"
            >
              <X size={16} strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>
        ))}
        {images.length < 3 && (
          <label className="flex aspect-[4/3] w-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-line text-sm text-muted hover:border-fg/40 has-focus-visible:outline-2 has-focus-visible:outline-accent">
            <ImagePlus size={20} strokeWidth={1.75} aria-hidden="true" />
            {uploading ? 'Uploading…' : 'Add photo'}
            <input
              type="file"
              accept={IMAGE_TYPES.join(',')}
              onChange={onPick}
              disabled={uploading}
              className="sr-only"
              aria-label="Add photo"
              aria-invalid={message ? true : undefined}
              aria-describedby={message ? 'photos-error' : undefined}
            />
          </label>
        )}
      </div>
      {message && <p id="photos-error" className="text-sm text-danger">{message}</p>}
    </section>
  );
}

export default function RecipeForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const existing = useAsync(() => (editing ? recipesApi.getRecipe(id) : Promise.resolve(null)), [id]);
  const [form, setForm] = useState(() => (editing ? null : emptyRecipe()));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [focusTick, setFocusTick] = useState(0);

  useEffect(() => {
    if (existing.data) setForm(fromRecipe(existing.data));
  }, [existing.data]);

  // After a failed save, move focus to the first invalid field (UI brief §5.6).
  useEffect(() => {
    if (focusTick) document.querySelector('[aria-invalid="true"]')?.focus();
  }, [focusTick]);

  if (existing.error) return <ErrorState error={existing.error} onRetry={existing.reload} />;
  if (!form || !user) return null;
  if (editing && existing.data.author.id !== user.id) {
    return (
      <section className="py-24 text-center">
        <h1 className="text-[32px] leading-10">Not your recipe</h1>
        <p className="mt-2 text-muted">You can only edit your own recipes.</p>
        <Link to={`/recipes/${id}`} className="btn-secondary mt-8">Back to the recipe</Link>
      </section>
    );
  }

  const set = (path, value) => {
    setForm((f) => setPath(f, path, value));
    setErrors(({ [path]: _cleared, ...rest }) => rest);
  };
  const bind = (path) => ({ value: path.split('.').reduce((o, k) => o[k], form), onChange: (e) => set(path, e.target.value), error: errors[path] });
  // Adding or removing rows shifts positions, so position-keyed errors would point at the wrong row.
  const update = (fn) => {
    setForm((f) => fn(structuredClone(f)) ?? f);
    setErrors({});
  };

  async function onSubmit(e) {
    e.preventDefault();
    setFormError('');
    const found = recipeErrors(form);
    setErrors(found);
    if (Object.keys(found).length) return setFocusTick((n) => n + 1);
    setSaving(true);
    try {
      const body = toBody(form);
      const saved = editing ? await recipesApi.updateRecipe(id, body) : await recipesApi.createRecipe(body);
      toast('Recipe saved');
      navigate(`/recipes/${saved.id}`);
    } catch (err) {
      setSaving(false);
      // API validation messages read "<path>: <message>", using the same paths as recipeErrors.
      const [path, message] = err.message.split(/: (.*)/s);
      if (err.code === 'VALIDATION_ERROR' && message && !path.includes(' ')) {
        setErrors({ [path]: message });
        setFocusTick((n) => n + 1);
      } else setFormError(err.message);
    }
    return undefined;
  }

  return (
    <form noValidate onSubmit={onSubmit} className="mx-auto flex max-w-[760px] flex-col gap-12">
      <h1 className="text-[32px] leading-10">{editing ? 'Edit recipe' : 'Add a recipe'}</h1>

      <Photos images={form.images} error={errors.images} onChange={(images) => set('images', images)} />

      <section aria-labelledby="basics-heading" className="flex flex-col gap-5">
        <h2 id="basics-heading" className="text-xl">Basics</h2>
        <Field label="Title" maxLength={120} {...bind('title')} />
        <Field label="Description (optional)" as="textarea" rows={3} maxLength={500} {...bind('description')} />
        <div className="grid grid-cols-2 gap-5">
          <Field label="Dish name" placeholder="e.g. Paneer Butter Masala" maxLength={80} {...bind('dishName')} />
          <Field label="Category" as="select" {...bind('category')}>
            <option value="">Choose a category</option>
            {CATEGORIES.map(([slug, name]) => <option key={slug} value={slug}>{name}</option>)}
          </Field>
        </div>
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium">Food type</legend>
          <div className="flex gap-6">
            {[['veg', 'Veg'], ['nonveg', 'Non-veg (includes egg)']].map(([value, label]) => (
              <label key={value} className="flex cursor-pointer items-center gap-2">
                <input type="radio" name="foodType" value={value} checked={form.foodType === value} onChange={() => set('foodType', value)} className="accent-accent" />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="grid grid-cols-4 gap-5">
          <Field label="Difficulty" as="select" {...bind('difficulty')}>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </Field>
          <Field label="Servings" inputMode="numeric" {...bind('servings')} />
          <Field label="Prep time (min)" inputMode="numeric" {...bind('prepTimeMin')} />
          <Field label="Cook time (min)" inputMode="numeric" {...bind('cookTimeMin')} />
        </div>
      </section>

      <section aria-labelledby="ingredients-heading" className="flex flex-col gap-3">
        <h2 id="ingredients-heading" className="text-xl">Ingredients</h2>
        <div className="grid grid-cols-[1fr_88px_88px_1fr_40px] gap-3 text-sm font-medium text-muted" aria-hidden="true">
          <span>Name</span><span>Qty</span><span>Unit</span><span>Note</span><span />
        </div>
        {form.ingredients.map((_, i) => (
          <div key={i} className="grid grid-cols-[1fr_88px_88px_1fr_40px] items-start gap-3">
            <Field hideLabel label={`Ingredient ${i + 1} name`} maxLength={60} {...bind(`ingredients.${i}.name`)} />
            <Field hideLabel label={`Ingredient ${i + 1} quantity`} inputMode="decimal" {...bind(`ingredients.${i}.quantity`)} />
            <Field hideLabel label={`Ingredient ${i + 1} unit`} maxLength={20} {...bind(`ingredients.${i}.unit`)} />
            <Field hideLabel label={`Ingredient ${i + 1} note`} maxLength={60} placeholder="e.g. finely chopped" {...bind(`ingredients.${i}.note`)} />
            <button
              type="button"
              className="btn-ghost w-10 px-0 text-muted hover:text-danger"
              aria-label={`Remove ingredient ${i + 1}`}
              disabled={form.ingredients.length === 1}
              onClick={() => update((f) => { f.ingredients.splice(i, 1); return f; })}
            >
              <Trash2 size={16} strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>
        ))}
        {form.ingredients.length < 40 && (
          <button type="button" className="btn-secondary self-start" onClick={() => update((f) => { f.ingredients.push(emptyIngredient()); return f; })}>
            <Plus size={16} strokeWidth={1.75} aria-hidden="true" /> Add ingredient
          </button>
        )}
      </section>

      <section aria-labelledby="instructions-heading" className="flex flex-col gap-5">
        <h2 id="instructions-heading" className="text-xl">Instructions</h2>
        {form.instructions.map((sec, s) => (
          <div key={s} className="flex flex-col gap-4 rounded-lg border border-line p-5">
            <div className="flex items-end gap-3">
              <Field className="flex-1" label={`Section ${s + 1} title (optional)`} placeholder="e.g. Marinade, Gravy" maxLength={40} {...bind(`instructions.${s}.section`)} />
              <button
                type="button"
                className="btn-ghost text-muted hover:text-danger"
                aria-label={`Remove section ${s + 1}`}
                disabled={form.instructions.length === 1}
                onClick={() => update((f) => { f.instructions.splice(s, 1); return f; })}
              >
                <Trash2 size={16} strokeWidth={1.75} aria-hidden="true" />
              </button>
            </div>
            <ol className="flex flex-col gap-4">
              {sec.steps.map((_, i) => (
                <li key={i} className="grid grid-cols-[28px_1fr_40px] gap-3">
                  <span aria-hidden="true" className="mt-2 flex size-7 items-center justify-center rounded-full border border-line text-sm">{i + 1}</span>
                  <div className="flex flex-col gap-3">
                    <Field hideLabel label={`Section ${s + 1}, step ${i + 1}`} as="textarea" rows={2} maxLength={600} placeholder="What to do in this step" {...bind(`instructions.${s}.steps.${i}.text`)} />
                    <div className="grid grid-cols-[120px_1fr] gap-3">
                      <Field hideLabel label={`Section ${s + 1}, step ${i + 1} minutes`} inputMode="numeric" placeholder="Minutes" {...bind(`instructions.${s}.steps.${i}.durationMin`)} />
                      <Field hideLabel label={`Section ${s + 1}, step ${i + 1} tip`} maxLength={200} placeholder="Tip (optional)" {...bind(`instructions.${s}.steps.${i}.tip`)} />
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-ghost w-10 px-0 text-muted hover:text-danger"
                    aria-label={`Remove step ${i + 1} from section ${s + 1}`}
                    disabled={sec.steps.length === 1}
                    onClick={() => update((f) => { f.instructions[s].steps.splice(i, 1); return f; })}
                  >
                    <Trash2 size={16} strokeWidth={1.75} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ol>
            {sec.steps.length < 30 && (
              <button
                type="button"
                className="btn-ghost self-start"
                aria-label={`Add step to section ${s + 1}`}
                onClick={() => update((f) => { f.instructions[s].steps.push(emptyStep()); return f; })}
              >
                <Plus size={16} strokeWidth={1.75} aria-hidden="true" /> Add step
              </button>
            )}
          </div>
        ))}
        {form.instructions.length < 8 && (
          <button type="button" className="btn-secondary self-start" onClick={() => update((f) => { f.instructions.push(emptySection()); return f; })}>
            <Plus size={16} strokeWidth={1.75} aria-hidden="true" /> Add section
          </button>
        )}
      </section>

      <div className="sticky bottom-0 -mx-4 flex items-center justify-end gap-3 border-t border-line bg-bg px-4 py-4">
        {formError && <p role="alert" className="mr-auto text-sm text-danger">{formError}</p>}
        <button type="button" className="btn-secondary" onClick={() => navigate(editing ? `/recipes/${id}` : '/home')}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save recipe'}</button>
      </div>
    </form>
  );
}
