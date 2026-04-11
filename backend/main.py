import random
import os
import uvicorn
from google.oauth2 import id_token
from google.auth.transport import requests
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sklearn.metrics.pairwise import cosine_similarity
from jose import JWTError, jwt
from datetime import datetime, timedelta
from fastapi import Header 
from fastapi import Depends
from backend.db import SessionLocal, Question, InterviewResult, User
from dotenv import load_dotenv
from fastapi import HTTPException
from passlib.hash import bcrypt
from backend.utils import embed
from backend.seed import run_seed
load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise Exception("SECRET_KEY missing in ENV")
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
if not GOOGLE_CLIENT_ID:
    print("⚠️ GOOGLE_CLIENT_ID missing")

app = FastAPI()

@app.on_event("startup")
async def startup_event():
    try:
        run_seed()
        print("✅ Seed executed safely")
    except Exception as e:
        print("❌ Seed failed:", e)

users = {
    "user": {"password": "123", "role": "user"},
    "admin": {"password": "admin123", "role": "admin"}
}

# SECRET_KEY = "mysecretkey"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60


def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# ✅ embedding function (YOU WERE MISSING THIS)
# def embed(text):
#     return model.encode(text)

# ✅ CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# ✅ FIND BEST QUESTION
# =========================

def find_best_match(user_question):
    session = SessionLocal()
    questions = session.query(Question).all()

    if not questions:
        session.close()
        return None, 0

    user_emb = embed(user_question)

    # ✅ NEW FAST METHOD
    all_embeddings = [q.embedding for q in questions]
    scores = cosine_similarity([user_emb], all_embeddings)[0]

    best_index = scores.argmax()
    best_q = questions[best_index]
    best_score = scores[best_index]

    session.close()
    return best_q, float(best_score)


# =========================
# ✅ FEEDBACK
# =========================

def get_feedback(answer):
    feedback = []

    if len(answer.split()) < 5:
        feedback.append("Answer is too short.")

    if "example" in answer.lower():
        feedback.append("Good use of example.")

    if "because" in answer.lower():
        feedback.append("Explanation is clear.")

    if not feedback:
        feedback.append("Decent answer.")

    return " ".join(feedback)


@app.post("/signup")
def signup(data: dict):
    session = SessionLocal()

    email = data.get("email")
    password = data.get("password")

    existing = session.query(User).filter_by(email=email).first()

    if existing:
        session.close()
        return {"success": False, "message": "User exists"}

    password = password[:72]   # truncate to avoid crash
    hashed = bcrypt.hash(password)

    new_user = User(
    email=email,
    password=hashed,
    role="student"
)

    session.add(new_user)
    session.commit()
    session.close()

    return {"success": True}

@app.get("/")
def home():
    return {"message": "API working"}

@app.post("/login")
def login(data: dict):
    username = data.get("username")
    password = data.get("password")

    # ✅ admin login
    if username in users and users[username]["password"] == password:
        token = create_access_token({
            "username": username,
            "role": users[username]["role"]
        })
        return {
            "success": True,
            "token": token,
            "role": users[username]["role"]
        }

    # ✅ student login (DB)
    session = SessionLocal()

    user = session.query(User).filter_by(email=username).first()

    if user and bcrypt.verify(password[:72], user.password):
        token = create_access_token({
            "username": user.email,
            "role": user.role
        })
        session.close()
        return {
            "success": True,
            "token": token,
            "role": user.role
        }

    session.close()
    return {"success": False}
    


def verify_token(authorization: str = Header(None)):
    if not authorization:
        return None

    try:
        token = authorization.split(" ")[1]
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except:
        return None


# =========================
# ✅ GENERATE QUESTION
# =========================

