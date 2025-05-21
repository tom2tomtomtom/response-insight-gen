
export type QuestionType = 'brand_awareness' | 'brand_description' | 'miscellaneous';

export interface QuestionTypeConfig {
  id: QuestionType;
  name: string;
  description: string;
  icon: string;
  promptInstructions: string;
}

export const QUESTION_TYPES: Record<QuestionType, QuestionTypeConfig> = {
  brand_awareness: {
    id: 'brand_awareness',
    name: 'Unaided Brand Awareness',
    description: 'For questions where respondents list brands they are aware of',
    icon: '🏢',
    promptInstructions: `
      1. Identify all mentioned brands and create a code for each unique brand
      2. Group brands by parent company/system where applicable
      3. Create hierarchical structure for related brands
      4. Include frequency counts for each brand mention
    `
  },
  brand_description: {
    id: 'brand_description',
    name: 'Brand Description',
    description: 'For questions about how respondents would describe a brand',
    icon: '💬',
    promptInstructions: `
      1. Identify key attributes and themes in brand descriptions
      2. Categorize by sentiment (positive, negative, neutral)
      3. Group related attributes into themes
      4. Track frequency of attribute mentions
    `
  },
  miscellaneous: {
    id: 'miscellaneous',
    name: 'Miscellaneous',
    description: 'For other types of open-ended questions',
    icon: '📝',
    promptInstructions: `
      1. Identify key themes and patterns in responses
      2. Create logical categories based on content
      3. Ensure comprehensive coverage of main ideas
      4. Track frequency of theme mentions
    `
  }
};

export const getQuestionTypeName = (type: string): string => {
  if (type in QUESTION_TYPES) {
    return QUESTION_TYPES[type as QuestionType].name;
  }
  return type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ');
};

export const getQuestionTypeIcon = (type: string): string => {
  if (type in QUESTION_TYPES) {
    return QUESTION_TYPES[type as QuestionType].icon;
  }
  return '📝';
};

export const getPromptInstructions = (type: string): string => {
  if (type in QUESTION_TYPES) {
    return QUESTION_TYPES[type as QuestionType].promptInstructions;
  }
  return '';
};
