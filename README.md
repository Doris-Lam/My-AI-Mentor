# AI Coding Mentor: Your Intelligent Pair Programming Companion

---

## Demo!

https://github.com/user-attachments/assets/cc4ec2ec-ea7a-4aa3-a782-af335d0f4cfc

---

## The Story Behind AI Coding Mentor

### Inspiration: From Grammarly to Code

Have you ever used Grammarly and thought, *"What if I had something like this for my code?"* That exact question sparked the creation of AI Coding Mentor.

**Grammarly** revolutionized writing by:
- Providing real-time feedback as you type
- Explaining *why* something is wrong, not just *what* is wrong
- Teaching you through context-aware suggestions
- Making learning seamless and integrated into your workflow

**AI Coding Mentor** brings this same philosophy to programming. It's not just another code editor or linter—it's your **intelligent coding companion** that:

- **Teaches you as you code** - Every suggestion comes with explanations
- **Highlights issues in real-time** - See problems before they become bugs
- **Explains the 'why'** - Understand concepts, not just syntax
- **Grows with you** - Learn best practices, patterns, and optimization techniques
- **Works alongside you** - AI that understands context and provides relevant help

### The Vision: Learning Through Doing

Traditional coding education often separates learning from practice. You read tutorials, watch videos, then try to apply concepts in isolation. AI Coding Mentor flips this model—**you learn by coding, and the AI guides you every step of the way**.

Whether you're:
- A beginner writing your first `print("Hello, World!")`
- An intermediate developer learning design patterns
- An experienced programmer exploring a new language
- A student working on assignments

AI Coding Mentor adapts to your level and provides contextual, educational feedback that makes you a better programmer.

---

## What Makes This Special

### It's More Than an IDE—It's a Learning Platform

AI Coding Mentor combines the power of a **full-featured IDE** with **intelligent AI assistance** and **educational tools**:

#### **Real-Time Code Analysis**
As you type, the AI analyzes your code in real-time (with intelligent debouncing to avoid overwhelming you). It doesn't just catch syntax errors—it understands:
- **Logic errors** - "This loop will never terminate because..."
- **Performance issues** - "This could be optimized using..."
- **Security vulnerabilities** - "This input should be sanitized to prevent..."
- **Best practices** - "Consider using a list comprehension here for better readability"
- **Code smells** - "This function is doing too much; consider breaking it into..."

#### **Visual Code Highlighting**
Every issue is **visually highlighted** in your editor with colour-coded decorations:
- 🔴 **Red** - Critical errors that will break your code
- 🟡 **Yellow** - Warnings and potential issues
- 🔵 **Blue** - Suggestions for improvement
- 🟢 **Green** - Best practices and optimizations

Click on any highlighted section to see detailed explanations and suggested fixes.

#### **Comprehensive Scoring System**
Get instant feedback on your code quality across multiple dimensions:

- **Correctness Score** (0-100) - Does your code work correctly?
- **Clarity Score** (0-100) - Is your code easy to read and understand?
- **Best Practices Score** (0-100) - Are you following language conventions?
- **Performance Score** (0-100) - Is your code efficient?

Track your improvement over time and see how your coding skills evolve.

#### **AI-Powered Code Generation**
Need help starting? Ask the AI in natural language:
- *"Create a function that sorts a list of dictionaries by a specific key"*
- *"Write a REST API endpoint that handles user authentication"*
- *"Generate a class that implements a binary search tree"*

The AI generates code **with explanations**, so you understand what it's doing and why.

#### **Interactive Code Visualization**
Don't just read code—**see it in action**. The visualization feature breaks down your code execution step-by-step:

1. **Execution Flow** - See how your code flows from line to line
2. **Variable Tracking** - Watch how variables change at each step
3. **Function Calls** - Visualize the call stack and function interactions
4. **Data Flow** - Understand how data moves through your program

Perfect for understanding complex algorithms or debugging tricky logic.

#### **Personalized Lessons**
Every piece of code can become a learning opportunity. The **Lesson Generator** creates custom educational content based on your code:

