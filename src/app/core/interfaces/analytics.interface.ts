export interface AnalyticsEventProperties {
  [key: string]: string | number | boolean | undefined;
}

export enum AnalyticsEvent {
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILED = 'login_failed',
  REGISTER_SUCCESS = 'register_success',
  REGISTER_FAILED = 'register_failed',
  LOGOUT = 'logout',
  PASSWORD_CREATED = 'password_created',
  PASSWORD_UPDATED = 'password_updated',
  PASSWORD_DELETED = 'password_deleted',
  PASSWORD_VIEWED = 'password_viewed',
  SETTINGS_UPDATED = 'settings_updated',
}
