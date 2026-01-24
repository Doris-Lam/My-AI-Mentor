"""
AI Coding Mentor - Backend API Server

This is the main FastAPI application that serves as the backend for the AI Coding Mentor platform.
It provides RESTful API endpoints for code analysis, generation, visualization, execution, and more.

Architecture:
- FastAPI framework for async HTTP handling
- Google Gemini AI for intelligent code analysis
- SQLAlchemy for optional database persistence
- In-memory storage for shared code (can be replaced with Redis/DB in production)

Key Features:
1. Code Analysis - AI-powered feedback on code quality, errors, and suggestions
2. Code Generation - Generate code from natural language prompts
3. Code Visualization - Step-by-step execution flow visualization
4. Diagram Generation - Create Mermaid diagrams from code
5. Lesson Generation - Educational content based on code
6. Code Formatting - Beautify code according to language standards
7. Code Execution - Safe sandboxed code execution
8. Code Metrics - Calculate code statistics and complexity
9. Code Sharing - Generate shareable links for code snippets
"""

from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
from contextlib import asynccontextmanager
import uvicorn
import traceback
import secrets
import sys

from database import get_db, init_db, CodeSubmission
from schemas import CodeAnalysisRequest, CodeAnalysisResponse, SubmissionHistory, CodeGenerationRequest, CodeGenerationResponse, CodeVisualizationRequest, CodeVisualizationResponse, CodeDiagramRequest, CodeDiagramResponse, CodeLessonRequest, CodeLessonResponse, CodeFormatRequest, CodeFormatResponse, CodeExecutionRequest, CodeExecutionResponse, ShareCodeRequest, ShareCodeResponse, SharedCodeResponse, CodeMetricsRequest, CodeMetricsResponse
from services.ai_service import analyze_code, generate_code, visualize_code, generate_diagram, generate_lesson, format_code
from services.code_executor import execute_code
from services.metrics_service import calculate_code_metrics
from config import get_settings

settings = get_settings()

