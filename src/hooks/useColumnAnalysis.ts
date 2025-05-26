
import { ColumnInfo } from '../types';

export const analyzeColumnValues = (values: any[]): { 
  type: 'text' | 'numeric' | 'mixed' | 'empty', 
  stats: { 
    textPercentage: number,
    numericPercentage: number,
    textLength: number,
    nonEmptyCount: number,
    totalCount: number
  } 
} => {
  if (!values || values.length === 0) {
    return { 
      type: 'empty', 
      stats: { 
        textPercentage: 0, 
        numericPercentage: 0, 
        textLength: 0,
        nonEmptyCount: 0,
        totalCount: 0
      } 
    };
  }

  const totalCount = values.length;
  let textCount = 0;
  let numericCount = 0;
  let totalTextLength = 0;
  let nonEmptyCount = 0;

  // Analyze each value
  values.forEach(value => {
    // Skip empty values
    if (value === undefined || value === null || value === '') {
      return;
    }

    nonEmptyCount++;
    const strValue = String(value).trim();
    
    // Check if it's a number
    const isNumeric = !isNaN(Number(strValue)) && strValue !== '';
    
    if (isNumeric) {
      numericCount++;
    } else {
      textCount++;
      // Only count length for non-numeric values
      totalTextLength += strValue.length;
    }
  });

  const textPercentage = nonEmptyCount > 0 ? (textCount / nonEmptyCount) * 100 : 0;
  const numericPercentage = nonEmptyCount > 0 ? (numericCount / nonEmptyCount) * 100 : 0;
  const avgTextLength = textCount > 0 ? totalTextLength / textCount : 0;

  // Determine column type based on percentages
  let type: 'text' | 'numeric' | 'mixed' | 'empty' = 'empty';
  if (nonEmptyCount === 0) {
    type = 'empty';
  } else if (textPercentage > 90) {
    type = 'text';
  } else if (numericPercentage > 90) {
    type = 'numeric';
  } else {
    type = 'mixed';
  }

  // Additional heuristic: If average text length is high, consider it text regardless
  if (avgTextLength > 30 && textCount > 0) {
    type = 'text';
  }

  return {
    type,
    stats: {
      textPercentage,
      numericPercentage,
      textLength: avgTextLength,
      nonEmptyCount,
      totalCount
    }
  };
};

export const getColumnNames = (
  headers: string[] | null, 
  columnCount: number
): string[] => {
  if (headers && headers.length > 0) {
    return headers.map(header => header.trim() || 'Unnamed Column');
  }
  
  // Generate generic column names if no headers
  return Array(columnCount).fill(0).map((_, i) => `Column ${i + 1}`);
};

export const analyzeColumns = (
  columns: any[][], 
  columnNames: string[]
): { columnInfos: ColumnInfo[], textResponses: string[] } => {
  const columnInfos: ColumnInfo[] = [];
  const textResponses: string[] = [];
  
  columns.forEach((columnData, index) => {
    const { type, stats } = analyzeColumnValues(columnData);
    
    // Include keywords that suggest open-ended questions
    const openEndedKeywords = ['comment', 'feedback', 'opinion', 'suggestion', 'describe', 'explain', 'tell', 'elaborate', 'why', 'how', 'open'];
    
    // Check if column name suggests it's an open-ended question
    let columnNameSuggestsOpenEnded = false;
    if (columnNames[index]) {
      const colNameLower = columnNames[index].toLowerCase();
      columnNameSuggestsOpenEnded = openEndedKeywords.some(keyword => 
        colNameLower.includes(keyword)
      );
    }
    
    // Get non-empty examples
    const examples = columnData
      .filter((value: any) => value !== undefined && value !== null && value !== '')
      .slice(0, 5)
      .map(String);
      
    columnInfos.push({
      index,
      name: columnNames[index],
      type: columnNameSuggestsOpenEnded && examples.length > 0 ? 'text' : type,
      examples,
      stats
    });
    
    // Collect text responses from text columns for backward compatibility
    if (type === 'text' || columnNameSuggestsOpenEnded) {
      const validResponses = columnData
        .filter((value: any) => 
          value !== undefined && 
          value !== null && 
          value !== '' &&
          String(value).trim().length > 5 // Only include substantive responses
        )
        .map(String);
        
      textResponses.push(...validResponses);
    }
  });
  
  return { columnInfos, textResponses };
};
