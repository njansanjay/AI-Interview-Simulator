🎯 Interview Simulator — AI-Based Mock Interview Platform

"Status" (https://img.shields.io/badge/status-complete-brightgreen?style=for-the-badge)

Interview Simulator is a full-stack web application that helps users practice technical interviews with AI-based evaluation, real-time scoring, and admin-managed question banks.

---

🌐 Live Demo

👉 https://ai-interview-simulator-six.vercel.app/

---

📦 GitHub Repository

👉 https://github.com/njansanjay/AI-Interview-Simulator

---

✨ Features

* 🤖 AI-based answer evaluation using embeddings
* 🎯 Topic-based question generation (OS, DBMS, OOPs, etc.)
* ⏱️ Timed mock interview mode (10 questions)
* 📊 Score + feedback for each answer
* 🧑‍🎓 Student interview history tracking
* 🏆 Leaderboard system
* 🔐 Admin authentication (JWT-based)
* ⚙️ Admin panel to add, edit, delete questions

---

🧠 Tech Stack

Frontend

* React
* Fetch API
* Speech Recognition API

Backend

* FastAPI
* SQLAlchemy (ORM)
* SQLite (database)
* Sentence Transformers (AI scoring)
* JWT Authentication

---

📁 Project Structure

AI-Interview-Simulator/
├── backend/     # FastAPI backend (AI + DB)
├── frontend/    # React frontend

---

⚙️ Setup Instructions

1️⃣ Clone Repository

git clone https://github.com/njansanjay/AI-Interview-Simulator.git
cd AI-Interview-Simulator

---

2️⃣ Run Backend

cd backend
pip install -r requirements.txt
uvicorn main:app --reload

Backend runs on:

http://127.0.0.1:8000

---

3️⃣ Run Frontend

Open new terminal:

cd frontend
npm install
npm start

Frontend runs on:

http://localhost:3000

---

🧪 Usage

1. Enter your name
2. Select a topic or start full interview
3. Answer questions manually or using 🎤 speech
4. Submit answers to get AI score + feedback
5. View leaderboard and history

---

🔐 Admin Access

Username: admin  
Password: admin123

---

⚠️ Limitations

* Basic AI scoring (not fully semantic)
* Local SQLite database (not scalable)
* No distributed system support

---

🚀 Future Improvements

* 🌐 Backend deployment (Render / Railway)
* 🧠 LLM-based evaluation
* ☁️ PostgreSQL database
* 📊 Analytics dashboard
* 🔐 Advanced authentication system

---

🧑‍💻 Author

Sanjay.R
GitHub: https://github.com/njansanjay

---

📄 License

This project is open-source and available under the MIT License.
