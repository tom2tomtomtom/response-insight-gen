const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all projects
router.get('/', async (req, res) => {
  try {
    const projectsDir = path.join(__dirname, '../projects');
    const projects = [];
    
    try {
      const entries = await fs.readdir(projectsDir);
      
      for (const entry of entries) {
        const projectPath = path.join(projectsDir, entry);
        const stat = await fs.stat(projectPath);
        
        if (stat.isDirectory()) {
          try {
            const metadataPath = path.join(projectPath, 'metadata.json');
            const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'));
            projects.push({
              id: entry,
              ...metadata,
              lastModified: stat.mtime
            });
          } catch (error) {
            console.warn(`Could not read metadata for project ${entry}:`, error.message);
          }
        }
      }
      
      // Sort by last modified date, newest first
      projects.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
      
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
      // Projects directory doesn't exist yet, return empty array
    }

    res.json({
      success: true,
      data: projects
    });

  } catch (error) {
    console.error('Error getting projects:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve projects'
    });
  }
});

// Create new project
router.post('/', async (req, res) => {
  try {
    const { clientName, projectType, waveNumber, notes } = req.body;
    
    if (!clientName || !projectType) {
      return res.status(400).json({
        success: false,
        error: 'Client name and project type are required'
      });
    }

    const projectId = uuidv4();
    const projectDir = path.join(__dirname, '../projects', projectId);
    
    // Create project directory structure
    await fs.mkdir(projectDir, { recursive: true });
    await fs.mkdir(path.join(projectDir, 'raw'), { recursive: true });
    await fs.mkdir(path.join(projectDir, 'codeframes'), { recursive: true });
    await fs.mkdir(path.join(projectDir, 'outputs'), { recursive: true });

    // Create metadata
    const metadata = {
      projectId,
      clientName,
      projectType,
      waveNumber: waveNumber || '',
      notes: notes || '',
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      status: 'draft'
    };

    await fs.writeFile(
      path.join(projectDir, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    );

    res.json({
      success: true,
      data: metadata
    });

  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create project'
    });
  }
});

// Get specific project
router.get('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const projectDir = path.join(__dirname, '../projects', projectId);
    
    try {
      const metadataPath = path.join(projectDir, 'metadata.json');
      const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'));
      
      res.json({
        success: true,
        data: metadata
      });
    } catch (error) {
      if (error.code === 'ENOENT') {
        return res.status(404).json({
          success: false,
          error: 'Project not found'
        });
      }
      throw error;
    }

  } catch (error) {
    console.error('Error getting project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve project'
    });
  }
});

// Update project metadata
router.put('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const updates = req.body;
    
    const projectDir = path.join(__dirname, '../projects', projectId);
    const metadataPath = path.join(projectDir, 'metadata.json');
    
    try {
      const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'));
      
      const updatedMetadata = {
        ...metadata,
        ...updates,
        lastModified: new Date().toISOString()
      };
      
      await fs.writeFile(metadataPath, JSON.stringify(updatedMetadata, null, 2));
      
      res.json({
        success: true,
        data: updatedMetadata
      });
    } catch (error) {
      if (error.code === 'ENOENT') {
        return res.status(404).json({
          success: false,
          error: 'Project not found'
        });
      }
      throw error;
    }

  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update project'
    });
  }
});

// Delete project
router.delete('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const projectDir = path.join(__dirname, '../projects', projectId);
    
    try {
      await fs.rm(projectDir, { recursive: true, force: true });
      
      res.json({
        success: true,
        message: 'Project deleted successfully'
      });
    } catch (error) {
      if (error.code === 'ENOENT') {
        return res.status(404).json({
          success: false,
          error: 'Project not found'
        });
      }
      throw error;
    }

  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete project'
    });
  }
});

module.exports = router;