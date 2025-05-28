
import { ProcessedResult, CodedResponse, CodeframeEntry } from '../types';

export interface MoniglewColumn {
  name: string;
  type: 'verbatim' | 'code' | 'thematic';
  dataType: 'string' | 'int' | 'float';
  questionId: string;
  themeDescription?: string;
  hierarchyLevel?: 'Grand Net' | 'Net' | 'Subnet';
  codeNumber?: string;
}

export interface MoniglewRow {
  [columnName: string]: string | number | null;
}

export class MoniglewStyleFormatter {
  private results: ProcessedResult;
  private questionColumns: Map<string, CodedResponse[]> = new Map();

  constructor(results: ProcessedResult) {
    this.results = results;
    this.groupResponsesByQuestion();
  }

  private groupResponsesByQuestion() {
    this.results.codedResponses.forEach(response => {
      const questionId = this.getQuestionId(response);
      if (!this.questionColumns.has(questionId)) {
        this.questionColumns.set(questionId, []);
      }
      this.questionColumns.get(questionId)!.push(response);
    });
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

  private createThematicColumns(questionId: string, codeframe: CodeframeEntry[]): MoniglewColumn[] {
    const columns: MoniglewColumn[] = [];
    
    // Group codes into hierarchy
    const grandNets = codeframe.filter(code => 
      code.label.toLowerCase().includes('positive') || 
      code.label.toLowerCase().includes('negative') ||
      code.label.toLowerCase().includes('neutral')
    );
    
    const nets = codeframe.filter(code => 
      !grandNets.includes(code) && 
      (code.definition.toLowerCase().includes('net') || code.count && code.count > 50)
    );
    
    const subnets = codeframe.filter(code => 
      !grandNets.includes(code) && 
      !nets.includes(code)
    );

    // Create Grand Net columns
    grandNets.forEach(code => {
      columns.push({
        name: `${questionId}_${code.label} (Grand Net)_${code.numeric}`,
        type: 'thematic',
        dataType: 'float',
        questionId,
        themeDescription: code.label,
        hierarchyLevel: 'Grand Net',
        codeNumber: code.numeric
      });
    });

    // Create Net columns
    nets.forEach(code => {
      columns.push({
        name: `${questionId}_${code.label} (Net)_${code.numeric}`,
        type: 'thematic',
        dataType: 'float',
        questionId,
        themeDescription: code.label,
        hierarchyLevel: 'Net',
        codeNumber: code.numeric
      });
    });

    // Create Subnet columns
    subnets.forEach(code => {
      columns.push({
        name: `${questionId}_${code.label} (Subnet)_${code.numeric}`,
        type: 'thematic',
        dataType: 'float',
        questionId,
        themeDescription: code.label,
        hierarchyLevel: 'Subnet',
        codeNumber: code.numeric
      });
    });

    return columns;
  }

  public generateColumns(): MoniglewColumn[] {
    const allColumns: MoniglewColumn[] = [];

    this.questionColumns.forEach((responses, questionId) => {
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

      // Add thematic columns
      const thematicColumns = this.createThematicColumns(questionId, this.results.codeframe);
      allColumns.push(...thematicColumns);
    });

    return allColumns;
  }

  public generateRows(): MoniglewRow[] {
    const rows: MoniglewRow[] = [];
    const columns = this.generateColumns();

    this.questionColumns.forEach((responses, questionId) => {
      responses.forEach(response => {
        const row: MoniglewRow = {};

        // Initialize all columns with null/empty values
        columns.forEach(col => {
          if (col.questionId === questionId) {
            row[col.name] = col.type === 'verbatim' ? '' : null;
          }
        });

        // Fill verbatim
        row[questionId] = response.responseText;

        // Fill code columns
        response.codesAssigned.forEach((code, index) => {
          if (index < 10) {
            const codeEntry = this.results.codeframe.find(c => c.code === code);
            if (codeEntry) {
              row[`${questionId}_Code${index + 1}`] = parseInt(codeEntry.numeric) || (1000 + index);
            }
          }
        });

        // Fill thematic columns
        response.codesAssigned.forEach(code => {
          const codeEntry = this.results.codeframe.find(c => c.code === code);
          if (codeEntry) {
            // Find matching thematic column
            const thematicCol = columns.find(col => 
              col.type === 'thematic' && 
              col.questionId === questionId &&
              col.themeDescription === codeEntry.label
            );
            if (thematicCol) {
              row[thematicCol.name] = 1;
            }
          }
        });

        rows.push(row);
      });
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
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return String(value);
      });
    });

    // Combine header and data
    const allRows = [headers, ...csvRows];
    return allRows.map(row => row.join(',')).join('\n');
  }

  public getColumnMetadata(): { column: MoniglewColumn; sampleValues: any[] }[] {
    const columns = this.generateColumns();
    const rows = this.generateRows().slice(0, 5); // First 5 rows for sample

    return columns.map(column => ({
      column,
      sampleValues: rows.map(row => row[column.name]).filter(v => v !== null && v !== '')
    }));
  }
}
