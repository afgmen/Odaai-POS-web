import useSWR from 'swr';
import { getSettings } from '@/lib/api';
import { Settings } from '@/lib/types';

export function useSettings() {
  const { data, error, mutate } = useSWR<Settings>('settings', getSettings, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  return {
    settings: data,
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}

export function useCurrency() {
  const { settings } = useSettings();
  
  return {
    currencyCode: settings?.currency_code || 'VND',
    currencySymbol: settings?.currency_symbol || '₫',
  };
}

