import type { User } from '../store/useAuthStore';

export const getUserDisplayName = (user: User | null, fallback = 'User'): string => {
  if (!user) return fallback;
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName.charAt(0)}.`;
  }
  if (user.firstName) return user.firstName;
  if (user.lastName) return user.lastName;
  return user.userId ? `User ${user.userId.substring(0, 8)}` : fallback;
};

export const getUserFirstName = (user: User | null, fallback = 'Alex'): string => {
  if (!user) return fallback;
  if (user.firstName) return user.firstName;
  return fallback;
};