@app.post("/google-login")
def google_login(data: dict):
    token = data.get("token")

    try:
        idinfo = id_token.verify_oauth2_token(
            token,
            requests.Request(),
            GOOGLE_CLIENT_ID
        )

        email = idinfo["email"]
        name = idinfo.get("name", "")

        # ✅ ADD THIS BLOCK HERE
        session = SessionLocal()

        user = session.query(User).filter_by(email=email).first()

        if not user:
            user = User(email=email, password="", role="student")
            session.add(user)
            session.commit()

        session.close()
        # ✅ END OF BLOCK

        jwt_token = create_access_token({
            "username": email,
            "role": "student"
        })

        return {
            "success": True,
            "token": jwt_token,
            "name": name
        }

    except Exception as e:
        print(e)
        return {"success": False}



@app.get("/admin/results")
def get_results(token_data: dict = Depends(verify_token)):

    if token_data["role"] != "admin":
        return {"error": "Not authorized"}

    session = SessionLocal()
    results = session.query(InterviewResult).all()
    session.close()

    return [
        {
            "id": r.id,
            "username": r.username,
            "score": r.score,
            "total": r.total_questions
        }
        for r in results
    ]

# used_questions = set()

@app.get("/generate-question/{topic}")
def generate_question(topic: str):
    session = SessionLocal()

    questions = session.query(Question).filter_by(topic=topic.lower()).all()

    if not questions:
        session.close()
        return {"question": "No questions found"}

    available = questions

    if not available:
        used_questions.clear()
        available = questions

    q = random.choice(available)
    # used_questions.add(q.text)

    session.close()

    return {"question": q.text}


# =========================
# ✅ SUBMIT ANSWER
# =========================

@app.post("/submit-ai")
def submit_ai_answer(data: dict):
    try:
        user_question = data.get("question", "")
        user_answer = data.get("answer", "")

        if not user_question or not user_answer:
            return {"score": 0, "feedback": "Invalid input"}

        best_q, similarity = find_best_match(user_question)

        if best_q is None:
            return {
                "score": 0,
                "feedback": "No matching question in database"
            }

        answer_score = cosine_similarity(
            [embed(user_answer)],
            [best_q.embedding]
        )[0][0]

        feedback = get_feedback(user_answer)

        return {
            "score": float(answer_score),
            "feedback": feedback,
            "matched_question": best_q.text,
            "match_confidence": similarity
        }

    except Exception as e:
        print("Error:", e)
        return {
            "score": 0,
            "feedback": "Server error"
        }

@app.post("/add-question")
def add_question(data: dict, user=Depends(verify_token)):
    if not user or user["role"] != "admin":
        raise HTTPException(status_code=401, detail="Unauthorized")

    try:
        text = data.get("text", "")
        topic = data.get("topic", "")

        if not text or not topic:
            return {"message": "Invalid input"}

        session = SessionLocal()

        # check duplicate
        exists = session.query(Question).filter_by(text=text).first()
        if exists:
            session.close()
            return {"message": "Question already exists"}

        new_q = Question(
            text=text,
            topic=topic.lower(),
            embedding=embed(text)
        )

        session.add(new_q)
        session.commit()
        session.close()

        return {"message": "Question added successfully"}

    except Exception as e:
        print("Error:", e)
        return {"message": "Server error"}
    
# =========================
# ✅ GET ALL QUESTIONS
# =========================
@app.get("/questions")
def get_all_questions(user=Depends(verify_token)):
    if not user or user["role"] != "admin":
        raise HTTPException(status_code=401, detail="Unauthorized")

    session = SessionLocal()
    questions = session.query(Question).all()
    session.close()

    return [
        {"id": q.id, "text": q.text, "topic": q.topic}
        for q in questions
    ]

@app.get("/public-questions")
def public_questions():
    session = SessionLocal()
    questions = session.query(Question).all()
    session.close()

    return [
        {"id": q.id, "text": q.text, "topic": q.topic}
        for q in questions
    ]


# =========================
# ✅ DELETE QUESTION
# =========================
@app.delete("/delete-question/{qid}")
def delete_question(qid: int, user=Depends(verify_token)):
    if not user or user["role"] != "admin":
        raise HTTPException(status_code=401, detail="Unauthorized")

    session = SessionLocal()
    q = session.query(Question).filter_by(id=qid).first()

    if not q:
        session.close()
        return {"message": "Not found"}

    session.delete(q)
    session.commit()
    session.close()

    return {"message": "Deleted successfully"}


