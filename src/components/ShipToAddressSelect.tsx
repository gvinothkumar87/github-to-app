import { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Customer, CustomerShipAddress } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

interface ShipToAddressSelectProps {
  customerId: string;
  customer?: Customer | null;
  value: string | null;
  onChange: (value: string | null, address: CustomerShipAddress | null) => void;
}

const BILL_TO_VALUE = '__bill_to__';

export const ShipToAddressSelect = ({ customerId, customer, value, onChange }: ShipToAddressSelectProps) => {
  const { language, getDisplayName } = useLanguage();
  const [addresses, setAddresses] = useState<CustomerShipAddress[]>([]);

  useEffect(() => {
    if (!customerId) {
      setAddresses([]);
      onChange(null, null);
      return;
    }

    supabase
      .from('customer_ship_addresses')
      .select('*')
      .eq('customer_id', customerId)
      .eq('is_active', true)
      .order('is_default', { ascending: false })
      .order('label')
      .then(({ data, error }) => {
        if (error) {
          console.error('Error fetching ship-to addresses:', error);
          setAddresses([]);
          return;
        }

        const rows = (data || []) as CustomerShipAddress[];
        setAddresses(rows);
        if (!value) {
          const defaultAddress = rows.find(addr => addr.is_default) || null;
          if (defaultAddress) onChange(defaultAddress.id, defaultAddress);
        } else if (value !== BILL_TO_VALUE && !rows.some(addr => addr.id === value)) {
          onChange(null, null);
        }
      });
  }, [customerId]);

  if (!customerId) return null;

  return (
    <div className="space-y-2">
      <Label>{language === 'english' ? 'Ship To Address' : 'அனுப்பும் முகவரி'}</Label>
      <Select
        value={value || BILL_TO_VALUE}
        onValueChange={(nextValue) => {
          if (nextValue === BILL_TO_VALUE) {
            onChange(null, null);
            return;
          }
          const selected = addresses.find(addr => addr.id === nextValue) || null;
          onChange(nextValue, selected);
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder={language === 'english' ? 'Select ship-to address' : 'அனுப்பும் முகவரியை தேர்ந்தெடுக்கவும்'} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={BILL_TO_VALUE}>
            {language === 'english' ? 'Same as Bill To' : 'பில் முகவரியே பயன்படுத்தவும்'}
            {customer ? ` - ${getDisplayName(customer)}` : ''}
          </SelectItem>
          {addresses.map(addr => (
            <SelectItem key={addr.id} value={addr.id}>
              {addr.label}{addr.is_default ? ' (Default)' : ''} - {addr.pin_code || addr.state_code || ''}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {value && addresses.find(addr => addr.id === value) && (
        <p className="text-xs text-muted-foreground">
          {addresses.find(addr => addr.id === value)?.address_english}
        </p>
      )}
    </div>
  );
};
