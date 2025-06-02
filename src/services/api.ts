import { ApiResponse, ProcessedResult, UploadedFile, ColumnInfo, UploadedCodeframe } from "../types";
import * as XLSX from 'xlsx';

// Default API endpoint for the text analysis service
const DEFAULT_API_URL = "https://api.openai.com/v1/chat/completions";

// Store selected columns for processing
let userSelectedColumns: ColumnInfo[] = [];

// Store uploaded codeframe if provided
let userUploadedCodeframe: UploadedCodeframe | null = null;

// Store column question types
let userColumnQuestionTypes: Record<number, string> = {};

// Set selected columns - renamed to avoid naming conflicts in ProcessingContext
export const setApiSelectedColumns = (columns: ColumnInfo[]): void => {
  userSelectedColumns = columns;
};

// Set uploaded codeframe for use in API
export const setUploadedCodeframe = (codeframe: UploadedCodeframe | null): void => {
  userUploadedCodeframe = codeframe;
};

// Set column question types
export const setColumnQuestionTypes = (columnTypes: Record<number, string>): void => {
  userColumnQuestionTypes = columnTypes;
};

// Test API connection with provided key
export const testApiConnection = async (apiKey: string, apiUrl: string): Promise<boolean> => {
  if (!apiKey || !apiKey.trim()) {
    throw new Error("API key is required");
  }
  
  try {
    // Make a minimal request to test the connection
    const response = await fetch(`${apiUrl || DEFAULT_API_URL}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: "Hello" }],
        max_tokens: 5
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API returned status ${response.status}`);
    }
    
    return true;
  } catch (error) {
    console.error("API connection test failed:", error);
    throw error;
  }
};

