import { useId } from 'react';

/**
 * Labelled input with its error linked through aria-describedby (UI brief §4 Inputs).
 * `as` = "textarea" | "select"; `hideLabel` keeps the label for screen readers only (table-like rows).
 */
export default function Field({ label, error, as: Tag = 'input', hideLabel = false, className = '', children, ...props }) {
  const id = useId();
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className={hideLabel ? 'sr-only' : 'text-sm font-medium'}>
        {label}
      </label>
      <Tag
        id={id}
        className={Tag === 'textarea' ? 'input h-auto py-2' : 'input'}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        {...props}
      >
        {children}
      </Tag>
      {error && (
        <p id={`${id}-error`} className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
