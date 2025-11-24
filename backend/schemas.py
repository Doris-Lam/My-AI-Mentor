from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class CodeAnalysisRequest(BaseModel):
    code: str
    language: str
    format: Optional[bool] = False


class CodeAnalysisResponse(BaseModel):
    id: int
    errors: str
    suggestions: str
    test_cases: str
    explanation: str
    formatted_code: Optional[str] = None
    correctness_score: Optional[int] = 100
    clarity_score: Optional[int] = 100
    best_practices_score: Optional[int] = 100
    performance_score: Optional[int] = 100
    overall_score: Optional[int] = 100
    created_at: datetime
    
    class Config:
        from_attributes = True


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
    code: str
    language: str


class CodeMetricsResponse(BaseModel):
    total_lines: int
    code_lines: int
    comment_lines: int
    blank_lines: int
    function_count: int
    class_count: int
    import_count: int
    complexity: int
    max_nesting_depth: int
    code_percentage: float
    comment_percentage: float
    avg_line_length: float
    longest_line: int
    characters: int
    characters_no_whitespace: int

