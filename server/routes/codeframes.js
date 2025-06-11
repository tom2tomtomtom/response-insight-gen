const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const OpenAI = require('openai');
const XLSX = require('xlsx');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Question type specific prompts
const QUESTION_TYPE_PROMPTS = {
  'unaided-awareness': {
    systemPrompt: `You are a market research coding specialist. Respondents have listed brands they recall when asked for unaided awareness. Generate a codeframe where each code ID corresponds to a unique brand mentioned.

For each code, provide:
• A unique code ID (e.g., C001, C002, …)
• The brand name as the label
• A clear definition
• Sample mentions from the responses

Return valid JSON in this format:
{
  "codeframe": [
    {
      "code": "C001",
      "label": "BrandName",
      "definition": "Mentions of BrandName in any form",
      "examples": ["exact mentions from responses"]
    }
  ]
}`,
    userPrompt: (responses, sampleSize) => 
      `Here are ${sampleSize} sample responses from unaided brand awareness questions (each line lists one or more brands mentioned by respondents):

${responses.join('\n')}

Generate a codeframe for these brand mentions.`
  },
  
  'brand-descriptions': {
    systemPrompt: `You are a market research coding specialist. Respondents have described a brand's attributes. Generate a codeframe where each code corresponds to a unique descriptive theme (e.g., "Customer Service," "Value," "Innovation").

For each code, provide:
• A unique code ID (e.g., C001, C002, …)
• A concise label (under 3 words, title case)
• A clear definition of what this theme encompasses
• Sample responses illustrating this theme

Return valid JSON in this format:
{
  "codeframe": [
    {
      "code": "C001",
      "label": "Customer Service",
      "definition": "Comments about staff helpfulness, service quality, and customer support",
      "examples": ["exact quotes from responses"]
    }
  ]
}`,
    userPrompt: (responses, sampleSize) => 
      `Here are ${sampleSize} sample responses where respondents described brand attributes:

${responses.join('\n')}

Generate a comprehensive codeframe for these brand descriptions.`
  },
  
  'miscellaneous': {
    systemPrompt: `You are a market research coding specialist. Generate a comprehensive codeframe for miscellaneous open-ended responses across varied topics.

For each code, provide:
• A unique code ID (e.g., C001, C002, …)
• A concise label (under 3 words, title case)
• A clear definition of what this theme encompasses
• Sample responses illustrating this theme

Return valid JSON in this format:
{
  "codeframe": [
    {
      "code": "C001",
      "label": "Theme Label",
      "definition": "Clear description of what this code captures",
      "examples": ["exact quotes from responses"]
    }
  ]
}`,
    userPrompt: (responses, sampleSize) => 
      `Here are ${sampleSize} sample responses from various open-ended questions:

${responses.join('\n')}

Generate a comprehensive codeframe that captures the variety of topics in these responses.`
  }
};

// Generate codeframe for a specific group
router.post('/:projectId/generate', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { groupId, groupName, questionType, columns, samplePercentage = 30 } = req.body;

    if (!groupId || !questionType || !columns || !Array.isArray(columns)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: groupId, questionType, columns'
      });
    }

    if (!QUESTION_TYPE_PROMPTS[questionType]) {
      return res.status(400).json({
        success: false,
        error: 'Invalid question type'
      });
    }

    // Get file data
    const metadataPath = path.join(__dirname, '../projects', projectId, 'raw', 'file_metadata.json');
    const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'));
    
    // Read the actual data file
    const filePath = metadata.filePath;
    let data;
    
    if (path.extname(metadata.originalName).toLowerCase() === '.csv') {
      const fileContent = await fs.readFile(filePath, 'utf8');
      data = fileContent.split('\n').map(row => 
        row.split(',').map(cell => cell.trim().replace(/^"|"$/g, ''))
      );
    } else {
      const workbook = XLSX.readFile(filePath);
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      data = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
    }

    // Extract responses for this group's columns
    const responses = [];
    
    // Skip header row
    for (let rowIndex = 1; rowIndex < data.length; rowIndex++) {
      const row = data[rowIndex];
      
      // Concatenate responses from all columns in this group
      const groupResponses = columns
        .map(colIndex => row[colIndex])
        .filter(val => val && String(val).trim())
        .map(val => String(val).trim());
      
      if (groupResponses.length > 0) {
        responses.push(groupResponses.join(' ∥ '));
      }
    }

    if (responses.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No responses found for the specified columns'
      });
    }

    // Sample responses (30% by default, minimum 20)
    const sampleSize = Math.max(20, Math.round(responses.length * (samplePercentage / 100)));
    const shuffled = [...responses].sort(() => 0.5 - Math.random());
    const sampledResponses = shuffled.slice(0, sampleSize);

    // Generate codeframe using OpenAI
    const promptConfig = QUESTION_TYPE_PROMPTS[questionType];
    
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: promptConfig.systemPrompt
          },
          {
            role: 'user',
            content: promptConfig.userPrompt(sampledResponses, sampledResponses.length)
          }
        ],
        temperature: 0.3,
        max_tokens: 3000,
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(completion.choices[0].message.content);
      
      if (!result.codeframe || !Array.isArray(result.codeframe)) {
        throw new Error('Invalid codeframe format returned from AI');
      }

      // Save codeframe
      const codeframeData = {
        groupId,
        groupName,
        questionType,
        columns,
        codeframe: result.codeframe,
        sampleSize: sampledResponses.length,
        totalResponses: responses.length,
        generatedAt: new Date().toISOString(),
        status: 'generated'
      };

      const codeframesDir = path.join(__dirname, '../projects', projectId, 'codeframes');
      await fs.mkdir(codeframesDir, { recursive: true });
      
      const codeframePath = path.join(codeframesDir, `${groupId}_generated.json`);
      await fs.writeFile(codeframePath, JSON.stringify(codeframeData, null, 2));

      res.json({
        success: true,
        data: codeframeData
      });

    } catch (aiError) {
      console.error('OpenAI API error:', aiError);
      res.status(500).json({
        success: false,
        error: 'AI codeframe generation failed. Please check your API key and try again.'
      });
    }

  } catch (error) {
    console.error('Codeframe generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate codeframe'
    });
  }
});

