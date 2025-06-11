const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const XLSX = require('xlsx');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const projectId = req.params.projectId;
    const uploadDir = path.join(__dirname, '../projects', projectId, 'raw');
    
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    // Keep original filename with timestamp
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}_${timestamp}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 100 * 1024 * 1024 // 100MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.xlsx', '.xls', '.csv'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only Excel (.xlsx, .xls) and CSV files are allowed.'));
    }
  }
});

// All routes require authentication
router.use(authenticateToken);

// Analyze column data from Excel/CSV file
const analyzeColumns = (data) => {
  if (data.length < 2) return [];

  const headers = data[0];
  const rows = data.slice(1);
  
  return headers.map((header, index) => {
    const columnData = rows.map(row => row[index]).filter(val => val != null && val !== '');
    const nonEmptyCount = columnData.length;
    const totalCount = rows.length;
    
    // Determine column type
    let type = 'empty';
    if (nonEmptyCount > 0) {
      const numericCount = columnData.filter(val => !isNaN(Number(val))).length;
      const textCount = columnData.filter(val => isNaN(Number(val)) && String(val).trim().length > 0).length;
      
      if (textCount > numericCount) {
        type = 'text';
      } else if (numericCount > textCount) {
        type = 'numeric';
      } else if (numericCount > 0 && textCount > 0) {
        type = 'mixed';
      }
    }

    // Get examples
    const examples = columnData.slice(0, 3).map(val => String(val));

    return {
      index,
      name: String(header || `Column ${index + 1}`),
      type,
      examples,
      nonEmptyCount,
      totalCount,
      stats: {
        textPercentage: nonEmptyCount > 0 ? (columnData.filter(val => isNaN(Number(val))).length / nonEmptyCount) * 100 : 0,
        numericPercentage: nonEmptyCount > 0 ? (columnData.filter(val => !isNaN(Number(val))).length / nonEmptyCount) * 100 : 0,
        textLength: columnData.reduce((sum, val) => sum + String(val).length, 0) / Math.max(nonEmptyCount, 1),
        nonEmptyCount,
        totalCount
      }
    };
  });
};

// Upload and process file
router.post('/:projectId', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const { projectId } = req.params;
    const filePath = req.file.path;
    const originalName = req.file.originalname;
    
    // Process the file
    let data;
    try {
      if (path.extname(originalName).toLowerCase() === '.csv') {
        // Handle CSV files
        const fileContent = await fs.readFile(filePath, 'utf8');
        data = fileContent.split('\n').map(row => 
          row.split(',').map(cell => cell.trim().replace(/^"|"$/g, ''))
        );
      } else {
        // Handle Excel files
        const workbook = XLSX.readFile(filePath);
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        data = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
      }
    } catch (parseError) {
      return res.status(400).json({
        success: false,
        error: 'Failed to parse file. Please check the file format.'
      });
    }

    if (data.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'File must contain at least a header row and one data row'
      });
    }

    // Analyze columns
    const columns = analyzeColumns(data);
    
    // Save file metadata
    const fileMetadata = {
      originalName,
      filename: req.file.filename,
      filePath: filePath,
      uploadedAt: new Date().toISOString(),
      size: req.file.size,
      totalRows: data.length - 1, // Exclude header
      totalColumns: columns.length,
      columns: columns
    };

    const metadataPath = path.join(path.dirname(filePath), 'file_metadata.json');
    await fs.writeFile(metadataPath, JSON.stringify(fileMetadata, null, 2));

    // Update project metadata
    const projectDir = path.join(__dirname, '../projects', projectId);
    const projectMetadataPath = path.join(projectDir, 'metadata.json');
    
    try {
      const projectMetadata = JSON.parse(await fs.readFile(projectMetadataPath, 'utf8'));
      projectMetadata.uploadedFile = fileMetadata;
      projectMetadata.lastModified = new Date().toISOString();
      await fs.writeFile(projectMetadataPath, JSON.stringify(projectMetadata, null, 2));
    } catch (error) {
      console.warn('Could not update project metadata:', error);
    }

    res.json({
      success: true,
      data: {
        filename: originalName,
        uploadedAt: fileMetadata.uploadedAt,
        columns: columns,
        totalRows: fileMetadata.totalRows,
        size: fileMetadata.size
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    
    // Clean up uploaded file on error
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.error('Failed to clean up file:', cleanupError);
      }
    }
    
    res.status(500).json({
      success: false,
      error: 'File upload failed'
    });
  }
});

// Get file metadata
router.get('/:projectId/file', async (req, res) => {
  try {
    const { projectId } = req.params;
    const metadataPath = path.join(__dirname, '../projects', projectId, 'raw', 'file_metadata.json');
    
    try {
      const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'));
      res.json({
        success: true,
        data: metadata
      });
    } catch (error) {
      if (error.code === 'ENOENT') {
        return res.status(404).json({
          success: false,
          error: 'No file uploaded for this project'
        });
      }
      throw error;
    }

  } catch (error) {
    console.error('Error getting file metadata:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve file information'
    });
  }
});

// Get sample data for a specific column range
router.get('/:projectId/sample', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { columns, sampleSize = 100 } = req.query;
    
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

    // Extract sample responses for specified columns
    const columnIndices = columns ? columns.split(',').map(Number) : [];
    const responses = [];
    
    // Skip header row
    for (let rowIndex = 1; rowIndex < data.length && responses.length < parseInt(sampleSize); rowIndex++) {
      const row = data[rowIndex];
      
      if (columnIndices.length > 0) {
        const rowResponses = columnIndices
          .map(colIndex => row[colIndex])
          .filter(val => val && String(val).trim())
          .map(val => String(val).trim());
        
        if (rowResponses.length > 0) {
          responses.push(rowResponses.join(' ∥ '));
        }
      }
    }

    res.json({
      success: true,
      data: {
        responses: responses,
        totalSampled: responses.length,
        totalRows: data.length - 1
      }
    });

  } catch (error) {
    console.error('Error getting sample data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve sample data'
    });
  }
});

module.exports = router;