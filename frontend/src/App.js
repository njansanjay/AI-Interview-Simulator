import { useState,useEffect } from "react";

function App() {
  const [topic, setTopic] = useState("");
  const [name, setName] = useState("");        
  const [username, setUsername] = useState(""); 
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState(null);
  const [listening, setListening] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [newTopic, setNewTopic] = useState("");
  const [adminMsg, setAdminMsg] = useState("");
  const [allQuestions, setAllQuestions] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [editTopic, setEditTopic] = useState("");
  const [mode, setMode] = useState("normal"); // normal / interview
  const [timeLeft, setTimeLeft] = useState(30);
  const [locked, setLocked] = useState(false);
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scores, setScores] = useState([]);
  const [history, setHistory] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);


  // 🎤 Speech Recognition setup
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  const recognition = SpeechRecognition ? new SpeechRecognition() : null;

  if (recognition) {
    recognition.continuous = false;
    recognition.lang = "en-US";
    recognition.interimResults = false;
  }

  // 🎤 Start speaking
  const startListening = () => {
    if (!recognition) {
      alert("Speech Recognition not supported in this browser");
      return;
    }

    setListening(true);

    recognition.start();

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setAnswer((prev) => prev + " " + transcript);
      setListening(false);
    };

    recognition.onerror = () => {
      setListening(false);
      alert("Speech recognition error");
    };

    recognition.onend = () => {
      setListening(false);
    };
  };

  const handleLogin = () => {
  fetch("http://127.0.0.1:8000/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      username: username,
      password: password
    })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        setRole(data.role);
        setLoggedIn(true);
      } else {
        alert("Invalid login");
      }
    });
};

  // generate question
  const generateQuestion = () => {
    fetch(`http://127.0.0.1:8000/generate-question/${topic}`)
      .then((res) => res.json())
      .then((data) => {
        setQuestion(data.question);
        setResult(null);
        setAnswer("");
      })
      .catch(() => alert("Backend error"));
  };

  const addQuestion = () => {
  fetch("http://127.0.0.1:8000/add-question", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
    text: newQuestion,
    topic: newTopic,
    role: role
})
  })
    .then(res => res.json())
    .then(data => {
      setAdminMsg(data.message);
      setNewQuestion("");
    })
    .catch(() => setAdminMsg("Error adding question"));
};

  // submit answer
  const submitAnswer = () => {
    fetch("http://127.0.0.1:8000/submit-ai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question: question,
        answer: answer,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        setResult(data);

if (mode === "interview") {
  setLocked(true);
}


      })
      .catch(() => alert("Submit failed"));
  };

  useEffect(() => {
  if (locked && mode === "interview") {
    const t = setTimeout(() => {
      handleAutoNext();
    }, 2000);

    return () => clearTimeout(t);
  }
}, [locked]);

  // fetch all questions
const fetchQuestions = () => {
  fetch("http://127.0.0.1:8000/questions")
    .then(res => res.json())
    .then(data => setAllQuestions(data));
};

// delete
const deleteQuestion = (id) => {
  fetch(`http://127.0.0.1:8000/delete-question/${id}?role=${role}`, {
    method: "DELETE"
  })
    .then(res => res.json())
    .then(() => fetchQuestions());
};

// start editing
const startEdit = (q) => {
  setEditingId(q.id);
  setEditText(q.text);
  setEditTopic(q.topic);
};

