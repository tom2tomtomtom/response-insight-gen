const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Single shared credential login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required'
      });
    }

    // Check credentials against environment variables
    const validUsername = process.env.AUTH_USERNAME || 'insights';
    const validPasswordHash = process.env.AUTH_PASSWORD_HASH;
    
    if (username !== validUsername) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // For development, allow simple password check if no hash is set
    let passwordValid = false;
    if (validPasswordHash) {
      passwordValid = await bcrypt.compare(password, validPasswordHash);
    } else {
      // Development fallback
      passwordValid = password === 'codify2025';
    }

    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { username: validUsername, timestamp: Date.now() },
      process.env.JWT_SECRET || 'default-secret-change-in-production',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      data: {
        token,
        username: validUsername,
        expiresIn: '24h'
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
});

// Token validation endpoint
router.post('/validate', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'No token provided'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'default-secret-change-in-production', (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: 'Invalid token'
      });
    }

    res.json({
      success: true,
      data: {
        username: user.username,
        valid: true
      }
    });
  });
});

module.exports = router;