- **Concept Explanations** - "This code demonstrates the Observer pattern..."
- **Algorithm Breakdown** - "This sorting algorithm works by..."
- **Language Features** - "Here's how Python's list comprehensions work..."
- **Best Practices** - "In production code, you'd want to..."

#### **Visual Code Diagrams**
Generate beautiful **Mermaid diagrams** that visualize:
- **Flowcharts** - Control flow and decision trees
- **Class Diagrams** - Object relationships and inheritance
- **Sequence Diagrams** - Function call sequences
- **State Diagrams** - State machines and transitions

Export diagrams as SVG for documentation or presentations.

#### **Live Code Execution**
Test your code instantly without leaving the editor:
- **Run code** in a sandboxed environment
- **See output** in real-time
- **Catch runtime errors** immediately
- **Test edge cases** on the fly

Supports multiple languages: Python, Java, C++, C, C#, Go, Rust, Ruby, and PHP.

**Built-in Libraries & Imports:**
All standard library modules and built-in functions are available when executing code:
- **Python**: `import math`, `import json`, `import datetime`, etc. - All Python standard library modules work
- **Java**: `java.util.*`, `java.lang.*`, etc. - Standard Java libraries are available
- **C++**: `#include <iostream>`, `#include <vector>`, etc. - Standard C++ libraries work
- **Other languages**: All built-in libraries and standard modules for each language are fully supported

You can use any standard library functions without installation - they're part of the language runtime!

#### **Smart Code Formatting**
One-click code beautification that:
- Formats according to language-specific style guides (PEP 8 for Python, etc.)
- Fixes indentation and spacing
- Organizes imports
- Applies consistent naming conventions

#### **Multi-Document Workspace**
Work on multiple files simultaneously with a **tabbed interface**:
- Drag and drop tabs to reorder
- Each document maintains its own history, feedback, and AI context
- Switch between projects seamlessly
- Perfect for working on related files or comparing implementations

#### **Progress Tracking & Achievements**
Gamify your learning with:
- **Achievement System** - Unlock badges for milestones
- **History Tracking** - Review your past code and see how you've improved
- **Score Trends** - Visualize your coding quality over time
- **Learning Streaks** - Build consistent coding habits

#### **Code Metrics Dashboard**
Get comprehensive insights into your code with real-time metrics visualization:
- **Code Statistics** - Total lines, code lines, comments, blank lines
- **Structure Analysis** - Count of functions, classes, and imports
- **Complexity Metrics** - Cyclomatic complexity and nesting depth analysis
- **Code Distribution** - Visual breakdown of code vs comments vs blank lines
- **Line Length Analysis** - Average and maximum line length tracking
- **Interactive Charts** - Beautiful visualizations using Recharts library
- **Real-time Updates** - Metrics update automatically as you type

Access the Metrics Dashboard via the "Metrics" button in the header. Perfect for understanding code structure, tracking complexity, and maintaining code quality standards.

#### **Code Sharing**
Share your code with others:
- Generate shareable links (expires in 30 days)
- Perfect for code reviews, collaboration, or getting help
- Recipients can view, analyze, and learn from your code

#### **Beautiful, Modern UI**
- **Dark/Light Mode** - Choose your preferred theme
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Smooth Animations** - Polished, professional interface
- **Keyboard Shortcuts** - Power-user features for efficiency

---

## Technical Architecture

### Frontend: React + TypeScript + Monaco Editor

The frontend is built with modern web technologies for a responsive, performant experience:

#### **React 18 with TypeScript**
- **Type Safety** - Catch errors at compile time
- **Component Architecture** - Modular, reusable components
- **Hooks** - Modern React patterns for state management
- **Performance** - Optimized rendering with React's latest features

#### **Recharts** (Charting Library)
- **Interactive Charts** - Beautiful, responsive data visualizations
- **Multiple Chart Types** - Bar charts, pie charts, line charts
- **Real-time Updates** - Charts update automatically with data changes
- **Theme Support** - Works seamlessly with dark/light mode

