from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Text, DateTime, Float, Table, BigInteger, JSON
from sqlalchemy.sql import func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
import loguru
from app.db.session import engine

logger = loguru.logger

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(BigInteger, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True)
    created_at = Column(DateTime, default=func.now())
    is_verified = Column(Boolean, default=False)
    hashed_password = Column(String, nullable=False)
    is_banned = Column(Boolean, default=False)
    last_login = Column(DateTime, nullable=True)
    role = Column(String, default="user")
    color_theme = Column(String, default="light")
    keys = Column(JSON, nullable=True)

    projects = relationship("Project", back_populates="user")

    def to_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}

class Project(Base):
    __tablename__ = "projects"
    id = Column(BigInteger, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now())
    keys = Column(JSON, nullable=True)

    user_id = Column(BigInteger, ForeignKey("users.id"))
    user = relationship("User", back_populates="projects")

    prompts = relationship("Prompt", back_populates="project")
    tests = relationship("TestSet", back_populates="project")

    def to_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}

class Prompt(Base):
    __tablename__ = "prompts"
    id = Column(BigInteger, primary_key=True, index=True)
    name = Column(String, nullable=False)
    project_id = Column(BigInteger, ForeignKey("projects.id"))
    project = relationship("Project", back_populates="prompts")
    versions = relationship("PromptVersion", back_populates="prompt", cascade="all, delete-orphan")
    runs = relationship("Run", back_populates="prompt")

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if 'prompt_text' in kwargs:
            self.versions.append(PromptVersion(
                prompt_text=kwargs['prompt_text'],
                version_number=1
            ))

    def to_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}

class PromptVersion(Base):
    __tablename__ = "prompt_versions"
    id = Column(BigInteger, primary_key=True, index=True)
    prompt_id = Column(BigInteger, ForeignKey("prompts.id", ondelete="CASCADE"))
    prompt = relationship("Prompt", back_populates="versions")
    version_number = Column(Integer, nullable=False)
    prompt_text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=func.now())
    comments = Column(JSON, nullable=True)
    runs = relationship("Run", back_populates="prompt_version")

    def create_run(self, user_id=None, result=None, success=None, cost=None):
        run = Run(
            prompt_version_id=self.id,
            prompt_id=self.prompt_id,
            user_id=user_id,
            result=result,
            success=success,
            cost=cost,
            started_at=func.now()
        )
        self.runs.append(run)
        return run

    def to_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}

class Run(Base):
    __tablename__ = "runs"
    id = Column(BigInteger, primary_key=True, index=True)
    prompt_version_id = Column(BigInteger, ForeignKey("prompt_versions.id"))
    prompt_version = relationship("PromptVersion", back_populates="runs")
    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=True)
    started_at = Column(DateTime, default=func.now())
    finished_at = Column(DateTime, nullable=True)
    cost = Column(Float, nullable=True)
    success = Column(Boolean, nullable=True)
    result = Column(Text, nullable=True)
    prompt_id = Column(BigInteger, ForeignKey("prompts.id"))

    user = relationship("User")
    prompt = relationship("Prompt", back_populates="runs")

    def to_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}


class TestSet(Base):
    __tablename__ = "testsets"
    id = Column(BigInteger, primary_key=True, index=True)
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=func.now())
    tests = Column(JSON, nullable=True)
    project_id = Column(BigInteger, ForeignKey("projects.id"))
    project = relationship("Project", back_populates="tests")

    def to_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}

Base.metadata.create_all(bind=engine)
logger.info("Created all tables")