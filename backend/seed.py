import os
from dotenv import load_dotenv
from passlib.hash import bcrypt

from db import SessionLocal, Question, User
from utils import embed

# load env
load_dotenv()

ADMIN_EMAIL = os.getenv("ADMIN_EMAIL")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD").strip()

admin = User(
    email=ADMIN_EMAIL,
    password=bcrypt.hash(ADMIN_PASSWORD[:72]),
    role="admin"
)

# questions list
questions = [
    ("os", "What is process vs thread?"),
    ("os", "Explain deadlock"),
    ("os", "What is paging?"),
    ("os", "What is segmentation?"),
    ("os", "Explain virtual memory"),

    ("dbms", "What is normalization?"),
    ("dbms", "Explain ACID properties"),
    ("dbms", "What is indexing?"),
    ("dbms", "What is primary key?"),
    ("dbms", "What is foreign key?"),

    ("oops", "What is polymorphism?"),
    ("oops", "Explain inheritance"),
    ("oops", "What is encapsulation?"),
    ("oops", "What is abstraction?"),
    ("oops", "What is class and object?")
]

# ✅ CREATE SESSION ONCE
session = SessionLocal()

# =========================
# CREATE ADMIN
# =========================
admin = session.query(User).filter_by(email=ADMIN_EMAIL).first()

if not admin:
    admin = User(
        email=ADMIN_EMAIL,
        password=bcrypt.hash(ADMIN_PASSWORD[:72]),  # ✅ HASH PASSWORD
        role="admin"
    )
    session.add(admin)
    session.commit()


# =========================
# ADD QUESTIONS
# =========================
for topic, text in questions:
    exists = session.query(Question).filter_by(text=text).first()

    if not exists:
        new_q = Question(
            text=text,
            topic=topic,
            embedding=embed(text)
        )
        session.add(new_q)

session.commit()
session.close()

print("✅ Seeding completed.")

session.commit()
session.close()

print("Seeding completed.")
