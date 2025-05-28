
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Upload, Plus, Trash2, Building2, Info } from 'lucide-react';
import { BrandEntry } from '../types';

const BrandListManager: React.FC = () => {
  const [brandList, setBrandList] = useState<BrandEntry[]>([]);
  const [brandInput, setBrandInput] = useState('');
  const [systemInput, setSystemInput] = useState('');
  const [showBulkInput, setShowBulkInput] = useState(false);
  const [bulkBrandText, setBulkBrandText] = useState('');

  const addBrand = () => {
    if (!brandInput.trim()) return;
    
    const newBrand: BrandEntry = {
      id: `brand-${Date.now()}`,
      name: brandInput.trim(),
      variants: [],
      system: systemInput.trim() || undefined
    };
    
    setBrandList(prev => [...prev, newBrand]);
    setBrandInput('');
    setSystemInput('');
  };

  const removeBrand = (id: string) => {
    setBrandList(prev => prev.filter(brand => brand.id !== id));
  };

  const processBulkBrands = () => {
    const lines = bulkBrandText.split('\n').filter(line => line.trim());
    const newBrands: BrandEntry[] = [];
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed) {
        // Check if line contains system info (format: "Brand Name | System Name")
        const parts = trimmed.split('|').map(p => p.trim());
        const brandName = parts[0];
        const systemName = parts[1];
        
        newBrands.push({
          id: `brand-${Date.now()}-${newBrands.length}`,
          name: brandName,
          variants: [],
          system: systemName
        });
      }
    });
    
    setBrandList(prev => [...prev, ...newBrands]);
    setBulkBrandText('');
    setShowBulkInput(false);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setBulkBrandText(text);
      setShowBulkInput(true);
    };
    reader.readAsText(file);
  };

  const groupedBrands = brandList.reduce((acc, brand) => {
    const system = brand.system || 'Independent';
    if (!acc[system]) acc[system] = [];
    acc[system].push(brand);
    return acc;
  }, {} as Record<string, BrandEntry[]>);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Brand List Manager
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Add brands to normalize responses. Use "|" to separate brand from system (e.g., "Hospital A | Health System B").
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="brand-input" className="text-xs font-medium">Brand/Hospital Name</Label>
              <Input
                id="brand-input"
                placeholder="Enter brand name..."
                value={brandInput}
                onChange={(e) => setBrandInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addBrand()}
                className="h-9"
              />
            </div>
            <div>
              <Label htmlFor="system-input" className="text-xs font-medium">System (Optional)</Label>
              <Input
                id="system-input"
                placeholder="Parent system..."
                value={systemInput}
                onChange={(e) => setSystemInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addBrand()}
                className="h-9"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={addBrand} disabled={!brandInput.trim()} size="sm" className="flex-1">
              <Plus className="h-4 w-4 mr-1" />
              Add Brand
            </Button>
            
            <div className="relative">
              <input
                type="file"
                accept=".txt,.csv"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-1" />
                Upload List
              </Button>
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowBulkInput(!showBulkInput)}
            >
              Bulk Add
            </Button>
          </div>
        </div>

        {showBulkInput && (
          <div className="space-y-2">
            <Label className="text-xs font-medium">Bulk Brand Entry</Label>
            <Textarea
              placeholder="Enter brands, one per line. Use | to separate brand from system:&#10;Brand A | System 1&#10;Brand B | System 1&#10;Brand C"
              value={bulkBrandText}
              onChange={(e) => setBulkBrandText(e.target.value)}
              className="min-h-[100px] text-sm"
            />
            <div className="flex gap-2">
              <Button onClick={processBulkBrands} size="sm" disabled={!bulkBrandText.trim()}>
                Process Brands
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowBulkInput(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {brandList.length > 0 && (
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Configured Brands</Label>
              <Badge variant="outline" className="text-xs">
                {brandList.length} brands
              </Badge>
            </div>
            
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {Object.entries(groupedBrands).map(([system, brands]) => (
                <div key={system} className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {system}
                  </div>
                  <div className="grid gap-1 pl-4">
                    {brands.map((brand) => (
                      <div key={brand.id} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                        <span>{brand.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                          onClick={() => removeBrand(brand.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground bg-amber-50 p-3 rounded-md">
          <div className="font-medium text-amber-700 mb-1">3% Threshold Rule:</div>
          <div>New brands will only be added to the codeframe if mentioned by ≥3% of responses.</div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BrandListManager;
