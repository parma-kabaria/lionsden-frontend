import packageJson from '../package.json';

// ----------------------------------------------------------------------

export type ConfigValue = {
  appName: string;
  appVersion: string;
  apiBaseUrl: string;
};

export const CONFIG: ConfigValue = {
  appName: 'LionsDen Resorts',
  appVersion: packageJson.version,
  apiBaseUrl: import.meta.env.VITE_API_URL || '/api/v1',
};
