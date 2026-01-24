# AI Coding Mentor - Project Overview & Architecture

## Table of Contents
1. [Project Vision](#project-vision)
2. [Architecture Overview](#architecture-overview)
3. [How Everything Works Together](#how-everything-works-together)
4. [Development Journey](#development-journey)
5. [Key Design Decisions](#key-design-decisions)
6. [Technology Stack](#technology-stack)
7. [File Structure Explained](#file-structure-explained)
8. [Data Flow](#data-flow)
9. [Feature Implementation Details](#feature-implementation-details)

---

## Project Vision

**AI Coding Mentor** is inspired by Grammarly but for code. The goal is to create an intelligent coding companion that:

- **Teaches as you code** - Every suggestion comes with explanations
- **Provides real-time feedback** - See issues before they become bugs
- **Explains the 'why'** - Understand concepts, not just syntax
- **Grows with you** - Learn best practices, patterns, and optimization techniques
- **Works alongside you** - AI that understands context and provides relevant help

The application combines:
- A full-featured code editor (Monaco Editor - VS Code's editor)
- AI-powered code analysis (Google Gemini)
- Educational tools (visualizations, lessons, diagrams)
- Code execution capabilities
- Comprehensive metrics and statistics

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + TypeScript)             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Monaco     │  │   Metrics    │  │   Sidebar    │      │
│  │   Editor     │  │  Dashboard   │  │  (Feedback) │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  State Management: React Hooks (useState, useEffect)        │
│  API Communication: Axios HTTP Client                       │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP REST API
                           │ (JSON)
┌──────────────────────────▼──────────────────────────────────┐
│              Backend (FastAPI + Python)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   AI Service │  │   Code       │  │   Metrics    │      │
│  │  (Gemini)    │  │  Executor    │  │   Service    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         API Endpoints (RESTful)                      │   │
│  │  /api/analyze, /api/generate, /api/execute, etc.    │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
┌───────▼──────┐  ┌────────▼────────┐  ┌─────▼──────┐
│   Gemini AI  │  │   PostgreSQL   │  │  Language  │
│     API      │  │   (Optional)   │  │  Runtimes  │
└──────────────┘  └─────────────────┘  └────────────┘
```

### Component Architecture

**Frontend:**
- **Monolithic Component (App.tsx)** - Main orchestrator (~3000 lines)
  - Document/tab management
  - Editor integration
  - API calls
  - State management
  - UI rendering

- **MetricsDashboard Component** - Separate component for metrics visualization
- **API Service Layer** - Type-safe API client
- **Type Definitions** - TypeScript interfaces

**Backend:**
- **FastAPI Application (main.py)** - API endpoints and routing
- **Service Layer** - Business logic separated into services:
  - `ai_service.py` - AI interactions
  - `code_executor.py` - Code execution
  - `metrics_service.py` - Code metrics
- **Data Layer** - Database models and schemas

---

## How Everything Works Together

### 1. User Types Code

```
User types in Monaco Editor
    ↓
onChange event fires
    ↓
Code state updates in React
    ↓
Debounced analysis trigger (500ms delay)
    ↓
API call to /api/analyze
    ↓
Backend receives request
    ↓
AI Service calls Gemini API
    ↓
Gemini analyzes code and returns feedback
    ↓
Backend parses response and returns JSON
    ↓
Frontend receives response
    ↓
Feedback items created
    ↓
Monaco Editor decorations applied (visual highlights)
    ↓
Sidebar shows suggestions
```

### 2. Code Execution Flow

```
User clicks "Run Code"
    ↓
Frontend sends POST /api/execute
    ↓
Backend Code Executor Service:
    1. Validates language support
    2. Checks if runtime is installed
    3. Creates temporary directory
    4. Writes code to file
    5. Compiles (if needed)
    6. Executes with timeout
    7. Captures output/errors
    8. Cleans up temp files
    ↓
Returns execution result
    ↓
Frontend displays in output panel
```

### 3. Code Analysis Flow

```
User code → AI Service → Gemini API
    ↓
Structured prompt with:
  - Code to analyze
  - Language context
  - Analysis requirements
    ↓
Gemini returns structured response:
  - ERRORS section
  - SUGGESTIONS section
  - TEST_CASES section
  - EXPLANATION section
  - SCORE section
    ↓
AI Service parses response
    ↓
Returns structured data
    ↓
Frontend displays in sidebar
```

### 4. Multi-Document System

```
Each tab = Document object
    ↓
Document contains:
  - code, language
  - history (for undo/redo)
  - feedback, visualization, diagram
  - scores, achievements
    ↓
Switching tabs = switching activeDocumentIndex
    ↓
All state is preserved per document
    ↓
Independent analysis per document
```

---

## Development Journey

### Phase 1: Core Editor
- Set up React + TypeScript + Vite
- Integrated Monaco Editor
- Basic code editing functionality

### Phase 2: Backend API
- FastAPI backend setup
- Google Gemini API integration
- Code analysis endpoint

### Phase 3: AI Features
- Code analysis with scoring
- Code generation
- Code visualization
- Diagram generation
- Lesson generation

### Phase 4: Advanced Features
- Code execution (multi-language)
- Code formatting
- Code sharing
- Metrics dashboard

### Phase 5: Polish
- Dark/light mode
- Multi-document workspace
- History tracking
- UI/UX improvements

---

## Key Design Decisions

### 1. **Monolithic Frontend Component**
**Decision:** Keep App.tsx as one large component (~3000 lines)

**Reasoning:**
- Easier to understand data flow
- All state in one place
- Simpler for learning/teaching
- No prop drilling issues

**Trade-off:**
- Large file can be harder to navigate
- Could be split into smaller components in production

### 2. **Optional Database**
**Decision:** Database is optional - app works without it

**Reasoning:**
- Easier setup for users
- History features are nice-to-have, not essential
- App can run immediately after cloning

**Trade-off:**
- History is lost on server restart
- In production, would use persistent storage

### 3. **In-Memory Code Sharing**
**Decision:** Shared code stored in memory (not database)

**Reasoning:**
- Simple implementation
- Works without database
- 30-day expiration is reasonable

**Trade-off:**
- Lost on server restart
- Not scalable for production
- Would use Redis/DB in production

### 4. **Model Fallback System**
**Decision:** Try multiple Gemini models if one fails

**Reasoning:**
- Different models available in different regions
- Free tier vs paid tier models
- Better user experience (works even if default model unavailable)

**Trade-off:**
- Slightly slower (tries multiple models)
- More complex error handling

### 5. **Debounced Analysis**
**Decision:** 500ms debounce on code analysis

**Reasoning:**
- Reduces API calls (saves quota)
- Better performance
- Less overwhelming for users

**Trade-off:**
- Slight delay in feedback
- Users might type faster than analysis

---

## Technology Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Monaco Editor** - Code editor (VS Code's editor)
- **Recharts** - Charting library for metrics
- **Axios** - HTTP client
- **Lucide React** - Icon library
- **Mermaid** - Diagram rendering

### Backend
- **FastAPI** - Modern Python web framework
- **Google Generative AI** - Gemini API client
- **SQLAlchemy** - Database ORM (optional)
- **Pydantic** - Data validation
- **Uvicorn** - ASGI server
- **psycopg** - PostgreSQL driver

### Infrastructure
- **PostgreSQL** - Database (optional)
- **Environment Variables** - Configuration (.env file)

---

## File Structure Explained

### Backend Structure

```
backend/
├── main.py                 # FastAPI app, all API endpoints
├── config.py              # Configuration management (settings)
├── database.py            # Database models and connection
├── schemas.py             # Pydantic request/response models
├── requirements.txt       # Python dependencies
└── services/
    ├── ai_service.py      # Google Gemini AI integration
    ├── code_executor.py   # Safe code execution
    └── metrics_service.py # Code metrics calculation
```

**main.py** - The heart of the backend:
- Defines all API endpoints
- Handles CORS configuration
- Error handling
- Request/response validation

**services/ai_service.py** - AI intelligence:
- Interfaces with Gemini API
- Model fallback logic
- Response parsing
- Error handling

**services/code_executor.py** - Code execution:
- Multi-language support
- Sandboxed execution
- Timeout protection
- Runtime detection

**services/metrics_service.py** - Code analysis:
- Line counting
- Complexity calculation
- Structure detection
- Language-specific parsing

### Frontend Structure

```
frontend/
├── src/
│   ├── App.tsx            # Main component (3000+ lines)
│   ├── main.tsx           # Entry point
│   ├── App.css            # All styles (3000+ lines)
│   ├── index.css          # Global styles
│   ├── components/
│   │   └── MetricsDashboard.tsx  # Metrics visualization
│   ├── services/
│   │   └── api.ts         # API client
│   ├── types/
│   │   ├── app.ts         # Application types
│   │   └── index.ts       # Type exports
│   └── constants/
│       └── starterCode.ts # Language templates
├── package.json           # Dependencies
└── vite.config.ts         # Vite configuration
```

**App.tsx** - The main component:
- All UI rendering
- State management
- Event handlers
- API integration

**services/api.ts** - API communication:
- Type-safe API functions
- Centralized configuration
- Error handling

**components/MetricsDashboard.tsx** - Metrics display:
- Interactive charts
- Real-time updates
- Dark mode support

---

## Data Flow

### Request Flow

1. **User Action** (e.g., types code, clicks button)
2. **React State Update** (useState hook)
3. **Effect Trigger** (useEffect hook)
4. **API Call** (Axios HTTP request)
5. **Backend Processing** (FastAPI endpoint)
6. **Service Layer** (Business logic)
7. **External API** (Gemini, database, etc.)
8. **Response Processing** (Parse and validate)
9. **State Update** (React state)
10. **UI Re-render** (React updates DOM)

### State Management

**Frontend State:**
- `documents` - Array of Document objects (one per tab)
- `activeDocumentIndex` - Currently selected tab
- UI state (modals, panels, loading states)
- Editor state (Monaco Editor instance)

**Backend State:**
- `shared_code_store` - In-memory shared code (dict)
- Database state (if enabled)
- No session state (stateless API)

### Data Persistence

**Frontend:**
- localStorage - Dark mode preference
- No code persistence (lost on refresh)

**Backend:**
- Database (optional) - Code analysis history
- In-memory - Shared code (lost on restart)

---

## Feature Implementation Details

### 1. Real-Time Code Analysis

**How it works:**
- Monaco Editor `onChange` event fires on every keystroke
- React state updates with new code
- `useEffect` hook watches code changes
- Debounce timer (500ms) prevents excessive API calls
- After debounce, API call to `/api/analyze`
- Response parsed into FeedbackItem objects
- Monaco Editor decorations applied (visual highlights)
- Sidebar displays suggestions

**Key Code:**
```typescript
useEffect(() => {
  const timeoutId = setTimeout(() => {
    if (code.trim()) {
      analyzeCodeDebounced();
    }
  }, 500);
  return () => clearTimeout(timeoutId);
}, [code]);
```

### 2. Code Execution

**How it works:**
- User clicks "Run Code" button
- Frontend sends code and language to `/api/execute`
- Backend creates temporary directory
- Writes code to file with appropriate extension
- Checks if language runtime is installed
- Compiles code (if needed for compiled languages)
- Executes with subprocess.run() and timeout
- Captures stdout, stderr, exit code
- Cleans up temporary files
- Returns execution result
- Frontend displays in output panel

**Security:**
- Temporary directories (auto-deleted)
- Timeout protection (10-15 seconds)
- Process isolation
- No network access

### 3. Code Visualization

**How it works:**
- User clicks "Visualize Code"
- Code sent to `/api/visualize`
- AI Service creates detailed prompt asking for step-by-step breakdown
- Gemini returns structured response with:
  - Execution steps
  - Variable states
  - Function calls
  - Control flow
- Response parsed into step objects
- Frontend displays in visualizer tab
- Each step shows line number, description, variables, output

### 4. Diagram Generation

**How it works:**
- Code sent to `/api/diagram`
- AI analyzes code structure
- Determines best diagram type (flowchart, class diagram, etc.)
- Generates Mermaid syntax
- Response includes diagram code and explanation
- Frontend renders using Mermaid library
- User can download as SVG

**Mermaid Syntax:**
- Flowcharts for execution flow
- Class diagrams for OOP code
- Sequence diagrams for function calls
- Graph diagrams for data flow

### 5. Metrics Dashboard

**How it works:**
- Code sent to `/api/metrics` (debounced)
- Backend Metrics Service analyzes code:
  - Counts lines (code, comments, blank)
  - Detects functions, classes, imports (language-specific)
  - Calculates complexity (decision points)
  - Measures nesting depth
  - Computes percentages and averages
- Returns comprehensive metrics
- Frontend displays in interactive dashboard:
  - Key metric cards
  - Structure cards
  - Charts (pie, bar)
  - Additional statistics
  - Explanation section

### 6. Multi-Document Workspace

**How it works:**
- Each tab is a Document object
- Document contains all state (code, feedback, history, etc.)
- Switching tabs = changing `activeDocumentIndex`
- All documents stored in `documents` array
- Each document maintains independent:
  - Code content
  - Analysis results
  - History (undo/redo)
  - Visualizations
  - Scores

**History System:**
- `documentHistory` array stores code snapshots
- `historyIndex` tracks current position
- Undo/redo navigates through history
- New changes create new history entries

---

## How You Built This

### Step-by-Step Development Process

1. **Initial Setup**
   - Created React + TypeScript project with Vite
   - Set up FastAPI backend
   - Configured environment variables

2. **Basic Editor**
   - Integrated Monaco Editor
   - Added language selection
   - Implemented basic editing

3. **Backend API**
   - Created FastAPI application
   - Set up CORS middleware
   - Added health check endpoint

4. **AI Integration**
   - Obtained Gemini API key
   - Created AI service module
   - Implemented code analysis endpoint
   - Added model fallback logic

5. **Frontend Integration**
   - Created API service layer
   - Implemented code analysis UI
   - Added real-time feedback display
   - Created sidebar for suggestions

6. **Advanced Features**
   - Code execution (multi-language)
   - Code visualization
   - Diagram generation
   - Lesson generation
   - Code formatting
   - Metrics dashboard

7. **Polish**
   - Dark/light mode
   - Multi-document workspace
   - History tracking
   - Code sharing
   - UI/UX improvements

### Key Challenges Solved

1. **Model Availability**
   - **Problem:** Different Gemini models available in different regions
   - **Solution:** Model fallback system tries multiple models

2. **Code Execution Security**
   - **Problem:** Need to execute untrusted user code safely
   - **Solution:** Temporary directories, timeouts, process isolation

3. **Real-Time Analysis Performance**
   - **Problem:** Too many API calls on every keystroke
   - **Solution:** Debouncing (500ms delay)

4. **Multi-Language Support**
   - **Problem:** Different languages need different execution methods
   - **Solution:** Configuration-based execution system

5. **State Management**
   - **Problem:** Complex state with multiple documents
   - **Solution:** Document-based state architecture

---

## Architecture Patterns Used

### 1. **Service Layer Pattern**
Business logic separated into service modules:
- `ai_service.py` - AI operations
- `code_executor.py` - Code execution
- `metrics_service.py` - Metrics calculation

### 2. **Repository Pattern** (Partial)
Database operations abstracted through SQLAlchemy models.

### 3. **Dependency Injection**
FastAPI uses dependency injection for database sessions:
```python
def my_endpoint(db: Session = Depends(get_db)):
    # db is injected
```

### 4. **Observer Pattern**
React's state management uses observer pattern (state changes trigger re-renders).

### 5. **Strategy Pattern**
Code execution uses strategy pattern (different strategies for different languages).

---

## Performance Considerations

### Frontend
- **Debouncing** - Reduces API calls
- **Memoization** - Could add React.memo for expensive components
- **Code Splitting** - Could split App.tsx into smaller components
- **Lazy Loading** - Metrics dashboard could be lazy-loaded

### Backend
- **Async/Await** - Non-blocking I/O
- **Connection Pooling** - SQLAlchemy connection pool
- **Caching** - Model caching in AI service
- **Timeout Protection** - Prevents hanging requests

### API Calls
- **Debouncing** - 500ms delay on analysis
- **Error Handling** - Graceful degradation
- **Retry Logic** - Could add for transient failures

---

## Security Considerations

### Code Execution
- Temporary directories (auto-deleted)
- Timeout protection
- Process isolation
- No network access
- Resource limits

### API Security
- CORS configuration (restrict in production)
- Input validation (Pydantic schemas)
- Error message sanitization
- No sensitive data in responses

### Data Privacy
- Code stored temporarily (in-memory)
- No persistent storage of user code (unless database enabled)
- Shared code expires after 30 days

---

## Future Improvements

### Potential Enhancements
1. **User Authentication** - Save code per user
2. **Project Management** - Multi-file projects
3. **Git Integration** - Analyze commits, suggest improvements
4. **Team Collaboration** - Share workspaces
5. **Custom AI Models** - Support for OpenAI, Anthropic
6. **Plugin System** - Extend functionality
7. **Mobile App** - iOS/Android versions
8. **Offline Mode** - Work without internet
9. **Advanced Debugging** - Step-through debugger
10. **Code Templates** - Pre-built code templates

### Technical Improvements
1. **Component Splitting** - Break App.tsx into smaller components
2. **State Management** - Consider Redux/Zustand for complex state
3. **Testing** - Add unit and integration tests
4. **Documentation** - API documentation improvements
5. **Monitoring** - Add logging and error tracking
6. **Caching** - Cache analysis results
7. **WebSockets** - Real-time collaboration
8. **Progressive Web App** - PWA support

---

## Conclusion

This project demonstrates:

1. **Full-Stack Development** - React frontend + FastAPI backend
2. **AI Integration** - Google Gemini API for intelligent features
3. **Modern Web Technologies** - TypeScript, Vite, Monaco Editor
4. **Real-Time Features** - Debounced analysis, live feedback
5. **Multi-Language Support** - 9 programming languages
6. **Educational Focus** - Teaching through code analysis
7. **User Experience** - Polished UI with dark mode, animations
8. **Code Quality** - Type safety, error handling, documentation

The architecture is designed to be:
- **Understandable** - Clear separation of concerns
- **Extensible** - Easy to add new features
- **Maintainable** - Well-commented code
- **Educational** - Great for learning full-stack development

---

**Built with ❤️ by Doris Lam**

This project represents a journey of learning and growth, combining modern web development practices with AI-powered features to create an intelligent coding companion.
