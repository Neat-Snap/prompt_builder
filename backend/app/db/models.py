from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Text, DateTime, Float, Table, BigInteger
from sqlalchemy.sql import func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()

Class User(Base):
    __tablename__ = "users"
    id = Column(BigInteger, primary_key=True, index=True)
    name = Column(String, nullable=True)
    email = Column(String, unique=True, index=True)
    created_at = Column(DateTime, default=func.now())
    is_verified = Column(Boolean, default=False)
    hashed_password = Column(String)
    is_banned = Column(Boolean, default=False)
    last_login = Column(DateTime, nullable=True)
    role = Column(String, default="user")
    color_theme = Column(String, default="light")

    projects = relationship("Project", back_populates="user")

Class Project(Base):
    __tablename__ = "projects"
    id = Column(BigInteger, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now())

    user_id = Column(BigInteger, ForeignKey("users.id"))
    user = relationship("User", back_populates="projects")

    prompts = relationship("Prompt", back_populates="project")

Class Prompt(Base):
    __tablename__ = "prompts"
    id = Column(BigInteger, primary_key=True, index=True)
    name = Column(String, nullable=False)
    project_id = Column(BigInteger, ForeignKey("projects.id"))
    project = relationship("Project", back_populates="prompts")
    versions = relationship("PromptVersion", back_populates="prompt")

class PromptVersion(Base):
    __tablename__ = "prompt_versions"
    id = Column(BigInteger, primary_key=True, index=True)
    prompt_id = Column(BigInteger, ForeignKey("prompts.id"))
    prompt = relationship("Prompt", back_populates="versions")
    version_number = Column(Integer, nullable=False)
    prompt_text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=func.now())
    runs = relationship("Run", back_populates="prompt_version")

class Run(Base):
    __tablename__ = "runs"
    id = Column(BigInteger, primary_key=True, index=True)
    prompt_version_id = Column(BigInteger, ForeignKey("prompt_versions.id"))
    prompt_version = relationship("PromptVersion", back_populates="runs")
    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=True)  # if you want to track who ran it
    started_at = Column(DateTime, default=func.now())
    finished_at = Column(DateTime, nullable=True)
    cost = Column(Float, nullable=True)
    success = Column(Boolean, nullable=True)
    result = Column(Text, nullable=True)

    prompt = relationship("Prompt", back_populates="runs")
    user = relationship("User")
    
