import { useState, useEffect } from 'react';
import { PageLayout } from '@/components/PageLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { validateBillSequence, BillRecord } from '@/utils/billValidation';
import { Loader2, AlertCircle, CheckCircle2, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { usePageAccess } from '@/hooks/usePageAccess';

interface ValidationIssue {
  bill_serial_no: string;
  sale_date: string;
  error: string;
  errorTa: string;
}

const BillValidationReport = () => {
  const { language } = useLanguage();
  const { checkAccess, loading: accessLoading } = usePageAccess();
  const hasAccess = checkAccess('/bill-validation-report');
  
  const [loading, setLoading] = useState(true);
  const [issues, setIssues] = useState<ValidationIssue[]>([]);
  const [totalBills, setTotalBills] = useState(0);

  useEffect(() => {
    if (!accessLoading && hasAccess) {
      fetchAndValidateBills();
    } else if (!accessLoading && !hasAccess) {
      setLoading(false);
    }
  }, [hasAccess, accessLoading]);

  const fetchAndValidateBills = async () => {
    setLoading(true);
    try {
      const { data: sales, error } = await supabase
        .from('sales')
        .select('bill_serial_no, sale_date')
        .not('bill_serial_no', 'is', null)
        .not('sale_date', 'is', null)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const existingBills = (sales || []) as BillRecord[];
      setTotalBills(existingBills.length);

      const foundIssues: ValidationIssue[] = [];
      const checkedSet = new Set<string>();

      // Validate each bill against the entire set
      for (let i = 0; i < existingBills.length; i++) {
        const bill = existingBills[i];
        if (!bill.bill_serial_no || !bill.sale_date) continue;
        
        // Pass all other bills (excluding current one) to validateBillSequence
        const otherBills = existingBills.filter((_, index) => index !== i);
        
        const validation = validateBillSequence(bill.bill_serial_no, bill.sale_date, otherBills);
        
        if (!validation.isValid) {
          // Check if we already recorded this issue (since A conflicting with B will flag both, we can just record it)
          foundIssues.push({
            bill_serial_no: bill.bill_serial_no,
            sale_date: bill.sale_date,
            error: validation.error || 'Unknown error',
            errorTa: validation.errorTa || validation.error || 'தெரியாத பிழை'
          });
        }
      }
      
      setIssues(foundIssues);

    } catch (error) {
      console.error('Error fetching bills:', error);
    } finally {
      setLoading(false);
    }
  };

  if (accessLoading) {
    return (
      <PageLayout title={language === 'english' ? 'Bill Sequence Report' : 'பில் வரிசை அறிக்கை'}>
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mb-4" />
          <p>{language === 'english' ? 'Loading...' : 'ஏற்றுகிறது...'}</p>
        </div>
      </PageLayout>
    );
  }

  if (!hasAccess) {
    return (
      <PageLayout title={language === 'english' ? 'Unauthorized' : 'அனுமதி இல்லை'}>
        <div className="container mx-auto p-6 space-y-6">
          <Card className="border-red-200">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Lock className="h-12 w-12 text-red-500 mb-4" />
              <h2 className="text-xl font-semibold text-red-700 mb-2">
                {language === 'english' ? 'Access Denied' : 'அணுகல் மறுக்கப்பட்டது'}
              </h2>
              <p className="text-muted-foreground max-w-md">
                {language === 'english' 
                  ? 'You need administrator privileges to view this page.' 
                  : 'இந்தப் பக்கத்தைப் பார்க்க உங்களுக்கு நிர்வாகி உரிமை தேவை.'}
              </p>
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title={language === 'english' ? 'Bill Sequence Report' : 'பில் வரிசை அறிக்கை'}>
      <div className="container mx-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{language === 'english' ? 'Retroactive Validation' : 'முந்தைய சரிபார்ப்பு'}</CardTitle>
            <CardDescription>
              {language === 'english' 
                ? 'Checks all existing bills for chronological inconsistencies or duplicate numbers.'
                : 'காலவரிசை முரண்பாடுகள் அல்லது நகல் எண்களுக்கு இருக்கும் அனைத்து பில்களையும் சரிபார்க்கிறது.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mb-4" />
                <p>{language === 'english' ? 'Analyzing bills...' : 'பில்களை பகுப்பாய்வு செய்கிறது...'}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4 mb-6">
                  <Badge variant="outline" className="text-base py-1 px-3">
                    {language === 'english' ? 'Total Bills Checked: ' : 'மொத்த பில்கள்: '} {totalBills}
                  </Badge>
                  {issues.length === 0 ? (
                    <Badge className="bg-green-500 hover:bg-green-600 text-base py-1 px-3 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      {language === 'english' ? 'No Issues Found' : 'எந்த பிரச்சனையும் இல்லை'}
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="text-base py-1 px-3 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      {issues.length} {language === 'english' ? 'Issues Found' : 'பிரச்சனைகள் கண்டறியப்பட்டன'}
                    </Badge>
                  )}
                </div>

                {issues.length > 0 && (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{language === 'english' ? 'Bill Number' : 'பில் எண்'}</TableHead>
                          <TableHead>{language === 'english' ? 'Sale Date' : 'விற்பனை தேதி'}</TableHead>
                          <TableHead>{language === 'english' ? 'Issue Description' : 'பிரச்சனை விவரம்'}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {issues.map((issue, idx) => (
                          <TableRow key={`${issue.bill_serial_no}-${idx}`}>
                            <TableCell className="font-medium">{issue.bill_serial_no}</TableCell>
                            <TableCell>{new Date(issue.sale_date).toLocaleDateString()}</TableCell>
                            <TableCell className="text-red-600">
                              {language === 'english' ? issue.error : issue.errorTa}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default BillValidationReport;
