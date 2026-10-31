import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import Field from '../components/Field.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { registerErrors } from '../lib/validate.js';
import AuthCard from './AuthCard.jsx';

export default function Register() {
  const { token, register } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  if (token && !saving) return <Navigate to="/home" replace />;

  const set = (key) => (e) => setValues({ ...values, [key]: e.target.value });

  async function onSubmit(e) {
    e.preventDefault();
    const found = registerErrors(values);
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length) return;
    setSaving(true);
    try {
      await register({ name: values.name.trim(), email: values.email.trim(), password: values.password });
      navigate('/home');
    } catch (err) {
      setSaving(false);
      // API validation messages read "<field>: <message>" (backend errorHandler).
      const [field, message] = err.message.split(/: (.*)/s);
      if (err.code === 'CONFLICT') setErrors({ email: err.message });
      else if (err.code === 'VALIDATION_ERROR' && field in values) setErrors({ [field]: message });
      else setFormError(err.message);
    }
  }

  return (
    <AuthCard title="Create your account" footer={<>Already have an account? <Link to="/login" className="link">Log in</Link></>}>
      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
        <Field label="Name" autoComplete="name" value={values.name} onChange={set('name')} error={errors.name} />
        <Field label="Email" type="email" autoComplete="email" value={values.email} onChange={set('email')} error={errors.email} />
        <Field label="Password" type="password" autoComplete="new-password" value={values.password} onChange={set('password')} error={errors.password} />
        {formError && <p role="alert" className="text-sm text-danger">{formError}</p>}
        <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Creating account…' : 'Create account'}</button>
      </form>
    </AuthCard>
  );
}