#### **Monaco Editor** (VS Code's Editor)
- **Full IDE Features** - Syntax highlighting, autocomplete, IntelliSense
- **Multi-language Support** - 50+ programming languages
- **Custom Decorations** - Visual feedback for AI suggestions
- **Keyboard Shortcuts** - Familiar VS Code keybindings
- **Code Folding** - Organize large files
- **Find & Replace** - Powerful search capabilities

#### **State Management**
- **React Hooks** - `useState`, `useEffect`, `useRef` for local state
- **Document-based State** - Each tab maintains independent state
- **History Management** - Undo/redo functionality
- **Local Storage** - Persist preferences and recent documents

#### **API Integration**
- **Axios** - HTTP client for backend communication
- **Error Handling** - Graceful error messages and retry logic
- **Loading States** - Visual feedback during API calls
- **Debouncing** - Intelligent rate limiting for real-time analysis

### Backend: FastAPI + Google Gemini AI

The backend is a high-performance API that orchestrates AI analysis and code execution:

#### **FastAPI Framework**
- **Async/Await** - Non-blocking I/O for high concurrency
- **Automatic Documentation** - OpenAPI/Swagger at `/docs`
- **Type Validation** - Pydantic schemas ensure data integrity
- **CORS Support** - Secure cross-origin requests
- **Error Handling** - Comprehensive exception handling with proper HTTP status codes

#### **Google Gemini AI Integration**
- **Advanced Code Analysis** - Deep understanding of code semantics
- **Context-Aware Suggestions** - AI considers your entire codebase
- **Multi-language Support** - Works with Python, Java, C++, C, C#, Go, Rust, Ruby, and PHP
- **Educational Explanations** - AI explains concepts, not just fixes
- **Code Generation** - Natural language to code conversion

#### **Code Execution Service**
- **Sandboxed Environment** - Safe code execution
- **Multi-language Runtime** - Execute code in various languages
- **Timeout Protection** - Prevents infinite loops
- **Resource Limits** - Memory and CPU constraints
- **Error Capture** - Detailed error messages and stack traces

#### **Database (Optional)**
- **PostgreSQL** - Reliable data storage
- **SQLAlchemy ORM** - Pythonic database access
- **History Tracking** - Save and retrieve past analyses
- **Non-blocking** - App works even if the database is unavailable

### Key Services

#### **AI Service** (`backend/services/ai_service.py`)
Handles all AI interactions:
- `analyze_code()` - Comprehensive code analysis
- `generate_code()` - Code generation from prompts
- `visualize_code()` - Step-by-step execution visualization
- `generate_diagram()` - Mermaid diagram generation
- `generate_lesson()` - Educational content creation
- `format_code()` - Code beautification

#### **Code Executor** (`backend/services/code_executor.py`)
Safe code execution:
- Language detection
- Sandboxed execution
- Output capture
- Error handling
- Timeout management
- Full standard library support for all languages

#### **Metrics Service** (`backend/services/metrics_service.py`)
Code metrics calculation:
- Line counting (code, comments, blank)
- Function/class/import detection
- Complexity analysis (cyclomatic complexity)
- Nesting depth calculation
- Code distribution analysis
- Language-specific pattern recognition

#### **API Service** (`frontend/src/services/api.ts`)
Frontend-backend communication:
- RESTful API calls
- Type-safe request/response handling
- Error transformation
- Loading state management

---

## Getting Started

### Prerequisites

Before you begin, ensure you have:

