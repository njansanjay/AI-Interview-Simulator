from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

model = SentenceTransformer('all-MiniLM-L6-v2')
app = FastAPI()

def get_score(user_answer, ideal_answer):
    emb1 = model.encode([user_answer])
    emb2 = model.encode([ideal_answer])

    score = cosine_similarity(emb1, emb2)[0][0]
    return float(score)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "API working"}


# Questions
questions = [
    {"id": 1, "question": "Explain REST API"},
    {"id": 2, "question": "What is OOP?"}
]

@app.get("/questions")
def get_questions():
    return questions
ideal_answers = {
    1: "REST API is an architectural style that uses HTTP methods like GET POST PUT DELETE",
    2: "OOP is a programming paradigm based on objects classes inheritance polymorphism encapsulation"
}

# Store answers(Submit)
@app.post("/submit")
def submit_answer(data: dict):
    q_id = data["id"]
    user_ans = data["answer"]

    ideal = ideal_answers[q_id]
    score = get_score(user_ans, ideal)

    if score > 0.75:
        feedback = "Strong answer"
    elif score > 0.5:
        feedback = "Average answer"
    else:
        feedback = "Weak answer"

    return {
        "score": score,
        "feedback": feedback
    }