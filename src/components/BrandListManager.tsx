
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Upload, Plus, Trash2, Building2 } from 'lucide-react';
import { Input } from './ui/input';
import { Alert, AlertDescription } from './ui/alert';

interface BrandEntry {
  id: string;
  name: string;
  variants: string[];
  system?: string;
}

interface BrandListManagerProps {
  onBrandListChange: (brands: BrandEntry[]) => void;
  existingBrands?: BrandEntry[];
}

const BrandListManager: React.FC<BrandListManagerProps> = ({ 
  onBrandListChange, 
  existingBrands = [] 
}) => {
  const [brands, setBrands] = useState<BrandEntry[]>(existingBrands);
  const [bulkInput, setBulkInput] = useState('');
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandSystem, setNewBrandSystem] = useState('');

  const handleBulkPaste = () => {
    const lines = bulkInput.split('\n').filter(line => line.trim());
    const newBrands: BrandEntry[] = lines.map((line, index) => {
      const [name, ...variants] = line.split(',').map(s => s.trim());
      return {
        id: `brand_${Date.now()}_${index}`,
        name: name || `Brand ${brands.length + index + 1}`,
        variants: variants.length > 0 ? variants : [name]
      };
    });
    
    const updatedBrands = [...brands, ...newBrands];
    setBrands(updatedBrands);
    onBrandListChange(updatedBrands);
    setBulkInput('');
  };

  const addSingleBrand = () => {
    if (!newBrandName.trim()) return;
    
    const newBrand: BrandEntry = {
      id: `brand_${Date.now()}`,
      name: newBrandName.trim(),
      variants: [newBrandName.trim()],
      system: newBrandSystem.trim() || undefined
    };
    
    const updatedBrands = [...brands, newBrand];
    setBrands(updatedBrands);
    onBrandListChange(updatedBrands);
    setNewBrandName('');
    setNewBrandSystem('');
  };

  const removeBrand = (id: string) => {
    const updatedBrands = brands.filter(b => b.id !== id);
    setBrands(updatedBrands);
    onBrandListChange(updatedBrands);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setBulkInput(text);
    };
    reader.readAsText(file);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Brand List Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            Add your brand list to normalize variants. Only brands mentioned by ≥3% of responses will be included in final codeframe.
          </AlertDescription>
        </Alert>

        {/* Bulk Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Bulk Add Brands</label>
          <Textarea
            placeholder="Paste brand list here (one per line, or comma-separated with variants)&#10;Example:&#10;McDonald's, McDonalds, McDonlds&#10;Burger King, BK&#10;KFC, Kentucky Fried Chicken"
            value={bulkInput}
            onChange={(e) => setBulkInput(e.target.value)}
            rows={4}
          />
          <div className="flex gap-2">
            <Button onClick={handleBulkPaste} disabled={!bulkInput.trim()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Brands
            </Button>
            <Button variant="outline" asChild>
              <label htmlFor="brand-file">
                <Upload className="h-4 w-4 mr-2" />
                Upload File
              </label>
            </Button>
            <input
              id="brand-file"
              type="file"
              accept=".txt,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </div>

        {/* Single Brand Input */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <Input
            placeholder="Brand name"
            value={newBrandName}
            onChange={(e) => setNewBrandName(e.target.value)}
          />
          <Input
            placeholder="System/Parent (optional)"
            value={newBrandSystem}
            onChange={(e) => setNewBrandSystem(e.target.value)}
          />
          <Button onClick={addSingleBrand} disabled={!newBrandName.trim()}>
            <Plus className="h-4 w-4 mr-2" />
            Add
          </Button>
        </div>

        {/* Brand List Display */}
        {brands.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Current Brand List ({brands.length})</label>
            <div className="max-h-48 overflow-y-auto space-y-2 border rounded p-2">
              {brands.map((brand) => (
                <div key={brand.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <div className="font-medium">{brand.name}</div>
                    {brand.system && (
                      <Badge variant="outline" className="text-xs">
                        System: {brand.system}
                      </Badge>
                    )}
                    {brand.variants.length > 1 && (
                      <div className="text-xs text-muted-foreground">
                        Variants: {brand.variants.slice(1).join(', ')}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeBrand(brand.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BrandListManager;
