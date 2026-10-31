import { Link } from 'react-router';

/** Centred 400 px card shared by Login and Register (UI brief §5.2). */
export default function AuthCard({ title, children, footer }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-10 py-16">
      <div className="w-[400px]">
        <Link to="/" className="text-sm font-medium text-muted hover:text-fg">Recipe Book</Link>
        <h1 className="mt-4 text-[32px] leading-10">{title}</h1>
        <div className="mt-8 rounded-lg border border-line bg-surface p-6">{children}</div>
        <p className="mt-6 text-center text-sm text-muted">{footer}</p>
      </div>
    </main>
  );
}
