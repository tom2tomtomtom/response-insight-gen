import { QuestionType } from '../contexts/types';

export interface QuestionGroup {
  id: string;
  name: string;
  pattern: RegExp;
  questionType: QuestionType;
  priority: number;
  examples: string[];
}

export interface GroupingResult {
  columnIndex: number;
  columnName: string;
  detectedGroup: QuestionGroup | null;
  confidence: number;
}

export class QuestionGroupingAutomation {
  private static defaultGroups: QuestionGroup[] = [
    // Brand Awareness Questions
    {
      id: 'brand_awareness_unaided',
      name: 'Unaided Brand Awareness',
      pattern: /\b(unaided|spontaneous|top.of.mind|first.mention|recall|think.of|come.to.mind|brands?.know|aware.of)\b/i,
      questionType: 'brand_awareness',
      priority: 1,
      examples: [
        'What brands come to mind when you think of soft drinks?',
        'Which car brands are you aware of?',
        'List all the smartphone brands you can recall.'
      ]
    },
    {
      id: 'brand_awareness_aided',
      name: 'Aided Brand Awareness',
      pattern: /\b(aided|prompted|heard.of|recognize|familiar.with|know.about|seen.before)\b/i,
      questionType: 'brand_awareness',
      priority: 2,
      examples: [
        'Which of these brands have you heard of?',
        'Are you familiar with Brand X?',
        'Have you seen advertising for any of these brands?'
      ]
    },
    
    // Brand Description Questions
    {
      id: 'brand_perception',
      name: 'Brand Perception',
      pattern: /\b(describe|think.about|opinion|perception|view|feel.about|associate|comes?.to.mind|impression)\b.*\b(brand|company|product)\b/i,
      questionType: 'brand_description',
      priority: 1,
      examples: [
        'How would you describe Brand X?',
        'What comes to mind when you think about Company Y?',
        'What is your opinion of this brand?'
      ]
    },
    {
      id: 'brand_attributes',
      name: 'Brand Attributes',
      pattern: /\b(attributes?|characteristics?|qualities|features?|traits?|aspects?)\b.*\b(brand|product|service)\b/i,
      questionType: 'brand_description',
      priority: 2,
      examples: [
        'What attributes do you associate with this brand?',
        'List the key characteristics of Brand X',
        'What qualities define this product?'
      ]
    },
    {
      id: 'brand_experience',
      name: 'Brand Experience',
      pattern: /\b(experience|satisfaction|happy|satisfied|disappointed|issue|problem|like|dislike|love|hate)\b.*\b(brand|product|service)\b/i,
      questionType: 'brand_description',
      priority: 3,
      examples: [
        'Describe your experience with Brand X',
        'What do you like most about this product?',
        'Any issues you faced with this service?'
      ]
    },
    
    // General/Miscellaneous Questions
    {
      id: 'reasons_why',
      name: 'Reasons/Explanations',
      pattern: /\b(why|reason|because|explain|elaborate|justify|motivation)\b/i,
      questionType: 'miscellaneous',
      priority: 3,
      examples: [
        'Why did you choose this option?',
        'Please explain your answer',
        'What are your reasons for this preference?'
      ]
    },
    {
      id: 'suggestions',
      name: 'Suggestions/Improvements',
      pattern: /\b(suggest|recommend|improve|change|better|enhance|advice|feedback)\b/i,
      questionType: 'miscellaneous',
      priority: 4,
      examples: [
        'How would you improve this product?',
        'Any suggestions for us?',
        'What changes would you recommend?'
      ]
    },
    {
      id: 'open_feedback',
      name: 'Open Feedback',
      pattern: /\b(additional|other|else|more|comment|feedback|anything.else|further|add)\b/i,
      questionType: 'miscellaneous',
      priority: 5,
      examples: [
        'Any additional comments?',
        'Is there anything else you would like to add?',
        'Other feedback?'
      ]
    }
  ];
  
  /**
   * Automatically detect question groups from column names
   */
  static detectGroups(columns: { name: string; index: number }[]): GroupingResult[] {
    return columns.map(column => {
      let bestMatch: QuestionGroup | null = null;
      let highestConfidence = 0;
      
      // Check each group pattern
      for (const group of this.defaultGroups) {
        const match = column.name.match(group.pattern);
        if (match) {
          // Calculate confidence based on match strength and priority
          const matchLength = match[0].length;
          const nameLength = column.name.length;
          const matchRatio = matchLength / nameLength;
          const confidence = (matchRatio * 0.7) + ((6 - group.priority) / 5 * 0.3);
          
          if (confidence > highestConfidence) {
            highestConfidence = confidence;
            bestMatch = group;
          }
        }
      }
      
      // Additional heuristics for higher confidence
      if (bestMatch) {
        // Check for exact phrase matches in examples
        const lowerName = column.name.toLowerCase();
        const hasExampleMatch = bestMatch.examples.some(example => 
          lowerName.includes(example.toLowerCase().slice(0, 20))
        );
        if (hasExampleMatch) {
          highestConfidence = Math.min(highestConfidence + 0.2, 1.0);
        }
      }
      
      return {
        columnIndex: column.index,
        columnName: column.name,
        detectedGroup: bestMatch,
        confidence: highestConfidence
      };
    });
  }
  
  /**
   * Group columns by detected question type
   */
  static groupByType(results: GroupingResult[]): Map<QuestionType, GroupingResult[]> {
    const grouped = new Map<QuestionType, GroupingResult[]>();
    
    results.forEach(result => {
      if (result.detectedGroup) {
        const type = result.detectedGroup.questionType;
        if (!grouped.has(type)) {
          grouped.set(type, []);
        }
        grouped.get(type)!.push(result);
      }
    });
    
    return grouped;
  }
  
  /**
   * Suggest question type assignments with confidence scores
   */
  static getSuggestions(
    columns: { name: string; index: number }[],
    confidenceThreshold: number = 0.5
  ): Record<number, { type: QuestionType; confidence: number; reason: string }> {
    const results = this.detectGroups(columns);
    const suggestions: Record<number, { type: QuestionType; confidence: number; reason: string }> = {};
    
    results.forEach(result => {
      if (result.detectedGroup && result.confidence >= confidenceThreshold) {
        suggestions[result.columnIndex] = {
          type: result.detectedGroup.questionType,
          confidence: result.confidence,
          reason: `Detected as "${result.detectedGroup.name}" based on pattern matching`
        };
      }
    });
    
    return suggestions;
  }
  
  /**
   * Add custom question group
   */
  static addCustomGroup(group: QuestionGroup) {
    this.defaultGroups.push(group);
  }
  
  /**
   * Export grouping configuration
   */
  static exportConfiguration(): QuestionGroup[] {
    return [...this.defaultGroups];
  }
  
  /**
   * Import grouping configuration
   */
  static importConfiguration(groups: QuestionGroup[]) {
    this.defaultGroups = groups.map(g => ({
      ...g,
      pattern: new RegExp(g.pattern.source, g.pattern.flags)
    }));
  }
}