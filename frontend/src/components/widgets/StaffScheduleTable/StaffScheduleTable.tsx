import React from 'react';
import { useTranslation } from 'react-i18next';
import styles from './StaffScheduleTable.module.css';
import { CalendarDays, MoreVertical, Phone, MapPin, Check } from 'lucide-react';
import { Badge } from '../../ui/Badge/Badge';
import { Button } from '../../ui/Button/Button';
import type { Appointment } from '../../../types/appointment';
import { useDateFormat } from '../../../hooks/useDateFormat';

interface StaffScheduleTableProps {
  appointments: Appointment[];
  isLoading?: boolean;
}

export const StaffScheduleTable: React.FC<StaffScheduleTableProps> = ({ appointments, isLoading }) => {
  const dates = useDateFormat();
  const { t } = useTranslation('dashboard');
  return (
    <div className={styles.tableContainer}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <CalendarDays size={20} className={styles.headerIcon} />
          <h2>{t('schedule.title')}</h2>
          <span className={styles.headerDate}>{t('schedule.today')}</span>
        </div>
        <Button variant="ghost" disabled title={t('schedule.comingSoon')}>{t('schedule.viewCalendar')}</Button>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>{t('schedule.columnTime')}</th>
              <th>{t('schedule.columnClient')}</th>
              <th>{t('schedule.columnType')}</th>
              <th>{t('schedule.columnStatus')}</th>
              <th className={styles.actionsColumn}></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className={styles.emptyState}>Loading schedule...</td></tr>
            ) : appointments.length === 0 ? (
              <tr><td colSpan={5} className={styles.emptyState}>No appointments scheduled for today.</td></tr>
            ) : (
              appointments.map((apt) => (
                <tr key={apt.id}>
                  <td className={styles.timeCell}>
                    {dates.time(apt.scheduledAt)}
                  </td>
                  <td>
                    <div className={styles.clientName}>{apt.clientName || 'Unknown Client'}</div>
                    <div className={styles.appointmentDetail}>{apt.notes || "Standard"}</div>
                  </td>
                  <td>
                    {/* Mocking the Type Badge mapping since we don't have location types in the enum yet */}
                    <Badge variant="primary">Standard</Badge>
                  </td>
                  <td>
                    <div className={styles.statusCell}>
                      <span className={`
                        ${styles.statusDot} 
                        ${apt.status === 'SCHEDULED' ? styles.dotScheduled : ''}
                        ${apt.status === 'CONFIRMED' ? styles.dotConfirmed : ''}
                        ${apt.status === 'COMPLETED' ? styles.dotCompleted : ''}
                        ${apt.status === 'CANCELLED' ? styles.dotCancelled : ''}
                      `} />
                      <span className={styles.statusText}>{apt.status}</span>
                    </div>
                  </td>
                  <td className={styles.actionsCell}>
                    <button className={styles.actionButton} disabled title="More options coming soon">
                      <MoreVertical size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Mobile Stacked View */}
      <div className={styles.mobileList}>
        {isLoading ? (
           <div className={styles.emptyState}>Loading schedule...</div>
        ) : appointments.length === 0 ? (
           <div className={styles.emptyState}>No appointments today.</div>
        ) : (
          appointments.map((apt) => (
            <div key={apt.id} className={styles.mobileCard}>
              <div className={styles.mobileHeader}>
                <span className={styles.timeCell}>
                  {dates.time(apt.scheduledAt)}
                </span>
                <span className={styles.statusText}>{apt.status}</span>
              </div>
              <div className={styles.mobileBody}>
                <div className={styles.clientName}>{apt.clientId}</div>
                <div className={styles.appointmentDetail}>{apt.notes || "Standard"}</div>
              </div>
              <div className={styles.mobileFooter}>
                <Badge variant="primary">Standard</Badge>
                <div className={styles.mobileActions}>
                  <button className={styles.iconAction} disabled title="Call coming soon" aria-label="Call (coming soon)"><Phone size={16} /></button>
                  <button className={styles.iconAction} disabled title="Directions coming soon" aria-label="Directions (coming soon)"><MapPin size={16} /></button>
                  <button className={styles.iconAction} disabled title="Mark complete coming soon" aria-label="Mark complete (coming soon)"><Check size={16} /></button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