# =========================
# ✅ UPDATE QUESTION
# =========================
@app.put("/update-question/{qid}")
def update_question(qid: int, data: dict, user=Depends(verify_token)):
    if not user or user["role"] != "admin":
        raise HTTPException(status_code=401, detail="Unauthorized")
    session = SessionLocal()
    q = session.query(Question).filter_by(id=qid).first()

    if not q:
        session.close()
        return {"message": "Not found"}

    new_text = data.get("text", "")
    new_topic = data.get("topic", "")

    if new_text:
        q.text = new_text
        q.embedding = embed(new_text)  # update embedding

    if new_topic:
        q.topic = new_topic.lower()

    session.commit()
    session.close()

    return {"message": "Updated successfully"}



#STORE RESULT

@app.post("/save-result")
def save_result(data: dict, user=Depends(verify_token)):

    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")

    session = SessionLocal()

    username = user["username"]   # ✅ ALWAYS EMAIL FROM TOKEN
    score = float(data.get("score", 0))
    total = data.get("total", 0)

    new_result = InterviewResult(
        username=username,
        score=score,
        total_questions=total
    )

    session.add(new_result)
    session.commit()
    session.close()

    return {"message": "Result saved"}

@app.get("/results")
def get_results():
    session = SessionLocal()
    results = session.query(InterviewResult).all()
    session.close()

    return [
    {
        "id": r.id,
        "username": r.username,
        "score": r.score,
        "total": r.total_questions
    }
        for r in results
    ]

@app.delete("/delete-result/{id}")
def delete_result(id: int, user=Depends(verify_token)):
    if not user or user["role"] != "admin":
        raise HTTPException(status_code=401, detail="Unauthorized")

    session = SessionLocal()
    result = session.query(InterviewResult).filter_by(id=id).first()

    if result:
        session.delete(result)
        session.commit()

    session.close()
    return {"message": "Deleted"}

@app.delete("/clear-results")
def clear_results(user=Depends(verify_token)):
    if not user or user["role"] != "admin":
        raise HTTPException(status_code=401, detail="Unauthorized")

    session = SessionLocal()
    session.query(InterviewResult).delete()
    session.commit()
    session.close()

    return {"message": "All results cleared"}

@app.delete("/delete-leaderboard/{id}")
def delete_leaderboard(id: int, user=Depends(verify_token)):
    if not user or user["role"] != "admin":
        raise HTTPException(status_code=401, detail="Unauthorized")

    session = SessionLocal()
    result = session.query(InterviewResult).filter_by(id=id).first()

    if result:
        session.delete(result)
        session.commit()

    session.close()
    return {"message": "Deleted from leaderboard"}

@app.get("/leaderboard")
def leaderboard():
    session = SessionLocal()

    results = session.query(InterviewResult)\
        .order_by(InterviewResult.score.desc())\
        .limit(5)\
        .all()

    session.close()

    return [
    {
        "id": r.id,
        "username": r.username,
        "score": r.score,
        "total": r.total_questions
    }
        for r in results
    ]

@app.get("/admin/users")
def get_users(token_data: dict = Depends(verify_token)):
    
    if token_data["role"] != "admin":
        return {"error": "Not authorized"}

    session = SessionLocal()
    users = session.query(User).all()
    session.close()

    return [{"email": u.email, "role": u.role} for u in users]


@app.delete("/admin/delete-result/{id}")
def delete_result_admin(id: int, authorization: str = Header(None)):
    data = verify_token(authorization)

    if not data or data["role"] != "admin":
        return {"message": "Unauthorized"}

    session = SessionLocal()

    result = session.query(InterviewResult).filter_by(id=id).first()

    if result:
        session.delete(result)
        session.commit()

    session.close()
    return {"message": "Deleted"}

if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000)


