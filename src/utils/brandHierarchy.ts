import { CodeframeEntry } from '../types';

export interface BrandHierarchy {
  parentBrand: string;
  subBrands: string[];
  aliases: string[];
}

export interface BrandRollupConfig {
  hierarchies: BrandHierarchy[];
  rollupEnabled: boolean;
  preserveSubBrands: boolean;
}

export class BrandHierarchyManager {
  private config: BrandRollupConfig;
  
  constructor(config?: BrandRollupConfig) {
    this.config = config || {
      hierarchies: [],
      rollupEnabled: true,
      preserveSubBrands: true
    };
  }
  
  /**
   * Add a new brand hierarchy
   */
  addHierarchy(parentBrand: string, subBrands: string[], aliases: string[] = []) {
    this.config.hierarchies.push({
      parentBrand,
      subBrands,
      aliases
    });
  }
  
  /**
   * Process codeframe to create hierarchical brand structure
   */
  processCodeframe(codeframe: CodeframeEntry[]): CodeframeEntry[] {
    if (!this.config.rollupEnabled) {
      return codeframe;
    }
    
    const processedCodeframe: CodeframeEntry[] = [];
    const processedCodes = new Set<string>();
    
    // First, create parent brand codes
    this.config.hierarchies.forEach(hierarchy => {
      const parentCode: CodeframeEntry = {
        code: `BRAND_${hierarchy.parentBrand.toUpperCase().replace(/\s+/g, '_')}`,
        label: hierarchy.parentBrand,
        definition: `Parent brand encompassing ${hierarchy.subBrands.join(', ')}`,
        examples: [],
        numeric: this.generateNumericCode('parent'),
        category: 'brand_awareness',
        isParent: true,
        percentage: 0
      };
      
      processedCodeframe.push(parentCode);
      processedCodes.add(parentCode.code);
      
      // Process sub-brands
      hierarchy.subBrands.forEach((subBrand, index) => {
        const subBrandCode = `BRAND_${subBrand.toUpperCase().replace(/\s+/g, '_')}`;
        
        const subBrandEntry: CodeframeEntry = {
          code: subBrandCode,
          label: subBrand,
          definition: `Sub-brand of ${hierarchy.parentBrand}`,
          examples: [],
          numeric: this.generateNumericCode('sub', parentCode.numeric!, index),
          category: 'brand_awareness',
          parentCode: parentCode.code,
          percentage: 0
        };
        
        processedCodeframe.push(subBrandEntry);
        processedCodes.add(subBrandCode);
      });
      
      // Process aliases as redirects to sub-brands
      hierarchy.aliases.forEach(alias => {
        const aliasCode = `BRAND_${alias.toUpperCase().replace(/\s+/g, '_')}`;
        if (!processedCodes.has(aliasCode)) {
          const aliasEntry: CodeframeEntry = {
            code: aliasCode,
            label: alias,
            definition: `Alias for ${hierarchy.parentBrand}`,
            examples: [],
            numeric: this.generateNumericCode('alias'),
            category: 'brand_awareness',
            parentCode: parentCode.code,
            isAlias: true,
            percentage: 0
          };
          
          processedCodeframe.push(aliasEntry);
          processedCodes.add(aliasCode);
        }
      });
    });
    
    // Add any remaining codes from original codeframe
    codeframe.forEach(entry => {
      if (!processedCodes.has(entry.code) && entry.category === 'brand_awareness') {
        processedCodeframe.push(entry);
      }
    });
    
    // Add non-brand codes
    codeframe.forEach(entry => {
      if (entry.category !== 'brand_awareness') {
        processedCodeframe.push(entry);
      }
    });
    
    return processedCodeframe;
  }
  
