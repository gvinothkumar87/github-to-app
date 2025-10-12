import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import { Camera as CapCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { useEnhancedOfflineData } from '../hooks/useEnhancedOfflineData';
import { supabase } from '@/integrations/supabase/client';

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
  const [photoDataUrl, setPhotoDataUrl] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { update: updateOutwardEntry } = useEnhancedOfflineData('outward_entries', [], { autoSync: true });

  const takePhoto = async () => {
    try {
      const photo = await CapCamera.getPhoto({
        quality: 60,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });

      if (photo.dataUrl) {
        setPhotoDataUrl(photo.dataUrl);
      }
    } catch (error: any) {
      console.error('Error taking photo:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to take photo. Please check camera permissions.',
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoDataUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoDataUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (uploadInputRef.current) {
      uploadInputRef.current.value = '';
    }
  };

  const uploadToGoogleDrive = async (dataUrl: string): Promise<string> => {
    const fileName = `${Date.now()}_${outwardEntry.serial_no}.jpg`;
    
    // Compress before upload to avoid edge memory limits
    const { compressDataUrl } = await import('@/lib/image');
    const compressed = await compressDataUrl(dataUrl, { maxSize: 1600, quality: 0.7 });

    const { data, error } = await supabase.functions.invoke('upload-to-google-drive', {
      body: { dataUrl: compressed, fileName },
    });

    if (error) throw error;
    if (!data?.viewUrl) throw new Error('No URL returned from upload');

    return data.viewUrl;
  };

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

    if (!photoDataUrl) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please upload a weighment photo",
      });
      return;
    }

    setLoading(true);
    try {
      setUploading(true);
      toast({
        title: "Uploading",
        description: "Uploading weighment photo...",
      });
      
      const photoUrl = await uploadToGoogleDrive(photoDataUrl);
      setUploadedPhotoUrl(photoUrl);
      setUploading(false);

      const netWeight = parseFloat(loadWeight) - outwardEntry.empty_weight;
      
      await updateOutwardEntry(outwardEntry.id, {
        load_weight: parseFloat(loadWeight),
        net_weight: netWeight,
        load_weight_updated_at: new Date().toISOString(),
        load_weight_updated_by: user?.id,
        remarks: remarks || null,
        is_completed: true,
        sync_status: 'pending',
        load_weight_photo_url: photoUrl
      });

      toast({
        title: "Success", 
        description: "Load weight updated successfully (will sync when online)",
      });
      
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error updating load weight:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error?.message || 'Failed to update load weight',
      });
    } finally {
      setLoading(false);
      setUploading(false);
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

          <div className="space-y-2">
            <Label htmlFor="weighment_photo">Weighment Photo *</Label>
            <input
              ref={fileInputRef}
              id="weighment_photo"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />
            <input
              ref={uploadInputRef}
              id="weighment_upload"
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={takePhoto}
                className="flex-1"
              >
                <Camera className="mr-2 h-4 w-4" />
                Take Photo
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => uploadInputRef.current?.click()}
                className="flex-1"
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload
              </Button>
            </div>
            {photoDataUrl && (
              <div className="relative mt-2">
                <img 
                  src={photoDataUrl} 
                  alt="Weighment preview" 
                  className="w-full h-48 object-cover rounded-md border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={handleRemovePhoto}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            {uploadedPhotoUrl && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2 w-full"
                onClick={() => window.open(uploadedPhotoUrl, '_blank')}
              >
                View in Google Drive
              </Button>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || uploading || !loadWeight || !photoDataUrl}>
              {(loading || uploading) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {uploading ? 'Uploading...' : 'Update Weight'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LoadWeightModal;