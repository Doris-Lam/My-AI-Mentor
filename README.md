# 🧠 AI Coding Mentor

An AI-powered web platform that analyzes your code, suggests improvements, generates test cases, and explains errors - just like a human mentor would.

![AI Coding Mentor](https://img.shields.io/badge/AI-Powered-blue) ![FastAPI](https://img.shields.io/badge/FastAPI-0.109-green) ![React](https://img.shields.io/badge/React-18-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

## 🌟 Features

- **🔍 Code Analysis**: Automatic detection of syntax errors, logical issues, and runtime problems
- **💡 Smart Suggestions**: AI-powered recommendations for code efficiency, best practices, and security
- **🧪 Test Generation**: Automatic creation of test cases including edge cases
- **📚 Clear Explanations**: Human-like explanations of what your code does and how to improve it
- **📊 History Tracking**: Save and review past code analyses
- **🎨 Modern UI**: Beautiful, responsive interface with smooth animations

## 🏗️ Tech Stack

### Frontend
- **React 18** with **TypeScript** - Modern UI components
- **Vite** - Fast build tool and dev server
- **Axios** - HTTP client for API calls
- **CSS3** - Custom styling with animations

### Backend
- **FastAPI** - High-performance Python web framework
- **OpenAI GPT-4** - AI-powered code analysis
- **SQLAlchemy** - Database ORM
- **Pydantic** - Data validation
- **Uvicorn** - ASGI server

### Database
- **PostgreSQL 15** - Reliable data storage (optional)

## 📋 Prerequisites

Before you begin, ensure you have:

- **Python 3.11+**
- **Node.js 18+** and **npm**
- **Gemini API Key** ([Get API Key](https://makersuite.google.com/app/apikey))
- **Git** for cloning the repository
- **PostgreSQL 15+** (optional - only needed if you want to use the database features)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd ai-mentor
```

### 2. Set Up Environment Variables

```bash
# Copy the example env file
cp env.example .env

# Edit .env and add your Gemini API key
# GEMINI_API_KEY=your_actual_gemini_api_key_here
```

### 3. Start Backend

```bash
cd backend

# Create virtual environment (optional but recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the server
python main.py
```

Backend will run on http://localhost:8000

### 4. Start Frontend

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

Frontend will run on http://localhost:5173

## 📝 How to Use

1. **Open the App**: Navigate to http://localhost:5173

2. **Select Language**: Choose your programming language from the dropdown

3. **Paste Code**: Type or paste your code into the text area

4. **Click Analyze**: Hit the "Analyze Code" button

5. **Review Results**: The AI will provide:
   - ❌ **Errors**: Any issues found in your code
   - 💡 **Suggestions**: Improvements and best practices
   - 🧪 **Test Cases**: Generated test cases for validation
   - 📚 **Explanation**: Clear explanation of how your code works

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Your Gemini API key | *Required* |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/ai_mentor` |
| `POSTGRES_USER` | Database username | `postgres` |
| `POSTGRES_PASSWORD` | Database password | `postgres` |
| `POSTGRES_DB` | Database name | `ai_mentor` |
| `BACKEND_PORT` | Backend server port | `8000` |
| `VITE_API_URL` | Backend API URL for frontend | `http://localhost:8000` |

## 📚 API Endpoints

### Health Check
```
GET /
```

### Analyze Code
```
POST /api/analyze
Body: {
  "code": "your code here",
  "language": "python"
}
```

### Get History
```
GET /api/history?limit=10
```

### Get Submission
```
GET /api/submission/{id}
```

Interactive API documentation available at http://localhost:8000/docs

## 🗂️ Project Structure

```
ai-mentor/
├── backend/                # FastAPI backend
│   ├── main.py            # Main application entry
│   ├── config.py          # Configuration settings
│   ├── database.py        # Database models and connection
│   ├── schemas.py         # Pydantic schemas
│   ├── ai_service.py      # AI integration
│   ├── code_executor.py   # Code execution service
│   └── requirements.txt   # Python dependencies
├── frontend/              # React frontend
│   ├── src/
│   │   ├── services/      # API services
│   │   ├── types/         # TypeScript types
│   │   ├── App.tsx        # Main app component
│   │   └── main.tsx       # Entry point
│   ├── package.json       # Node dependencies
│   └── vite.config.ts     # Vite configuration
├── env.example           # Environment template
└── README.md             # This file
```

## 🐛 Troubleshooting

### Backend Issues

**Port already in use:**
```bash
# Find and kill process using port 8000
sudo lsof -i :8000  # Find process using port
kill -9 <PID>       # Kill the process
```

**Database connection error:**
- Ensure PostgreSQL is running
- Check DATABASE_URL in .env
- Wait a few seconds after starting the database

**Gemini API error:**
- Verify your API key in .env (GEMINI_API_KEY)
- Check API quota at https://makersuite.google.com/app/apikey
- Ensure you have credits available

### Frontend Issues

**API connection failed:**
- Ensure backend is running
- Check VITE_API_URL in .env
- Check browser console for CORS errors

## 🚀 Deployment

1. Set up a PostgreSQL database
2. Deploy backend to a Python hosting service (Heroku, Railway, etc.)
3. Build frontend: `cd frontend && npm run build`
4. Deploy frontend build to static hosting (Vercel, Netlify, etc.)

## 🤝 Contributing

Contributions are welcome! Here's how:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Google for Gemini AI API
- FastAPI framework
- React and Vite teams
- PostgreSQL community

## 📧 Support

For issues and questions:
- Open an issue on GitHub
- Check the [API documentation](http://localhost:8000/docs)
- Review troubleshooting section

---

**Built with ❤️ using React, TypeScript, FastAPI, and Google Gemini AI**

