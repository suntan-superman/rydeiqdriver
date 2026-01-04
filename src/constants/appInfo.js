/**
 * Application Information Constants
 * 
 * Single source of truth for app branding, copyright, and version info.
 * Update COPYRIGHT_YEAR here to change it across the entire application.
 */

export const APP_INFO = {
  // Application Details
  APP_NAME: 'AnyRyde',
  APP_DISPLAY_NAME: 'AnyRyde Driver',
  APP_TAGLINE: 'Your Rides • Your Rates • Your Rules',
  COMPANY_NAME: 'AnyRyde Technologies, Inc.',
  DEVELOPER_NAME: 'Workside Software',
  
  // Version
  VERSION: '1.0.0',
  
  // Copyright
  COPYRIGHT_YEAR: 2026,
  
  // Contact
  SUPPORT_EMAIL: 'support@anyryde.com',
  WEBSITE: 'https://anyryde.com',
};

// Helper functions for formatted strings
export const getCopyrightText = () => `${APP_INFO.APP_DISPLAY_NAME} © ${APP_INFO.COPYRIGHT_YEAR}`;
export const getCompanyCopyright = () => `Copyright ${APP_INFO.COPYRIGHT_YEAR} ${APP_INFO.APP_NAME}`;
export const getDeveloperCopyright = () => `${APP_INFO.DEVELOPER_NAME} Copyright ${APP_INFO.COPYRIGHT_YEAR}`;

export default APP_INFO;
