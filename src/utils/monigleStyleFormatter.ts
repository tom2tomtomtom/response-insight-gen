import { ProcessedResult, CodedResponse, CodeframeEntry } from '../types';

export interface MonigleColumn {
  name: string;
  type: 'respondent_id' | 'verbatim' | 'code' | 'thematic';
  dataType: 'string' | 'int' | 'float';
  questionId?: string;
  themeDescription?: string;
  hierarchyLevel?: 'Grand Net' | 'Net' | 'Subnet';
  codeNumber?: string;
}

export interface MonigleRow {
  [columnName: string]: string | number | null;
}

export class MonigleStyleFormatter {
  private results: ProcessedResult;
  private responsesByRow: Map<number, CodedResponse[]> = new Map();
  private uniqueRowIndices: number[] = [];

  constructor(results: ProcessedResult) {
    this.results = results;
    this.groupResponsesByRow();
  }

  private groupResponsesByRow() {
    // Group responses by row index and collect unique row indices
    const rowIndicesSet = new Set<number>();
    
    this.results.codedResponses.forEach(response => {
      const rowIndex = response.rowIndex || 0;
      rowIndicesSet.add(rowIndex);
      
      if (!this.responsesByRow.has(rowIndex)) {
        this.responsesByRow.set(rowIndex, []);
      }
      this.responsesByRow.get(rowIndex)!.push(response);
    });
    
    // Sort row indices for consistent ordering
    this.uniqueRowIndices = Array.from(rowIndicesSet).sort((a, b) => a - b);
  }

  private getQuestionId(response: CodedResponse): string {
    // Generate question ID based on column name or index
    if (response.columnName) {
      // Convert column name to question ID format (e.g., "Column 1" -> "B1r1")
      const match = response.columnName.match(/(\d+)/);
      const num = match ? match[1] : '1';
      return `B${num}r${response.columnIndex || 1}`;
    }
    return `B1r${response.columnIndex || 1}`;
  }

  private getAllQuestionIds(): string[] {
    const questionIds = new Set<string>();
    this.results.codedResponses.forEach(response => {
      questionIds.add(this.getQuestionId(response));
    });
    return Array.from(questionIds).sort();
  }

  private createThematicColumns(questionId: string, codeframe: CodeframeEntry[]): MonigleColumn[] {
    const columns: MonigleColumn[] = [];
    
    // Group codes into hierarchy based on parentCode or other logic
    const grandNets = codeframe.filter(code => 
      code.label.toLowerCase().includes('positive') || 
      code.label.toLowerCase().includes('negative') ||
      code.label.toLowerCase().includes('neutral') ||
      code.label.toLowerCase().includes('total')
    );
    
    // Codes with parentCode are subnets
    const subnets = codeframe.filter(code => code.parentCode);
    
    // Remaining codes that aren't grand nets or subnets are nets
    const nets = codeframe.filter(code => 
      !grandNets.includes(code) && 
      !subnets.includes(code) &&
      !['Other', 'None', 'DK_NA'].includes(code.code)
    );

    // Create Grand Net columns
    grandNets.forEach(code => {
      columns.push({
        name: `${questionId}_${code.label.replace(/[^\w\s]/g, '_')} (Grand Net)_${code.numeric}`,
        type: 'thematic',
        dataType: 'int',
        questionId,
        themeDescription: code.label,
        hierarchyLevel: 'Grand Net',
        codeNumber: code.numeric
      });
    });

    // Create Net columns
    nets.forEach(code => {
      columns.push({
        name: `${questionId}_${code.label.replace(/[^\w\s]/g, '_')} (Net)_${code.numeric}`,
        type: 'thematic',
        dataType: 'int',
        questionId,
        themeDescription: code.label,
        hierarchyLevel: 'Net',
        codeNumber: code.numeric
      });
    });

    // Create Subnet columns
    subnets.forEach(code => {
      columns.push({
        name: `${questionId}_${code.label.replace(/[^\w\s]/g, '_')} (Subnet)_${code.numeric}`,
        type: 'thematic',
        dataType: 'int',
        questionId,
        themeDescription: code.label,
        hierarchyLevel: 'Subnet',
        codeNumber: code.numeric
      });
    });

    return columns;
  }

