# 🎯 Interview Simulator — AI-Based Mock Interview Platform
![Status](https://img.shields.io/badge/status-complete-brightgreen?style=for-the-badge)

Interview Simulator is a full-stack AI-powered mock interview platform where users can practice technical interviews with AI-based evaluation, real-time scoring, and admin-managed question banks.
It uses embeddings-based similarity and machine learning models to analyze answers and simulate real interview scenarios.

---

## ✨ Features

* 🤖 AI-based answer evaluation using embeddings
* 🎯 Topic-based question generation (OS, DBMS, OOPs, etc.)
* ⏱️ Timed mock interview mode (10 questions)
* 📊 Real-time scoring and feedback
* 🧑‍🎓 Student interview history tracking
* 🏆 Leaderboard system
* 🔐 Admin authentication (JWT-based)
* ⚙️ Admin panel to add, edit, delete questions

---

## 🧠 Tech Stack

### Frontend

* React
* Fetch API
* Speech Recognition API

### Backend

* FastAPI
* SQLAlchemy (ORM)
* SQLite (database)
* Sentence Transformers (AI scoring)
* JWT Authentication

---

## 📁 Project Structure

```
AI-Interview-Simulator/
├── backend/   # FastAPI backend (AI + DB)
├── frontend/  # React 
```

---

## ⚙️ Setup Instructions

### 1️⃣ Clone Repository

```
git clone https://github.com/njansanjay/AI-Interview-Simulator.git
cd AI-Interview-Simulator
```

---

### 2️⃣ Run Backend

```
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend runs on:

```
http://127.0.0.1:8000
```

---

### 3️⃣ Run Frontend

Open new terminal:

```
cd frontend
npm install
npm start
```

Frontend runs on:

```
http://localhost:3000
```

---

## 🧪 Usage

1. Open:

```
http://localhost:3000
```

2. Enter your name and choose a topic

3. Start interview and answer questions

4. Submit answers to get AI score + feedback

5. View leaderboard and history

---

## ⚠️ Limitations

* Basic AI evaluation (not fully semantic understanding)
* Local SQLite database (not scalable)
* No distributed backend support
---

## 🚀 Future Improvements

* 🔐 Advanced authentication system
* 🧠 LLM-based answer evaluation
* ☁️ Deployment (cloud hosting)
* 📊 Analytics dashboard
* 🗄️ PostgreSQL database

---

## 📸 Preview

```

 https://ai-interview-simulator-six.vercel.app/
```
---

## 🧑‍💻 Author

Sanjay.R

---

## 📄 License

This project is open-source and available under the MIT License.
