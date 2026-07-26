import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { User, FileText, Save, Puzzle } from 'lucide-react';
import { Button } from '../../components/ui/Button/Button';
import { Card } from '../../components/ui/Card/Card';
import { TextInput } from '../../components/ui/TextInput/TextInput';
import { SelectInput } from '../../components/ui/SelectInput/SelectInput';
import { TextareaInput } from '../../components/ui/TextareaInput/TextareaInput';
import { CustomFieldInput, type CustomFieldInputProps } from '../../components/ui/CustomFieldInput/CustomFieldInput';
import { useCreateClient, useUpdateClient, useClientDetail, useClientSettings } from '../../hooks/useClients';
import { useTeam } from '../../hooks/useTeam';
import { getStaffDisplayName } from '../../utils/userUtils';
import { ClientStatus, type CustomFieldType } from '../../types/client';
import styles from './ClientFormContent.module.css';

interface ClientFormValues {
  name: string;
  email: string;
  phone: string;
  status: string;
  assignedUserId: string;
  customFieldValues: Record<string, unknown>;
}

/**
 * Backend field type → the input variant that renders it.
 *
 * Explicit rather than derived, so adding a backend type is a deliberate choice
 * here too. Anything unrecognised falls back to a plain text box: a field the UI
 * does not know about should still be readable and editable, never blank.
 */
const FIELD_TYPE_TO_INPUT: Record<CustomFieldType, CustomFieldInputProps['fieldType']> = {
  TEXT: 'text',
  NUMBER: 'number',
  DATE: 'date',
  BOOLEAN: 'checkbox',
  SINGLE_SELECT: 'dropdown',
};

const inputVariantFor = (fieldType: string): CustomFieldInputProps['fieldType'] =>
  FIELD_TYPE_TO_INPUT[fieldType as CustomFieldType] ?? 'text';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const ClientFormContent: React.FC = () => {
  const navigate = useNavigate();
  const { tenantSlug, clientId } = useParams();
  const isEdit = !!clientId;

  const { createClient, isLoading: isCreating, error: createError } = useCreateClient();
  const { updateClient, isLoading: isUpdating, error: updateError } = useUpdateClient();
  const { client, fetchClient } = useClientDetail(clientId || '');
  const { customFields, fetchSettings } = useClientSettings();
  // Only the staff list; pending invitations are Business-Owner-only.
  const { staff, fetchStaff } = useTeam();

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClientFormValues>({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      status: ClientStatus.PROSPECT,
      assignedUserId: '',
      customFieldValues: {},
    },
  });

  useEffect(() => {
    fetchSettings();
    fetchStaff();
    if (isEdit) {
      fetchClient();
    }
  }, [fetchSettings, fetchStaff, isEdit, fetchClient]);

  // Populate form when editing
  useEffect(() => {
    if (client && isEdit) {
      reset({
        name: client.name,
        email: client.contactInfo?.email || '',
        phone: client.contactInfo?.phone || '',
        status: client.status,
        // '' is the Unassigned option; the column is nullable.
        assignedUserId: client.assignedUserId ?? '',
        // Values are passed through as stored, NOT String()-coerced. Coercing
        // turned a stored `false` into the string "false", which is truthy — so
        // a checkbox field that was off rendered as on, and saving it back
        // silently flipped the value to true.
        customFieldValues: { ...(client.customFieldValues || {}) },
      });
    }
  }, [client, isEdit, reset]);

  const onSubmit = async (values: ClientFormValues) => {
    const data = {
      name: values.name,
      contactInfo: { email: values.email || undefined, phone: values.phone || undefined },
      status: values.status as ClientStatus,
      // Empty string means Unassigned — send null so the column is cleared
      // rather than set to an invalid empty id.
      assignedUserId: values.assignedUserId || null,
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
            {/*
              Available to Staff as well as Business Owners: SRS §6.2 lists
              "Assign the client to a staff member" under Add Client, which it
              states is for "staff and business owners", and the permission
              matrix gives Staff Full (assigned/shared) client management. The
              /auth/staff endpoint is likewise authorized for both roles.
            */}
            <SelectInput label="Assigned To" {...register('assignedUserId')}>
              <option value="">Unassigned</option>
              {staff.map((member) => (
                <option key={member.id} value={member.id}>
                  {getStaffDisplayName(member)}
                </option>
              ))}
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
                <Controller
                  key={field.id}
                  name={`customFieldValues.${field.fieldName}`}
                  control={control}
                  render={({ field: controlled }) => (
                    <CustomFieldInput
                      fieldType={inputVariantFor(field.fieldType)}
                      label={field.fieldName}
                      options={field.options ?? []}
                      value={controlled.value}
                      onChange={controlled.onChange}
                    />
                  )}
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
