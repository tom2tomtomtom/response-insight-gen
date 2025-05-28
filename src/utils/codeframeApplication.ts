
import { ProcessedResult, CodeframeEntry, UploadedCodeframe } from '../types';

export interface CodeframeApplicationRule {
  questionId: string;
  codeLabel: string;
  codeId: string;
  hierarchy: 'Grand Net' | 'Net' | 'Subnet';
  group?: string;
  keywords?: string[];
  semanticMatches?: string[];
}

export interface AppliedCode {
  code_id: string;
  label: string;
  hierarchy: string;
  group?: string;
  confidence?: number;
}

export interface CodedVerbatimResponse {
  respondent_id: string;
  question_id: string;
  response: string;
  codes_applied: AppliedCode[];
}

export class CodeframeApplicator {
  private codeframe: UploadedCodeframe;
  private rules: CodeframeApplicationRule[];

  constructor(codeframe: UploadedCodeframe) {
    this.codeframe = codeframe;
    this.rules = this.generateApplicationRules();
  }

  private generateApplicationRules(): CodeframeApplicationRule[] {
    return this.codeframe.entries.map(entry => ({
      questionId: 'default', // Will be mapped per question
      codeLabel: entry.label,
      codeId: entry.code,
      hierarchy: this.determineHierarchy(entry.label),
      group: this.determineGroup(entry.label),
      keywords: this.extractKeywords(entry.definition, entry.examples),
      semanticMatches: entry.examples || []
    }));
  }

  private determineHierarchy(label: string): 'Grand Net' | 'Net' | 'Subnet' {
    if (label.toLowerCase().includes('positive') || label.toLowerCase().includes('negative')) {
      return 'Grand Net';
    }
    if (label.toLowerCase().includes('overall') || label.toLowerCase().includes('general')) {
      return 'Net';
    }
    return 'Subnet';
  }

  private determineGroup(label: string): string {
    if (label.toLowerCase().includes('positive') || label.toLowerCase().includes('good') || label.toLowerCase().includes('excellent')) {
      return 'Positive Comments';
    }
    if (label.toLowerCase().includes('negative') || label.toLowerCase().includes('bad') || label.toLowerCase().includes('poor')) {
      return 'Negative Comments';
    }
    return 'Neutral Comments';
  }

  private extractKeywords(definition: string, examples: string[]): string[] {
    const keywords: string[] = [];
    
    // Extract from definition
    if (definition) {
      const words = definition.toLowerCase()
        .split(/[^a-zA-Z]+/)
        .filter(word => word.length > 3 && !['this', 'that', 'with', 'they', 'them', 'when', 'where'].includes(word));
      keywords.push(...words);
    }
    
    // Extract from examples
    examples.forEach(example => {
      const words = example.toLowerCase()
        .split(/[^a-zA-Z]+/)
        .filter(word => word.length > 3);
      keywords.push(...words);
    });
    
    return [...new Set(keywords)];
  }

  public applyCodeframe(verbatimData: any[][], questionColumns: string[]): CodedVerbatimResponse[] {
    const results: CodedVerbatimResponse[] = [];
    
    // Skip header row
    for (let rowIndex = 1; rowIndex < verbatimData.length; rowIndex++) {
      const row = verbatimData[rowIndex];
      const respondentId = `R${rowIndex}`;
      
      questionColumns.forEach((questionId, colIndex) => {
        const response = row[colIndex];
        if (response && typeof response === 'string' && response.trim().length > 0) {
          const appliedCodes = this.matchResponseToCodes(response, questionId);
          
          results.push({
            respondent_id: respondentId,
            question_id: questionId,
            response: response.trim(),
            codes_applied: appliedCodes
          });
        }
      });
    }
    
    return results;
  }

