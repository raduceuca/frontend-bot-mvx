import { EnvironmentsEnum } from 'lib/sdkDapp/sdkDapp.types';

export * from './sharedConfig';

export const API_URL = 'https://devnet-api.multiversx.com';
export const contractAddress =
  'erd1qqqqqqqqqqqqqpgqm6ad6xrsjvxlcdcffqe8w58trpec09ug9l5qde96pq';
export const environment = EnvironmentsEnum.devnet;
export const EXTRAS_API_URL = 'https://devnet-extras-api.multiversx.com';
export const sampleAuthenticatedDomains = [API_URL, EXTRAS_API_URL];
