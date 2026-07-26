import { useState } from 'react';
import {} from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, Link as LinkIcon, UploadCloud, ArrowLeft, ArrowRight } from 'lucide-react';
import { Card } from '../../components/ui/Card/Card';
import { Stepper } from '../../components/ui/Stepper/Stepper';
import { TextInput } from '../../components/ui/TextInput/TextInput';
import { PasswordInput } from '../../components/ui/PasswordInput/PasswordInput';
import { Button } from '../../components/ui/Button/Button';
import { useRegisterBusiness } from '../../hooks/useRegisterBusiness';
import styles from './OnboardingPage.module.css';

/*
 * The "Localization" step was removed. Its region select sent ad-hoc codes
 * (us/uk/eu/au/ca) that registration accepted and then silently discarded, and
 * its language select was never wired to state at all. Locale is now set from
 * Company Settings, where it is validated against a list we actually support.
 */
const steps = [
  { id: 'org', label: 'Organization' },
  { id: 'brand', label: 'Branding' },
];

export const OnboardingPage = () => {
  const navigate = useNavigate();
  const { register, isLoading, error, isSuccess, tenantSlug } = useRegisterBusiness();
  const [currentStep, setCurrentStep] = useState(1);
  const [companyName, setCompanyName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Slug generation logic
  const slug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  const displaySlug = slug || 'your-workspace';

  const handleComplete = async () => {
    try {
      await register({
        companyName,
        urlSlug: slug,
        ownerEmail,
        ownerPassword,
      });
    } catch (err) {
      // Error is handled by the hook — go back to step 1 to show error
      setCurrentStep(1);
    }
  };

  // If registration succeeded, show success and redirect
  if (isSuccess && tenantSlug) {
    return (
      <div className={styles.container}>
        <main className={styles.mainWrapper}>
          <div className={styles.header}>
            <h1 className={styles.title}>Neva CRM</h1>
          </div>
          <Card padding="none" className={styles.cardContainer}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--spacing-lg)', padding: 'var(--spacing-2xl)' }}>
              <CheckCircle2 size={64} color="#059669" />
              <h2 className={styles.stepTitle}>Workspace Created!</h2>
              <p className={styles.stepSubtitle}>Your workspace is ready at <strong>neva.crm/{tenantSlug}</strong></p>
              <Button
                variant="primary"
                onClick={() => navigate('/login')}
              >
                Go to Login
              </Button>
            </div>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <main className={styles.mainWrapper}>
        <div className={styles.header}>
          <h1 className={styles.title}>Neva CRM</h1>
          <p className={styles.subtitle}>Let's set up your workspace.</p>
        </div>

        <Card padding="none" className={styles.cardContainer}>
          <div className={styles.stepperHeader}>
            <Stepper steps={steps} currentStep={currentStep} />
          </div>

          <div className={styles.contentArea}>
            {/* Step 1: Organization */}
            <div className={`${styles.stepContent} ${currentStep === 1 ? styles.stepContentActive : currentStep > 1 ? styles.stepContentHiddenLeft : styles.stepContentHiddenRight}`}>
              <h2 className={styles.stepTitle}>What's your company name?</h2>
              <p className={styles.stepSubtitle}>This will be used to generate your dedicated workspace URL.</p>
              
              <div className={`${styles.formContent} ${styles.formContentMaxW}`}>
                {error && (
                  <div style={{ color: 'var(--color-on-error-container)', fontSize: 'var(--font-size-label-sm)', background: 'var(--color-error-container)', padding: 'var(--spacing-sm)', borderRadius: 'var(--radius-default)', marginBottom: 'var(--spacing-sm)' }}>
                    {typeof error === 'string' ? error : JSON.stringify(error)}
                  </div>
                )}
                <TextInput 
                  label="Company Name" 
                  placeholder="e.g. Acme Corp" 
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />

                <TextInput
                  label="Your Email"
                  placeholder="you@company.com"
                  type="email"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  required
                />

                <PasswordInput
                  label="Create Password"
                  placeholder="••••••••"
                  helperText="Min 8 chars, 1 uppercase, 1 lowercase, 1 digit."
                  value={ownerPassword}
                  onChange={(e) => setOwnerPassword(e.target.value)}
                  required
                />
                
                <div className={styles.urlPreviewBox}>
                  <LinkIcon size={20} color="var(--color-outline)" />
                  <div className={styles.urlText}>
                    <span>neva.crm/</span><span className={styles.urlSlug}>{displaySlug}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Branding */}
            <div className={`${styles.stepContent} ${currentStep === 2 ? styles.stepContentActive : currentStep > 2 ? styles.stepContentHiddenLeft : styles.stepContentHiddenRight}`}>
              <h2 className={styles.stepTitle}>Upload your logo</h2>
              <p className={styles.stepSubtitle}>Personalize your workspace for your team and clients.</p>
              
              <div className={`${styles.formContent} ${styles.formContentMaxW}`}>
                <div className={styles.uploadBox}>
                  <div className={styles.uploadIconBox}>
                    <UploadCloud className={styles.uploadIcon} />
                  </div>
                  <span className={styles.uploadTitle}>Click to upload</span>
                  <span className={styles.uploadSubtitle}>or drag and drop</span>
                  <span className={styles.uploadHelp}>SVG, PNG, JPG (max. 5MB)</span>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.footer}>
            {/* Step 1 has nothing to go back to, so the slot offers a way to sign in
                instead. Rendering conditionally also keeps a dead "Back" button out
                of the tab order. */}
            {currentStep === 1 ? (
              <span className={styles.signInPrompt}>
                Already have an account?{' '}
                <Link to="/login" className={styles.signInLink}>
                  Sign in
                </Link>
              </span>
            ) : (
              <button type="button" className={styles.btnBack} onClick={prevStep}>
                <ArrowLeft size={18} />
                Back
              </button>
            )}

            {currentStep < steps.length ? (
              <Button 
                variant="primary" 
                icon={<ArrowRight size={18} />}
                iconPosition="right"
                onClick={nextStep}
              >
                Continue
              </Button>
            ) : (
              <Button 
                style={{ backgroundColor: 'var(--color-on-background)', color: 'white' }}
                icon={<CheckCircle2 size={18} />}
                iconPosition="right"
                onClick={handleComplete}
                isLoading={isLoading}
              >
                Complete Setup
              </Button>
            )}
          </div>
        </Card>
      </main>
    </div>
  );
};
