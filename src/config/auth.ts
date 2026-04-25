export const AUTH_CONFIG = {
  googleWebClientId: '819034908815-151na90glq2nnq549cu6gbqd4sbsj4tr.apps.googleusercontent.com',
  calendarScopes: ['https://www.googleapis.com/auth/calendar'],
} as const;

export function isGoogleAuthConfigured() {
  return !AUTH_CONFIG.googleWebClientId.startsWith('REPLACE_WITH_');
}