// update
const updateQuestion = () => {
  fetch(`http://127.0.0.1:8000/update-question/${editingId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: editText,
      topic: editTopic
    })
  })
    .then(res => res.json())
    .then(() => {
      setEditingId(null);
      fetchQuestions();
    });
};

const startInterview = () => {
  fetch("http://127.0.0.1:8000/questions")
    .then(res => res.json())
    .then(data => {
      const shuffled = data.sort(() => 0.5 - Math.random()).slice(0, 10);

      setQueue(shuffled);
      setCurrentIndex(0);
      setScores([]);
      setMode("interview");

      setQuestion(shuffled[0].text);
      setAnswer("");
      setResult(null);

      setTimeLeft(30);
      setLocked(false);
    });
};

const handleAutoNext = () => {
  const updatedScores = [...scores, result ? result.score : 0];
  setScores(updatedScores);

  const next = currentIndex + 1;

  if (next >= queue.length) {
    setMode("normal");

    const avg =
      updatedScores.reduce((a, b) => a + b, 0) / updatedScores.length;

    fetch("http://127.0.0.1:8000/save-result", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
  username: name.trim(),
  score: avg.toFixed(2),
  total: 10
})
});

alert("Interview Finished! Avg Score: " + avg.toFixed(2));
    return;
  }

  setCurrentIndex(next);
  setQuestion(queue[next].text);
  setAnswer("");
  setResult(null);

  setTimeLeft(30);
  setLocked(false);
};

// const nextQuestion = () => {
//   const next = currentIndex + 1;

//   if (next >= queue.length) {
//     setMode("normal");
//     alert(
//       "Interview finished. Avg score: " +
//         (
//           scores.reduce((a, b) => a + b, 0) / scores.length
//         ).toFixed(2)
//     );
//     return;
//   }

//   setCurrentIndex(next);
//   setQuestion(queue[next].text);
//   setAnswer("");
//   setResult(null);
// };

const fetchHistory = () => {
  fetch("http://127.0.0.1:8000/results")
    .then(res => res.json())
    .then(data => setHistory(data));
};

const deleteResult = (id) => {
  fetch(`http://127.0.0.1:8000/delete-result/${id}`, {
    method: "DELETE"
  })
    .then(res => res.json())
    .then(() => {
      fetchHistory();   // ✅ correct function
      loadLeaderboard(); // ✅ also refresh leaderboard
    })
    .catch(() => alert("Delete failed"));
};

const clearResults = () => {
  fetch(`http://127.0.0.1:8000/clear-results?role=${role}`, {
    method: "DELETE"
  })
    .then(() => {
      setHistory([]);
    })
    .catch(() => alert("Clear failed"));
};

const loadLeaderboard = () => {
  fetch("http://127.0.0.1:8000/leaderboard")
    .then(res => res.json())
    .then(data => setLeaderboard(data))
    .catch(() => alert("Failed to load leaderboard"));
};

useEffect(() => {
  if (mode !== "interview") return;

  if (timeLeft <= 0) {
    handleAutoNext();
    return;
  }
  

  const timer = setTimeout(() => {
    setTimeLeft(prev => prev - 1);
  }, 1000);

  return () => clearTimeout(timer);
}, [timeLeft, mode]);

// if (!loggedIn) {
//   return (
//     <div style={{ padding: "20px" }}>
//       <h2>Login</h2>

//       <input
//         placeholder="Username"
//         value={username}
//         onChange={(e) => setUsername(e.target.value)}
//       />

//       <br /><br />

//       <input
//         type="password"
//         placeholder="Password"
//         value={password}
//         onChange={(e) => setPassword(e.target.value)}
//       />

//       <br /><br />

//       <button onClick={handleLogin}>Login</button>
//     </div>
//   );
// }

