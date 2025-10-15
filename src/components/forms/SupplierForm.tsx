import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface SupplierFormProps {
  onSuccess?: () => void;
}

export function SupplierForm({ onSuccess }: SupplierFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name_english: "",
    name_tamil: "",
    code: "",
    contact_person: "",
    phone: "",
    email: "",
    address_english: "",
    address_tamil: "",
    gstin: "",
    pin_code: "",
    state_code: "33",
    place_of_supply: "33",
  });

  useEffect(() => {
    generateSupplierCode();
  }, []);

  const generateSupplierCode = async () => {
    try {
      const { data, error } = await supabase
        .from("suppliers")
        .select("code")
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) throw error;

      let nextNumber = 1;
      if (data && data.length > 0) {
        const lastCode = data[0].code;
        const match = lastCode.match(/^SUP(\d+)$/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }

      const newCode = `SUP${String(nextNumber).padStart(3, '0')}`;
      setFormData(prev => ({ ...prev, code: newCode }));
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to generate supplier code",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("suppliers")
        .insert([formData]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Supplier added successfully",
      });

      setFormData({
        name_english: "",
        name_tamil: "",
        code: "",
        contact_person: "",
        phone: "",
        email: "",
        address_english: "",
        address_tamil: "",
        gstin: "",
        pin_code: "",
        state_code: "33",
        place_of_supply: "33",
      });

      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name_english">Supplier Name (English) *</Label>
          <Input
            id="name_english"
            value={formData.name_english}
            onChange={(e) => setFormData({ ...formData, name_english: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="name_tamil">Supplier Name (Tamil)</Label>
          <Input
            id="name_tamil"
            value={formData.name_tamil}
            onChange={(e) => setFormData({ ...formData, name_tamil: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="code">Supplier Code *</Label>
          <Input
            id="code"
            value={formData.code}
            readOnly
            className="bg-muted"
          />
        </div>
        <div>
          <Label htmlFor="contact_person">Contact Person</Label>
          <Input
            id="contact_person"
            value={formData.contact_person}
            onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="gstin">GSTIN</Label>
          <Input
            id="gstin"
            value={formData.gstin}
            onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="pin_code">Pin Code</Label>
          <Input
            id="pin_code"
            value={formData.pin_code}
            onChange={(e) => setFormData({ ...formData, pin_code: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="state_code">State Code</Label>
          <Input
            id="state_code"
            value={formData.state_code}
            onChange={(e) => setFormData({ ...formData, state_code: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="place_of_supply">Place of Supply</Label>
          <Input
            id="place_of_supply"
            value={formData.place_of_supply}
            onChange={(e) => setFormData({ ...formData, place_of_supply: e.target.value })}
          />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="address_english">Address (English)</Label>
          <Input
            id="address_english"
            value={formData.address_english}
            onChange={(e) => setFormData({ ...formData, address_english: e.target.value })}
          />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="address_tamil">Address (Tamil)</Label>
          <Input
            id="address_tamil"
            value={formData.address_tamil}
            onChange={(e) => setFormData({ ...formData, address_tamil: e.target.value })}
          />
        </div>
      </div>

      <Button type="submit" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Add Supplier
      </Button>
    </form>
  );
}
