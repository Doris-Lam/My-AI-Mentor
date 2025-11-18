from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
from config import get_settings

settings = get_settings()

# Create database engine
# For psycopg3, we can use postgresql:// URL format, SQLAlchemy will use psycopg if available
# For local dev, replace 'db' with 'localhost' in the URL
db_url = settings.database_url.replace("postgresql://", "postgresql+psycopg://").replace("@db:", "@localhost:")
engine = create_engine(db_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class CodeSubmission(Base):
    __tablename__ = "code_submissions"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(Text, nullable=False)
    language = Column(String(50), nullable=False)
    errors = Column(Text, nullable=True)
    suggestions = Column(Text, nullable=True)
    test_cases = Column(Text, nullable=True)
    explanation = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    Base.metadata.create_all(bind=engine)

