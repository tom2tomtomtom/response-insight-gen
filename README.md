# Qualitative Coding Application

AI-powered qualitative coding web application for survey response analysis.

## ✨ Features

- **Large File Support**: Process Excel/CSV files up to 500MB with 10,000+ rows
- **AI-Powered Coding**: Automatic codeframe generation using OpenAI
- **Question Types**: Support for Unaided Awareness, Brand Descriptions, and Miscellaneous open-ends
- **30% Sampling**: Efficient AI processing using smart sampling
- **Excel Export**: Two-sheet format (Codeframe + Coded_Responses)
- **Clean UX**: Step-by-step workflow with intuitive interface
- **Secure Storage**: Backend file storage with project isolation

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Frontend dependencies
npm install

# Backend dependencies
cd server
npm install
cd ..
```

### 2. Configure OpenAI API Key

Edit `server/.env` and add your OpenAI API key:

```bash
OPENAI_API_KEY=your-openai-api-key-here
```

### 3. Start the Application

```bash
npm run start:fullstack
```

This starts:
- **Backend API**: http://localhost:3001
- **Frontend**: http://localhost:8080

### 4. Login

- **Username**: `insights`
- **Password**: `codify2025`

## 📋 Workflow

1. **Login** → Use demo credentials
2. **Dashboard** → View/manage projects
3. **New Project** → Client name, project type, wave number
4. **Upload Data** → Drag & drop Excel/CSV files (up to 500MB)
5. **Select Columns** → Choose text columns and respondent ID
6. **Group Questions** → Assign question types:
   - **Unaided Awareness**: Brand recall questions
   - **Brand Descriptions**: Brand attribute descriptions
   - **Miscellaneous**: Other open-ended questions
7. **Generate Codeframes** → AI creates optimized codes
8. **Export Results** → Download Excel with coded responses

## 🏗️ Architecture

### Frontend (React/TypeScript)
- Clean step-by-step UI
- API client for backend communication
- JWT authentication
- File upload with progress tracking

### Backend (Express.js)
- Large file upload handling
- OpenAI API integration
- Project storage with filesystem structure
- JWT authentication
- Excel export generation

### Data Storage
```
projects/
├── {projectId}/
│   ├── raw/
│   │   ├── original_upload.xlsx
│   │   └── file_metadata.json
│   ├── codeframes/
│   │   ├── {groupName}_generated.json
│   │   └── {groupName}_final.json
│   └── outputs/
│       └── {Client_ProjectType_Wave_YYYYMMDD}.xlsx
```

## 🔧 Configuration

### Environment Variables (server/.env)

```bash
PORT=3001
NODE_ENV=development
JWT_SECRET=your-jwt-secret
AUTH_USERNAME=insights
OPENAI_API_KEY=your-openai-api-key
MAX_FILE_SIZE=500000000
CORS_ORIGIN=http://localhost:8080
```

## 📊 File Limits

- **Maximum file size**: 500MB (configurable)
- **Supported formats**: Excel (.xlsx, .xls), CSV
- **Row capacity**: 10,000+ rows easily handled
- **Column detection**: Automatic text/numeric classification

## 🤖 AI Features

- **Type-specific prompts** for different question types
- **30% random sampling** for efficient processing
- **Smart codeframe generation** with examples
- **Error handling** for API rate limits

## 🛠️ Development

### Frontend Only
```bash
npm run dev
```

### Backend Only
```bash
npm run server
```

### Full Stack
```bash
npm run start:fullstack
```

## 📝 Sample Data

Use the included `sample_data.csv` for testing with realistic survey data.

## 🚨 Troubleshooting

### "File too large" errors
- Ensure you're using the full-stack mode (`npm run start:fullstack`)
- Check that the backend is running on port 3001
- Verify `MAX_FILE_SIZE` in server/.env

### API errors
- Verify `OPENAI_API_KEY` is set in server/.env
- Check API key has sufficient credits
- Ensure internet connection for API calls

### Upload fails
- Check file format (Excel/CSV only)
- Verify file size under 500MB
- Ensure backend server is running

## 🔒 Security

- JWT authentication for API access
- Rate limiting on API endpoints
- Secure file storage with project isolation
- CORS protection
- Input validation and sanitization

## 📈 Production Deployment

For production deployment:

1. Set `NODE_ENV=production` in server/.env
2. Use a strong `JWT_SECRET`
3. Configure proper CORS origins
4. Set up SSL/TLS certificates
5. Configure reverse proxy (nginx)
6. Set up monitoring and logging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.