// Handle file upload - now processes locally without sending to API
export const uploadFile = async (file: File, apiConfig?: { apiKey: string, apiUrl: string }): Promise<ApiResponse<UploadedFile>> => {
  try {
    // Generate a file ID locally - we don't need to upload the file to OpenAI
    const fileId = `file-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    
    // Just return a successful upload response
    return {
      success: true,
      data: {
        id: fileId,
        filename: file.name,
        status: 'uploaded',
        uploadedAt: new Date()
      }
    };
  } catch (error) {
    console.error("File upload failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// Store user responses
let userUploadedResponses: string[] = [];

// Store the real responses for use in the API
export const setUserResponses = (responses: string[]) => {
  userUploadedResponses = responses;
};

// Process the uploaded file
export const processFile = async (fileId: string, apiConfig?: { apiKey: string, apiUrl: string }): Promise<ApiResponse<UploadedFile>> => {
  if (!apiConfig?.apiKey) {
    throw new Error('OpenAI API key is required for processing. Please configure your API key first.');
  }
  
  try {
    // Return a processing status - actual processing will happen in getProcessingResult
    return {
      success: true,
      data: {
        id: fileId,
        filename: 'processing_file.xlsx',
        status: 'processing'
      }
    };
  } catch (error) {
    console.error("File processing failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// Calculate code percentages based on usage
const calculateCodePercentages = (codedResponses: any[], codeframe: any[]) => {
  // Count occurrences of each code
  const codeCounts: Record<string, number> = {};
  let totalCodeAssignments = 0;
  
  // Count occurrences of each code in responses
  codedResponses.forEach(response => {
    response.codesAssigned.forEach((code: string) => {
      codeCounts[code] = (codeCounts[code] || 0) + 1;
      totalCodeAssignments++;
    });
  });
  
  // Update codeframe with counts and percentages
  const updatedCodeframe = codeframe.map(code => {
    const count = codeCounts[code.code] || 0;
    const percentage = totalCodeAssignments > 0 ? (count / codedResponses.length) * 100 : 0;
    
    return {
      ...code,
      count,
      percentage
    };
  });
  
  // Sort codes by percentage descending for the summary
  const codeSummary = updatedCodeframe
    .map(code => ({
      code: code.code,
      numeric: code.numeric || code.code.replace(/[^0-9.]/g, ''),
      label: code.label,
      count: code.count || 0,
      percentage: code.percentage || 0
    }))
    .sort((a, b) => b.percentage - a.percentage);
  
  return {
    updatedCodeframe,
    codeSummary
  };
};

// Ensure numeric codes format
const ensureNumericCodes = (codeframe: any[]) => {
  // First check if numeric codes are already present
  const hasNumericCodes = codeframe.some(code => code.numeric);
  
  if (hasNumericCodes) {
    return codeframe;
  }
  
  // If not, generate numeric codes
  return codeframe.map((code, index) => {
    // Make sure code.code exists and is a string before using replace
    let numericPart = '';
    
    if (code && typeof code.code === 'string') {
      // Extract numeric part if code already has a number format like "C01"
      numericPart = code.code.replace(/[^0-9.]/g, '');
    }
    
    // If no numeric part found, use the index + 1
    const numeric = numericPart.length > 0 ? numericPart : (index + 1).toString();
    
    return {
      ...code,
      numeric
    };
  });
};

// Ensure essential catch-all categories exist in the codeframe
const ensureCatchAllCategories = (codeframe: any[], questionType: string) => {
  const requiredCategories = [
    {
      code: "Other",
      label: "Other",
      definition: "Responses that don't fit into the main categories",
      examples: ["Miscellaneous response", "Unrelated comment", "Different answer"]
    },
    {
      code: "None",
      label: "None/Nothing",
      definition: "Responses indicating nothing, none, or no answer",
      examples: ["None", "Nothing", "N/A", "No response"]
    },
    {
      code: "DK_NA",
      label: "Don't Know/Not Applicable",
      definition: "Responses indicating uncertainty or that the question doesn't apply",
      examples: ["Don't know", "Not sure", "N/A", "Not applicable", "Can't say"]
    }
  ];
  
  let updatedCodeframe = [...codeframe];
  
  // Get the highest numeric code
  let maxNumeric = 0;
  codeframe.forEach(code => {
    const numeric = parseInt(code.numeric || '0');
    if (!isNaN(numeric) && numeric > maxNumeric) {
      maxNumeric = numeric;
    }
  });
  
  requiredCategories.forEach(required => {
    // Check if this category already exists
    const exists = codeframe.some(code => 
      code.code === required.code || 
      code.label.toLowerCase() === required.label.toLowerCase() ||
      (required.label.includes('/') && 
        required.label.split('/').some(part => 
          code.label.toLowerCase().includes(part.toLowerCase().trim())
        ))
    );
    
    if (!exists) {
      maxNumeric++;
      updatedCodeframe.push({
        ...required,
        numeric: maxNumeric.toString(),
        count: 0,
        percentage: 0
      });
    }
  });
  
  return updatedCodeframe;
};

// Helper function to create unique worksheet names
const createUniqueWorksheetName = (baseName: string, existingNames: Set<string>): string => {
  // Excel worksheet names have a 31 character limit and cannot contain certain characters
  let cleanName = baseName.replace(/[*?[\]]/g, '_').substring(0, 31);
  
  if (!existingNames.has(cleanName)) {
    existingNames.add(cleanName);
    return cleanName;
  }
  
  // If name exists, add a number suffix
  for (let i = 1; i <= 99; i++) {
    const suffix = `_${i}`;
    const maxBaseLength = 31 - suffix.length;
    const uniqueName = cleanName.substring(0, maxBaseLength) + suffix;
    
    if (!existingNames.has(uniqueName)) {
      existingNames.add(uniqueName);
      return uniqueName;
    }
  }
  
  // Fallback - should rarely happen
  const fallbackName = `Sheet_${Date.now().toString().slice(-6)}`;
  existingNames.add(fallbackName);
  return fallbackName;
};

// Generate codeframe for a specific question type
const generatePromptByQuestionType = (questionType: string, columns: any[], uploadedCodeframe: UploadedCodeframe | null) => {
  let promptContent = "";
  
  // If user uploaded a codeframe, include it in the prompt
  if (uploadedCodeframe) {
    // Transform columns to include row indices
    const columnsWithIndices = columns.map(col => ({
      ...col,
      responsesWithRowIndices: col.responsesWithIndices?.filter(item => 
        item.value !== undefined && 
        item.value !== null && 
        item.value !== '' &&
        String(item.value).trim().length > 5
      ).map(item => ({
        responseText: String(item.value),
        rowIndex: item.rowIndex
      })) || []
    }));
    
    promptContent = `I have a survey with the following open-ended questions and responses (each response includes its row index):
    ${JSON.stringify(columnsWithIndices, null, 2)}
    
    I already have a predefined codeframe that I want you to use to code these responses:
    ${JSON.stringify(uploadedCodeframe.entries, null, 2)}
    
    Please analyze these responses and:
    1. Use ONLY the provided codeframe codes - do not create new ones
    2. Assign the appropriate codes to each response based on the definitions in the codeframe
    3. Make sure to include the "Other" category for responses that don't fit any category
    4. IMPORTANT: Preserve the rowIndex for each response in your output
    
    Format your response as a JSON object with two properties:
    - codeframe: The provided codeframe array of code objects with {code, numeric, label, definition, examples}
    - codedResponses: An array of response objects with {responseText, columnName, columnIndex, rowIndex, codesAssigned}`;
    
    return promptContent;
  }

  // Create different prompts based on question type
  switch (questionType) {
    case 'brand_awareness':
      promptContent = `I have survey responses from Unaided Brand Awareness questions where respondents listed brands they are aware of (each response includes its row index):
      ${JSON.stringify(columns, null, 2)}
      
      Please analyze these responses and:
      1. Create a codeframe with distinct brand codes
      2. IMPORTANT HIERARCHICAL GROUPING RULES:
         - Group locations under their parent state/region (e.g., "Richmond" → "Virginia")
         - Group individual stores/branches under their parent company/system
         - Group product variations under their main brand
         - Create parent codes with numeric like "10" and child codes like "10.1", "10.2"
      3. REQUIRED: Include these catch-all categories:
         - "Other" for mentions that don't fit main brands
         - "None/Nothing" for no brand mentions
         - "Don't Know/Not Applicable" for uncertain responses
      4. For each code, provide:
         - A short label (the brand name)
         - A clear definition including parent company if applicable
         - A numeric code (use hierarchical numbering: parent=10, children=10.1, 10.2)
         - Sample mentions that would be coded to this brand
         - parentCode field if this is a child brand
      5. Examples of hierarchical grouping:
         - "Walmart in Richmond" → parentCode: "Walmart", also gets "Virginia" location code
         - "Mayo Clinic Rochester" → parentCode: "Mayo Clinic Health System"
         - "Coca-Cola Zero" → parentCode: "Coca-Cola Company"
      6. IMPORTANT: Preserve the rowIndex from responsesWithRowIndices for each response in your output
      
      Format your response as a JSON object with:
      - codeframe: Array of code objects with {code, numeric, label, definition, examples, parentCode}
      - codedResponses: Array of response objects with {responseText, columnName, columnIndex, rowIndex, codesAssigned}
      - brandHierarchies: Object mapping parent codes to arrays of child codes`;
      break;
      
    case 'brand_description':
      promptContent = `I have survey responses from Brand Description questions where respondents described brands (each response includes its row index):
      ${JSON.stringify(columns, null, 2)}
      
      Please analyze these responses and:
      1. Create a codeframe with attribute categories (like Quality, Value, Innovation)
      2. Include sentiment dimensions (Positive, Negative, Neutral) where appropriate
      3. REQUIRED: Include these catch-all categories:
         - "Other" for attributes that don't fit main categories
         - "None/Nothing" for no description given
         - "Don't Know/Not Applicable" for uncertain responses
      4. For each code, provide:
         - A short label for the attribute
         - A clear definition of what this attribute represents
         - A numeric code
         - Example phrases from the responses
      5. Group related attributes under themes where possible
      6. IMPORTANT: Preserve the rowIndex from responsesWithRowIndices for each response in your output
      
      Format your response as a JSON object with:
      - codeframe: Array of code objects with {code, numeric, label, definition, examples, themeGroup}
      - codedResponses: Array of objects with {responseText, columnName, columnIndex, rowIndex, codesAssigned}
      - attributeThemes: Object mapping themes to arrays of attribute codes`;
      break;
      
    case 'miscellaneous':
    default:
      promptContent = `I have a survey with the following open-ended questions and responses (each response includes its row index):
      ${JSON.stringify(columns, null, 2)}
      
      Please analyze these responses and:
      1. Create a codeframe with 5-10 distinct codes using numeric identifiers
      2. REQUIRED: Always include these three catch-all categories:
         - "Other" for responses that don't fit main categories
         - "None/Nothing" for responses indicating nothing or no answer
         - "Don't Know/Not Applicable" for uncertain or N/A responses
      3. For each code, provide:
         - A short label
         - A clear definition
         - A numeric code (e.g., 1, 2, 3 or 1.1, 1.2, etc.)
         - 2-3 example phrases
      4. Assign appropriate codes to each response
      5. IMPORTANT: Preserve the rowIndex from responsesWithRowIndices for each response in your output
      
      Format your response as a JSON object with two properties:
      - codeframe: An array of code objects with {code, numeric, label, definition, examples}
      - codedResponses: An array of response objects with {responseText, columnName, columnIndex, rowIndex, codesAssigned}`;
  }
  
  return promptContent;
};

// Generate insights based on coded results
const generateInsightsPrompt = (questionTypes: string[], codedResponses: any, codeframes: any) => {
  return `Based on the analysis of the survey responses across ${questionTypes.length} question types:
  
  ${JSON.stringify({questionTypes, codedResponses, codeframes}, null, 2)}
  
  Please provide a high-level summary of key findings and insights:
  1. For each question type, identify the top 3-5 themes/patterns
  2. Highlight any notable correlations or contrasts between different question types
  3. Summarize the overall sentiment and main takeaways from the responses
  4. Suggest potential follow-up areas for deeper analysis
  
  Format your response as markdown text with clear section headers for each question type.`;
};

// Helper function to safely parse JSON with better error handling
const safeParseJSON = (jsonString: string, questionType: string) => {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error(`JSON parsing failed for question type ${questionType}:`, error);
    
    // Try to fix common JSON issues
    let fixedJson = jsonString;
    
    // Fix trailing commas
    fixedJson = fixedJson.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
    
    // Try to close unclosed arrays/objects at the end
    if (fixedJson.includes('"codedResponses"')) {
      // Count open brackets
      const openBrackets = (fixedJson.match(/\[/g) || []).length;
      const closeBrackets = (fixedJson.match(/\]/g) || []).length;
      const openBraces = (fixedJson.match(/{/g) || []).length;
      const closeBraces = (fixedJson.match(/}/g) || []).length;
      
      // Add missing closing brackets
      for (let i = 0; i < openBrackets - closeBrackets; i++) {
        fixedJson += ']';
      }
      for (let i = 0; i < openBraces - closeBraces; i++) {
        fixedJson += '}';
      }
    }
    
    try {
      return JSON.parse(fixedJson);
    } catch (secondError) {
      // If still fails, try to extract a minimal valid response
      if (jsonString.includes('"codeframe"')) {
        try {
          // Extract just the codeframe part
          const codeframeMatch = jsonString.match(/"codeframe"\s*:\s*\[([^\]]*)\]/);
          if (codeframeMatch) {
            const minimalResponse = {
              codeframe: JSON.parse('[' + codeframeMatch[1] + ']'),
              codedResponses: []
            };
            console.warn(`Recovered partial codeframe for ${questionType}, but responses may be missing`);
            return minimalResponse;
          }
        } catch (minimalError) {
          console.error(`Minimal recovery failed for question type ${questionType}:`, minimalError);
        }
      }
    }
    
    throw new Error(`Invalid JSON response for ${questionType}. The AI response may have been truncated or malformed.`);
  }
};

// Enhanced error handling for individual question type processing
const processQuestionTypeWithRetry = async (questionType: string, columns: any[], apiConfig: any, retryCount = 0) => {
  const MAX_RETRIES = 3;
  const MAX_RESPONSES_PER_BATCH = 20; // Further reduced to prevent token overflow
  
  try {
    // Transform columns to include row indices and sample if needed
    const processedColumns = columns.map(col => {
      // Get responses with row indices
      const responsesWithIndices = col.responsesWithIndices?.filter(item => 
        item.value !== undefined && 
        item.value !== null && 
        item.value !== '' &&
        String(item.value).trim().length > 5
      ) || [];
      
      // Sample if too many responses
      let sampledResponsesWithIndices = responsesWithIndices;
      if (responsesWithIndices.length > MAX_RESPONSES_PER_BATCH) {
        console.log(`Sampling ${MAX_RESPONSES_PER_BATCH} responses from ${responsesWithIndices.length} for column ${col.name}`);
        const step = Math.floor(responsesWithIndices.length / MAX_RESPONSES_PER_BATCH);
        sampledResponsesWithIndices = [];
        for (let i = 0; i < responsesWithIndices.length; i += step) {
          if (sampledResponsesWithIndices.length < MAX_RESPONSES_PER_BATCH) {
            sampledResponsesWithIndices.push(responsesWithIndices[i]);
          }
        }
      }
      
      return { 
        ...col, 
        responsesWithRowIndices: sampledResponsesWithIndices.map(item => ({
          responseText: String(item.value),
          rowIndex: item.rowIndex
        })),
        totalResponses: responsesWithIndices.length 
      };
    });
    
    const promptContent = generatePromptByQuestionType(questionType, processedColumns, userUploadedCodeframe);
    
    const messages = [
      {
        role: "system",
        content: `You are an expert qualitative researcher analyzing ${questionType} type survey responses. IMPORTANT: Always return valid JSON with proper syntax. Note: You are seeing a sample of responses - create a comprehensive codeframe that would work for the full dataset. Each response in responsesWithRowIndices includes a rowIndex that MUST be preserved in your codedResponses output.`
      },
      {
        role: "user",
        content: promptContent
      }
    ];
    
    // Increase max_tokens to ensure complete JSON response
    const maxTokens = retryCount > 0 ? 3000 : 4000;
    
    const response = await fetch(`${apiConfig.apiUrl || DEFAULT_API_URL}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiConfig.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: messages,
        temperature: 0.7,
        max_tokens: maxTokens,
        response_format: { type: "json_object" }
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || errorData.message || `API request failed with status ${response.status}`;
      
      // Check for rate limit error
      if (response.status === 429 || errorMessage.includes('Rate limit')) {
        const waitTime = parseRetryAfter(errorData) || Math.pow(2, retryCount + 1) * 1000; // Exponential backoff
        console.log(`Rate limit hit for ${questionType}. Waiting ${waitTime}ms before retry...`);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, waitTime));
        
        // Force a retry for rate limit errors
        if (retryCount < MAX_RETRIES) {
          return processQuestionTypeWithRetry(questionType, columns, apiConfig, retryCount + 1);
        }
      }
      
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Use safe JSON parsing
    const parsedResult = safeParseJSON(content, questionType);
    
    // Validate the parsed result structure
    if (!parsedResult.codeframe || !Array.isArray(parsedResult.codeframe) || 
        !parsedResult.codedResponses || !Array.isArray(parsedResult.codedResponses)) {
      throw new Error(`Invalid response structure for ${questionType}. Missing required fields.`);
    }
    
    // Ensure codeframe has numeric codes
    const codeframeWithNumeric = ensureNumericCodes(parsedResult.codeframe);
    
    // Ensure all catch-all categories exist
    const codeframeWithCatchAll = ensureCatchAllCategories(codeframeWithNumeric, questionType);
    
    // Calculate code percentages
    const { updatedCodeframe, codeSummary } = calculateCodePercentages(
      parsedResult.codedResponses, 
      codeframeWithCatchAll
    );
    
    // Return the processed result for this question type
    return {
      questionType,
      codeframe: updatedCodeframe,
      codedResponses: parsedResult.codedResponses,
      codeSummary: codeSummary,
      brandHierarchies: parsedResult.brandHierarchies,
      attributeThemes: parsedResult.attributeThemes
    };
    
  } catch (error) {
    console.error(`Error processing question type ${questionType} (attempt ${retryCount + 1}):`, error);
    
    // Retry with reduced complexity if possible
    if (retryCount < MAX_RETRIES && !error.message.includes('after ' + (MAX_RETRIES + 1) + ' attempts')) {
      console.log(`Retrying ${questionType} with reduced complexity...`);
      // Add a small delay between retries
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
      return processQuestionTypeWithRetry(questionType, columns, apiConfig, retryCount + 1);
    }
    
    // If all retries failed, return a fallback or throw with helpful message
    throw new Error(`Failed to process ${questionType} after ${retryCount + 1} attempts. ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Helper function to parse retry-after header or message
const parseRetryAfter = (errorData: any): number | null => {
  // Check for retry-after in error message (e.g., "Please try again in 3.517s")
  const match = errorData.error?.message?.match(/Please try again in ([\d.]+)s/);
  if (match) {
    return Math.ceil(parseFloat(match[1]) * 1000) + 500; // Add 500ms buffer
  }
  return null;
};

// Get the processing result - now requires API key
export const getProcessingResult = async (fileId: string, apiConfig?: { apiKey: string, apiUrl: string }): Promise<ApiResponse<ProcessedResult>> => {
  if (!apiConfig?.apiKey) {
    throw new Error('OpenAI API key is required for processing. Please configure your API key first.');
  }
  
  try {
    console.log("Selected columns for processing:", userSelectedColumns);
    
    // Check if we have selected columns
    if (!userSelectedColumns || userSelectedColumns.length === 0) {
      throw new Error("No columns selected for processing");
    }
    
    // Group columns by question type
    const columnsByType: Record<string, any[]> = {};
    
    for (const columnInfo of userSelectedColumns) {
      const questionType = userColumnQuestionTypes[columnInfo.index] || 'miscellaneous';
      
      if (!columnsByType[questionType]) {
        columnsByType[questionType] = [];
      }
      
      const columnData = {
        name: columnInfo.name,
        index: columnInfo.index,
        responses: columnInfo.examples || [],
        responsesWithIndices: columnInfo.dataWithIndices || [],
        settings: columnInfo.settings || {}
      };
      
      columnsByType[questionType].push(columnData);
    }
    
    console.log("Columns grouped by question type:", Object.keys(columnsByType));
    
    // Process each question type with enhanced error handling
    const results = [];
    const failedTypes = [];
    
    // Add delay between question types to avoid rate limits
    let typeIndex = 0;
    for (const [questionType, columns] of Object.entries(columnsByType)) {
      try {
        // Add delay between question types (except for the first one)
        if (typeIndex > 0) {
          console.log(`Waiting 2 seconds before processing next question type...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        console.log(`Processing question type: ${questionType}`);
        const result = await processQuestionTypeWithRetry(questionType, columns, apiConfig);
        results.push(result);
        console.log(`Successfully processed ${questionType}`);
        typeIndex++;
      } catch (error) {
        console.error(`Failed to process question type ${questionType}:`, error);
        failedTypes.push({
          questionType,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    // Check if we have any successful results
    if (results.length === 0) {
      const errorMessages = failedTypes.map(f => `${f.questionType}: ${f.error}`).join('; ');
      throw new Error(`Failed to process any question types. Errors: ${errorMessages}`);
    }
    
    // Handle partial failures with recovery support
    const partialResults = {
      successful: results,
      failed: failedTypes,
      recoverable: failedTypes.length > 0 && results.length > 0
    };
    
    // Store partial results for recovery
    if (partialResults.recoverable) {
      localStorage.setItem('partial_processing_results', JSON.stringify({
        timestamp: new Date().toISOString(),
        fileId,
        successful: results.map(r => ({ questionType: r.questionType, columnsProcessed: r.columnsProcessed || [] })),
        failed: failedTypes,
        columnsByType
      }));
      
      console.warn(`Partial processing results saved. ${results.length} succeeded, ${failedTypes.length} failed.`);
    }
    
    // Combine results from successful question types
    const allCodedResponses: any[] = [];
    const multipleCodeframes: Record<string, any> = {};
    
    results.forEach(result => {
      if (!result) return;
      
      allCodedResponses.push(...result.codedResponses);
      
      multipleCodeframes[result.questionType] = {
        codeframe: result.codeframe,
        codeSummary: result.codeSummary,
        brandHierarchies: result.brandHierarchies,
        attributeThemes: result.attributeThemes
      };
    });
    
    // Use the first result as the "primary" one for backward compatibility
    const primaryResult = results[0];
    
    // Generate insights if there are multiple question types
    let insights = null;
    if (results.length > 1) {
      try {
        const insightsPrompt = generateInsightsPrompt(
          Object.keys(multipleCodeframes),
          allCodedResponses,
          multipleCodeframes
        );
        
        const insightsResponse = await fetch(`${apiConfig.apiUrl || DEFAULT_API_URL}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiConfig.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content: "You are an expert data analyst providing insights on survey results."
              },
              {
                role: "user",
                content: insightsPrompt
              }
            ],
            temperature: 0.7,
            max_tokens: 2000
          })
        });
        
        if (insightsResponse.ok) {
          const insightsData = await insightsResponse.json();
          insights = insightsData.choices[0].message.content;
        }
      } catch (error) {
        console.error("Failed to generate insights:", error);
        // Continue without insights if generation fails
      }
    }
    
    // Return the combined result with partial failure info
    return {
      success: true,
      data: {
        codeframe: primaryResult.codeframe,
        codedResponses: allCodedResponses,
        codeSummary: primaryResult.codeSummary,
        multipleCodeframes,
        insights,
        status: failedTypes.length > 0 ? 'partial' : 'complete',
        processingDetails: {
          totalQuestionTypes: Object.keys(columnsByType).length,
          successfulTypes: results.length,
          failedTypes: failedTypes.length,
          failures: failedTypes
        }
      }
    };
  } catch (error) {
    console.error("Getting processing results failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// Function to generate an Excel file from the results with multiple codeframes
export const generateExcelFile = async (result: ProcessedResult): Promise<Blob> => {
  try {
    console.log("Starting Excel file generation...");
    
    // Create a new workbook
    const workbook = XLSX.utils.book_new();
    
    // Track worksheet names to prevent duplicates
    const worksheetNames = new Set<string>();
    
    // Check for multiple codeframes
    const hasMultipleCodeframes = result.multipleCodeframes && 
      Object.keys(result.multipleCodeframes).length > 0;
    
    // Add overall summary tab if we have insights
    if (result.insights) {
      console.log("Adding insights worksheet...");
      try {
        // Convert the insights markdown to a format suitable for Excel
        const insightRows = result.insights.split('\n').map(line => [line]);
        const insightsWorksheet = XLSX.utils.aoa_to_sheet(insightRows);
        const insightsSheetName = createUniqueWorksheetName("Analysis Insights", worksheetNames);
        XLSX.utils.book_append_sheet(workbook, insightsWorksheet, insightsSheetName);
      } catch (error) {
        console.error("Error adding insights worksheet:", error);
      }
    }
    
    // If we have multiple codeframes, create a worksheet for each question type
    if (hasMultipleCodeframes) {
      console.log("Processing multiple codeframes...");
      
      Object.entries(result.multipleCodeframes).forEach(([questionType, typeData]) => {
        try {
          // Create readable question type name
          const questionTypeName = questionType === 'brand_awareness' ? 'Brand Awareness' : 
                                  questionType === 'brand_description' ? 'Brand Description' : 
                                  'Miscellaneous';
                                  
          // Create codeframe worksheet for this question type
          if (typeData.codeframe) {
            const codeframeData = typeData.codeframe.map((code: any) => ({
              Code: code.code,
              Numeric: code.numeric || '',
              Label: code.label,
              Definition: code.definition,
              Examples: (code.examples || []).join('; '),
              Count: code.count || 0,
              Percentage: code.percentage ? `${code.percentage.toFixed(1)}%` : '0%',
              ...(code.parentCode ? { ParentCode: code.parentCode } : {}),
              ...(code.themeGroup ? { Theme: code.themeGroup } : {})
            }));
            
            const typeCodeframeWorksheet = XLSX.utils.json_to_sheet(codeframeData);
            const codeframeSheetName = createUniqueWorksheetName(`${questionTypeName} Codes`, worksheetNames);
            XLSX.utils.book_append_sheet(workbook, typeCodeframeWorksheet, codeframeSheetName);
          }
          
          // Create code summary worksheet for this question type
          if (typeData.codeSummary) {
            const summaryData = typeData.codeSummary.map((code: any) => ({
              Code: code.code,
              Numeric: code.numeric || '',
              Label: code.label,
              Count: code.count,
              Percentage: `${code.percentage.toFixed(1)}%`
            }));
            
            const typeSummaryWorksheet = XLSX.utils.json_to_sheet(summaryData);
            const summarySheetName = createUniqueWorksheetName(`${questionTypeName} Summary`, worksheetNames);
            XLSX.utils.book_append_sheet(workbook, typeSummaryWorksheet, summarySheetName);
          }
          
          // Add brand hierarchies if available
          if (questionType === 'brand_awareness' && typeData.brandHierarchies) {
            const hierarchyData: any[] = [];
            
            Object.entries(typeData.brandHierarchies).forEach(([parent, children]) => {
              hierarchyData.push({ ParentSystem: parent, ChildBrand: '', Count: '' });
              (children as string[]).forEach(child => {
                const childCode = typeData.codeframe.find((c: any) => c.code === child);
                hierarchyData.push({ 
                  ParentSystem: '',
                  ChildBrand: childCode?.label || child,
                  Count: childCode?.count || 0
                });
              });
            });
            
            if (hierarchyData.length > 0) {
              const hierarchyWorksheet = XLSX.utils.json_to_sheet(hierarchyData);
              const hierarchySheetName = createUniqueWorksheetName("Brand Hierarchies", worksheetNames);
              XLSX.utils.book_append_sheet(workbook, hierarchyWorksheet, hierarchySheetName);
            }
          }
          
          // Add attribute themes if available
          if (questionType === 'brand_description' && typeData.attributeThemes) {
            const themeData: any[] = [];
            
            Object.entries(typeData.attributeThemes).forEach(([theme, attributes]) => {
              themeData.push({ Theme: theme, Attribute: '', Count: '' });
              (attributes as string[]).forEach(attr => {
                const attrCode = typeData.codeframe.find((c: any) => c.code === attr);
                themeData.push({ 
                  Theme: '',
                  Attribute: attrCode?.label || attr,
                  Count: attrCode?.count || 0
                });
              });
            });
            
            if (themeData.length > 0) {
              const themeWorksheet = XLSX.utils.json_to_sheet(themeData);
              const themeSheetName = createUniqueWorksheetName("Attribute Themes", worksheetNames);
              XLSX.utils.book_append_sheet(workbook, themeWorksheet, themeSheetName);
            }
          }
        } catch (error) {
          console.error(`Error processing question type ${questionType}:`, error);
          // Continue with other question types
        }
      });
    } else {
      console.log("Processing single codeframe...");
      try {
        // If no multiple codeframes, keep the original codeframe worksheet
        const codeframeData = result.codeframe.map(code => ({
          Code: code.code,
          Numeric: code.numeric || '',
          Label: code.label,
          Definition: code.definition,
          Examples: (code.examples || []).join('; '),
          Count: code.count || 0,
          Percentage: code.percentage ? `${code.percentage.toFixed(1)}%` : '0%'
        }));
        
        const codeframeWorksheet = XLSX.utils.json_to_sheet(codeframeData);
        const codeframeSheetName = createUniqueWorksheetName("Codeframe", worksheetNames);
        XLSX.utils.book_append_sheet(workbook, codeframeWorksheet, codeframeSheetName);
        
        // Add the Code Summary worksheet if available
        if (result.codeSummary) {
          const summaryData = result.codeSummary.map(code => ({
            Code: code.code,
            Numeric: code.numeric || '',
            Label: code.label,
            Count: code.count,
            Percentage: `${code.percentage.toFixed(1)}%`
          }));
          
          const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData);
          const summarySheetName = createUniqueWorksheetName("Code Summary", worksheetNames);
          XLSX.utils.book_append_sheet(workbook, summaryWorksheet, summarySheetName);
        }
      } catch (error) {
        console.error("Error processing single codeframe:", error);
      }
    }
    
    // Create the Coded Responses worksheet (this always contains all responses)
    console.log("Adding coded responses worksheet...");
    try {
      const responsesData = result.codedResponses.map(response => ({
        'Respondent ID': response.rowIndex !== undefined ? response.rowIndex + 1 : 'N/A',
        Response: response.responseText,
        Column: response.columnName || 'Unknown',
        QuestionType: hasMultipleCodeframes ? 
          userColumnQuestionTypes[response.columnIndex] || 'miscellaneous' : 
          'N/A',
        Codes: response.codesAssigned.join('; '),
        NumericCodes: response.codesAssigned.map(code => {
          // Find the code in the appropriate codeframe based on question type
          const questionType = hasMultipleCodeframes ? 
            userColumnQuestionTypes[response.columnIndex] || 'miscellaneous' :
            '';
            
          let codeEntry;
          if (hasMultipleCodeframes && questionType && result.multipleCodeframes[questionType]) {
            codeEntry = result.multipleCodeframes[questionType].codeframe.find((c: any) => c.code === code);
          } else {
            codeEntry = result.codeframe.find(c => c.code === code);
          }
          
          return codeEntry ? codeEntry.numeric || code : code;
        }).join('; ')
      }));
      
      const responsesWorksheet = XLSX.utils.json_to_sheet(responsesData);
      const responsesSheetName = createUniqueWorksheetName("Coded Responses", worksheetNames);
      XLSX.utils.book_append_sheet(workbook, responsesWorksheet, responsesSheetName);
    } catch (error) {
      console.error("Error adding coded responses worksheet:", error);
    }
    
    // Create column-specific worksheets
    console.log("Adding column-specific worksheets...");
    try {
      const columnResponses = new Map<string, any[]>();
      
      // Group responses by column
      result.codedResponses.forEach(response => {
        if (response.columnName) {
          const key = response.columnName;
          if (!columnResponses.has(key)) {
            columnResponses.set(key, []);
          }
          
          // Determine which codeframe to use for this response
          const questionType = hasMultipleCodeframes ? 
            userColumnQuestionTypes[response.columnIndex] || 'miscellaneous' :
            '';
            
          const codes = response.codesAssigned.map(code => {
            let codeEntry;
            if (hasMultipleCodeframes && questionType && result.multipleCodeframes[questionType]) {
              codeEntry = result.multipleCodeframes[questionType].codeframe.find((c: any) => c.code === code);
            } else {
              codeEntry = result.codeframe.find(c => c.code === code);
            }
            
            return codeEntry ? `${codeEntry.numeric || ''} - ${codeEntry.label}` : code;
          }).join('; ');
          
          columnResponses.get(key)?.push({
            'Respondent ID': response.rowIndex !== undefined ? response.rowIndex + 1 : 'N/A',
            Response: response.responseText,
            QuestionType: hasMultipleCodeframes ? 
              (questionType === 'brand_awareness' ? 'Brand Awareness' : 
               questionType === 'brand_description' ? 'Brand Description' : 
               'Miscellaneous') : 
              'N/A',
            Codes: codes
          });
        }
      });
      
      // Create a worksheet for each column
      columnResponses.forEach((responses, columnName) => {
        try {
          const worksheet = XLSX.utils.json_to_sheet(responses);
          const columnSheetName = createUniqueWorksheetName(columnName, worksheetNames);
          XLSX.utils.book_append_sheet(workbook, worksheet, columnSheetName);
        } catch (error) {
          console.error(`Error creating worksheet for column ${columnName}:`, error);
        }
      });
    } catch (error) {
      console.error("Error adding column-specific worksheets:", error);
    }
    
    // Write the workbook to an array buffer
    console.log("Writing workbook to buffer...");
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    
    // Create a Blob from the ArrayBuffer
    console.log("Excel file generation completed successfully");
    return new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
  } catch (error) {
    console.error("Error generating Excel file:", error);
    throw new Error(`Failed to generate Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Function to generate Excel with original data and codes
export const generateExcelWithOriginalData = async (result: ProcessedResult, rawFileData: any[][]): Promise<Blob> => {
  try {
    console.log("Starting Excel generation with original data. Raw data rows:", rawFileData?.length);
    
    // Step 1: Validate input data - must be strict
    if (!rawFileData || !Array.isArray(rawFileData) || rawFileData.length === 0) {
      throw new Error("No raw file data available for export");
    }
    
    // Step 2: Create a new workbook
    const workbook = XLSX.utils.book_new();
    
    // Step 3: Create the Codeframe worksheet - small data, safe to add first
    const codeframeData = result.codeframe.map(code => ({
      Code: code.code,
      Numeric: code.numeric || '',
      Label: code.label,
      Definition: code.definition,
      Examples: (code.examples || []).join('; '),
      Count: code.count || 0,
      Percentage: code.percentage ? `${code.percentage.toFixed(1)}%` : '0%'
    }));
    
    const codeframeWorksheet = XLSX.utils.json_to_sheet(codeframeData);
    XLSX.utils.book_append_sheet(workbook, codeframeWorksheet, "Codeframe");
    
    // Step 4: Add the Code Summary worksheet - also small data
    if (result.codeSummary) {
      const summaryData = result.codeSummary.map(code => ({
        Code: code.code,
        Numeric: code.numeric || '',
        Label: code.label,
        Count: code.count,
        Percentage: `${code.percentage.toFixed(1)}%`
      }));
      const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summaryWorksheet, "Code Summary");
    }
    
    // Step 5: Create the Coded Responses worksheet - medium sized data
    const responsesData = result.codedResponses.map(response => ({
      'Respondent ID': response.rowIndex !== undefined ? response.rowIndex + 1 : 'N/A',
      Response: response.responseText,
      Column: response.columnName || 'Unknown',
      Codes: response.codesAssigned.join('; '),
      NumericCodes: response.codesAssigned.map(code => {
        const codeEntry = result.codeframe.find(c => c.code === code);
        return codeEntry ? codeEntry.numeric || code : code;
      }).join('; ')
    }));
    
    const responsesWorksheet = XLSX.utils.json_to_sheet(responsesData);
    XLSX.utils.book_append_sheet(workbook, responsesWorksheet, "Coded Responses");
    
    // Step 6: Process original data with codes - completely new approach
    try {
      console.log("Creating original data worksheet with memory-efficient approach");
      
      // 6.1: Build normalized lookup map for response matching - critical for performance
      const responseCodeMap = new Map();
      
      // Only include necessary data in the map to reduce memory usage
      result.codedResponses.forEach(response => {
        if (!response || !response.responseText) return;
        
        // Get codes and labels as strings
        const codes = (response.codesAssigned || [])
          .map(code => {
            const codeEntry = result.codeframe.find(c => c.code === code);
            return codeEntry ? (codeEntry.numeric || code) : code;
          })
          .join('; ');
        
        const labels = (response.codesAssigned || [])
          .map(code => {
            const codeEntry = result.codeframe.find(c => c.code === code);
            return codeEntry ? codeEntry.label : code;
          })
          .join('; ');
        
        // Store normalized key for case-insensitive matching
        const normalizedKey = response.responseText.trim().toLowerCase();
        if (normalizedKey) {
          responseCodeMap.set(normalizedKey, { codes, labels });
        }
      });
      
      console.log(`Created response code map with ${responseCodeMap.size} entries`);
      
      // 6.2: Don't pre-allocate the entire array - process in chunks
      const MAX_ROWS = 50000; // Limit to prevent memory issues
      const CHUNK_SIZE = 1000; // Process chunks of rows at a time
      
      // Get headers first - add Respondent ID as first column
      const originalHeaders = Array.isArray(rawFileData[0]) ? rawFileData[0] : [];
      const headers = ["Respondent ID", ...originalHeaders, "Assigned Codes", "Code Labels"];
      const headerSheet = XLSX.utils.aoa_to_sheet([headers]);
      XLSX.utils.book_append_sheet(workbook, headerSheet, "Original Data with Codes");
      
      // Process data in chunks to avoid memory issues
      let processedRows = 0;
      let matchCount = 0;
      
      // Only process at most MAX_ROWS to avoid crashes
      const rowsToProcess = Math.min(rawFileData.length, MAX_ROWS);
      
      for (let chunkStart = 1; chunkStart < rowsToProcess; chunkStart += CHUNK_SIZE) {
        // Process each chunk
        const chunkEnd = Math.min(chunkStart + CHUNK_SIZE, rowsToProcess);
        const chunk = [];
        
        for (let i = chunkStart; i < chunkEnd; i++) {
          const row = rawFileData[i];
          if (!Array.isArray(row)) continue;
          
          // Create a new row with respondent ID and assignment info
          const respondentId = i; // Row index is the respondent ID (0-based, header is row 0)
          const newRow = [respondentId, ...row]; // Add respondent ID as first column
          let foundMatch = false;
          
          // Try to find a coded response match in this row
          for (let j = 0; j < row.length; j++) {
            if (row[j] === null || row[j] === undefined) continue;
            
            // Convert to string and normalize
            const cellText = String(row[j]).trim();
            if (!cellText) continue;
            
            // Check for match using normalized version
            const normalizedText = cellText.toLowerCase();
            const match = responseCodeMap.get(normalizedText);
            
            if (match) {
              newRow.push(match.codes || "");
              newRow.push(match.labels || "");
              foundMatch = true;
              matchCount++;
              break;
            }
          }
          
          if (!foundMatch) {
            newRow.push("");  // No codes
            newRow.push("");  // No labels
          }
          
          chunk.push(newRow);
          processedRows++;
        }
        
        // Add chunk to worksheet, with offset for header
        XLSX.utils.sheet_add_aoa(headerSheet, chunk, { origin: -1 }); // -1 means append
        
        // Free memory
        chunk.length = 0;
      }
      
      console.log(`Processed ${processedRows} rows, found matches for ${matchCount} rows`);
      
    } catch (sheetError) {
      console.error("Error processing original data sheet:", sheetError);
      
      // Create an error explanation sheet instead
      const errorData = [
        ["Error Processing Original Data"],
        ["There was a problem processing your original data file:"],
        [sheetError instanceof Error ? sheetError.message : String(sheetError)],
        [""],
        ["Your coded responses are still available in the other sheets."],
        ["Try one of these solutions:"],
        ["1. Use 'Coded responses only' option instead"],
        ["2. Try with a smaller dataset"],
        ["3. Contact support if the problem persists"]
      ];
      
      const errorWorksheet = XLSX.utils.aoa_to_sheet(errorData);
      XLSX.utils.book_append_sheet(workbook, errorWorksheet, "Processing Error");
    }
    
    // Step 7: Write the complete workbook to Excel
    console.log("Writing workbook to Excel buffer with compression");
    
    try {
      // Use compression and efficient write options
      const excelBuffer = XLSX.write(workbook, { 
        bookType: 'xlsx', 
        type: 'array',
        compression: true
      });
      
      return new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
    } catch (writeError) {
      console.error("Failed in final Excel generation step:", writeError);
      throw new Error("Failed to generate Excel file due to memory limitations. Try with a smaller dataset.");
    }
  } catch (error) {
    console.error("Error in Excel generation:", error);
    throw error instanceof Error ? error : new Error('Unknown error occurred during Excel generation');
  }
};

// Get partial processing results from storage
export const getPartialResults = (): {
  timestamp: string;
  fileId: string;
  successful: Array<{ questionType: string; columnsProcessed: string[] }>;
  failed: Array<{ questionType: string; error: string }>;
  columnsByType: Record<string, any[]>;
} | null => {
  try {
    const stored = localStorage.getItem('partial_processing_results');
    if (!stored) return null;
    
    const data = JSON.parse(stored);
    // Check if results are less than 24 hours old
    const timestamp = new Date(data.timestamp);
    const hoursSince = (Date.now() - timestamp.getTime()) / (1000 * 60 * 60);
    
    if (hoursSince > 24) {
      localStorage.removeItem('partial_processing_results');
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error reading partial results:', error);
    return null;
  }
};

// Clear partial results
export const clearPartialResults = () => {
  localStorage.removeItem('partial_processing_results');
};

// Retry failed question types
export const retryFailedQuestionTypes = async (
  failedTypes: Array<{ questionType: string; error: string }>,
  columnsByType: Record<string, any[]>,
  apiConfig: { apiKey: string; apiUrl: string }
): Promise<ApiResponse<ProcessedResult>> => {
  try {
    console.log('Retrying failed question types:', failedTypes.map(f => f.questionType));
    
    const results = [];
    const stillFailedTypes = [];
    
    // Retry each failed type with longer delays
    let typeIndex = 0;
    for (const failed of failedTypes) {
      const columns = columnsByType[failed.questionType];
      if (!columns) continue;
      
      try {
        // Add longer delay for retries
        if (typeIndex > 0) {
          console.log(`Waiting 5 seconds before retrying ${failed.questionType}...`);
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
        
        console.log(`Retrying question type: ${failed.questionType}`);
        const result = await processQuestionTypeWithRetry(failed.questionType, columns, apiConfig);
        results.push(result);
        console.log(`Successfully processed ${failed.questionType} on retry`);
        typeIndex++;
      } catch (error) {
        console.error(`Failed to process ${failed.questionType} on retry:`, error);
        stillFailedTypes.push({
          questionType: failed.questionType,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    // Clear partial results if all retries succeeded
    if (stillFailedTypes.length === 0) {
      clearPartialResults();
    }
    
    // Combine results
    const allCodedResponses: any[] = [];
    const multipleCodeframes: Record<string, any> = {};
    
    results.forEach(result => {
      if (!result) return;
      
      allCodedResponses.push(...result.codedResponses);
      
      multipleCodeframes[result.questionType] = {
        codeframe: result.codeframe,
        codeSummary: result.codeSummary,
        brandHierarchies: result.brandHierarchies,
        attributeThemes: result.attributeThemes
      };
    });
    
    const primaryResult = results[0];
    
    return {
      success: true,
      data: {
        codeframe: primaryResult?.codeframe || [],
        codedResponses: allCodedResponses,
        codeSummary: primaryResult?.codeSummary || [],
        multipleCodeframes,
        insights: null,
        status: stillFailedTypes.length > 0 ? 'partial' : 'complete',
        processingDetails: {
          totalQuestionTypes: failedTypes.length,
          successfulTypes: results.length,
          failedTypes: stillFailedTypes.length,
          failures: stillFailedTypes
        }
      }
    };
  } catch (error) {
    console.error('Retry processing failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};
