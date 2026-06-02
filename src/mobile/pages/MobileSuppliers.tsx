import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '../components/MobileLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const MobileSuppliers: React.FC = () => {
  const navigate = useNavigate();

  return (
    <MobileLayout title="Suppliers" showBackButton onBack={() => navigate('/')}>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Suppliers Directory</h2>
          <Button onClick={() => {}} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Supplier
          </Button>
        </div>
        
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <p>Suppliers module is under development.</p>
          </CardContent>
        </Card>
      </div>
    </MobileLayout>
  );
};

export default MobileSuppliers;
