import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { User, Building2, FileText, Save, Puzzle } from 'lucide-react';
import { Button } from '../../components/ui/Button/Button';
import { Card } from '../../components/ui/Card/Card';
import { TextInput } from '../../components/ui/TextInput/TextInput';
import { SelectInput } from '../../components/ui/SelectInput/SelectInput';
import { TextareaInput } from '../../components/ui/TextareaInput/TextareaInput';
import { useCreateClient, useUpdateClient, useClientDetail, useClientSettings } from '../../hooks/useClients';
import { ClientStatus } from '../../types/client';
import styles from './ClientFormContent.module.css';

export const ClientFormContent: React.FC = () => {
  const navigate = useNavigate();
  const { tenantSlug, clientId } = useParams();
  const isEdit = !!clientId;

  const { createClient, isLoading: isCreating, error: createError } = useCreateClient();
  const { updateClient, isLoading: isUpdating, error: updateError } = useUpdateClient();
  const { client, fetchClient } = useClientDetail(clientId || '');
  const { customFields, fetchSettings } = useClientSettings();

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<string>(ClientStatus.PROSPECT);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchSettings();
    if (isEdit) {
      fetchClient();
    }
  }, [fetchSettings, isEdit, fetchClient]);

  // Populate form when editing
  useEffect(() => {
    if (client && isEdit) {
      setName(client.name);
      setEmail(client.contactInfo?.email || '');
      setPhone(client.contactInfo?.phone || '');
      setStatus(client.status);
      setCustomFieldValues(
        Object.fromEntries(
          Object.entries(client.customFieldValues || {}).map(([k, v]) => [k, String(v)])
        )
      );
    }
  }, [client, isEdit]);

  const handleSubmit = async () => {
    const data = {
      name,
      contactInfo: { email: email || undefined, phone: phone || undefined },
      status: status as ClientStatus,
      customFieldValues,
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

  const handleCustomFieldChange = (fieldName: string, value: string) => {
    setCustomFieldValues(prev => ({ ...prev, [fieldName]: value }));
  };

  const error = createError || updateError;
  const isLoading = isCreating || isUpdating;

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.header}>
        <div className={styles.headerText}>
          <h1 className={styles.title}>{isEdit ? 'Edit Client' : 'Add New Client'}</h1>
          <p className={styles.subtitle}>
            {isEdit ? 'Update the client information below.' : 'Fill out the form below to add a new client to the CRM.'}
          </p>
        </div>
        <div className={styles.actions}>
          <Button variant="outline" onClick={() => navigate(`/${tenantSlug}/clients`)}>Cancel</Button>
          <Button variant="primary" icon={<Save size={18} />} onClick={handleSubmit} disabled={isLoading || !name}>
            {isLoading ? 'Saving...' : 'Save Client'}
          </Button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: 'var(--color-error-container, #fdecea)', color: 'var(--color-on-error-container, #b71c1c)', borderRadius: '8px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

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
            <TextInput label="Client Name" placeholder="e.g. Acme Corp" value={name} onChange={(e) => setName(e.target.value)} />
            <TextInput label="Email" type="email" placeholder="contact@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <TextInput label="Phone" type="tel" placeholder="(555) 123-4567" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <SelectInput label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
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
                  value={customFieldValues[field.fieldName] || ''}
                  onChange={(e) => handleCustomFieldChange(field.fieldName, e.target.value)}
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
              placeholder="Add any internal notes about this client here..." 
              rows={4} 
            />
          </div>
        </Card>
      </div>
    </div>
  );
};
