import { ProcessedResult, CodeframeEntry } from '../types';

interface MoniglewRow {
  respondentId: string;
  [key: string]: string | number;
}

interface HierarchicalCode {
  code: string;
  label: string;
  numeric: number | string;
  level: 'grand_net' | 'net' | 'subnet';
  parent?: string;
  children: string[];
}

export class MoniglewFormatter {
  /**
   * Generate properly formatted Moniglew CSV output
   * Format requirements:
   * - Respondent ID as first column
   * - One row per respondent
   * - Verbatim responses followed by code columns
   * - Binary columns for themes/nets with proper hierarchy
   */
  static generateMoniglewCSV(
    result: ProcessedResult,
    selectedColumns: { name: string; index: number }[]
  ): string {
    // Create respondent-based structure
    const respondentMap = new Map<number, MoniglewRow>();
    
    // Initialize all respondents
    result.codedResponses.forEach(response => {
      const respId = response.rowIndex !== undefined ? response.rowIndex + 1 : 0;
      if (!respondentMap.has(respId)) {
        respondentMap.set(respId, {
          respondentId: `R${respId}`
        });
      }
    });
    
    // Build column headers
    const headers: string[] = ['Respondent_ID'];
    const codeColumns: string[] = [];
    const netColumns: string[] = [];
    const grandNetColumns: string[] = [];
    
    // Process each selected column
    selectedColumns.forEach(column => {
      const columnName = column.name.replace(/[^a-zA-Z0-9]/g, '_');
      
      // Add verbatim column
      headers.push(`${columnName}_Verbatim`);
      
      // Add code columns (up to 10)
      for (let i = 1; i <= 10; i++) {
        const codeColName = `${columnName}_Code${i}`;
        headers.push(codeColName);
        codeColumns.push(codeColName);
      }
    });
    
    // Build hierarchical code structure
    const hierarchicalCodes = this.buildHierarchicalStructure(result.codeframe);
    
    // Add binary columns in hierarchical order
    // First add subnet columns
    const subnetColumns: string[] = [];
    hierarchicalCodes
      .filter(h => h.level === 'subnet')
      .forEach(code => {
        const colName = `${code.label.replace(/[^a-zA-Z0-9]/g, '_')} (Subnet)_${code.numeric}`;
        headers.push(colName);
        subnetColumns.push(colName);
      });
    
    // Then add net columns
    hierarchicalCodes
      .filter(h => h.level === 'net')
      .forEach(code => {
        const colName = `${code.label.replace(/[^a-zA-Z0-9]/g, '_')} (Net)_${code.numeric}`;
        headers.push(colName);
        netColumns.push(colName);
      });
    
    // Finally add grand net columns
    hierarchicalCodes
      .filter(h => h.level === 'grand_net')
      .forEach(code => {
        const colName = `${code.label.replace(/[^a-zA-Z0-9]/g, '_')} (Grand Net)_${code.numeric}`;
        headers.push(colName);
        grandNetColumns.push(colName);
      });
    
    // Populate respondent data
    result.codedResponses.forEach(response => {
      const respId = response.rowIndex !== undefined ? response.rowIndex + 1 : 0;
      const row = respondentMap.get(respId);
      if (!row) return;
      
      const columnName = response.columnName?.replace(/[^a-zA-Z0-9]/g, '_');
      if (!columnName) return;
      
      // Add verbatim response
      row[`${columnName}_Verbatim`] = `"${response.responseText.replace(/"/g, '""')}"`;
      
      // Add codes (up to 10)
      response.codesAssigned.forEach((code, index) => {
        if (index < 10) {
          const codeEntry = result.codeframe.find(c => c.code === code);
          row[`${columnName}_Code${index + 1}`] = codeEntry?.numeric || code;
        }
      });
      
      // Set binary columns using hierarchical structure
      response.codesAssigned.forEach(code => {
        const hierarchicalCode = hierarchicalCodes.find(h => h.code === code);
        if (hierarchicalCode) {
          // Set the code's own column
          let colName = '';
          switch (hierarchicalCode.level) {
            case 'subnet':
              colName = `${hierarchicalCode.label.replace(/[^a-zA-Z0-9]/g, '_')} (Subnet)_${hierarchicalCode.numeric}`;
              break;
            case 'net':
              colName = `${hierarchicalCode.label.replace(/[^a-zA-Z0-9]/g, '_')} (Net)_${hierarchicalCode.numeric}`;
              break;
            case 'grand_net':
              colName = `${hierarchicalCode.label.replace(/[^a-zA-Z0-9]/g, '_')} (Grand Net)_${hierarchicalCode.numeric}`;
              break;
          }
          row[colName] = 1;
          
          // Roll up to parent levels
          if (hierarchicalCode.parent) {
            const parentCode = hierarchicalCodes.find(h => h.code === hierarchicalCode.parent);
            if (parentCode) {
              const parentColName = parentCode.level === 'net' 
                ? `${parentCode.label.replace(/[^a-zA-Z0-9]/g, '_')} (Net)_${parentCode.numeric}`
                : `${parentCode.label.replace(/[^a-zA-Z0-9]/g, '_')} (Grand Net)_${parentCode.numeric}`;
              row[parentColName] = 1;
              
              // Check for grandparent (grand net)
              if (parentCode.parent) {
                const grandParentCode = hierarchicalCodes.find(h => h.code === parentCode.parent);
                if (grandParentCode) {
                  const grandParentColName = `${grandParentCode.label.replace(/[^a-zA-Z0-9]/g, '_')} (Grand Net)_${grandParentCode.numeric}`;
                  row[grandParentColName] = 1;
                }
              }
            }
          }
        }
      });
    });
    
    // Convert to CSV format
    const rows: string[][] = [];
    
    // Add headers
    rows.push(headers);
    
    // Sort respondents by ID and add data rows
    const sortedRespondents = Array.from(respondentMap.entries())
      .sort((a, b) => a[0] - b[0]);
    
    sortedRespondents.forEach(([_, row]) => {
      const csvRow = headers.map(header => {
        const value = row[header];
        return value !== undefined ? String(value) : '0';
      });
      rows.push(csvRow);
    });
    
    // Generate CSV content
    return rows.map(row => row.join(',')).join('\n');
  }
  
