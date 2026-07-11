export const UserRole = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  BUSINESS_OWNER: 'BUSINESS_OWNER',
  STAFF: 'STAFF'
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];