// Save finalized codeframe
router.post('/:projectId/finalize', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { groupId, codeframe } = req.body;

    if (!groupId || !codeframe) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: groupId, codeframe'
      });
    }

    // Load existing generated codeframe
    const generatedPath = path.join(__dirname, '../projects', projectId, 'codeframes', `${groupId}_generated.json`);
    const generatedData = JSON.parse(await fs.readFile(generatedPath, 'utf8'));

    // Create finalized version
    const finalizedData = {
      ...generatedData,
      codeframe: codeframe,
      finalizedAt: new Date().toISOString(),
      status: 'finalized'
    };

    const finalizedPath = path.join(__dirname, '../projects', projectId, 'codeframes', `${groupId}_final.json`);
    await fs.writeFile(finalizedPath, JSON.stringify(finalizedData, null, 2));

    res.json({
      success: true,
      data: finalizedData
    });

  } catch (error) {
    console.error('Finalize codeframe error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to finalize codeframe'
    });
  }
});

// Get all codeframes for a project
router.get('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const codeframesDir = path.join(__dirname, '../projects', projectId, 'codeframes');
    
    const codeframes = [];
    
    try {
      const files = await fs.readdir(codeframesDir);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(codeframesDir, file);
          const data = JSON.parse(await fs.readFile(filePath, 'utf8'));
          codeframes.push({
            filename: file,
            ...data
          });
        }
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
      // Codeframes directory doesn't exist yet
    }

    res.json({
      success: true,
      data: codeframes
    });

  } catch (error) {
    console.error('Get codeframes error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve codeframes'
    });
  }
});

// Export project results as Excel
router.get('/:projectId/export', async (req, res) => {
  try {
    const { projectId } = req.params;
    
    // Get project metadata
    const projectMetadataPath = path.join(__dirname, '../projects', projectId, 'metadata.json');
    const projectMetadata = JSON.parse(await fs.readFile(projectMetadataPath, 'utf8'));
    
    // Get all finalized codeframes
    const codeframesDir = path.join(__dirname, '../projects', projectId, 'codeframes');
    const finalizedCodeframes = [];
    
    try {
      const files = await fs.readdir(codeframesDir);
      
      for (const file of files) {
        if (file.endsWith('_final.json')) {
          const filePath = path.join(codeframesDir, file);
          const data = JSON.parse(await fs.readFile(filePath, 'utf8'));
          finalizedCodeframes.push(data);
        }
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }

    if (finalizedCodeframes.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No finalized codeframes found for export'
      });
    }

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Sheet 1: Codeframe
    const codeframeRows = [
      ['Code_ID', 'Label', 'Definition', 'Examples', 'Question_Group', 'Question_Type', 'Date_Modified']
    ];

    finalizedCodeframes.forEach(group => {
      group.codeframe.forEach(code => {
        codeframeRows.push([
          code.code,
          code.label,
          code.definition,
          code.examples.join('; '),
          group.groupName,
          group.questionType,
          new Date(group.finalizedAt).toISOString().split('T')[0]
        ]);
      });
    });

    const codeframeSheet = XLSX.utils.aoa_to_sheet(codeframeRows);
    XLSX.utils.book_append_sheet(workbook, codeframeSheet, 'Codeframe');

    // Sheet 2: Coded_Responses (placeholder for now - would need semantic matching implementation)
    const responsesRows = [
      ['Respondent_ID', ...finalizedCodeframes.flatMap(group => 
        group.codeframe.map(code => code.code)
      )]
    ];

    // Add sample rows (in real implementation, this would be actual coded data)
    for (let i = 1; i <= 10; i++) {
      const row = [`R${i.toString().padStart(3, '0')}`];
      // Add binary coding (0 or 1) for each code
      finalizedCodeframes.forEach(group => {
        group.codeframe.forEach(() => {
          row.push(Math.random() > 0.7 ? '1' : '0'); // Random for demo
        });
      });
      responsesRows.push(row);
    }

    const responsesSheet = XLSX.utils.aoa_to_sheet(responsesRows);
    XLSX.utils.book_append_sheet(workbook, responsesSheet, 'Coded_Responses');

    // Generate filename
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const filename = `${projectMetadata.clientName}_${projectMetadata.projectType}_${projectMetadata.waveNumber || 'W1'}_${date}.xlsx`;

    // Save to outputs directory
    const outputsDir = path.join(__dirname, '../projects', projectId, 'outputs');
    await fs.mkdir(outputsDir, { recursive: true });
    const outputPath = path.join(outputsDir, filename);
    
    XLSX.writeFile(workbook, outputPath);

    // Send file as response
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    const fileBuffer = await fs.readFile(outputPath);
    res.send(fileBuffer);

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export results'
    });
  }
});

module.exports = router;