# In-memory store for shared code (in production, use a database or Redis)
# This stores code snippets that users want to share with others
# Format: {share_id: {code, language, title, created_at, expires_at}}
shared_code_store: dict[str, dict] = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan event handler for startup and shutdown.
    
    This function is called when the FastAPI app starts and stops.
    It handles:
    - Database initialization (non-fatal - app works without DB)
    - Any cleanup needed on shutdown
    
    The database is optional - the app will continue to work even if
    database initialization fails (history features just won't be available).
    """
    # Startup: Initialize database (optional)
    try:
        init_db()
        print("Database initialized successfully")
    except Exception as e:
        # Log the error but don't fail startup - database is optional
        print(f"Warning: Database initialization failed (non-fatal): {str(e)}", file=sys.stderr)
        print("The application will continue but database features may not work.", file=sys.stderr)
        # Don't re-raise the exception - allow the app to start without database
    
    yield  # App runs here
    
    # Shutdown: Cleanup if needed (currently no cleanup required)
    pass

# Initialize FastAPI app with lifespan handler
# This creates the main application instance with metadata and lifecycle management
app = FastAPI(
    title="AI Coding Mentor",
    description="An AI-powered platform for code analysis, suggestions, and test generation",
    version="1.0.0",
    lifespan=lifespan  # Handles startup/shutdown events
)

# Configure CORS (Cross-Origin Resource Sharing)
# This allows the frontend (running on different ports) to make API requests
# In production, you should restrict this to your actual frontend domain
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server (default)
        "http://localhost:3000",  # Alternative React dev server
        "http://localhost:8080",  # Alternative dev server
        "http://127.0.0.1:5173",   # Alternative localhost format
        "http://127.0.0.1:3000",  # Alternative localhost format
        "http://localhost",        # Production frontend
        "http://frontend:5173",    # Docker frontend (if using Docker)
    ],
    allow_credentials=True,  # Allow cookies/auth headers
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],  # Allowed HTTP methods
    allow_headers=["*"],  # Allow all headers (can be restricted in production)
)

# Global exception handler to ensure CORS headers are always included
# This catches any unhandled exceptions and ensures CORS headers are present
# so the frontend can properly receive error responses
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Global exception handler that ensures CORS headers are included in error responses.
    
    This is important because if an exception occurs, we still want the frontend
    to be able to read the error message. Without CORS headers, browsers will
    block the response.
    """
    error_trace = traceback.format_exc()
    print(f"Unhandled exception: {str(exc)}")
    print(f"Traceback: {error_trace}")
    
    return JSONResponse(
        status_code=500,
        content={
            "detail": f"Internal server error: {str(exc)}"
        },
        headers={
            "Access-Control-Allow-Origin": request.headers.get("origin", "*"),
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "*",
        }
    )

# HTTPException handler to ensure CORS headers
# This handles HTTP exceptions (like 404, 400, etc.) and ensures CORS headers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """
    HTTPException handler that ensures CORS headers are included.
    
    Handles standard HTTP exceptions (400, 404, etc.) and ensures
    the frontend can read the error response.
    """
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers={
            "Access-Control-Allow-Origin": request.headers.get("origin", "*"),
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "*",
        }
    )


@app.get("/")
async def root():
    """
    Health check endpoint.
    
    Returns basic API information and status.
    Useful for checking if the backend is running and accessible.
    """
    return {
        "message": "AI Coding Mentor API is running",
        "version": "1.0.0",
        "status": "healthy"
    }


@app.post("/api/analyze", response_model=CodeAnalysisResponse)
async def analyze_code_endpoint(
    request: CodeAnalysisRequest,
    db: Session = Depends(get_db)
):
    """
    Analyze code and return AI-powered feedback.
    
    This is the core endpoint of the application. It:
    1. Takes code and language as input
    2. Uses Google Gemini AI to analyze the code
    3. Returns errors, suggestions, test cases, explanations, and scores
    4. Optionally saves the analysis to the database (non-fatal if DB unavailable)
    
    The AI analyzes:
    - Syntax errors and logical issues
    - Code quality and best practices
    - Performance optimization opportunities
    - Security vulnerabilities
    - Code clarity and readability
    
    Returns scores for:
    - Correctness (0-100)
    - Clarity (0-100)
    - Best Practices (0-100)
    - Performance (0-100)
    - Overall (0-100)
    """
    if not request.code.strip():
        raise HTTPException(status_code=400, detail="Code cannot be empty")
    
    try:
        # Analyze code using AI
        analysis = await analyze_code(request.code, request.language, getattr(request, 'format', False))
        
        # Save to database (non-fatal - continue even if database fails)
        try:
            submission = CodeSubmission(
                code=request.code,
                language=request.language,
                errors=analysis["errors"],
                suggestions=analysis["suggestions"],
                test_cases=analysis["test_cases"],
                explanation=analysis["explanation"]
            )
            
            db.add(submission)
            db.commit()
            db.refresh(submission)
            
            submission_id = submission.id
            created_at = submission.created_at
        except Exception as db_error:
            # Database error is non-fatal - log and continue
            print(f"Database error (non-fatal): {str(db_error)}", file=sys.stderr)
            submission_id = 0
            created_at = datetime.utcnow()
        
        return CodeAnalysisResponse(
            id=submission_id,
            errors=analysis["errors"],
            suggestions=analysis["suggestions"],
            test_cases=analysis["test_cases"],
            explanation=analysis["explanation"],
            formatted_code=analysis.get("formatted_code"),
            correctness_score=analysis.get("correctness_score", 100),
            clarity_score=analysis.get("clarity_score", 100),
            best_practices_score=analysis.get("best_practices_score", 100),
            performance_score=analysis.get("performance_score", 100),
            overall_score=analysis.get("overall_score", 100),
            created_at=created_at
        )
    except Exception as e:
        error_trace = traceback.format_exc()
        print(f"Error in analyze_code_endpoint: {str(e)}")
        print(f"Traceback: {error_trace}")
        raise HTTPException(
            status_code=500,
            detail=f"Error analyzing code: {str(e)}"
        )


@app.get("/api/history", response_model=List[SubmissionHistory])
async def get_history(
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """
    Get recent code analysis history.
    """
    submissions = db.query(CodeSubmission)\
        .order_by(CodeSubmission.created_at.desc())\
        .limit(limit)\
        .all()
    
    return submissions


@app.get("/api/submission/{submission_id}", response_model=SubmissionHistory)
async def get_submission(
    submission_id: int,
    db: Session = Depends(get_db)
):
    """
    Get a specific code submission by ID.
    """
    submission = db.query(CodeSubmission).filter(CodeSubmission.id == submission_id).first()
    
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    return submission


@app.post("/api/generate", response_model=CodeGenerationResponse)
async def generate_code_endpoint(request: CodeGenerationRequest):
    """
    Generate code based on a natural language prompt.
    
    Uses AI to convert natural language descriptions into working code.
    For example: "Create a function that sorts a list of dictionaries by a key"
    will generate the actual code implementation.
    
    Optional context parameter allows providing existing code for the AI
    to consider when generating new code (useful for extending existing codebases).
    """
    if not request.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt cannot be empty")
    
    # Generate code using AI
    result = await generate_code(request.prompt, request.language, request.context)
    
    return CodeGenerationResponse(
        generated_code=result["generated_code"],
        explanation=result["explanation"]
    )


@app.post("/api/visualize", response_model=CodeVisualizationResponse)
async def visualize_code_endpoint(request: CodeVisualizationRequest):
    """
    Visualize code execution flow and explain how the code works step by step.
    
    This endpoint creates a detailed step-by-step breakdown of code execution:
    - Line-by-line execution order
    - Variable state changes at each step
    - Function calls and their parameters
    - Control flow (if statements, loops, etc.)
    - Output at each step
    
    Perfect for understanding complex algorithms or debugging logic issues.
    """
    if not request.code.strip():
        raise HTTPException(status_code=400, detail="Code cannot be empty")
    
    try:
        # Visualize code using AI
        result = await visualize_code(request.code, request.language)
        
        return CodeVisualizationResponse(
            steps=result.get("steps", []),
            explanation=result.get("explanation", ""),
            flow_diagram=result.get("flow_diagram")
        )
    except Exception as e:
        error_trace = traceback.format_exc()
        print(f"Error in visualize_code_endpoint: {str(e)}")
        print(f"Traceback: {error_trace}")
        raise HTTPException(
            status_code=500,
            detail=f"Error visualizing code: {str(e)}"
        )


@app.post("/api/diagram", response_model=CodeDiagramResponse)
async def generate_diagram_endpoint(request: CodeDiagramRequest):
    """
    Generate a visual diagram (Mermaid format) representing the code structure.
    
    Creates different types of diagrams based on the code:
    - Flowcharts (for execution flow and algorithms)
    - Class diagrams (for object-oriented code)
    - Sequence diagrams (for function call sequences)
    - Graph diagrams (for data flow and dependencies)
    
    The diagram is returned in Mermaid syntax which can be rendered
    in the frontend using the Mermaid library.
    """
    if not request.code.strip():
        raise HTTPException(status_code=400, detail="Code cannot be empty")
    
    try:
        # Generate diagram using AI
        result = await generate_diagram(request.code, request.language)
        
        return CodeDiagramResponse(
            diagram_code=result.get("diagram_code", ""),
            diagram_type=result.get("diagram_type", "flowchart TD"),
            explanation=result.get("explanation", "")
        )
    except Exception as e:
        error_trace = traceback.format_exc()
        print(f"Error in generate_diagram_endpoint: {str(e)}")
        print(f"Traceback: {error_trace}")
        raise HTTPException(
            status_code=500,
            detail=f"Error generating diagram: {str(e)}"
        )


@app.post("/api/lesson", response_model=CodeLessonResponse)
async def generate_lesson_endpoint(request: CodeLessonRequest):
    """
    Generate an educational lesson teaching the core concepts and algorithms in the code.
    
    This creates comprehensive educational content that teaches:
    - Programming concepts used in the code (OOP, functional programming, etc.)
    - Algorithms and data structures (sorting, searching, trees, graphs, etc.)
    - Design patterns and techniques
    - Best practices and when to use them
    
    The lesson focuses on teaching concepts, not just explaining what the code does.
    It helps users understand the "why" and "when" behind the code.
    """
    if not request.code.strip():
        raise HTTPException(status_code=400, detail="Code cannot be empty")
    
    try:
        # Generate lesson using AI
        result = await generate_lesson(request.code, request.language)
        
        return CodeLessonResponse(
            lesson=result.get("lesson", ""),
            concepts=result.get("concepts", [])
        )
    except Exception as e:
        error_trace = traceback.format_exc()
        print(f"Error in generate_lesson_endpoint: {str(e)}")
        print(f"Traceback: {error_trace}")
        raise HTTPException(
            status_code=500,
            detail=f"Error generating lesson: {str(e)}"
        )


@app.post("/api/format", response_model=CodeFormatResponse)
async def format_code_endpoint(request: CodeFormatRequest):
    """
    Format and beautify code according to language-specific style guidelines.
    
    Uses AI to format code according to language standards:
    - Python: PEP 8 style guide
    - Java: Java style conventions
    - C++: C++ style guidelines
    - And other language-specific conventions
    
    Fixes:
    - Indentation and spacing
    - Line breaks and alignment
    - Import organization
    - Consistent naming conventions
    
    Returns the formatted code and a flag indicating if changes were made.
    """
    if not request.code.strip():
        raise HTTPException(status_code=400, detail="Code cannot be empty")
    
    try:
        result = await format_code(request.code, request.language)
        return CodeFormatResponse(**result)
    except Exception as e:
        error_trace = traceback.format_exc()
        print(f"Error in format_code_endpoint: {str(e)}")
        print(f"Traceback: {error_trace}")
        raise HTTPException(
            status_code=500,
            detail=f"Error formatting code: {str(e)}"
        )


@app.post("/api/execute", response_model=CodeExecutionResponse)
async def execute_code_endpoint(request: CodeExecutionRequest):
    """
    Execute code and return output, errors, and execution time.
    
    Safely executes code in a sandboxed environment with:
    - Timeout protection (prevents infinite loops)
    - Resource limits (memory and CPU constraints)
    - Error capture (detailed error messages and stack traces)
    
    Supports multiple languages:
    - Python, Java, C++, C, C#, Go, Rust, Ruby, PHP
    
    All standard library modules are available for each language.
    Returns stdout, stderr, exit code, and execution time.
    """
    if not request.code.strip():
        raise HTTPException(status_code=400, detail="Code cannot be empty")
    
    try:
        result = execute_code(request.code, request.language)
        return CodeExecutionResponse(**result)
    except Exception as e:
        error_trace = traceback.format_exc()
        print(f"Error in execute_code_endpoint: {str(e)}")
        print(f"Traceback: {error_trace}")
        raise HTTPException(
            status_code=500,
            detail=f"Error executing code: {str(e)}"
        )


@app.post("/api/share", response_model=ShareCodeResponse)
async def share_code_endpoint(request: ShareCodeRequest):
    """
    Share code and generate a shareable link.
    
    Creates a temporary shareable link for code snippets.
    - Generates a unique share ID using secure tokens
    - Stores code in memory (expires in 30 days)
    - Returns share URL that can be shared with others
    
    Note: In production, this should use a database or Redis
    instead of in-memory storage for persistence and scalability.
    """
    if not request.code.strip():
        raise HTTPException(status_code=400, detail="Code cannot be empty")
    
    try:
        # Generate a unique share ID
        share_id = secrets.token_urlsafe(16)
        
        # Store the shared code (expires in 30 days)
        expires_at = datetime.utcnow() + timedelta(days=30)
        shared_code_store[share_id] = {
            "code": request.code,
            "language": request.language,
            "title": request.title,
            "created_at": datetime.utcnow(),
            "expires_at": expires_at
        }
        
        # Generate share URL (frontend will construct the full URL)
        # Return share_id and let frontend construct the URL
        share_url = f"{share_id}"  # Frontend will prepend the base URL
        
        return ShareCodeResponse(
            share_id=share_id,
            share_url=share_url,
            expires_at=expires_at
        )
    except Exception as e:
        error_trace = traceback.format_exc()
        print(f"Error in share_code_endpoint: {str(e)}")
        print(f"Traceback: {error_trace}")
        raise HTTPException(
            status_code=500,
            detail=f"Error sharing code: {str(e)}"
        )


@app.get("/api/share/{share_id}", response_model=SharedCodeResponse)
async def get_shared_code(share_id: str):
    """
    Retrieve shared code by share ID.
    """
    if share_id not in shared_code_store:
        raise HTTPException(status_code=404, detail="Shared code not found or expired")
    
    shared_data = shared_code_store[share_id]
    
    # Check if expired
    if shared_data["expires_at"] < datetime.utcnow():
        del shared_code_store[share_id]
        raise HTTPException(status_code=404, detail="Shared code has expired")
    
    return SharedCodeResponse(
        code=shared_data["code"],
        language=shared_data["language"],
        title=shared_data.get("title"),
        created_at=shared_data["created_at"]
    )


@app.get("/share/{share_id}")
async def share_page(share_id: str):
    """
    HTML page to display shared code (for easy viewing).
    """
    try:
        if share_id not in shared_code_store:
            return JSONResponse(
                status_code=404,
                content={"error": "Shared code not found or expired"}
            )
        
        shared_data = shared_code_store[share_id]
        
        # Check if expired
        if shared_data["expires_at"] < datetime.utcnow():
            del shared_code_store[share_id]
            return JSONResponse(
                status_code=404,
                content={"error": "Shared code has expired"}
            )
        
        # Return JSON for frontend to handle
        return JSONResponse(content={
            "code": shared_data["code"],
            "language": shared_data["language"],
            "title": shared_data.get("title"),
            "created_at": shared_data["created_at"].isoformat()
        })
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )


@app.post("/api/metrics", response_model=CodeMetricsResponse)
async def get_code_metrics(request: CodeMetricsRequest):
    """
    Calculate and return code metrics for the given code.
    
    Computes comprehensive code statistics including:
    - Line counts (total, code, comments, blank)
    - Structure counts (functions, classes, imports)
    - Complexity metrics (cyclomatic complexity, nesting depth)
    - Code distribution (percentage of code vs comments)
    - Line length statistics (average, longest)
    - Character counts (with and without whitespace)
    
    These metrics help developers understand code structure,
    maintainability, and quality at a glance.
    """
    if not request.code.strip():
        raise HTTPException(status_code=400, detail="Code cannot be empty")
    
    try:
        metrics = calculate_code_metrics(request.code, request.language)
        return CodeMetricsResponse(**metrics)
    except Exception as e:
        error_trace = traceback.format_exc()
        print(f"Error calculating metrics: {str(e)}")
        print(f"Traceback: {error_trace}")
        raise HTTPException(
            status_code=500,
            detail=f"Error calculating metrics: {str(e)}"
        )


if __name__ == "__main__":
    """
    Run the FastAPI application using Uvicorn ASGI server.
    
    This starts the development server with:
    - Hot reload enabled (auto-restarts on code changes)
    - Host and port from settings (default: 0.0.0.0:8000)
    
    In production, use a production ASGI server like:
    - gunicorn with uvicorn workers
    - uvicorn with multiple workers
    - Or deploy to platforms like Railway, Heroku, etc.
    """
    uvicorn.run(
        "main:app",
        host=settings.backend_host,
        port=settings.backend_port,
        reload=True  # Auto-reload on code changes (development only)
    )

