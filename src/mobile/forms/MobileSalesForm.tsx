import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { MobileLayout } from '../components/MobileLayout';
import { useEnhancedOfflineData } from '../hooks/useEnhancedOfflineData';


const MobileSalesForm: React.FC = () => {
  const { language } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { outwardEntryId } = useParams();
  const [loading, setLoading] = useState(false);
  
  const { create: createSale } = useEnhancedOfflineData('offline_sales', [], { autoSync: true });
  const { data: outwardEntries } = useEnhancedOfflineData('offline_outward_entries', [], { autoSync: true });
  const { data: customers } = useEnhancedOfflineData('offline_customers', [], { autoSync: true });
  const { data: items } = useEnhancedOfflineData('offline_items', [], { autoSync: true });

  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [formData, setFormData] = useState({
    outward_entry_id: outwardEntryId || '',
    customer_id: '',
    item_id: '',
    quantity: '',
    rate: '',
    total_amount: '',
    bill_serial_no: '',
    sale_date: new Date().toISOString().split('T')[0],
  });
  const [useSpecialSerial, setUseSpecialSerial] = useState(true);

  // Auto-generate bill serial number when selected entry changes or special serial checkbox changes
  useEffect(() => {
    if (selectedEntry && !formData.bill_serial_no) {
      if (useSpecialSerial) {
        generateSpecialSerial().then(billSerial => {
          setFormData(prev => ({ ...prev, bill_serial_no: billSerial }));
        });
      } else {
        generateBillSerial(selectedEntry.loading_place).then(billSerial => {
          setFormData(prev => ({ ...prev, bill_serial_no: billSerial }));
        });
      }
    }
  }, [selectedEntry, useSpecialSerial, formData.bill_serial_no]);

  useEffect(() => {
    if (outwardEntryId) {
      const entry = outwardEntries.find((e: any) => e.id === outwardEntryId) as any;
      if (entry) {
        setSelectedEntry(entry);
        setFormData(prev => ({
          ...prev,
          outward_entry_id: outwardEntryId,
          customer_id: entry.customer_id,
          item_id: entry.item_id,
          quantity: '',  // Will be calculated in the next useEffect
        }));
      }
    }
  }, [outwardEntryId, outwardEntries]);

  // Auto-calculate quantity based on net weight and unit weight
  useEffect(() => {
    if (selectedEntry) {
      const item = items.find((i: any) => i.id === selectedEntry.item_id) as any;
      if (item && selectedEntry.net_weight) {
        const calculatedQuantity = (selectedEntry.net_weight / (item.unit_weight || 1));
        setFormData(prev => ({ ...prev, quantity: calculatedQuantity.toFixed(2) }));
      }
    }
  }, [selectedEntry, items]);

  useEffect(() => {
    if (formData.quantity && formData.rate && selectedEntry) {
      const baseAmount = parseFloat(formData.quantity) * parseFloat(formData.rate);
      const item = items.find((i: any) => i.id === selectedEntry.item_id) as any;
      const gstPercent = item?.gst_percentage || 0;
      const gstAmount = baseAmount * (gstPercent / 100);
      const totalAmount = baseAmount + gstAmount;
      setFormData(prev => ({ ...prev, total_amount: totalAmount.toFixed(2) }));
    }
  }, [formData.quantity, formData.rate, selectedEntry, items]);

  // Get sales data for bill generation
  const { data: salesData } = useEnhancedOfflineData('offline_sales');

  // Generate special serial (D-series)
  const generateSpecialSerial = async (): Promise<string> => {
    try {
      const sales = salesData || [];
      const existingBills = sales.filter((sale: any) => 
        sale.bill_serial_no && sale.bill_serial_no.startsWith('D')
      );
      
      let nextNumber = 1;
      if (existingBills.length > 0) {
        let maxNumber = 0;
        existingBills.forEach((sale: any) => {
          const num = parseInt((sale.bill_serial_no || 'D0').replace('D', ''));
          maxNumber = Math.max(maxNumber, num);
        });
        nextNumber = maxNumber + 1;
      }
      
      const serialNumber = nextNumber.toString().padStart(3, '0');
      return `D${serialNumber}`;
    } catch (error) {
      console.error('Error generating special serial:', error);
      return 'D001';
    }
  };

  // Generate bill serial number based on loading place
  const generateBillSerial = async (loadingPlace: string): Promise<string> => {
    try {
      const sales = salesData || [];
      let prefix = '';
      let existingBills: any[] = [];
      
      if (loadingPlace === 'PULIVANTHI') {
        // For PULIVANTHI, get numeric serials without leading zeros
        existingBills = sales.filter((sale: any) => 
          sale.bill_serial_no && /^[0-9]+$/.test(sale.bill_serial_no) && !sale.bill_serial_no.startsWith('D')
        );
      } else if (loadingPlace === 'MATTAPARAI') {
        // For MATTAPARAI, get GRM prefixed serials like GRM050, GRM051, GRM052
        prefix = 'GRM';
        existingBills = sales.filter((sale: any) => 
          sale.bill_serial_no && sale.bill_serial_no.startsWith('GRM')
        );
      }
      
      let nextNumber = 1;
      if (existingBills.length > 0) {
        // Find the highest number (not the latest chronologically)
        let maxNumber = 0;
        existingBills.forEach((sale: any) => {
          if (loadingPlace === 'PULIVANTHI') {
            const num = parseInt(sale.bill_serial_no || '0');
            if (!isNaN(num)) {
              maxNumber = Math.max(maxNumber, num);
            }
          } else {
            const num = parseInt((sale.bill_serial_no || 'GRM0').replace('GRM', ''));
            maxNumber = Math.max(maxNumber, num);
          }
        });
        
        nextNumber = maxNumber + 1;
        if (loadingPlace === 'MATTAPARAI') {
          nextNumber = Math.max(50, nextNumber); // Ensure GRM starts from 050
        }
      } else {
        // Set starting numbers for new series
        if (loadingPlace === 'MATTAPARAI') {
          nextNumber = 50; // Start GRM series from 050
        }
      }
      
      // For PULIVANTHI: return number without leading zeros (e.g., 1, 2, 46)
      // For MATTAPARAI: return with GRM prefix and padded (e.g., GRM050)
      if (loadingPlace === 'PULIVANTHI') {
        return nextNumber.toString();
      } else {
        const serialNumber = nextNumber.toString().padStart(3, '0');
        return `${prefix}${serialNumber}`;
      }
    } catch (error) {
      console.error('Error generating bill serial:', error);
      return loadingPlace === 'PULIVANTHI' ? '1' : 'GRM050';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Ensure bill_serial_no is not empty before submission
      const finalFormData = {
        ...formData,
        quantity: parseFloat(formData.quantity),
        rate: parseFloat(formData.rate),
        total_amount: parseFloat(formData.total_amount),
      };

      // If bill_serial_no is empty, generate one
      if (!finalFormData.bill_serial_no && selectedEntry) {
        finalFormData.bill_serial_no = useSpecialSerial 
          ? await generateSpecialSerial()
          : await generateBillSerial(selectedEntry.loading_place);
      }

      await createSale(finalFormData);
      
      toast({
        title: language === 'english' ? 'Success' : 'வெற்றி',
        description: language === 'english' ? 'Sale recorded successfully' : 'விற்பனை வெற்றிகரமாக பதிவு செய்யப்பட்டது',
      });
      
      navigate('/sales');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: language === 'english' ? 'Error' : 'பிழை',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <MobileLayout title="New Sale">
      <div className="space-y-4">

        <Card>
          <CardHeader>
            <CardTitle>
              {language === 'english' ? 'Record New Sale' : 'புதிய விற்பனையை பதிவு செய்யவும்'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="outward_entry_id">
                  {language === 'english' ? 'Outward Entry' : 'வெளியீட்டு பதிவு'} *
                </Label>
                <Select 
                  value={formData.outward_entry_id} 
                  onValueChange={(value) => {
                  const entry = outwardEntries.find((e: any) => e.id === value) as any;
                    setSelectedEntry(entry);
                    setFormData(prev => ({
                      ...prev,
                      outward_entry_id: value,
                      customer_id: entry?.customer_id || '',
                      item_id: entry?.item_id || '',
                      quantity: '', // Will be auto-calculated
                      bill_serial_no: '', // Reset to trigger auto-generation
                    }));
                    setUseSpecialSerial(false); // Reset special serial checkbox
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={language === 'english' ? 'Select outward entry' : 'வெளியீட்டு பதிவை தேர்ந்தெடுக்கவும்'} />
                  </SelectTrigger>
                  <SelectContent>
                    {outwardEntries.filter((entry: any) => entry.is_completed).map((entry: any) => {
                      const customer = customers.find((c: any) => c.id === entry.customer_id) as any;
                      const item = items.find((i: any) => i.id === entry.item_id) as any;
                      return (
                        <SelectItem key={entry.id} value={entry.id}>
                          #{entry.serial_no} - {customer?.name_english} - {item?.name_english}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {selectedEntry && (
                <div className="bg-muted p-3 rounded space-y-2">
                  <p className="text-xs font-semibold text-primary">
                    {language === 'english' ? 'Note: Weights are in KG, Bill Quantity = Net Weight ÷ Unit Weight' : 'குறிப்பு: எடைகள் கிலோவில், பில் அளவு = நிகர எடை ÷ யூனிட் எடை'}
                  </p>
                  <p className="text-sm">
                    <strong>Net Weight:</strong> {selectedEntry.net_weight} KG
                  </p>
                  <p className="text-sm">
                    <strong>Unit Weight:</strong> {(items.find((i: any) => i.id === selectedEntry.item_id) as any)?.unit_weight || 1} KG
                  </p>
                  <p className="text-sm">
                    <strong>Calculated Bill Quantity:</strong> {formData.quantity} Units
                  </p>
                  <p className="text-sm">
                    <strong>Lorry:</strong> {selectedEntry.lorry_no}
                  </p>
                </div>
              )}
              
              <div>
                <Label htmlFor="quantity">
                  {language === 'english' ? 'Calculated Quantity (Units)' : 'கணக்கிடப்பட்ட அளவு (யூனிட்)'} *
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  step="0.01"
                  value={formData.quantity}
                  readOnly
                  className="bg-muted"
                  placeholder={language === 'english' ? 'Auto-calculated' : 'தானாக கணக்கிடப்பட்டது'}
                />
              </div>
              
              <div>
                <Label htmlFor="rate">
                  {language === 'english' ? 'Rate per Unit (₹)' : 'யூனிட் வீத விலை (₹)'} *
                </Label>
                <Input
                  id="rate"
                  type="number"
                  step="0.01"
                  value={formData.rate}
                  onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                  required
                  placeholder={language === 'english' ? 'Enter rate per unit' : 'யூனிட் வீத விலையை உள்ளிடவும்'}
                />
              </div>
              
              <div>
                <Label htmlFor="total_amount">
                  {language === 'english' ? 'Total Amount (₹)' : 'மொத்த தொகை (₹)'}
                </Label>
                <Input
                  id="total_amount"
                  type="number"
                  step="0.01"
                  value={formData.total_amount}
                  readOnly
                  className="bg-muted"
                  placeholder={language === 'english' ? 'Auto-calculated' : 'தானாக கணக்கிடப்பட்டது'}
                />
              </div>
              
              <div>
                <Label htmlFor="sale_date">
                  {language === 'english' ? 'Sale Date' : 'விற்பனை தேதி'} *
                </Label>
                <Input
                  id="sale_date"
                  type="date"
                  value={formData.sale_date}
                  onChange={(e) => setFormData({ ...formData, sale_date: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="use-special-serial" className="flex items-center gap-2 cursor-pointer mb-2">
                  <input
                    id="use-special-serial"
                    type="checkbox"
                    checked={useSpecialSerial}
                    onChange={(e) => {
                      setUseSpecialSerial(e.target.checked);
                      setFormData({ ...formData, bill_serial_no: '' }); // Reset to trigger auto-generation
                    }}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">
                    {language === 'english' ? 'Use Special Serial (D001)' : 'சிறப்பு எண் பயன்படுத்தவும் (D001)'}
                  </span>
                </Label>
                <Label htmlFor="bill_serial_no">
                  {language === 'english' ? 'Bill Serial Number' : 'பில் எண்'}
                </Label>
                <Input
                  id="bill_serial_no"
                  value={formData.bill_serial_no}
                  onChange={(e) => setFormData({ ...formData, bill_serial_no: e.target.value })}
                  placeholder={language === 'english' ? 'Auto-generated (editable)' : 'தானாக உருவாக்கப்பட்டது (திருத்தலாம்)'}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {language === 'english' 
                    ? `${useSpecialSerial ? 'D-series' : selectedEntry?.loading_place === 'PULIVANTHI' ? 'Numeric' : 'GRM-series'} - Auto-generated, can be edited`
                    : `${useSpecialSerial ? 'D-தொடர்' : selectedEntry?.loading_place === 'PULIVANTHI' ? 'எண்கள்' : 'GRM-தொடர்'} - தானாக உருவாக்கப்பட்டது, திருத்தலாம்`
                  }
                </p>
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? (language === 'english' ? 'Recording...' : 'பதிவு செய்கிறது...') : 
                   (language === 'english' ? 'Record Sale' : 'விற்பனையை பதிவு செய்யவும்')}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate('/sales')} 
                  className="flex-1"
                >
                  {language === 'english' ? 'Cancel' : 'ரத்து செய்'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MobileLayout>
  );
};

export default MobileSalesForm;