  /**
   * Roll up coded responses based on brand hierarchy
   */
  rollUpResponses(codedResponses: any[]): any[] {
    if (!this.config.rollupEnabled) {
      return codedResponses;
    }
    
    return codedResponses.map(response => {
      const rolledUpCodes = new Set<string>(response.codesAssigned);
      
      // Check each assigned code
      response.codesAssigned.forEach((code: string) => {
        // Find if this code is a sub-brand
        this.config.hierarchies.forEach(hierarchy => {
          hierarchy.subBrands.forEach(subBrand => {
            const subBrandCode = `BRAND_${subBrand.toUpperCase().replace(/\s+/g, '_')}`;
            if (code === subBrandCode) {
              // Add parent brand code
              const parentCode = `BRAND_${hierarchy.parentBrand.toUpperCase().replace(/\s+/g, '_')}`;
              rolledUpCodes.add(parentCode);
            }
          });
          
          // Check aliases
          hierarchy.aliases.forEach(alias => {
            const aliasCode = `BRAND_${alias.toUpperCase().replace(/\s+/g, '_')}`;
            if (code === aliasCode) {
              // Add parent brand code
              const parentCode = `BRAND_${hierarchy.parentBrand.toUpperCase().replace(/\s+/g, '_')}`;
              rolledUpCodes.add(parentCode);
            }
          });
        });
      });
      
      return {
        ...response,
        codesAssigned: Array.from(rolledUpCodes)
      };
    });
  }
  
  /**
   * Generate numeric codes for hierarchy levels
   */
  private generateNumericCode(level: 'parent' | 'sub' | 'alias', parentNumeric?: number, index?: number): number {
    switch (level) {
      case 'parent':
        return 1000 + (this.config.hierarchies.length * 100);
      case 'sub':
        return parentNumeric! + 10 + (index || 0);
      case 'alias':
        return 9000 + Math.floor(Math.random() * 100);
      default:
        return 9999;
    }
  }
  
  /**
   * Create a summary of brand hierarchies
   */
  generateHierarchySummary(): string {
    const lines: string[] = ['BRAND HIERARCHY STRUCTURE'];
    lines.push('=' .repeat(50));
    lines.push('');
    
    this.config.hierarchies.forEach(hierarchy => {
      lines.push(`📊 ${hierarchy.parentBrand} (Parent Brand)`);
      
      hierarchy.subBrands.forEach(subBrand => {
        lines.push(`   └─ ${subBrand}`);
      });
      
      if (hierarchy.aliases.length > 0) {
        lines.push(`   📎 Aliases: ${hierarchy.aliases.join(', ')}`);
      }
      
      lines.push('');
    });
    
    lines.push(`Roll-up Status: ${this.config.rollupEnabled ? 'ENABLED' : 'DISABLED'}`);
    lines.push(`Preserve Sub-brands: ${this.config.preserveSubBrands ? 'YES' : 'NO'}`);
    
    return lines.join('\n');
  }
  
  /**
   * Export configuration for persistence
   */
  exportConfig(): BrandRollupConfig {
    return this.config;
  }
  
  /**
   * Import configuration
   */
  importConfig(config: BrandRollupConfig) {
    this.config = config;
  }
  
  /**
   * Get suggested hierarchies based on codeframe
   */
  suggestHierarchies(codeframe: CodeframeEntry[]): BrandHierarchy[] {
    const suggestions: BrandHierarchy[] = [];
    const brandCodes = codeframe.filter(c => c.category === 'brand_awareness');
    
    // Common brand groupings
    const commonGroups = [
      {
        parent: 'Coca-Cola Company',
        keywords: ['coca-cola', 'coke', 'diet coke', 'coke zero', 'sprite', 'fanta']
      },
      {
        parent: 'PepsiCo',
        keywords: ['pepsi', 'diet pepsi', 'mountain dew', '7up', 'sierra mist']
      },
      {
        parent: 'Unilever',
        keywords: ['dove', 'axe', 'lipton', 'knorr', 'hellmann']
      },
      {
        parent: 'P&G',
        keywords: ['tide', 'pampers', 'gillette', 'olay', 'crest']
      }
    ];
    
    commonGroups.forEach(group => {
      const matchingBrands = brandCodes.filter(code => 
        group.keywords.some(keyword => 
          code.label.toLowerCase().includes(keyword)
        )
      );
      
      if (matchingBrands.length > 1) {
        suggestions.push({
          parentBrand: group.parent,
          subBrands: matchingBrands.map(b => b.label),
          aliases: []
        });
      }
    });
    
    return suggestions;
  }
}