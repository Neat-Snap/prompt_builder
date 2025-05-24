from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session
import loguru
from contextlib import contextmanager
from app.settings import settings

logger = loguru.logger

engine = create_engine(settings.DATABASE_URL)
SessionFactory = sessionmaker(autocommit=False, autoflush=False, bind=engine)
SessionLocal = scoped_session(SessionFactory)

@contextmanager
def get_db_session():
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception as e:
        session.rollback()
        logger.error(f"[DB] Error in session: {e}", exc_info=True)
        raise
    finally:
        session.close()