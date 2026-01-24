"""
Database Models and Connection Management

This module handles database operations using SQLAlchemy ORM.
The database is OPTIONAL - the application works without it.

Features:
- SQLAlchemy ORM for database operations
- PostgreSQL support (can be adapted for other databases)
- Code submission history storage
- Automatic table creation

Note: If database connection fails, the app continues to work
but history features won't be available.
"""

from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
from config import get_settings

settings = get_settings()

# Create database engine
# For psycopg3, we can use postgresql:// URL format, SQLAlchemy will use psycopg if available
# For local dev, replace 'db' with 'localhost' in the URL (for Docker compatibility)
db_url = settings.database_url.replace("postgresql://", "postgresql+psycopg://").replace("@db:", "@localhost:")
engine = create_engine(db_url)  # Creates connection pool to database
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)  # Session factory
Base = declarative_base()  # Base class for all database models


class CodeSubmission(Base):
    """
    Database model for storing code analysis history.
    
    This table stores past code submissions and their analysis results.
    Allows users to view their code analysis history.
    
    Fields:
        id: Primary key (auto-incrementing)
        code: The submitted code (text field for large code)
        language: Programming language (python, java, etc.)
        errors: AI-detected errors (stored as text)
        suggestions: AI suggestions for improvement
        test_cases: Generated test cases
        explanation: AI explanation of the code
        created_at: Timestamp when submission was created
    """
    __tablename__ = "code_submissions"
    
    id = Column(Integer, primary_key=True, index=True)  # Auto-incrementing primary key
    code = Column(Text, nullable=False)  # The actual code (Text allows unlimited length)
    language = Column(String(50), nullable=False)  # Programming language
    errors = Column(Text, nullable=True)  # AI-detected errors
    suggestions = Column(Text, nullable=True)  # AI suggestions
    test_cases = Column(Text, nullable=True)  # Generated test cases
    explanation = Column(Text, nullable=True)  # AI explanation
    created_at = Column(DateTime, default=datetime.utcnow)  # Auto-set timestamp


def get_db():
    """
    Database session dependency for FastAPI endpoints.
    
    This is a generator function that:
    1. Creates a new database session
    2. Yields it to the endpoint
    3. Closes the session when done (even if an error occurs)
    
    Usage in FastAPI:
        @app.get("/endpoint")
        def my_endpoint(db: Session = Depends(get_db)):
            # Use db here
            pass
    
    Returns:
        Generator[Session]: Database session
    """
    db = SessionLocal()
    try:
        yield db  # Provide session to endpoint
    finally:
        db.close()  # Always close session, even on error


def init_db():
    """
    Initialize database by creating all tables.
    
    This creates the database tables if they don't exist.
    Safe to call multiple times - won't recreate existing tables.
    
    Note: This is called during app startup (in main.py lifespan).
    If it fails, the app continues without database features.
    """
    Base.metadata.create_all(bind=engine)  # Create all tables defined by Base subclasses

