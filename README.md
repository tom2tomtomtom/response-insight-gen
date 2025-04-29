
# Verbatim Coder

## Overview
Verbatim Coder is an AI-powered tool for analyzing open-ended survey responses. It automatically generates a structured codeframe and assigns relevant codes to each response.

## Features
- Upload Excel files containing survey responses
- AI-powered theme detection and response classification
- Generates a comprehensive codeframe with codes, labels, definitions, and examples
- Maps each response to relevant codes
- Downloads results as an Excel file with two sheets (Codeframe and Coded Responses)

## Tech Stack
- React
- TypeScript
- Tailwind CSS
- shadcn/ui components
- OpenAI API (backend integration)
- Supabase (for storage and database)

## Project Status
This is an MVP (Minimum Viable Product) demonstration version. In a production version, the application would integrate with actual backend services for processing files through OpenAI's API and storing results in Supabase.

## Development
1. Clone the repository
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`
4. Open your browser and navigate to the provided local URL

## Backend Integration
The current frontend implementation uses mock data and simulated processing. In a production environment, you would need to:

1. Set up a FastAPI backend service
2. Configure OpenAI API integration
3. Establish Supabase for file storage and database operations
4. Implement file processing logic with proper error handling

## Environment Variables
For a complete implementation, you would need to configure:
- `OPENAI_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_KEY`
- `SUPABASE_BUCKET_NAME`
