def run_seed():
    import os
    from dotenv import load_dotenv
    from passlib.hash import bcrypt
    from backend.db import SessionLocal, Question, User
    from backend.utils import embed
    print("🚀 RUNNING SEED...")
    load_dotenv()

    ADMIN_EMAIL = os.getenv("ADMIN_EMAIL")
    ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")

    if not ADMIN_EMAIL or not ADMIN_PASSWORD:
        print("❌ Admin credentials missing")
        return

    session = SessionLocal()

    admin = session.query(User).filter_by(email=ADMIN_EMAIL).first()

    if not admin:
        admin = User(
            email=ADMIN_EMAIL,
            password=bcrypt.hash(ADMIN_PASSWORD[:72]),
            role="admin"
        )
        session.add(admin)
        session.commit()

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

    for topic, text in questions:
        exists = session.query(Question).filter_by(text=text).first()

    if exists:
    # 🔥 UPDATE OLD EMBEDDINGS
        exists.embedding = embed(text)
        exists.topic = topic
    else:
        session.add(Question(
        text=text,
        topic=topic,
        embedding=embed(text)
    ))

    session.commit()
    session.close()

    print("✅ Seed executed")