- **Python 3.11+** - Backend runtime
- **Node.js 18+** and **npm** - Frontend build tools
- **Google Gemini API Key** - [Get your free API key](https://makersuite.google.com/app/apikey)
- **Git** - Version control
- **PostgreSQL 15+** (Optional) - For history tracking features

#### Optional: Language Runtimes for Code Execution

The app supports code execution in multiple languages. To execute code in a specific language, you need the corresponding runtime installed:

**Required for code execution:**
- **Python 3** - Usually pre-installed on macOS/Linux
- **Java JDK** - For Java code execution
- **Node.js** - Already required for frontend

**Optional (install as needed):**
- **PHP** - `brew install php` (macOS) or `apt-get install php` (Linux)
- **Ruby** - Usually pre-installed, or `brew install ruby` (macOS)
- **Go** - [Download from go.dev](https://go.dev/dl/)
- **Rust** - [Install via rustup.rs](https://rustup.rs/)
- **C/C++ Compiler** - `brew install gcc` (macOS) or `apt-get install build-essential` (Linux)
- **.NET SDK** - [Download from Microsoft](https://dotnet.microsoft.com/download) (for C#)

**Note:** The app will show helpful error messages with installation instructions if a runtime is missing when you try to execute code in that language. You don't need to install all languages - only the ones you want to use!

**Quick check:** Run `./setup_languages.sh` to see which runtimes are installed and get installation commands for your OS.

### Installation

#### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd ai-mentor-nov16
```

#### 2. Set Up Environment Variables

```bash
# Copy the example environment file
cp env.example .env

# Edit .env and add your Gemini API key
# GEMINI_API_KEY=your_actual_gemini_api_key_here
```

**Required Environment Variables:**
- `GEMINI_API_KEY` - Your Google Gemini API key (required)

**Optional Environment Variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `POSTGRES_USER` - Database username (default: `postgres`)
- `POSTGRES_PASSWORD` - Database password (default: `postgres`)
- `POSTGRES_DB` - Database name (default: `ai_mentor`)
- `BACKEND_PORT` - Backend server port (default: `8000`)
- `VITE_API_URL` - Backend API URL for frontend (default: `http://localhost:8000`)

#### 3. Set Up Backend

```bash
cd backend

# Create virtual environment (highly recommended)
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the server
python main.py
```

The backend will start on **http://localhost:8000**

You can verify it's running by visiting:
- **API Root**: http://localhost:8000
- **Interactive API Docs**: http://localhost:8000/docs
- **Alternative Docs**: http://localhost:8000/redoc

#### 4. Set Up Frontend

```bash
# From the project root
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will start on **http://localhost:5173**

Open your browser and navigate to **http://localhost:5173** to start using AI Coding Mentor!

---

## How to Use AI Coding Mentor

### Basic Workflow

1. **Open the Application**
   - Navigate to http://localhost:5173
   - You'll see a clean, modern interface with a code editor

2. **Select Your Language**
   - Use the language dropdown in the top toolbar
   - Choose from Python, Java, C++, C, C#, Go, Rust, Ruby, or PHP
   - Each language comes with starter code templates

3. **Write or Paste Your Code**
   - Start typing in the Monaco editor
   - Or paste existing code from your clipboard
   - The editor provides syntax highlighting, autocomplete, and IntelliSense

4. **Get Real-Time Feedback**
   - As you type, the AI analyzes your code (debounced to avoid spam)
   - Issues are highlighted with colored decorations
   - Click on highlighted sections to see detailed explanations

5. **Review AI Suggestions**
   - Open the sidebar to see:
     - **Errors** - Critical issues that need fixing
     - **Suggestions** - Improvements and best practices
     - **Test Cases** - Generated test cases for your code
     - **Explanation** - What your code does and how it works

6. **Apply Suggestions**
   - Click on any suggestion to see the before/after code
   - Accept suggestions with one click
   - Learn from the explanations provided

### Advanced Features

#### **Code Analysis**
Click the "Analyze Code" button (or use the keyboard shortcut) for a comprehensive analysis:
- Detailed error reports
- Performance optimization suggestions
- Security vulnerability detection
- Best practice recommendations
- Code quality scores

#### **Code Visualization**
Click "Visualize Code" to see your code execution step-by-step:
- Execution flow diagram
- Variable value tracking
- Function call visualization
- Perfect for understanding complex algorithms

#### **Generate Diagrams**
Click "Generate Diagram" to create visual representations:
- Flowcharts for control flow
- Class diagrams for object relationships
- Sequence diagrams for function calls
- Export as SVG for documentation

#### **Generate Lessons**
Click "Generate Lesson" to create educational content:
- Concept explanations
- Algorithm breakdowns
- Language feature tutorials
- Best practice guides

#### **Execute Code**
Click "Run Code" to execute your code:
- See output in real-time
- Catch runtime errors immediately
- Test edge cases
- Debug interactively
- **Use standard libraries** - All built-in modules work (e.g., `import math` in Python, `#include <iostream>` in C++)

**Example with libraries:**
```python
import math
import json

result = math.sqrt(16)
data = json.loads('{"key": "value"}')
print(result, data)
```

#### **View Code Metrics**
Click the "Metrics" button in the header to open the Code Metrics Dashboard:
- View real-time code statistics and visualizations
- Analyze code complexity and structure
- Track code distribution (code vs comments)
- Monitor line length and nesting depth
- See interactive charts and graphs

#### **AI Code Generation**
Use the AI chat panel to generate code:
- Type natural language prompts
- Get code with explanations
- Option to include context from your current code
- Perfect for starting new features or learning new patterns

#### **Code Formatting**
Click "Format Code" to beautify your code:
- Applies language-specific style guides
- Fixes indentation and spacing
- Organizes imports
- Makes code more readable

#### **Multi-Document Workspace**
- Click the "+" button to create new documents
- Drag tabs to reorder
- Each document maintains an independent state
- Perfect for working on multiple files

#### **Code Sharing**
Click "Share" to generate a shareable link:
- Share code with others
- Links expire in 30 days
- Recipients can view and analyze your code
- Great for code reviews and collaboration

---

## Configuration & Customization

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `GEMINI_API_KEY` | Your Google Gemini API key | - | Yes |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/ai_mentor` | No |
| `POSTGRES_USER` | Database username | `postgres` | No |
| `POSTGRES_PASSWORD` | Database password | `postgres` | No |
| `POSTGRES_DB` | Database name | `ai_mentor` | No |
| `BACKEND_PORT` | Backend server port | `8000` | No |
| `BACKEND_HOST` | Backend server host | `0.0.0.0` | No |
| `VITE_API_URL` | Backend API URL for frontend | `http://localhost:8000` | No |

### UI Customization

#### **Dark/Light Mode**
- Toggle in the settings sidebar
- Preference is saved to localStorage
- Applies to the entire interface

#### **Editor Settings**
- Font size (adjustable)
- Theme (VS Code themes supported)
- Word wrap
- Line numbers
- Minimap

#### **Keyboard Shortcuts**
- `Ctrl/Cmd + S` - Save document
- `Ctrl/Cmd + Z` - Undo
- `Ctrl/Cmd + Shift + Z` - Redo
- `Ctrl/Cmd + F` - Find
- `Ctrl/Cmd + H` - Find & Replace
- `Ctrl/Cmd + /` - Toggle comment
- `F5` - Run code
- `Ctrl/Cmd + Enter` - Analyze code

---

## API Documentation

### Interactive API Docs

Visit **http://localhost:8000/docs** for interactive API documentation powered by Swagger UI.

### Key Endpoints

#### **Health Check**
```http
GET /
```
Returns API status and version information.

#### **Analyze Code**
```http
POST /api/analyze
Content-Type: application/json

{
  "code": "def hello():\n    print('Hello, World!')",
  "language": "python",
  "format": false
}
```

Returns comprehensive code analysis, including:
- Errors and warnings
- Suggestions for improvement
- Generated test cases
- Code explanation
- Quality scores (correctness, clarity, best practices, performance)

#### **Generate Code**
```http
POST /api/generate
Content-Type: application/json

{
  "prompt": "Create a function that sorts a list of dictionaries by a key",
  "language": "python",
  "context": "optional existing code context"
}
```

Returns generated code with an explanation.

#### **Visualize Code**
```http
POST /api/visualize
Content-Type: application/json

{
  "code": "your code here",
  "language": "python"
}
```

Returns step-by-step execution visualization.

#### **Generate Diagram**
```http
POST /api/diagram
Content-Type: application/json

{
  "code": "your code here",
  "language": "python"
}
```

Returns Mermaid diagram code and explanation.

#### **Generate Lesson**
```http
POST /api/lesson
Content-Type: application/json

{
  "code": "your code here",
  "language": "python"
}
```

Returns educational lesson content.

#### **Format Code**
```http
POST /api/format
Content-Type: application/json

{
  "code": "your code here",
  "language": "python"
}
```

Returns formatted code.

#### **Execute Code**
```http
POST /api/execute
Content-Type: application/json

{
  "code": "print('Hello, World!')",
  "language": "python"
}
```

Returns execution output, errors, and execution time.

**Note**: All standard library modules are available. For example:
- Python: `import math`, `import json`, `import datetime`, etc.
- Java: `java.util.*`, `java.lang.*`, etc.
- C++: Standard library headers like `<iostream>`, `<vector>`, etc.

#### **Get Code Metrics**
```http
POST /api/metrics
Content-Type: application/json

{
  "code": "def hello():\n    print('Hello')",
  "language": "python"
}
```

Returns comprehensive code metrics including:
- Line counts (total, code, comments, blank)
- Structure counts (functions, classes, imports)
- Complexity metrics (cyclomatic complexity, nesting depth)
- Code distribution percentages
- Line length statistics
- Character counts

#### **Share Code**
```http
POST /api/share
Content-Type: application/json

{
  "code": "your code here",
  "language": "python",
  "title": "My Code"
}
```

Returns shareable link ID and expiration date.

#### **Get Shared Code**
```http
GET /api/share/{share_id}
```

Returns shared code by ID.

#### **Get History**
```http
GET /api/history?limit=10
```

Returns recent code analysis history.

---

## Project Structure

```
ai-mentor-nov16/
├── backend/                      # FastAPI backend
│   ├── __pycache__/             # Python cache (gitignored)
│   ├── services/                 # Business logic services
│   │   ├── __init__.py
│   │   ├── ai_service.py        # AI integration with Gemini
│   │   ├── code_executor.py     # Safe code execution
│   │   └── metrics_service.py   # Code metrics calculation
│   ├── main.py                  # FastAPI application entry point
│   ├── config.py                # Configuration management
│   ├── database.py              # Database models and connection
│   ├── schemas.py               # Pydantic request/response schemas
│   ├── requirements.txt         # Python dependencies
│   └── venv/                    # Virtual environment (gitignored)
│
├── frontend/                     # React frontend
│   ├── node_modules/            # Node dependencies (gitignored)
│   ├── dist/                    # Build output (gitignored)
│   ├── public/                  # Static assets
│   │   └── vite.svg
│   ├── src/
│   │   ├── components/          # React components
│   │   │   └── MetricsDashboard.tsx  # Code metrics dashboard
│   │   ├── constants/           # Constants and configuration
│   │   │   └── starterCode.ts  # Language starter templates
│   │   ├── services/            # API service layer
│   │   │   └── api.ts          # Axios API client
│   │   ├── types/               # TypeScript type definitions
│   │   │   ├── app.ts          # Application types
│   │   │   └── index.ts        # Type exports
│   │   ├── App.tsx             # Main application component
│   │   ├── App.css             # Application styles
│   │   ├── main.tsx            # React entry point
│   │   └── index.css           # Global styles
│   ├── index.html              # HTML template
│   ├── package.json            # Node dependencies and scripts
│   ├── package-lock.json       # Dependency lock file
│   ├── tsconfig.json           # TypeScript configuration
│   ├── tsconfig.app.json       # App-specific TS config
│   ├── tsconfig.node.json      # Node-specific TS config
│   ├── vite.config.ts          # Vite build configuration
│   └── eslint.config.js        # ESLint configuration
│
├── .gitignore                   # Git ignore rules
├── env.example                  # Environment variables template
└── README.md                    # This file
```

### Key Files Explained

#### **Backend**

- **`main.py`** - FastAPI application with all API endpoints, CORS configuration, and error handling
- **`services/ai_service.py`** - Core AI service that interfaces with Google Gemini API for code analysis, generation, visualization, and lesson creation
- **`services/code_executor.py`** - Safe code execution service with sandboxing and timeout protection
- **`services/metrics_service.py`** - Code metrics calculation service for analyzing code structure, complexity, and statistics
- **`config.py`** - Configuration management using Pydantic settings
- **`database.py`** - SQLAlchemy models and database connection management
- **`schemas.py`** - Pydantic schemas for request/response validation

#### **Frontend**

- **`App.tsx`** - Main React component (3135 lines) containing:
  - Document/tab management
  - Monaco editor integration
  - AI feedback display
  - Code visualization
  - Diagram rendering
  - Lesson modal
  - Code execution panel
  - All UI interactions
- **`services/api.ts`** - Type-safe API client for backend communication
- **`types/app.ts`** - TypeScript interfaces for documents, feedback, achievements, etc.
- **`constants/starterCode.ts`** - Starter code templates for different languages
- **`components/MetricsDashboard.tsx`** - Code metrics dashboard component with interactive charts using Recharts

---

## Learning Philosophy

### How AI Coding Mentor Helps You Learn

#### **1. Contextual Learning**
Instead of reading generic tutorials, learn from your actual code. The AI provides explanations tailored to what you're working on right now.

#### **2. Just-in-Time Feedback**
Get feedback exactly when you need it—as you code. This reinforces learning and prevents bad habits from forming.

#### **3. Explanation, Not Just Correction**
Every suggestion comes with a "why." You don't just learn what to change; you learn why it should be changed.

#### **4. Progressive Complexity**
The AI adapts to your skill level. Beginners get simple, clear explanations. Advanced users get deep technical insights.

#### **5. Visual Learning**
Diagrams and visualizations help you understand abstract concepts. See your code's execution flow, not just read about it.

#### **6. Practice with Purpose**
Every code you write becomes a learning opportunity. The AI turns your projects into personalized lessons.

---

## Troubleshooting

### Backend Issues

#### **Port Already in Use**
```bash
# Find process using port 8000
sudo lsof -i :8000

# Kill the process
kill -9 <PID>

# Or use a different port by setting BACKEND_PORT in .env
```

#### **Database Connection Error**
- Ensure PostgreSQL is running: `pg_isready` or `sudo systemctl status postgresql`
- Check `DATABASE_URL` in `.env` matches your PostgreSQL configuration
- Wait a few seconds after starting PostgreSQL before running the app
- **Note**: The app works without a database! The database is optional for history features.

#### **Gemini API Error**
- Verify your API key in `.env` (no spaces, correct format)
- Check API quota at https://makersuite.google.com/app/apikey
- Ensure you have credits/quota available
- Check your internet connection

#### **Module Not Found Errors**
```bash
# Ensure virtual environment is activated
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Reinstall dependencies
pip install -r requirements.txt
```

### Frontend Issues

#### **API Connection Failed**
- Ensure backend is running on http://localhost:8000
- Check `VITE_API_URL` in `.env` matches your backend URL
- Check browser console for CORS errors
- Verify backend CORS settings allow your frontend origin

#### **Build Errors**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf node_modules/.vite
```

#### **TypeScript Errors**
- Ensure all dependencies are installed: `npm install`
- Check `tsconfig.json` configuration
- Restart your IDE/editor

### General Issues

#### **Code Analysis Not Working**
- Check browser console for errors
- Verify backend is running and accessible
- Check the network tab for failed API requests
- Ensure Gemini API key is valid

#### **Code Execution Failing**
- Verify the language is supported
- Check code doesn't have infinite loops (timeout protection)
- Ensure code doesn't require external dependencies not available in the sandbox
- Check the execution output panel for error messages

---

## Deployment

### Backend Deployment

#### **Option 1: Railway**
1. Connect your GitHub repository
2. Set environment variables (especially `GEMINI_API_KEY`)
3. Railway auto-detects Python and installs dependencies
4. Your backend will be live at `https://your-app.railway.app`

#### **Option 2: Heroku**
```bash
# Install Heroku CLI
# Login: heroku login
# Create app: heroku create your-app-name
# Set environment variables
heroku config:set GEMINI_API_KEY=your_key
# Deploy
git push heroku main
```

#### **Option 3: Docker**
```dockerfile
# Create Dockerfile in backend/
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Frontend Deployment

#### **Option 1: Vercel**
1. Connect your GitHub repository
2. Set build command: `cd frontend && npm install && npm run build`
3. Set output directory: `frontend/dist`
4. Set environment variable: `VITE_API_URL` to your backend URL
5. Deploy!

#### **Option 2: Netlify**
1. Connect your GitHub repository
2. Build command: `cd frontend && npm install && npm run build`
3. Publish directory: `frontend/dist`
4. Add environment variable: `VITE_API_URL`

#### **Option 3: Build Locally**
```bash
cd frontend
npm install
npm run build
# Deploy the dist/ folder to any static hosting
```

### Environment Variables for Production

Make sure to set:
- `GEMINI_API_KEY` - Your production API key
- `VITE_API_URL` - Your production backend URL
- `DATABASE_URL` - Production database connection string (if using)
- `BACKEND_PORT` - Port for backend (usually 8000 or provided by hosting)

---

## Reflection

This project represents a journey of learning and growth. Here's what I discovered:

### **Technical Learnings**
- **Full-Stack Development**: Building a complete application from frontend to backend
- **AI Integration**: Working with large language models and understanding their capabilities
- **Real-Time Features**: Implementing debouncing, state management, and live updates
- **Code Execution**: Creating safe sandboxed environments for code execution
- **Type Safety**: Leveraging TypeScript and Pydantic for robust applications

### **Design Insights**
- **User Experience**: Making complex AI features accessible and intuitive
- **Visual Feedback**: Using colours, animations, and highlights effectively
- **Educational Design**: Creating interfaces that teach, not just inform

### **Philosophical Realizations**
- **Learning Through Doing**: The best way to learn is by building
- **AI as a Tool**: AI amplifies human capability; it doesn't replace it
- **Accessibility**: Making powerful tools available to everyone, regardless of skill level

---

## Libraries and Dependencies

### Frontend Libraries
- **React 18** - UI framework
- **TypeScript** - Type-safe JavaScript
- **Monaco Editor** - VS Code editor component
- **Recharts** - Charting library for metrics visualizations
- **Axios** - HTTP client for API calls
- **Lucide React** - Icon library
- **Mermaid** - Diagram rendering

### Backend Libraries
- **FastAPI** - Modern Python web framework
- **Google Generative AI** - Gemini AI integration
- **SQLAlchemy** - Database ORM
- **Pydantic** - Data validation
- **Uvicorn** - ASGI server

### Built-in Language Libraries
When executing code, all standard library modules are available:
- **Python**: `math`, `json`, `datetime`, `os`, `sys`, `collections`, `itertools`, etc.
- **Java**: `java.lang.*`, `java.util.*`, `java.io.*`, etc.
- **C++**: Standard library headers (`<iostream>`, `<vector>`, `<algorithm>`, etc.)
- **C**: Standard C library (`<stdio.h>`, `<stdlib.h>`, `<string.h>`, etc.)
- **Other languages**: Full standard library support for Go, Rust, Ruby, PHP, C#

## Future Vision

### Planned Features
- **Multi-file Projects** - Work with entire codebases, not just single files
- **Git Integration** - Analyze commits, suggest improvements
- **Team Collaboration** - Share workspaces, code review features
- **Custom AI Models** - Support for OpenAI, Anthropic, and other providers
- **Plugin System** - Extend functionality with custom plugins
- **Mobile App** - Learn on the go with iOS and Android apps
- **Offline Mode** - Work without internet connection
- **Advanced Debugging** - Step-through debugger with AI assistance

---

## License

This project is open source and available under the [MIT License](LICENSE).

---

**Built with ❤️ by Doris Lam**
