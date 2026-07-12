import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ChevronRight, Edit3, Mail, MoreVertical, Phone, Settings, Filter, Search, PhoneCall, Video, FileText } from 'lucide-react';
import { useClientDetail, useClientHistory, useClientSettings } from '../../hooks/useClients';
import { Card } from '../../components/ui/Card/Card';
import { Badge } from '../../components/ui/Badge/Badge';
import { Avatar } from '../../components/ui/Avatar/Avatar';
import { Button } from '../../components/ui/Button/Button';
import { SlideOver } from '../../components/ui/SlideOver';
import { TextInput } from '../../components/ui/TextInput/TextInput';
import { SelectInput } from '../../components/ui/SelectInput/SelectInput';
import { TextareaInput } from '../../components/ui/TextareaInput/TextareaInput';
import { TimelineItem } from '../../components/ui/TimelineItem/TimelineItem';
import { useAddInteraction } from '../../hooks/useClients';
import styles from './ClientDetailContent.module.css';

export const ClientDetailContent: React.FC = () => {
  const { clientId } = useParams();
  const { client, isLoading: isClientLoading, fetchClient } = useClientDetail(clientId || '');
  const { history, isLoading: isHistoryLoading, fetchHistory } = useClientHistory(clientId || '');
  const { customFields, outcomeCategories, fetchSettings } = useClientSettings();
  const { addInteraction, isLoading: isAddingInteraction } = useAddInteraction();

  const [isInteractionSlideOverOpen, setIsInteractionSlideOverOpen] = useState(false);
  const [interactionChannel, setInteractionChannel] = useState('NOTE');
  const [interactionContent, setInteractionContent] = useState('');
  const [interactionOutcomeId, setInteractionOutcomeId] = useState('');

  const handleAddInteraction = async () => {
    if (!clientId || !interactionContent) return;
    await addInteraction(clientId, {
      channel: interactionChannel,
      content: interactionContent,
      outcomeCategoryId: interactionOutcomeId || undefined
    });
    setInteractionContent('');
    setIsInteractionSlideOverOpen(false);
    fetchHistory();
  };

  useEffect(() => {
    fetchClient();
    fetchHistory();
    fetchSettings();
  }, [fetchClient, fetchHistory, fetchSettings]);

  if (isClientLoading) return <div className={styles.container}>Loading client...</div>;
  if (!client) return <div className={styles.container}>Client not found.</div>;

  return (
    <div className={styles.container}>
      {/* Header section */}
      <div className={styles.headerArea}>
        <div className={styles.breadcrumbs}>
          <span className={styles.breadcrumbLink}>Clients</span>
          <ChevronRight size={14} className={styles.breadcrumbSeparator} />
          <span className={styles.breadcrumbCurrent}>{client.name}</span>
        </div>

        <div className={styles.headerMain}>
          <div className={styles.headerLeft}>
            <div className={styles.companyLogo}>
              <span className={styles.companyInitials}>{client.name.substring(0, 2).toUpperCase()}</span>
            </div>
            <div className={styles.companyInfo}>
              <div className={styles.companyTitleRow}>
                <h1 className={styles.companyName}>{client.name}</h1>
                <Badge variant="primary">{client.status}</Badge>
              </div>
              <p className={styles.companySubtitle}>
                {client.contactInfo?.email} {client.contactInfo?.phone ? `· ${client.contactInfo.phone}` : ''}
              </p>
            </div>
          </div>
          <div className={styles.headerActions}>
            <Button variant="outline" className={styles.iconButton}>
              <Edit3 size={18} />
            </Button>
            <Button variant="outline" className={styles.iconButton}>
              <Mail size={18} />
            </Button>
            <Button variant="outline" className={styles.iconButton}>
              <MoreVertical size={18} />
            </Button>
          </div>
        </div>
      </div>

      {/* Grid Layout */}
      <div className={styles.gridContainer}>
        {/* Left Column */}
        <div className={styles.leftColumn}>
          {/* Key Contact Card */}
          <Card padding="lg">
            <h2 className={styles.cardTitle}>Key Contact</h2>
            <div className={styles.contactDetails}>
              <Avatar
                size="lg"
                fallback="SJ"
                className={styles.contactAvatar}
              />
              <div className={styles.contactInfo}>
                <h3 className={styles.contactName}>{client.assignedUserId || 'Unassigned'}</h3>
                <p className={styles.contactTitle}>Assigned User</p>
              </div>
            </div>
            <div className={styles.contactActions}>
              {client.contactInfo?.email && (
                <a href={`mailto:${client.contactInfo.email}`} className={styles.contactLink}>
                  <Mail size={16} /> {client.contactInfo.email}
                </a>
              )}
              {client.contactInfo?.phone && (
                <a href={`tel:${client.contactInfo.phone}`} className={styles.contactLink}>
                  <Phone size={16} /> {client.contactInfo.phone}
                </a>
              )}
            </div>
          </Card>

          {/* Custom Fields Card */}
          <Card padding="lg" className={styles.customFieldsCard}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>About</h2>
              <button className={styles.settingsButton}>
                <Settings size={16} />
              </button>
            </div>
            <div className={styles.fieldsList}>
              {customFields.map((field) => (
                <div key={field.id} className={styles.fieldRow}>
                  <span className={styles.fieldLabel}>{field.fieldName}</span>
                  <span className={styles.fieldValue}>{client.customFieldValues?.[field.fieldName] || '-'}</span>
                </div>
              ))}
              {customFields.length === 0 && (
                <div className={styles.fieldRow}>
                  <span className={styles.fieldValue}>No custom fields defined.</span>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className={styles.rightColumn}>
          <Card padding="lg" className={styles.timelineCard}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Interactions</h2>
              <div className={styles.timelineActions}>
                <Button variant="outline" className={styles.smallIconButton}>
                  <Filter size={16} />
                </Button>
                <Button variant="outline" className={styles.smallIconButton}>
                  <Search size={16} />
                </Button>
              </div>
            </div>

            <div className={styles.logActivityRow}>
              <Button variant="outline" className={styles.logActivityButton} onClick={() => { setInteractionChannel('CALL'); setIsInteractionSlideOverOpen(true); }}>
                <PhoneCall size={16} /> Log Call
              </Button>
              <Button variant="outline" className={styles.logActivityButton} onClick={() => { setInteractionChannel('EMAIL'); setIsInteractionSlideOverOpen(true); }}>
                <Mail size={16} /> Email
              </Button>
              <Button variant="outline" className={styles.logActivityButton} onClick={() => { setInteractionChannel('MEETING'); setIsInteractionSlideOverOpen(true); }}>
                <Video size={16} /> Meeting
              </Button>
              <Button variant="outline" className={styles.logActivityButton} onClick={() => { setInteractionChannel('NOTE'); setIsInteractionSlideOverOpen(true); }}>
                <FileText size={16} /> Note
              </Button>
            </div>

            <div className={styles.timelineList}>
              {isHistoryLoading && <div>Loading history...</div>}
              {!isHistoryLoading && history?.timeline.length === 0 && (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-on-surface-variant)' }}>
                  No interactions yet.
                </div>
              )}
              {!isHistoryLoading && history?.timeline.map((item, index) => {
                let icon = <FileText size={16} />;
                if (item.details?.channel === 'CALL') icon = <PhoneCall size={16} />;
                if (item.details?.channel === 'EMAIL') icon = <Mail size={16} />;
                if (item.details?.channel === 'MEETING') icon = <Video size={16} />;

                return (
                  <TimelineItem
                    key={item.id}
                    title={item.type === 'INTERACTION_ADDED' ? `Interaction (${item.details?.channel})` : item.description}
                    subtitle={`${new Date(item.timestamp).toLocaleString()} · by ${item.actor}`}
                    content={item.details?.content}
                    icon={icon}
                    iconBgColor="var(--color-surface-container-high)"
                    iconTextColor="var(--color-on-surface-variant)"
                    isLast={index === history.timeline.length - 1}
                  />
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      <SlideOver
        isOpen={isInteractionSlideOverOpen}
        onClose={() => setIsInteractionSlideOverOpen(false)}
        title="Add Interaction"
        footer={
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <Button variant="outline" onClick={() => setIsInteractionSlideOverOpen(false)}>Cancel</Button>
            <Button onClick={handleAddInteraction} disabled={isAddingInteraction || !interactionContent}>
              {isAddingInteraction ? 'Saving...' : 'Save Interaction'}
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px' }}>
          <SelectInput label="Channel" value={interactionChannel} onChange={e => setInteractionChannel(e.target.value)}>
            <option value="CALL">Call</option>
            <option value="EMAIL">Email</option>
            <option value="MEETING">Meeting</option>
            <option value="NOTE">Note</option>
          </SelectInput>
          <TextareaInput 
            label="Notes" 
            placeholder="Add details about this interaction..." 
            rows={5}
            value={interactionContent}
            onChange={e => setInteractionContent(e.target.value)}
          />
          {outcomeCategories && outcomeCategories.length > 0 && (
            <SelectInput label="Outcome" value={interactionOutcomeId} onChange={e => setInteractionOutcomeId(e.target.value)}>
              <option value="">No Outcome</option>
              {outcomeCategories.map(oc => (
                <option key={oc.id} value={oc.id}>{oc.label}</option>
              ))}
            </SelectInput>
          )}
        </div>
      </SlideOver>
    </div>
  );
};
