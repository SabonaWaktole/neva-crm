import React from 'react';
import { 
  CalendarCheck, 
  UserPlus,
  History,
  PhoneCall,
  Video,
  FileText,
  Mail,
  CalendarX,
  Calendar
} from 'lucide-react';

export interface ActivityConfig {
  icon: React.ReactNode;
  color: string;
  bg: string;
  statusLabel?: string;
  statusColor?: string;
  statusBgColor?: string;
}

export const getActivityConfig = (type: string, details?: any): ActivityConfig => {
  switch (type) {
    case 'CLIENT_CREATED':
      return { icon: <UserPlus size={16} />, color: 'var(--color-primary)', bg: 'var(--color-primary-fixed)' };
    
    case 'APPOINTMENT_SCHEDULED':
      return { 
        icon: <Calendar size={16} />, 
        color: 'var(--color-on-primary-container)', 
        bg: 'var(--color-primary-container)',
        statusLabel: 'Scheduled',
        statusColor: 'var(--color-primary)',
        statusBgColor: 'rgba(192, 193, 255, 0.15)'
      };
      
    case 'APPOINTMENT_CONFIRMED':
      return { 
        icon: <CalendarCheck size={16} />, 
        color: '#10b981', 
        bg: 'rgba(16, 185, 129, 0.15)',
        statusLabel: 'Confirmed',
        statusColor: '#10b981',
        statusBgColor: 'rgba(16, 185, 129, 0.15)'
      };
      
    case 'APPOINTMENT_COMPLETED':
      return { 
        icon: <CalendarCheck size={16} />, 
        color: '#10b981', 
        bg: 'rgba(16, 185, 129, 0.15)',
        statusLabel: 'Completed',
        statusColor: '#10b981',
        statusBgColor: 'rgba(16, 185, 129, 0.15)'
      };
      
    case 'APPOINTMENT_CANCELLED':
      return { 
        icon: <CalendarX size={16} />, 
        color: 'var(--color-error)', 
        bg: 'rgba(255, 180, 171, 0.15)',
        statusLabel: 'Cancelled',
        statusColor: 'var(--color-error)',
        statusBgColor: 'rgba(255, 180, 171, 0.15)'
      };
      
    case 'INTERACTION_ADDED':
      if (details?.channel === 'CALL') return { icon: <PhoneCall size={16} />, color: 'var(--color-on-surface-variant)', bg: 'var(--color-surface-container-high)' };
      if (details?.channel === 'EMAIL') return { icon: <Mail size={16} />, color: 'var(--color-on-surface-variant)', bg: 'var(--color-surface-container-high)' };
      if (details?.channel === 'MEETING') return { icon: <Video size={16} />, color: 'var(--color-on-surface-variant)', bg: 'var(--color-surface-container-high)' };
      return { icon: <FileText size={16} />, color: 'var(--color-on-surface-variant)', bg: 'var(--color-surface-container-high)' };
      
    default:
      return { icon: <History size={16} />, color: 'var(--color-on-surface-variant)', bg: 'var(--color-surface-container-high)' };
  }
};
