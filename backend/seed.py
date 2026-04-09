from db import SessionLocal, Question
from utils import embed

session = SessionLocal()

questions = [
    # OS
    ("os", "What is process vs thread?"),
    ("os", "Explain deadlock"),
    ("os", "What is paging?"),
    ("os", "What is segmentation?"),
    ("os", "Explain virtual memory"),

    # DBMS
    ("dbms", "What is normalization?"),
    ("dbms", "Explain ACID properties"),
    ("dbms", "What is indexing?"),
    ("dbms", "What is primary key?"),
    ("dbms", "What is foreign key?"),

    # OOPS
    ("oops", "What is polymorphism?"),
    ("oops", "Explain inheritance"),
    ("oops", "What is encapsulation?"),
    ("oops", "What is abstraction?"),
    ("oops", "What is class and object?")
]

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

print("Seeding completed.")
