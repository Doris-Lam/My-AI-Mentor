"""
Pydantic Schemas for Request/Response Validation

This module defines all API request and response models using Pydantic.
Pydantic automatically validates data types and provides clear error messages.

All API endpoints use these schemas to:
- Validate incoming request data
- Serialize response data
- Provide automatic API documentation (OpenAPI/Swagger)

The schemas ensure type safety and data integrity throughout the application.
"""

from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class CodeAnalysisRequest(BaseModel):
    """
    Request schema for code analysis endpoint.
    
    Fields:
        code: The code to analyze (required)
        language: Programming language (python, java, etc.) (required)
        format: Whether to format the code instead of analyzing (optional, default: False)
    """
    code: str
    language: str
    format: Optional[bool] = False


class CodeAnalysisResponse(BaseModel):
    """
    Response schema for code analysis endpoint.
    
    Contains comprehensive AI analysis results including:
    - Errors and warnings
    - Suggestions for improvement
    - Generated test cases
    - Code explanation
    - Quality scores (0-100 for each category)
    - Formatted code (if format was requested)
    """
    id: int  # Database ID (0 if not saved to DB)
    errors: str  # Detected errors (one per line with line numbers)
    suggestions: str  # Improvement suggestions
    test_cases: str  # Generated test cases
    explanation: str  # Overall code explanation
    formatted_code: Optional[str] = None  # Formatted code (if format was requested)
    correctness_score: Optional[int] = 100  # Score 0-100
    clarity_score: Optional[int] = 100  # Score 0-100
    best_practices_score: Optional[int] = 100  # Score 0-100
    performance_score: Optional[int] = 100  # Score 0-100
    overall_score: Optional[int] = 100  # Average of all scores
    created_at: datetime  # Timestamp
    
    class Config:
        from_attributes = True  # Allow creating from SQLAlchemy models


class CodeGenerationRequest(BaseModel):
    prompt: str
    language: str
    context: Optional[str] = None  # Optional existing code context


class CodeGenerationResponse(BaseModel):
    generated_code: str
    explanation: str


class CodeVisualizationRequest(BaseModel):
    code: str
    language: str


class CodeVisualizationResponse(BaseModel):
    steps: list
    explanation: str
    flow_diagram: Optional[str] = None


class CodeDiagramRequest(BaseModel):
    code: str
    language: str


class CodeDiagramResponse(BaseModel):
    diagram_code: str  # Mermaid diagram code
    diagram_type: str  # Type of diagram (flowchart, classDiagram, etc.)
    explanation: str


class CodeLessonRequest(BaseModel):
    code: str
    language: str


class CodeLessonResponse(BaseModel):
    lesson: str
    concepts: list[str] = []


class CodeFormatRequest(BaseModel):
    code: str
    language: str


class CodeFormatResponse(BaseModel):
    formatted_code: str
    changes_made: bool


class CodeExecutionRequest(BaseModel):
    code: str
    language: str


class CodeExecutionResponse(BaseModel):
    output: str
    error: Optional[str] = None
    exit_code: int
    execution_time: float


class SubmissionHistory(BaseModel):
    id: int
    code: str
    language: str
    errors: str
    suggestions: str
    test_cases: str
    explanation: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class ShareCodeRequest(BaseModel):
    code: str
    language: str
    title: Optional[str] = None


class ShareCodeResponse(BaseModel):
    share_id: str
    share_url: str
    expires_at: Optional[datetime] = None


class SharedCodeResponse(BaseModel):
    code: str
    language: str
    title: Optional[str] = None
    created_at: datetime


class CodeMetricsRequest(BaseModel):
    """
    Request schema for code metrics endpoint.
    
    Fields:
        code: The code to analyze (required)
        language: Programming language for language-specific analysis (required)
    """
    code: str
    language: str


class CodeMetricsResponse(BaseModel):
    """
    Response schema for code metrics endpoint.
    
    Contains comprehensive code statistics and metrics:
    - Line counts (total, code, comments, blank)
    - Structure counts (functions, classes, imports)
    - Complexity metrics (cyclomatic complexity, nesting depth)
    - Code distribution percentages
    - Line length statistics
    - Character counts
    """
    total_lines: int  # Total lines including blank lines
    code_lines: int  # Lines with actual code
    comment_lines: int  # Lines with comments
    blank_lines: int  # Empty lines
    function_count: int  # Number of functions/methods
    class_count: int  # Number of classes
    import_count: int  # Number of import statements
    complexity: int  # Cyclomatic complexity (decision points)
    max_nesting_depth: int  # Maximum indentation/nesting level
    code_percentage: float  # Percentage of code vs comments/blank
    comment_percentage: float  # Percentage of comments
    avg_line_length: float  # Average characters per line
    longest_line: int  # Longest line in characters
    characters: int  # Total characters including whitespace
    characters_no_whitespace: int  # Total characters excluding whitespace

