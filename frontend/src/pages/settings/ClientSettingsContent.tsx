import React, { useState } from 'react';
import { Plus, Edit2 } from 'lucide-react';
import { SettingsLayout } from '../../components/layout/SettingsLayout';
import { SlideOver } from '../../components/ui/SlideOver';
import { Button } from '../../components/ui/Button';
import { TextInput } from '../../components/ui/TextInput';
import { SelectInput } from '../../components/ui/SelectInput';
import { TextareaInput } from '../../components/ui/TextareaInput';
import styles from './ClientSettingsContent.module.css';

export const ClientSettingsContent: React.FC = () => {
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);

  const customFields = [
    { id: '1', name: 'Industry Vertical', type: 'Dropdown', object: 'Client' },
    { id: '2', name: 'Annual Revenue', type: 'Number', object: 'Client' },
    { id: '3', name: 'Lead Source', type: 'Dropdown', object: 'Lead' },
    { id: '4', name: 'Has NDAs', type: 'Boolean', object: 'Client' },
  ];

  return (
    <SettingsLayout activeNavId="client-management">
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.breadcrumbs}>
            <a href="#settings" className={styles.breadcrumbLink}>Settings</a> &gt; Client Management
          </div>
          <h1 className={styles.title}>Client Management Settings</h1>
          <div className={styles.tabs}>
            <button className={`${styles.tab} ${styles.tabActive}`}>Custom Fields</button>
            <button className={styles.tab}>Outcome Categories</button>
            <button className={styles.tab}>Tags</button>
            <button className={styles.tab}>Pipeline Stages</button>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Active Custom Fields</h2>
            <Button icon={<Plus size={16} />} onClick={() => setIsSlideOverOpen(true)}>
              Add Field
            </Button>
          </div>

          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Field Name</th>
                  <th className={styles.th}>Type</th>
                  <th className={styles.th}>Object</th>
                  <th className={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customFields.map((field) => (
                  <tr key={field.id} className={styles.tr}>
                    <td className={styles.td}>{field.name}</td>
                    <td className={styles.td}>
                      <span className={styles.typeBadge}>{field.type}</span>
                    </td>
                    <td className={styles.td}>{field.object}</td>
                    <td className={styles.td}>
                      <button className={styles.actionButton} aria-label="Edit field">
                        <Edit2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <SlideOver
        isOpen={isSlideOverOpen}
        onClose={() => setIsSlideOverOpen(false)}
        title="Add Custom Field"
        footer={
          <div className={styles.slideOverFooter}>
            <Button variant="outline" onClick={() => setIsSlideOverOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsSlideOverOpen(false)}>
              Save Field
            </Button>
          </div>
        }
      >
        <div className={styles.slideOverForm}>
          <TextInput label="Field Label" placeholder="e.g. Industry Vertical" />
          
          <SelectInput label="Target Object" defaultValue="client">
            <option value="client">Client</option>
            <option value="lead">Lead</option>
            <option value="contact">Contact</option>
          </SelectInput>
          
          <SelectInput label="Field Type" defaultValue="text">
            <option value="text">Text</option>
            <option value="number">Number</option>
            <option value="dropdown">Dropdown</option>
            <option value="boolean">Boolean</option>
            <option value="date">Date</option>
          </SelectInput>
          
          <TextareaInput 
            label="Description" 
            placeholder="Describe the purpose of this field..." 
            rows={3} 
          />
          
          <label className={styles.checkboxContainer}>
            <input type="checkbox" className={styles.checkbox} />
            <span className={styles.checkboxLabel}>Make this field required</span>
          </label>
        </div>
      </SlideOver>
    </SettingsLayout>
  );
};
