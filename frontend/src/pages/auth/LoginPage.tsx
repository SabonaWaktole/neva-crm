import { useState } from 'react';
import {} from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Network } from 'lucide-react';
import { AuthLayout } from '../../components/layout/AuthLayout/AuthLayout';
import { TextInput } from '../../components/ui/TextInput/TextInput';
import { PasswordInput } from '../../components/ui/PasswordInput/PasswordInput';
import { Button } from '../../components/ui/Button/Button';
import { useLogin } from '../../hooks/useLogin';
import styles from './LoginPage.module.css';

export const LoginPage = () => {
  const { tenantSlug } = useParams();
  const navigate = useNavigate();
  const { login, isLoading, error } = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const actualTenantSlug = await login(email, password, tenantSlug || null);
      if (actualTenantSlug) {
        navigate(`/${actualTenantSlug}/dashboard`);
      } else {
        navigate('/admin/dashboard');
      }
    } catch (err) {
      // Error is handled by the hook
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your Neva CRM account"
      logoIcon={<Network size={32} color="var(--color-primary)" />}
    >
      <form className={styles.form} onSubmit={handleSubmit}>
        {error && (
          <div className={styles.errorBanner} role="alert">
            {error}
          </div>
        )}
        <TextInput
          label="Email Address" 
          placeholder="name@company.com" 
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        
        <div className={styles.passwordGroup}>
          <PasswordInput
            label="Password"
            placeholder="••••••••"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <div className={styles.metaRow}>
            <span className={styles.metaText}>
              Don't have an account?{' '}
              <Link to="/register-business" className={styles.link}>
                Sign up
              </Link>
            </span>
            <Link to={`/${tenantSlug || 'admin'}/forgot-password`} className={styles.link}>
              Forgot password?
            </Link>
          </div>
        </div>

        <div className={styles.submitRow}>
          <Button fullWidth variant="primary" type="submit" isLoading={isLoading}>
            Sign In
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
};
