from sqlalchemy import create_engine, Column, Integer, String, PickleType
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy import Float


engine = create_engine("sqlite:///questions.db")

SessionLocal = sessionmaker(bind=engine)

Base = declarative_base()

class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True)
    text = Column(String, unique=True)
    topic = Column(String)  # ✅ NEW
    embedding = Column(PickleType)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    role = Column(String, default="student")


class InterviewResult(Base):
    __tablename__ = "results"

    id = Column(Integer, primary_key=True)
    username = Column(String)
    score = Column(Float)  # store avg score
    total_questions = Column(Integer)

Base.metadata.create_all(engine)
    score = Column(Float)  # store avg score
    total_questions = Column(Integer)

Base.metadata.create_all(engine)
