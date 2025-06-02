// Model configurations for different AI providers
export const AI_MODELS = {
  openai: {
    'gpt-4o': {
      name: 'GPT-4 Optimized',
      contextLimit: 128000,
      costPerMillion: { input: 5, output: 15 },
      endpoint: 'https://api.openai.com/v1/chat/completions'
    },
    'gpt-4-turbo': {
      name: 'GPT-4 Turbo',
      contextLimit: 128000,
      costPerMillion: { input: 10, output: 30 },
      endpoint: 'https://api.openai.com/v1/chat/completions'
    },
    'gpt-3.5-turbo': {
      name: 'GPT-3.5 Turbo',
      contextLimit: 16385,
      costPerMillion: { input: 0.5, output: 1.5 },
      endpoint: 'https://api.openai.com/v1/chat/completions'
    }
  },
  anthropic: {
    'claude-3-opus-20240229': {
      name: 'Claude 3 Opus',
      contextLimit: 200000,
      costPerMillion: { input: 15, output: 75 },
      endpoint: 'https://api.anthropic.com/v1/messages'
    },
    'claude-3-5-sonnet-20241022': {
      name: 'Claude 3.5 Sonnet',
      contextLimit: 200000,
      costPerMillion: { input: 3, output: 15 },
      endpoint: 'https://api.anthropic.com/v1/messages'
    },
    'claude-3-haiku-20240307': {
      name: 'Claude 3 Haiku',
      contextLimit: 200000,
      costPerMillion: { input: 0.25, output: 1.25 },
      endpoint: 'https://api.anthropic.com/v1/messages'
    }
  }
};

// Helper to check if request fits within model limits
export const canModelHandleTokens = (model: string, tokenCount: number): boolean => {
  const modelConfig = Object.values(AI_MODELS).flatMap(provider => Object.entries(provider))
    .find(([key]) => key === model)?.[1];
  
  return modelConfig ? tokenCount <= modelConfig.contextLimit : false;
};

// Get recommended model based on token count and budget
export const recommendModel = (tokenCount: number, preferLowCost: boolean = false) => {
  const suitable = [];
  
  for (const [provider, models] of Object.entries(AI_MODELS)) {
    for (const [modelId, config] of Object.entries(models)) {
      if (tokenCount <= config.contextLimit) {
        suitable.push({
          provider,
          modelId,
          ...config,
          totalCost: (tokenCount / 1000000) * (config.costPerMillion.input + config.costPerMillion.output)
        });
      }
    }
  }
  
  // Sort by cost if preferred, otherwise by context limit
  suitable.sort((a, b) => 
    preferLowCost 
      ? a.totalCost - b.totalCost 
      : b.contextLimit - a.contextLimit
  );
  
  return suitable[0];
};