  /**
   * Generate hierarchical summary for Moniglew
   */
  static generateHierarchicalSummary(result: ProcessedResult): string {
    const lines: string[] = ['HIERARCHICAL CODE SUMMARY'];
    lines.push('=' .repeat(50));
    lines.push('');
    
    // Group codes by hierarchy
    const grandNets = new Map<string, CodeframeEntry[]>();
    const nets = new Map<string, CodeframeEntry[]>();
    const subnets: CodeframeEntry[] = [];
    
    result.codeframe.forEach(code => {
      if (code.label.toLowerCase().includes('positive') || 
          code.label.toLowerCase().includes('negative')) {
        const key = code.label.includes('positive') ? 'Positive' : 'Negative';
        if (!grandNets.has(key)) grandNets.set(key, []);
        grandNets.get(key)!.push(code);
      } else if (code.parentCode) {
        if (!nets.has(code.parentCode)) nets.set(code.parentCode, []);
        nets.get(code.parentCode)!.push(code);
      } else if (!['Other', 'None', 'DK_NA'].includes(code.code)) {
        subnets.push(code);
      }
    });
    
    // Output hierarchy
    grandNets.forEach((codes, grandNet) => {
      lines.push(`GRAND NET: ${grandNet}`);
      codes.forEach(code => {
        lines.push(`  └─ ${code.label} (${code.numeric}) - ${code.percentage?.toFixed(1)}%`);
      });
      lines.push('');
    });
    
    nets.forEach((codes, net) => {
      const netCode = result.codeframe.find(c => c.code === net);
      if (netCode) {
        lines.push(`NET: ${netCode.label}`);
        codes.forEach(code => {
          lines.push(`  └─ ${code.label} (${code.numeric}) - ${code.percentage?.toFixed(1)}%`);
        });
        lines.push('');
      }
    });
    
    if (subnets.length > 0) {
      lines.push('SUBNETS:');
      subnets.forEach(code => {
        lines.push(`  • ${code.label} (${code.numeric}) - ${code.percentage?.toFixed(1)}%`);
      });
    }
    
    return lines.join('\n');
  }
  
