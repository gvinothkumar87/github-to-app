import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { useEnhancedOfflineData } from '../hooks/useEnhancedOfflineData';

interface LoadWeightModalProps {
  isOpen: boolean;
  onClose: () => void;
  outwardEntry: {
    id: string;
    serial_no: number;
    empty_weight: number;
    load_weight?: number;
    net_weight?: number;
    customer_name?: string;
    item_name?: string;
  };
  onSuccess: () => void;
}

const LoadWeightModal: React.FC<LoadWeightModalProps> = ({
  isOpen,
  onClose,
  outwardEntry,
  onSuccess
}) => {
  const [loadWeight, setLoadWeight] = useState(outwardEntry.load_weight?.toString() || '');
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { update: updateOutwardEntry } = useEnhancedOfflineData('outward_entries', [], { autoSync: true });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loadWeight || parseFloat(loadWeight) <= 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a valid load weight",
      });
      return;
    }

    if (parseFloat(loadWeight) <= outwardEntry.empty_weight) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Load weight must be greater than empty weight",
      });
      return;
    }

    setLoading(true);
    try {
      const netWeight = parseFloat(loadWeight) - outwardEntry.empty_weight;
      
      await updateOutwardEntry(outwardEntry.id, {
        load_weight: parseFloat(loadWeight),
        net_weight: netWeight,
        load_weight_updated_at: new Date().toISOString(),
        load_weight_updated_by: user?.id,
        remarks: remarks || null,
        is_completed: true
      });

      toast({
        title: "Success", 
        description: "Load weight updated successfully (will sync when online)",
      });
      
      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update load weight",
      });
    } finally {
      setLoading(false);
    }
  };

  const netWeight = loadWeight ? parseFloat(loadWeight) - outwardEntry.empty_weight : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Update Load Weight</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">
              <p>Serial No: <span className="font-medium">{outwardEntry.serial_no}</span></p>
              {outwardEntry.customer_name && (
                <p>Customer: <span className="font-medium">{outwardEntry.customer_name}</span></p>
              )}
              {outwardEntry.item_name && (
                <p>Item: <span className="font-medium">{outwardEntry.item_name}</span></p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Empty Weight (KG)</Label>
              <Input 
                value={outwardEntry.empty_weight} 
                disabled 
                className="bg-muted"
              />
            </div>
            <div>
              <Label>Load Weight (KG) *</Label>
              <Input
                type="number"
                step="0.01"
                value={loadWeight}
                onChange={(e) => setLoadWeight(e.target.value)}
                placeholder="Enter load weight"
                required
                min={outwardEntry.empty_weight + 0.01}
              />
            </div>
          </div>

          {loadWeight && (
            <div>
              <Label>Net Weight (KG)</Label>
              <Input 
                value={netWeight.toFixed(2)} 
                disabled 
                className="bg-muted font-medium"
              />
            </div>
          )}

          <div>
            <Label>Remarks (Optional)</Label>
            <Textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Add any remarks..."
              rows={2}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !loadWeight}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update Weight
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LoadWeightModal;