  public generateColumns(): MonigleColumn[] {
    const allColumns: MonigleColumn[] = [];
    
    // First column is always Respondent ID
    allColumns.push({
      name: 'Respondent_ID',
      type: 'respondent_id',
      dataType: 'int'
    });

    // Get all unique question IDs
    const questionIds = this.getAllQuestionIds();

    questionIds.forEach(questionId => {
      // Add verbatim column
      allColumns.push({
        name: questionId,
        type: 'verbatim',
        dataType: 'string',
        questionId
      });

      // Add code columns (up to 10)
      for (let i = 1; i <= 10; i++) {
        allColumns.push({
          name: `${questionId}_Code${i}`,
          type: 'code',
          dataType: 'int',
          questionId
        });
      }

      // Add thematic columns based on the actual codeframe
      const relevantCodeframe = this.getRelevantCodeframeForQuestion(questionId);
      const thematicColumns = this.createThematicColumns(questionId, relevantCodeframe);
      allColumns.push(...thematicColumns);
    });

    return allColumns;
  }

  private getRelevantCodeframeForQuestion(questionId: string): CodeframeEntry[] {
    // If we have multiple codeframes, get the relevant one for this question
    if (this.results.multipleCodeframes) {
      // Try to match question ID to question type
      const questionType = this.getQuestionTypeFromId(questionId);
      if (questionType && this.results.multipleCodeframes[questionType]) {
        return this.results.multipleCodeframes[questionType].codeframe || this.results.codeframe;
      }
    }
    return this.results.codeframe;
  }

  private getQuestionTypeFromId(questionId: string): string | null {
    // Find a response with this question ID to determine its type
    const sampleResponse = this.results.codedResponses.find(r => 
      this.getQuestionId(r) === questionId
    );
    
    if (sampleResponse && sampleResponse.columnIndex !== undefined) {
      // This would need to be passed in or stored somewhere
      // For now, return null to use default codeframe
      return null;
    }
    
    return null;
  }

  public generateRows(): MonigleRow[] {
    const rows: MonigleRow[] = [];
    const columns = this.generateColumns();

    // Create one row per unique respondent
    this.uniqueRowIndices.forEach(rowIndex => {
      const row: MonigleRow = {};
      
      // Initialize all columns with empty/null values
      columns.forEach(col => {
        if (col.type === 'respondent_id') {
          row[col.name] = rowIndex + 1; // 1-based respondent ID
        } else if (col.type === 'verbatim') {
          row[col.name] = '';
        } else {
          row[col.name] = null;
        }
      });

      // Get all responses for this row
      const responsesForRow = this.responsesByRow.get(rowIndex) || [];
      
      // Fill in data for each response
      responsesForRow.forEach(response => {
        const questionId = this.getQuestionId(response);
        
        // Fill verbatim
        row[questionId] = response.responseText;

        // Fill code columns
        response.codesAssigned.forEach((code, index) => {
          if (index < 10) {
            const codeEntry = this.getRelevantCodeframeForQuestion(questionId)
              .find(c => c.code === code);
            if (codeEntry) {
              row[`${questionId}_Code${index + 1}`] = parseInt(codeEntry.numeric) || (1000 + index);
            }
          }
        });

        // Fill thematic columns (binary 0/1)
        const relevantCodeframe = this.getRelevantCodeframeForQuestion(questionId);
        response.codesAssigned.forEach(code => {
          const codeEntry = relevantCodeframe.find(c => c.code === code);
          if (codeEntry) {
            // Find matching thematic columns
            columns.forEach(col => {
              if (col.type === 'thematic' && 
                  col.questionId === questionId &&
                  col.codeNumber === codeEntry.numeric) {
                row[col.name] = 1;
              }
            });
          }
        });
      });

      rows.push(row);
    });

    return rows;
  }

  public generateCSV(): string {
    const columns = this.generateColumns();
    const rows = this.generateRows();

    // Create header row
    const headers = columns.map(col => col.name);
    
    // Create data rows
    const csvRows = rows.map(row => {
      return headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) {
          return '';
        }
        if (typeof value === 'string') {
          // Escape quotes and wrap in quotes if contains comma, quote, or newline
          if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
        }
        return String(value);
      });
    });

    // Combine header and data
    const allRows = [headers, ...csvRows];
    return allRows.map(row => row.join(',')).join('\n');
  }

  public getColumnMetadata(): { column: MonigleColumn; sampleValues: any[] }[] {
    const columns = this.generateColumns();
    const rows = this.generateRows().slice(0, 5); // First 5 rows for sample

    return columns.map(column => ({
      column,
      sampleValues: rows.map(row => row[column.name]).filter(v => v !== null && v !== '')
    }));
  }
}