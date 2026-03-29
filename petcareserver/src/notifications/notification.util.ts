import { INVITE_PAGE_ROUTE } from 'src/common';

export const buildNotificationProductUrl = (notificationId: number): string => {
  return `/notifications/${notificationId}/product-details`;
};

/**
 * Build the invitation URL for both email and notification
 * This ensures consistency between email links and notification action URLs
 * @param frontendUrl - The frontend base URL
 * @param token - The invitation token
 * @returns The complete invitation URL
 */
export const buildInvitationUrl = (frontendUrl: string, token: string): string => {
  return `${frontendUrl}/${INVITE_PAGE_ROUTE}?token=${token}`;
};
