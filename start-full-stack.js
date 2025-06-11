#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Full-Stack Qualitative Coding Application...\n');

// Start backend server
console.log('📡 Starting backend server on port 3001...');
const backend = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, 'server'),
  stdio: 'inherit',
  shell: true
});

// Wait a moment for backend to start
setTimeout(() => {
  // Start frontend development server
  console.log('🎨 Starting frontend development server on port 8080...');
  const frontend = spawn('npm', ['run', 'dev'], {
    cwd: __dirname,
    stdio: 'inherit',
    shell: true
  });

  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down servers...');
    backend.kill('SIGINT');
    frontend.kill('SIGINT');
    process.exit(0);
  });

  frontend.on('close', (code) => {
    console.log(`Frontend server exited with code ${code}`);
    backend.kill('SIGINT');
    process.exit(code);
  });

  backend.on('close', (code) => {
    console.log(`Backend server exited with code ${code}`);
    frontend.kill('SIGINT');
    process.exit(code);
  });

}, 2000);

console.log('\n📋 Application URLs:');
console.log('   Frontend: http://localhost:8080');
console.log('   Backend API: http://localhost:3001');
console.log('   Login: insights / codify2025');
console.log('\n💡 Make sure to set your OpenAI API key in server/.env\n');
console.log('⏹️  Press Ctrl+C to stop both servers\n');