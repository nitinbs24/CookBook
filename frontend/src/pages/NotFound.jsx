import { Link } from 'react-router';

export default function NotFound() {
  return (
    <section className="py-24 text-center">
      <h1 className="text-[32px] leading-10">Page not found</h1>
      <p className="mt-2 text-muted">That page doesn’t exist or has moved.</p>
      <Link to="/home" className="btn-secondary mt-8">Back to recipes</Link>
    </section>
  );
}