return (
  <div style={{ padding: "20px", maxWidth: "800px", margin: "auto" }}>
    
    <h1>🎯 Interview Simulator</h1>
<h2>🔐 Admin Login</h2>

<input
  placeholder="Admin username"
  value={username}
  onChange={(e) => setUsername(e.target.value)}
/>
<br></br>
<input
  type="password"
  placeholder="Admin password"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
/>

<button onClick={handleLogin}>Login as Admin</button>
{role === "admin" && (
  <button
    onClick={() => {
      setRole(null);
      alert("Logged out");
    }}
    style={{ marginLeft: "10px" }}
  >
    Logout
  </button>
)}
<hr />
<br></br>
<h2>🧑‍🎓Student </h2>
    <input
  placeholder="Enter your name"
  value={name}
  onChange={(e) => setName(e.target.value)}
/>
  

    {/* Generate */}
    <div style={{ marginBottom: "20px" }}>
      <input
        placeholder="Enter topic (os, dbms, oops)"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
      />
      <button onClick={generateQuestion} style={{ marginLeft: "10px" }}>
        Generate
      </button>
<button
  onClick={() => {
    if (!name.trim()) {
      alert("Enter name first");
      return;
    }
    startInterview();
  }}
>
  Start Interview (10 Q)
</button>    </div>

    {/* Question */}
    {question && (
      <div
        style={{
          border: "1px solid #ccc",
          padding: "15px",
          borderRadius: "10px",
          marginBottom: "20px"
        }}
      >
        <h2>{question}</h2>

        {mode === "interview" && (
  <>
    <p>Question {currentIndex + 1} / 10</p>
    <p>⏳ Time Left: {timeLeft}s</p>
  </>
)}

        <textarea
          placeholder="Type your answer..."
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          rows={4}
          style={{ width: "100%" }}
          
          disabled={locked}
        />

        <br />

        <button onClick={startListening}>🎤 Speak</button>
       <button
  onClick={submitAnswer}
  disabled={locked}   // ✅ ADD THIS
  style={{ marginLeft: "10px" }}
>
  Submit
</button>
      </div>
    )}

    {/* Result */}
    {result && (
      <div style={{ marginBottom: "20px" }}>
        <h3>Score: {result.score.toFixed(2)}</h3>
        <p>Feedback: {result.feedback}</p>
      </div>
    )}

    {/* Admin Panel */}
    <div
      style={{
        borderTop: "2px solid black",
        paddingTop: "20px",
        marginTop: "30px"
      }}
    >

      <h2>📊 Interview History</h2>
    {role === "admin" && (
  <button onClick={clearResults}>
    Clear All History
  </button>
)}
<button onClick={fetchHistory}>Load History</button>

{history.map((r) => (
  <li key={r.id}>
    {r.username} → {r.score} / {r.total}

    {role === "admin" && (
  <button
    style={{ marginLeft: "10px" }}
    onClick={() => deleteResult(r.id)}
  >
    Delete
  </button>
)}
  </li>
))}
      


      {/* <h2>📋 All Questions</h2>
<button onClick={fetchQuestions}>Load Questions</button> */}

<h2>🏆 Leaderboard</h2>
{role === "admin" && (
  <button onClick={clearResults}>
    Clear Leaderboard
  </button>
)}
<button onClick={loadLeaderboard}>Load Leaderboard</button>

{/* {allQuestions.map(q => (
  <div key={q.id} style={{ border: "1px solid gray", margin: "10px", padding: "10px" }}>
    
    {editingId === q.id ? (
      <>
        <input value={editTopic} onChange={(e)=>setEditTopic(e.target.value)} />
        <input value={editText} onChange={(e)=>setEditText(e.target.value)} />
        <button onClick={updateQuestion}>Save</button>
      </>
    ) : (
      <>
        <b>{q.topic}</b> — {q.text}
        <br />
        <button onClick={() => deleteQuestion(q.id)}>Delete</button>
        <button onClick={() => startEdit(q)}>Edit</button>
      </>
    )}

  </div>
))} */}

<hr />
      {role === "admin" && (
  <>
      
      <h2>⚙ Admin Panel</h2>
      <h2>📋 All Questions</h2>
<button onClick={fetchQuestions}>Load Questions</button>

{allQuestions.map(q => (
  <div key={q.id} style={{ border: "1px solid gray", margin: "10px", padding: "10px" }}>
    
    {editingId === q.id ? (
      <>
        <input value={editTopic} onChange={(e)=>setEditTopic(e.target.value)} />
        <input value={editText} onChange={(e)=>setEditText(e.target.value)} />
        <button onClick={updateQuestion}>Save</button>
      </>
    ) : (
      <>
        <b>{q.topic}</b> — {q.text}
        <br />
        <button onClick={() => deleteQuestion(q.id)}>Delete</button>
        <button onClick={() => startEdit(q)}>Edit</button>
      </>
    )}

  </div>
))}
<br></br>
<hr />
<h2> Add Questions</h2>
      <input
        placeholder="Topic"
        value={newTopic}
        onChange={(e) => setNewTopic(e.target.value)}
      />

      <textarea
        placeholder="New question"
        value={newQuestion}
        onChange={(e) => setNewQuestion(e.target.value)}
        rows={3}
        style={{ width: "100%" }}
      />

      <br />

      <button onClick={addQuestion}>Add Question</button>
      

      {adminMsg && (
        <p style={{ color: "green" }}>{adminMsg}</p>
      )}
      </>
)}
    </div>
    
    

{leaderboard.length > 0 && (
  <ul>
    {leaderboard.map((item) => (
  <li key={item.id}>
    #{item.id} — {item.username} : {item.score} / {item.total}

    {role === "admin" && (
  <button
    style={{ marginLeft: "10px" }}
    onClick={() => deleteResult(item.id)}
  >
    Delete
  </button>
)}
  </li>
))}
  </ul>
)}
  </div>

);
}

export default App;
