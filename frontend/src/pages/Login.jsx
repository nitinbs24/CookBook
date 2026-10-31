import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import Field from '../components/Field.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { loginErrors } from '../lib/validate.js';
import AuthCard from './AuthCard.jsx';

export default function Login() {
  const { token, login } = useAuth();
  const navigate = useNavigate();
  const from = useLocation().state?.from ?? '/home'; // back to the page that sent a guest here
  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  if (token && !saving) return <Navigate to={from} replace />;

  const set = (key) => (e) => setValues({ ...values, [key]: e.target.value });

  async function onSubmit(e) {
    e.preventDefault();
    const found = loginErrors(values);
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length) return;
    setSaving(true);
    try {
      await login({ email: values.email.trim(), password: values.password });
      navigate(from, { replace: true });
    } catch (err) {
      setSaving(false);
      setFormError(err.message);
    }
  }

  return (
    <AuthCard title="Log in" footer={<>New here? <Link to="/register" className="link">Create an account</Link></>}>
      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
        <Field label="Email" type="email" autoComplete="email" value={values.email} onChange={set('email')} error={errors.email} />
        <Field label="Password" type="password" autoComplete="current-password" value={values.password} onChange={set('password')} error={errors.password} />
        {formError && <p role="alert" className="text-sm text-danger">{formError}</p>}
        <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Logging in…' : 'Log in'}</button>
      </form>
    </AuthCard>
  );
}
