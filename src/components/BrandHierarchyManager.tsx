import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { 
  Plus, 
  Trash2, 
  ChevronDown, 
  ChevronRight,
  GitBranch,
  Link,
  Sparkles,
  Save,
  Upload
} from 'lucide-react';
import { toast } from './ui/use-toast';
import { BrandHierarchy, BrandRollupConfig } from '../utils/brandHierarchy';
import { useProcessing } from '../contexts/ProcessingContext';

const BrandHierarchyManager: React.FC = () => {
  const { results, codeframe } = useProcessing();
  const [hierarchies, setHierarchies] = useState<BrandHierarchy[]>([]);
  const [rollupEnabled, setRollupEnabled] = useState(true);
  const [preserveSubBrands, setPreserveSubBrands] = useState(true);
  const [expandedHierarchies, setExpandedHierarchies] = useState<Set<number>>(new Set());
  const [newParentBrand, setNewParentBrand] = useState('');
  const [newSubBrands, setNewSubBrands] = useState('');
  const [newAliases, setNewAliases] = useState('');
  
  // Load saved configuration
  useEffect(() => {
    const savedConfig = localStorage.getItem('brand-hierarchy-config');
    if (savedConfig) {
      const config: BrandRollupConfig = JSON.parse(savedConfig);
      setHierarchies(config.hierarchies);
      setRollupEnabled(config.rollupEnabled);
      setPreserveSubBrands(config.preserveSubBrands);
    }
  }, []);
  
  // Save configuration
  const saveConfig = () => {
    const config: BrandRollupConfig = {
      hierarchies,
      rollupEnabled,
      preserveSubBrands
    };
    localStorage.setItem('brand-hierarchy-config', JSON.stringify(config));
    toast({
      title: 'Configuration Saved',
      description: 'Brand hierarchy settings have been saved.',
    });
  };
  
  // Add new hierarchy
  const addHierarchy = () => {
    if (!newParentBrand.trim()) {
      toast({
        variant: 'destructive',
        title: 'Invalid Input',
        description: 'Please enter a parent brand name.',
      });
      return;
    }
    
    const subBrands = newSubBrands
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);
      
    if (subBrands.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid Input',
        description: 'Please enter at least one sub-brand.',
      });
      return;
    }
    
    const aliases = newAliases
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    const newHierarchy: BrandHierarchy = {
      parentBrand: newParentBrand.trim(),
      subBrands,
      aliases
    };
    
    setHierarchies([...hierarchies, newHierarchy]);
    setNewParentBrand('');
    setNewSubBrands('');
    setNewAliases('');
    
    toast({
      title: 'Hierarchy Added',
      description: `${newHierarchy.parentBrand} hierarchy has been created.`,
    });
  };
  
  // Remove hierarchy
  const removeHierarchy = (index: number) => {
    const updated = hierarchies.filter((_, i) => i !== index);
    setHierarchies(updated);
  };
  
  // Toggle hierarchy expansion
  const toggleHierarchy = (index: number) => {
    const newExpanded = new Set(expandedHierarchies);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedHierarchies(newExpanded);
  };
  
  // Auto-suggest hierarchies
  const autoSuggest = () => {
    if (!results || !results.codeframe) {
      toast({
        variant: 'destructive',
        title: 'No Codeframe Available',
        description: 'Please process data first to get brand suggestions.',
      });
      return;
    }
    
    // This would use the BrandHierarchyManager.suggestHierarchies method
    toast({
      title: 'Coming Soon',
      description: 'Auto-suggestion feature will analyze your codeframe for brand patterns.',
    });
  };
  
  // Export configuration
  const exportConfig = () => {
    const config: BrandRollupConfig = {
      hierarchies,
      rollupEnabled,
      preserveSubBrands
    };
    
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'brand-hierarchy-config.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Import configuration
  const importConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const config: BrandRollupConfig = JSON.parse(e.target?.result as string);
        setHierarchies(config.hierarchies);
        setRollupEnabled(config.rollupEnabled);
        setPreserveSubBrands(config.preserveSubBrands);
        
        toast({
          title: 'Configuration Imported',
          description: 'Brand hierarchy settings have been loaded.',
        });
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Import Failed',
          description: 'Invalid configuration file.',
        });
      }
    };
    reader.readAsText(file);
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranch className="h-5 w-5" />
          Brand Hierarchy Management
        </CardTitle>
        <CardDescription>
          Configure brand roll-up relationships for hierarchical analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="rollup-enabled">Enable Brand Roll-up</Label>
              <p className="text-sm text-muted-foreground">
                Automatically group sub-brands under parent brands
              </p>
            </div>
            <Switch
              id="rollup-enabled"
              checked={rollupEnabled}
              onCheckedChange={setRollupEnabled}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="preserve-sub">Preserve Sub-brands</Label>
              <p className="text-sm text-muted-foreground">
                Keep sub-brand codes in addition to parent codes
              </p>
            </div>
            <Switch
              id="preserve-sub"
              checked={preserveSubBrands}
              onCheckedChange={setPreserveSubBrands}
              disabled={!rollupEnabled}
            />
          </div>
        </div>
        
        {/* Current Hierarchies */}
        {hierarchies.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Configured Hierarchies</h3>
            {hierarchies.map((hierarchy, index) => (
              <div key={index} className="border rounded-lg p-3">
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <div 
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => toggleHierarchy(index)}
                    >
                      <div className="flex items-center gap-2">
                        {expandedHierarchies.has(index) ? 
                          <ChevronDown className="h-4 w-4" /> : 
                          <ChevronRight className="h-4 w-4" />
                        }
                        <span className="font-medium">{hierarchy.parentBrand}</span>
                        <Badge variant="secondary" className="text-xs">
                          {hierarchy.subBrands.length} sub-brands
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeHierarchy(index);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-3 space-y-2">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Sub-brands:</p>
                      <div className="flex flex-wrap gap-1">
                        {hierarchy.subBrands.map((subBrand, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {subBrand}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    {hierarchy.aliases.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                          <Link className="h-3 w-3" />
                          Aliases:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {hierarchy.aliases.map((alias, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {alias}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              </div>
            ))}
          </div>
        )}
        
        {/* Add New Hierarchy */}
        <div className="space-y-4 border-t pt-4">
          <h3 className="text-sm font-medium">Add New Hierarchy</h3>
          <div className="space-y-3">
            <div>
              <Label htmlFor="parent-brand">Parent Brand</Label>
              <Input
                id="parent-brand"
                value={newParentBrand}
                onChange={(e) => setNewParentBrand(e.target.value)}
                placeholder="e.g., Coca-Cola Company"
              />
            </div>
            <div>
              <Label htmlFor="sub-brands">Sub-brands (comma-separated)</Label>
              <Input
                id="sub-brands"
                value={newSubBrands}
                onChange={(e) => setNewSubBrands(e.target.value)}
                placeholder="e.g., Coca-Cola, Diet Coke, Sprite, Fanta"
              />
            </div>
            <div>
              <Label htmlFor="aliases">Aliases (comma-separated, optional)</Label>
              <Input
                id="aliases"
                value={newAliases}
                onChange={(e) => setNewAliases(e.target.value)}
                placeholder="e.g., Coke, Coca Cola"
              />
            </div>
            <Button onClick={addHierarchy} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Hierarchy
            </Button>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex flex-wrap gap-2 border-t pt-4">
          <Button onClick={saveConfig} variant="default">
            <Save className="h-4 w-4 mr-2" />
            Save Configuration
          </Button>
          <Button onClick={autoSuggest} variant="secondary">
            <Sparkles className="h-4 w-4 mr-2" />
            Auto-Suggest
          </Button>
          <Button onClick={exportConfig} variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Export
          </Button>
          <div className="relative">
            <input
              type="file"
              accept=".json"
              onChange={importConfig}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2 rotate-180" />
              Import
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BrandHierarchyManager;