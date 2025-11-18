from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from contextlib import asynccontextmanager
import uvicorn
import traceback

from database import get_db, init_db, CodeSubmission
from schemas import CodeAnalysisRequest, CodeAnalysisResponse, SubmissionHistory, CodeGenerationRequest, CodeGenerationResponse, CodeVisualizationRequest, CodeVisualizationResponse, CodeDiagramRequest, CodeDiagramResponse, CodeLessonRequest, CodeLessonResponse, CodeFormatRequest, CodeFormatResponse, CodeExecutionRequest, CodeExecutionResponse
from services.ai_service import analyze_code, generate_code, visualize_code, generate_diagram, generate_lesson, format_code
from services.code_executor import execute_code
from config import get_settings

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler for startup and shutdown"""
    # Startup
    try:
        init_db()
        print("Database initialized successfully")
    except Exception as e:
        # Log the error but don't fail startup - database is optional
        import sys
        print(f"Warning: Database initialization failed (non-fatal): {str(e)}", file=sys.stderr)
        print("The application will continue but database features may not work.", file=sys.stderr)
        # Don't re-raise the exception - allow the app to start without database
    
    yield
    
    # Shutdown (cleanup if needed)
    pass

# Initialize FastAPI app with lifespan handler
app = FastAPI(
    title="AI Coding Mentor",
    description="An AI-powered platform for code analysis, suggestions, and test generation",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",  # Alternative React dev server
        "http://localhost:8080",  # Alternative dev server
        "http://127.0.0.1:5173",   # Alternative localhost
        "http://127.0.0.1:3000",  # Alternative localhost
        "http://localhost",        # Production frontend
        "http://frontend:5173",    # Docker frontend
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Global exception handler to ensure CORS headers are always included
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler that ensures CORS headers are included"""
    import traceback
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
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """HTTPException handler that ensures CORS headers are included"""
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
    """Health check endpoint"""
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
    Saves the analysis to the database (non-fatal if database is unavailable).
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
            import sys
            print(f"Database error (non-fatal): {str(db_error)}", file=sys.stderr)
            submission_id = 0
            from datetime import datetime
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
        import traceback
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
        import traceback
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
        import traceback
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
        import traceback
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
    """
    if not request.code.strip():
        raise HTTPException(status_code=400, detail="Code cannot be empty")
    
    try:
        result = await format_code(request.code, request.language)
        return CodeFormatResponse(**result)
    except Exception as e:
        import traceback
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
    """
    if not request.code.strip():
        raise HTTPException(status_code=400, detail="Code cannot be empty")
    
    try:
        result = execute_code(request.code, request.language)
        return CodeExecutionResponse(**result)
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Error in execute_code_endpoint: {str(e)}")
        print(f"Traceback: {error_trace}")
        raise HTTPException(
            status_code=500,
            detail=f"Error executing code: {str(e)}"
        )


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.backend_host,
        port=settings.backend_port,
        reload=True
    )

