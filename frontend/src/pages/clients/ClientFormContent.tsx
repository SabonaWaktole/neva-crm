import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { User, FileText, Save, Puzzle } from 'lucide-react';
import { Button } from '../../components/ui/Button/Button';
import { Card } from '../../components/ui/Card/Card';
import { TextInput } from '../../components/ui/TextInput/TextInput';
import { SelectInput } from '../../components/ui/SelectInput/SelectInput';
import { TextareaInput } from '../../components/ui/TextareaInput/TextareaInput';
import { useCreateClient, useUpdateClient, useClientDetail, useClientSettings } from '../../hooks/useClients';
import { ClientStatus } from '../../types/client';
import styles from './ClientFormContent.module.css';

interface ClientFormValues {
  name: string;
  email: string;
  phone: string;
  status: string;
  customFieldValues: Record<string, string>;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const ClientFormContent: React.FC = () => {
  const navigate = useNavigate();
  const { tenantSlug, clientId } = useParams();
  const isEdit = !!clientId;

  const { createClient, isLoading: isCreating, error: createError } = useCreateClient();
  const { updateClient, isLoading: isUpdating, error: updateError } = useUpdateClient();
  const { client, fetchClient } = useClientDetail(clientId || '');
  const { customFields, fetchSettings } = useClientSettings();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClientFormValues>({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      status: ClientStatus.PROSPECT,
      customFieldValues: {},
    },
  });

  useEffect(() => {
    fetchSettings();
    if (isEdit) {
      fetchClient();
    }
  }, [fetchSettings, isEdit, fetchClient]);

  // Populate form when editing
  useEffect(() => {
    if (client && isEdit) {
      reset({
        name: client.name,
        email: client.contactInfo?.email || '',
        phone: client.contactInfo?.phone || '',
        status: client.status,
        customFieldValues: Object.fromEntries(
          Object.entries(client.customFieldValues || {}).map(([k, v]) => [k, String(v)])
        ),
      });
    }
  }, [client, isEdit, reset]);

  const onSubmit = async (values: ClientFormValues) => {
    const data = {
      name: values.name,
      contactInfo: { email: values.email || undefined, phone: values.phone || undefined },
      status: values.status as ClientStatus,
      customFieldValues: values.customFieldValues,
    };

    try {
      if (isEdit && clientId) {
        await updateClient(clientId, data);
        navigate(`/${tenantSlug}/clients/${clientId}`);
      } else {
        const newClient = await createClient(data);
        navigate(`/${tenantSlug}/clients/${newClient.id}`);
      }
    } catch {
      // error state is set by the hook
    }
  };

  const error = createError || updateError;
  const isLoading = isCreating || isUpdating;

  return (
    <form className={styles.container} onSubmit={handleSubmit(onSubmit)}>
      {/* Page Header */}
      <div className={styles.header}>
        <div className={styles.headerText}>
          <h1 className={styles.title}>{isEdit ? 'Edit Client' : 'Add New Client'}</h1>
          <p className={styles.subtitle}>
            {isEdit ? 'Update the client information below.' : 'Fill out the form below to add a new client to the CRM.'}
          </p>
        </div>
        <div className={styles.actions}>
          <Button variant="outline" type="button" onClick={() => navigate(`/${tenantSlug}/clients`)}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" icon={<Save size={18} />} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Client'}
          </Button>
        </div>
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      <div className={styles.formContainer}>
        {/* Section 1: Basic Information */}
        <Card className={styles.sectionCard} padding="xl">
          <div className={styles.sectionHeader}>
            <div className={styles.iconWrapper}>
              <User size={20} />
            </div>
            <h2 className={styles.sectionTitle}>Basic Information</h2>
          </div>
          <div className={styles.grid2}>
            <TextInput
              label="Client Name"
              placeholder="e.g. Acme Corp"
              error={errors.name?.message}
              {...register('name', { required: 'Client name is required' })}
            />
            <TextInput
              label="Email"
              type="email"
              placeholder="contact@example.com"
              error={errors.email?.message}
              {...register('email', {
                pattern: { value: EMAIL_PATTERN, message: 'Enter a valid email address' },
              })}
            />
            <TextInput
              label="Phone"
              type="tel"
              placeholder="(555) 123-4567"
              error={errors.phone?.message}
              {...register('phone')}
            />
            <SelectInput label="Status" {...register('status')}>
              <option value={ClientStatus.PROSPECT}>Prospect</option>
              <option value={ClientStatus.ACTIVE}>Active</option>
              <option value={ClientStatus.INACTIVE}>Inactive</option>
            </SelectInput>
          </div>
        </Card>

        {/* Section 2: Custom Fields (Dynamic) */}
        {customFields.length > 0 && (
          <Card className={`${styles.sectionCard} ${styles.dynamicCard}`} padding="xl">
            <div className={styles.sectionHeader}>
              <div className={styles.iconWrapper}>
                <Puzzle size={20} />
              </div>
              <h2 className={styles.sectionTitle}>Custom Fields</h2>
            </div>
            <div className={styles.grid2}>
              {customFields.map((field) => (
                <TextInput
                  key={field.id}
                  label={field.fieldName}
                  placeholder={`Enter ${field.fieldName}`}
                  type={field.fieldType === 'NUMBER' ? 'number' : 'text'}
                  {...register(`customFieldValues.${field.fieldName}`)}
                />
              ))}
            </div>
          </Card>
        )}

        {/* Section 3: Internal Notes */}
        <Card className={styles.sectionCard} padding="xl">
          <div className={styles.sectionHeader}>
            <div className={styles.iconWrapper}>
              <FileText size={20} />
            </div>
            <h2 className={styles.sectionTitle}>Internal Notes</h2>
          </div>
          <div className={styles.fullWidth}>
            <TextareaInput
              label="Notes"
              placeholder="Coming soon: internal notes are not yet saved with the client record."
              rows={4}
              disabled
              helperText="This field isn't wired up to the backend yet, so notes typed here won't be saved."
            />
          </div>
        </Card>
      </div>
    </form>
  );
};