  private matchResponseToCodes(response: string, questionId: string): AppliedCode[] {
    const appliedCodes: AppliedCode[] = [];
    const responseLower = response.toLowerCase();
    
    this.rules.forEach(rule => {
      let confidence = 0;
      
      // Check for exact keyword matches
      rule.keywords?.forEach(keyword => {
        if (responseLower.includes(keyword.toLowerCase())) {
          confidence += 0.3;
        }
      });
      
      // Check for semantic matches from examples
      rule.semanticMatches?.forEach(example => {
        const exampleWords = example.toLowerCase().split(/\s+/);
        const matchingWords = exampleWords.filter(word => 
          responseLower.includes(word) && word.length > 3
        );
        confidence += (matchingWords.length / exampleWords.length) * 0.5;
      });
      
      // Apply threshold for code assignment
      if (confidence > 0.2) {
        appliedCodes.push({
          code_id: rule.codeId,
          label: rule.codeLabel,
          hierarchy: rule.hierarchy,
          group: rule.group,
          confidence: Math.min(confidence, 1.0)
        });
      }
    });
    
    return appliedCodes.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
  }

  public generateMoniglewOutput(codedResponses: CodedVerbatimResponse[]): string {
    // Group by question
    const byQuestion = new Map<string, CodedVerbatimResponse[]>();
    codedResponses.forEach(response => {
      if (!byQuestion.has(response.question_id)) {
        byQuestion.set(response.question_id, []);
      }
      byQuestion.get(response.question_id)?.push(response);
    });
    
    const headers: string[] = [];
    const rows: string[][] = [];
    
    // Build headers for each question
    byQuestion.forEach((responses, questionId) => {
      headers.push(questionId); // Verbatim column
      
      // Add code columns
      for (let i = 1; i <= 10; i++) {
        headers.push(`${questionId}_Code${i}`);
      }
      
      // Add thematic columns
      const uniqueGroups = new Set(
        responses.flatMap(r => r.codes_applied.map(c => c.group)).filter(Boolean)
      );
      
      uniqueGroups.forEach(group => {
        headers.push(`${questionId}_${group} (Grand Net)_1000`);
      });
      
      const uniqueLabels = new Set(
        responses.flatMap(r => r.codes_applied.map(c => c.label))
      );
      
      uniqueLabels.forEach(label => {
        headers.push(`${questionId}_${label} (Net)_${Math.floor(Math.random() * 1000) + 1010}`);
      });
    });
    
    // Build data rows
    const maxRespondents = Math.max(...Array.from(byQuestion.values()).map(arr => arr.length));
    
    for (let i = 0; i < maxRespondents; i++) {
      const row: string[] = [];
      
      byQuestion.forEach((responses, questionId) => {
        const response = responses[i];
        
        if (response) {
          // Verbatim response
          row.push(`"${response.response.replace(/"/g, '""')}"`);
          
          // Code columns
          for (let j = 1; j <= 10; j++) {
            const code = response.codes_applied[j - 1];
            row.push(code ? code.code_id : '');
          }
          
          // Thematic binary columns - simplified for now
          const uniqueGroups = new Set(
            responses.flatMap(r => r.codes_applied.map(c => c.group)).filter(Boolean)
          );
          
          uniqueGroups.forEach(group => {
            const hasGroup = response.codes_applied.some(c => c.group === group);
            row.push(hasGroup ? '1' : '0');
          });
          
          const uniqueLabels = new Set(
            responses.flatMap(r => r.codes_applied.map(c => c.label))
          );
          
          uniqueLabels.forEach(label => {
            const hasLabel = response.codes_applied.some(c => c.label === label);
            row.push(hasLabel ? '1' : '0');
          });
        } else {
          // Fill empty row
          const columnsForQuestion = headers.filter(h => h.startsWith(questionId)).length;
          for (let k = 0; k < columnsForQuestion; k++) {
            row.push('');
          }
        }
      });
      
      rows.push(row);
    }
    
    // Convert to CSV
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    return csvContent;
  }
}
