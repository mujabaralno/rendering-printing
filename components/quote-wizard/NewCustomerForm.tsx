"use client";

import { useQuoteStore } from "@/store/useQuoteStore";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function NewCustomerForm() {
  const customerData = useQuoteStore((state) => state.customerData);
  const setCustomerData = useQuoteStore((state) => state.setCustomerData);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCustomerData({ [name]: value });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-2">
        <Label htmlFor="firstName">Nama Depan *</Label>
        <Input 
          id="firstName" 
          name="firstName" 
          placeholder="Masukkan nama depan" 
          value={customerData.firstName}
          onChange={handleChange}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="lastName">Nama Belakang</Label>
        <Input 
          id="lastName" 
          name="lastName" 
          placeholder="Masukkan nama belakang" 
          value={customerData.lastName}
          onChange={handleChange}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input 
          id="email" 
          name="email" 
          type="email" 
          placeholder="email@perusahaan.com" 
          value={customerData.email}
          onChange={handleChange}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Nomor Telepon</Label>
        <Input 
          id="phone" 
          name="phone" 
          type="tel" 
          placeholder="+62 812..." 
          value={customerData.phone}
          onChange={handleChange}
        />
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="companyName">Nama Perusahaan (Opsional)</Label>
        <Input 
          id="companyName" 
          name="companyName" 
          placeholder="PT Maju Bersama" 
          value={customerData.companyName}
          onChange={handleChange}
        />
      </div>
      
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="address">Alamat</Label>
        <Input 
          id="address" 
          name="address" 
          placeholder="Masukkan alamat lengkap" 
          value={customerData.address}
          onChange={handleChange}
        />
      </div>
    </div>
  );
}
