import { User, Building2, FileText, Save } from 'lucide-react';
import { Button } from '../../components/ui/Button/Button';
import { Card } from '../../components/ui/Card/Card';
import { TextInput } from '../../components/ui/TextInput/TextInput';
import { SelectInput } from '../../components/ui/SelectInput/SelectInput';
import { TextareaInput } from '../../components/ui/TextareaInput/TextareaInput';
import styles from './ClientFormContent.module.css';

export const ClientFormContent: React.FC = () => {
  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.header}>
        <div className={styles.headerText}>
          <h1 className={styles.title}>Add New Client</h1>
          <p className={styles.subtitle}>Fill out the form below to add a new client to the CRM.</p>
        </div>
        <div className={styles.actions}>
          <Button variant="outline">Cancel</Button>
          <Button variant="primary" icon={<Save size={18} />}>Save Client</Button>
        </div>
      </div>

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
            <TextInput label="First Name" placeholder="e.g. Jane" />
            <TextInput label="Last Name" placeholder="e.g. Doe" />
            <TextInput label="Email" type="email" placeholder="jane@example.com" />
            <TextInput label="Phone" type="tel" placeholder="(555) 123-4567" />
            <SelectInput label="Lead Status" defaultValue="">
              <option value="" disabled>Select Status</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="lost">Lost</option>
            </SelectInput>
          </div>
        </Card>

        {/* Section 2: Company Details */}
        <Card className={`${styles.sectionCard} ${styles.dynamicCard}`} padding="xl">
          <div className={styles.sectionHeader}>
            <div className={styles.iconWrapper}>
              <Building2 size={20} />
            </div>
            <h2 className={styles.sectionTitle}>Company Details</h2>
          </div>
          <div className={styles.grid2}>
            <TextInput label="Company Name" placeholder="e.g. Acme Corp" />
            <SelectInput label="Industry" defaultValue="">
              <option value="" disabled>Select Industry</option>
              <option value="tech">Technology</option>
              <option value="finance">Finance</option>
              <option value="healthcare">Healthcare</option>
              <option value="other">Other</option>
            </SelectInput>
            <SelectInput label="Company Size" defaultValue="">
              <option value="" disabled>Select Size</option>
              <option value="1-10">1-10 employees</option>
              <option value="11-50">11-50 employees</option>
              <option value="51-200">51-200 employees</option>
              <option value="201+">201+ employees</option>
            </SelectInput>
            <TextInput label="Website" type="url" placeholder="https://example.com" />
          </div>
        </Card>

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
