export interface FeatureFlags {
  calendar_enabled: boolean;
  customers_enabled: boolean;
  leads_enabled: boolean;
  jobs_enabled: boolean;
  quotes_enabled: boolean;
  invoices_enabled: boolean;
  tasks_enabled: boolean;
  analytics_enabled: boolean; // Legacy - kept for backwards compatibility
  campaigns_enabled: boolean;
  ai_assistant_enabled: boolean;
  // Separated analytics flags
  reports_enabled: boolean;
  chat_analytics_enabled: boolean;
  call_analytics_enabled: boolean;
  // Integrations
  voice_calls_enabled: boolean;
  email_integration_enabled: boolean;
  sms_integration_enabled: boolean;
  api_access_enabled: boolean;
  webhooks_enabled: boolean;
  custom_branding_enabled: boolean;
  white_label_enabled: boolean;
}

export type FeatureFlagKey = keyof FeatureFlags;

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  calendar_enabled: true,
  customers_enabled: true,
  leads_enabled: true,
  jobs_enabled: true,
  quotes_enabled: true,
  invoices_enabled: true,
  tasks_enabled: true,
  analytics_enabled: true, // Legacy
  campaigns_enabled: true,
  ai_assistant_enabled: true,
  // Separated analytics - default to true
  reports_enabled: true,
  chat_analytics_enabled: true,
  call_analytics_enabled: true,
  // Integrations
  voice_calls_enabled: false,
  email_integration_enabled: false,
  sms_integration_enabled: false,
  api_access_enabled: false,
  webhooks_enabled: false,
  custom_branding_enabled: false,
  white_label_enabled: false,
};