  /**
   * Build hierarchical structure from flat codeframe
   */
  private static buildHierarchicalStructure(codeframe: CodeframeEntry[]): HierarchicalCode[] {
    const hierarchicalCodes: HierarchicalCode[] = [];
    const codeMap = new Map<string, HierarchicalCode>();
    
    // First pass: Create all codes and determine hierarchy levels
    codeframe.forEach(code => {
      let level: 'grand_net' | 'net' | 'subnet' = 'subnet';
      let numeric = code.numeric || parseInt(code.code.replace(/[^0-9]/g, '')) || 1;
      
      // Determine level based on code properties
      if (code.label.toLowerCase().includes('positive') || 
          code.label.toLowerCase().includes('negative') ||
          code.label.toLowerCase().includes('overall')) {
        level = 'grand_net';
        numeric = 1000 + hierarchicalCodes.filter(h => h.level === 'grand_net').length;
      } else if (code.parentCode || code.isParent) {
        level = 'net';
        numeric = 2000 + hierarchicalCodes.filter(h => h.level === 'net').length;
      } else {
        // Regular codes are subnets
        numeric = 3000 + hierarchicalCodes.filter(h => h.level === 'subnet').length;
      }
      
      const hierarchicalCode: HierarchicalCode = {
        code: code.code,
        label: code.label,
        numeric,
        level,
        parent: code.parentCode,
        children: []
      };
      
      hierarchicalCodes.push(hierarchicalCode);
      codeMap.set(code.code, hierarchicalCode);
    });
    
    // Second pass: Build parent-child relationships
    hierarchicalCodes.forEach(code => {
      if (code.parent && codeMap.has(code.parent)) {
        const parent = codeMap.get(code.parent)!;
        parent.children.push(code.code);
      }
    });
    
    // Third pass: Infer grand net relationships for nets without explicit parents
    hierarchicalCodes
      .filter(code => code.level === 'net' && !code.parent)
      .forEach(netCode => {
        // Find appropriate grand net based on sentiment
        const grandNets = hierarchicalCodes.filter(c => c.level === 'grand_net');
        
        if (netCode.label.toLowerCase().includes('positive') || 
            netCode.label.toLowerCase().includes('good') ||
            netCode.label.toLowerCase().includes('excellent')) {
          const positiveGrandNet = grandNets.find(g => 
            g.label.toLowerCase().includes('positive')
          );
          if (positiveGrandNet) {
            netCode.parent = positiveGrandNet.code;
            positiveGrandNet.children.push(netCode.code);
          }
        } else if (netCode.label.toLowerCase().includes('negative') || 
                   netCode.label.toLowerCase().includes('bad') ||
                   netCode.label.toLowerCase().includes('poor')) {
          const negativeGrandNet = grandNets.find(g => 
            g.label.toLowerCase().includes('negative')
          );
          if (negativeGrandNet) {
            netCode.parent = negativeGrandNet.code;
            negativeGrandNet.children.push(netCode.code);
          }
        }
      });
    
    // Sort by hierarchy level and numeric code
    return hierarchicalCodes.sort((a, b) => {
      const levelOrder = { grand_net: 0, net: 1, subnet: 2 };
      if (levelOrder[a.level] !== levelOrder[b.level]) {
        return levelOrder[a.level] - levelOrder[b.level];
      }
      return Number(a.numeric) - Number(b.numeric);
    });
  }
}