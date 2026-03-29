from openai import OpenAI

client = OpenAI(api_key="YOUR_API_KEY")
import random
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

app = FastAPI()

# load model
model = SentenceTransformer('all-MiniLM-L6-v2')

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# scoring function
def get_score(user_answer, ideal_answer):
    emb1 = model.encode([user_answer])
    emb2 = model.encode([ideal_answer])
    score = cosine_similarity(emb1, emb2)[0][0]
    return float(score)

@app.get("/")
def home():
    return {"message": "API working"}

# questions
# questions = [
#     {"id": 1, "question": "Explain REST API"},
#     {"id": 2, "question": "What is OOP?"}
# ]

# @app.get("/questions")
# def get_questions():
#     return questions

# ideal answers
ideal_answers = {
    1: "REST API allows communication between systems using HTTP",
    2: "OOP is a programming paradigm based on objects and classes"
}

# topics
topics = {
    "os": [
        "What is process vs thread?",
        "Explain deadlock",
        "What is paging?"
    ],
    "dbms": [
        "What is normalization?",
        "Explain ACID properties",
        "What is indexing?"
    ],
    "oops": [
        "What is polymorphism?",
        "Explain inheritance",
        "What is encapsulation?"
    ]
}

@app.get("/generate-question/{topic}")
def generate_question(topic: str):
    if topic.lower() not in topics:
        return {"question": "Invalid topic"}

    return {"question": random.choice(topics[topic.lower()])}

# submit answer
@app.post("/submit")
def submit_answer(data: dict):
    q_id = data["id"]
    user_ans = data["answer"]

    ideal = ideal_answers.get(q_id, "")
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



@app.post("/submit-ai")
def submit_ai_answer(data: dict):
    question = data["question"]
    user_ans = data["answer"]

    score = get_score(user_ans, question)

    # GPT feedback
    response = client.chat.completions.create(
    model="gpt-3.5-turbo",
    messages=[
        {"role": "system", "content": "You are an interview evaluator."},
        {
            "role": "user",
            "content": f"Question: {question}\nAnswer: {user_ans}\nGive feedback."
        }
    ]
)

feedback = response.choices[0].message.content

    feedback = response["choices"][0]["message"]["content"]

    return {
        "score": score,
        "feedback": feedback
    }


   

    
