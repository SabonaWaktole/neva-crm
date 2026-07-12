import React, { useState, useEffect } from 'react';
import { Plus, Edit2 } from 'lucide-react';
import { SettingsLayout } from '../../components/layout/SettingsLayout';
import { SlideOver } from '../../components/ui/SlideOver';
import { Button } from '../../components/ui/Button';
import { TextInput } from '../../components/ui/TextInput';
import { SelectInput } from '../../components/ui/SelectInput';
import { useClientSettings, useDefineCustomField, useDefineOutcomeCategory } from '../../hooks/useClients';
import styles from './ClientSettingsContent.module.css';

export const ClientSettingsContent: React.FC = () => {
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'fields' | 'outcomes'>('fields');

  // Form state for the slide-over
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState('TEXT');
  const [newOutcomeLabel, setNewOutcomeLabel] = useState('');

  const { customFields, outcomeCategories, isLoading, fetchSettings } = useClientSettings();
  const { defineCustomField, isLoading: isDefiningField } = useDefineCustomField();
  const { defineOutcomeCategory, isLoading: isDefiningCategory } = useDefineOutcomeCategory();

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSaveField = async () => {
    if (!newFieldName) return;
    try {
      await defineCustomField({ fieldName: newFieldName, fieldType: newFieldType });
      setNewFieldName('');
      setNewFieldType('TEXT');
      setIsSlideOverOpen(false);
      fetchSettings(); // refresh
    } catch {
      // error handled by hook
    }
  };

  const handleSaveOutcome = async () => {
    if (!newOutcomeLabel) return;
    try {
      await defineOutcomeCategory({ label: newOutcomeLabel });
      setNewOutcomeLabel('');
      setIsSlideOverOpen(false);
      fetchSettings(); // refresh
    } catch {
      // error handled by hook
    }
  };

  return (
    <SettingsLayout activeNavId="client-management">
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.breadcrumbs}>
            <a href="#settings" className={styles.breadcrumbLink}>Settings</a> &gt; Client Management
          </div>
          <h1 className={styles.title}>Client Management Settings</h1>
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${activeTab === 'fields' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('fields')}
            >
              Custom Fields
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'outcomes' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('outcomes')}
            >
              Outcome Categories
            </button>
          </div>
        </div>

        {/* Custom Fields Tab */}
        {activeTab === 'fields' && (
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
                    <th className={styles.th}>Required</th>
                    <th className={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading && (
                    <tr><td colSpan={4} style={{ textAlign: 'center', padding: '20px' }}>Loading...</td></tr>
                  )}
                  {!isLoading && customFields.length === 0 && (
                    <tr><td colSpan={4} style={{ textAlign: 'center', padding: '20px', color: 'var(--color-on-surface-variant)' }}>No custom fields defined yet.</td></tr>
                  )}
                  {!isLoading && customFields.map((field) => (
                    <tr key={field.id} className={styles.tr}>
                      <td className={styles.td}>{field.fieldName}</td>
                      <td className={styles.td}>
                        <span className={styles.typeBadge}>{field.fieldType}</span>
                      </td>
                      <td className={styles.td}>{field.isRequired ? 'Yes' : 'No'}</td>
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
        )}

        {/* Outcome Categories Tab */}
        {activeTab === 'outcomes' && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Outcome Categories</h2>
              <Button icon={<Plus size={16} />} onClick={() => setIsSlideOverOpen(true)}>
                Add Category
              </Button>
            </div>

            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>Label</th>
                    <th className={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading && (
                    <tr><td colSpan={2} style={{ textAlign: 'center', padding: '20px' }}>Loading...</td></tr>
                  )}
                  {!isLoading && outcomeCategories.length === 0 && (
                    <tr><td colSpan={2} style={{ textAlign: 'center', padding: '20px', color: 'var(--color-on-surface-variant)' }}>No outcome categories defined yet.</td></tr>
                  )}
                  {!isLoading && outcomeCategories.map((cat) => (
                    <tr key={cat.id} className={styles.tr}>
                      <td className={styles.td}>{cat.label}</td>
                      <td className={styles.td}>
                        <button className={styles.actionButton} aria-label="Edit category">
                          <Edit2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Slide-Over for Adding */}
      <SlideOver
        isOpen={isSlideOverOpen}
        onClose={() => setIsSlideOverOpen(false)}
        title={activeTab === 'fields' ? 'Add Custom Field' : 'Add Outcome Category'}
        footer={
          <div className={styles.slideOverFooter}>
            <Button variant="outline" onClick={() => setIsSlideOverOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={activeTab === 'fields' ? handleSaveField : handleSaveOutcome}
              disabled={activeTab === 'fields' ? isDefiningField || !newFieldName : isDefiningCategory || !newOutcomeLabel}
            >
              {(isDefiningField || isDefiningCategory) ? 'Saving...' : 'Save'}
            </Button>
          </div>
        }
      >
        <div className={styles.slideOverForm}>
          {activeTab === 'fields' ? (
            <>
              <TextInput
                label="Field Name"
                placeholder="e.g. Industry"
                value={newFieldName}
                onChange={(e) => setNewFieldName(e.target.value)}
              />
              <SelectInput label="Field Type" value={newFieldType} onChange={(e) => setNewFieldType(e.target.value)}>
                <option value="TEXT">Text</option>
                <option value="NUMBER">Number</option>
                <option value="DATE">Date</option>
                <option value="BOOLEAN">Boolean</option>
              </SelectInput>
            </>
          ) : (
            <TextInput
              label="Category Label"
              placeholder="e.g. Positive"
              value={newOutcomeLabel}
              onChange={(e) => setNewOutcomeLabel(e.target.value)}
            />
          )}
        </div>
      </SlideOver>
    </SettingsLayout>
  );
};
