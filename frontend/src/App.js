import { useState,useEffect } from "react";
import API_URL from "./config";
import "./App.css";
import { GoogleLogin } from '@react-oauth/google';

function App() {
  const [topic, setTopic] = useState("");
  const [name, setName] = useState("");        
  const [username, setUsername] = useState(""); 
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [question, setQuestion] = useState("");
  const [quickQuestion, setQuickQuestion] = useState("");
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
  const [token, setToken] = useState("");
  const [loginMode, setLoginMode] = useState("none"); 
  const [invalidTopic, setInvalidTopic] = useState(false);
  const [users, setUsers] = useState([]);
  const [results, setResults] = useState([]);

useEffect(() => {
  const savedToken = localStorage.getItem("token");
  const savedRole = localStorage.getItem("role");

  if (savedToken) {
    setToken(savedToken);
    setRole(savedRole);
  }
}, []);

useEffect(() => {
  localStorage.setItem("mode", mode);
  localStorage.setItem("question", question);
  localStorage.setItem("currentIndex", currentIndex);
  localStorage.setItem("queue", JSON.stringify(queue));
  localStorage.setItem("scores", JSON.stringify(scores));
  localStorage.setItem("timeLeft", timeLeft);
  localStorage.setItem("name", name);
}, [mode, question, currentIndex, queue, scores, timeLeft, name]);

useEffect(() => {
  const savedMode = localStorage.getItem("mode");

  if (savedMode === "interview") {
    setMode("interview");
    setQuestion(localStorage.getItem("question") || "");
    setCurrentIndex(parseInt(localStorage.getItem("currentIndex")) || 0);
    setQueue(JSON.parse(localStorage.getItem("queue")) || []);
    setScores(JSON.parse(localStorage.getItem("scores")) || []);
    setTimeLeft(parseInt(localStorage.getItem("timeLeft")) || 30);
    setName(localStorage.getItem("name") || "");
  }
}, []);



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
  if (loginMode === "student") {
  if (!username.includes("@")) {
    alert("Enter valid email");
    return;
  }
}
    fetch(`${API_URL}/login`, {
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
  setToken(data.token);
  localStorage.setItem("token", data.token);

  setRole(data.role);
  localStorage.setItem("role", data.role);

  if (data.role === "student") {
    const extractedName = username.split("@")[0];
    setName(extractedName);
  }
} else {
  alert("Login failed");
}

});
};

  // generate question
const generateQuestion = async () => {
  setMode("quick");
  setInvalidTopic(false); // ✅ ADD THIS AT TOP

  try {
    const res = await fetch(`${API_URL}/generate-question/${topic.toLowerCase()}`);

    const data = await res.json();

    if (!data.question || data.question === "No questions found") {
      setQuickQuestion("");
      setAnswer("");
      setInvalidTopic(true);
      setResult(null);
      return;
    }

    setQuickQuestion(data.question);
  } catch (err) {
    console.error(err);
    alert("Server error");
  }
};
  const addQuestion = () => {
  fetch(`${API_URL}/add-question`, {
    method: "POST",
    headers: {
  "Content-Type": "application/json",
  "Authorization": "Bearer " + token
},
    body: JSON.stringify({
  text: newQuestion,
  topic: newTopic
})
  })
    .then(res => res.json())
    .then(data => {
      if (data.detail === "Unauthorized") {
  alert("Session expired. Login again.");
  logout();
  return;
}
      setAdminMsg(data.message);
      setNewQuestion("");
    })
    .catch(() => setAdminMsg("Error adding question"));
};

  // submit answer
  const submitAnswer = () => {
  fetch(`${API_URL}/submit-ai`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      question: question || quickQuestion,
      answer: answer,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (!data || typeof data.score !== "number") {
        console.error("Invalid response:", data);
        setResult({ score: 0, feedback: "Server error" });
        return;
      }

      setResult(data);

if (mode === "interview") {
  setLocked(true);

  // ✅ store score immediately
  setScores(prev => [
    ...prev,
    typeof data.score === "number" ? data.score : 0
  ]);
}
    })
    .catch((err) => {
      console.error("Submit error:", err);
      setResult({ score: 0, feedback: "Server error" });
    });
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
  fetch(`${API_URL}/public-questions`)
    .then(res => res.json())
    .then(data => setAllQuestions(data));
};

// delete
const deleteQuestion = (id) => {
  fetch(`${API_URL}/delete-question/${id}`, {
    method: "DELETE",
    headers: {
      "Authorization": "Bearer " + token
    }
  })
    .then(res => res.json())
    .then(data => {
      if (data.detail === "Unauthorized") {
        alert("Session expired. Login again.");
        logout();
        return;
      }

      fetchQuestions();
    });
};

const loadUsers = () => {
fetch(`${API_URL}/admin/users`, {
      headers: {
      Authorization: "Bearer " + token
    }
  })
    .then(res => res.json())
    .then(data => setUsers(data));

  // ALSO LOAD RESULTS
 fetch(`${API_URL}/admin/results`, {
    headers: {
      Authorization: "Bearer " + token
    }
  })
    .then(res => res.json())
    .then(data => setResults(data));
};


const deleteUser = (email) => {
  fetch(`${API_URL}/admin/delete-user/${email}`, {
    method: "DELETE",
    headers: {
      Authorization: "Bearer " + localStorage.getItem("token")
    }
  })
    .then(res => res.json())
    .then(() => loadUsers());
};

const deleteAdminResult = (id) => {
  fetch(`${API_URL}/admin/delete-result/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: "Bearer " + token
    }
  })
    .then(res => res.json())
    .then(() => loadUsers()); // reload everything
};

const loadResults = () => {
  fetch(`${API_URL}/admin/results`, {
    headers: {
      Authorization: "Bearer " + localStorage.getItem("token")
    }
  })
    .then(res => res.json())
    .then(data => setResults(data));
};

// start editing
const startEdit = (q) => {
  setEditingId(q.id);
  setEditText(q.text);
  setEditTopic(q.topic);
};

const logout = () => {
  localStorage.clear();
  setToken("");
  setRole(null);
};

// update
const updateQuestion = () => {
  fetch(`${API_URL}/update-question/${editingId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + token
    },
    body: JSON.stringify({
      text: editText,
      topic: editTopic
    })
  })
    .then(res => res.json())
    .then(data => {
      if (data.detail === "Unauthorized") {
        alert("Session expired. Login again.");
        logout();
        return;
      }

      setEditingId(null);
      fetchQuestions();
    });
};

const startInterview = () => {
  fetch(`${API_URL}/public-questions`)
    .then(res => res.json())
    .then(data => {
      console.log("DATA:", data);

      console.log("QUEUE LENGTH:", shuffled.length);

      if (!Array.isArray(data) || data.length === 0) {
        alert("No questions found in DB ❌");
        return;
      }

      const shuffled = data.sort(() => 0.5 - Math.random()).slice(0, 10);

      if (!shuffled[0]) {
        alert("Questions not loaded properly ❌");
        return;
      }

      setQueue(shuffled);
      setCurrentIndex(0);
      setScores([]);
      setMode("interview");

      setQuestion(shuffled[0].text); // safe now ✅
      setAnswer("");
      setResult(null);

      setTimeLeft(30);
      setLocked(false);
    })
    .catch(err => {
      console.error(err);
      alert("Failed to load questions ❌");
    });
};

const nextQuickQuestion = async () => {
  setAnswer("");

  const res = await fetch(`${API_URL}/generate-question/${topic.toLowerCase()}`);

  const data = await res.json();

  if (data.question) {
    setQuickQuestion(data.question);
  }
};


const handleAutoNext = () => {
  const updatedScores = scores;

  const next = currentIndex + 1;

  if (next >= queue.length) {
    setMode("normal");

    const avg =
      updatedScores.reduce((a, b) => a + b, 0) / updatedScores.length;

    fetch(`${API_URL}/save-result`, {
  method: "POST",
  headers: { 
    "Content-Type": "application/json",
    "Authorization": "Bearer " + token
  },
  body: JSON.stringify({
    score: avg.toFixed(2),
    total: 10
  })
})
  .then(res => res.json())
  .then(data => {
    console.log("SAVE RESULT:", data);
    loadUsers();
  })
  .catch(err => console.error(err));

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

const endInterview = () => {
  const finalScores = [...scores];

  // include current question score if exists
  if (result && result.score !== undefined) {
    finalScores.push(result.score);
  }

  if (finalScores.length === 0) {
    alert("No answers submitted");
    return;
  }

  const avg =
    finalScores.reduce((a, b) => a + b, 0) / finalScores.length;

  // save result
 fetch(`${API_URL}/save-result`, {
  method: "POST",
  headers: { 
    "Content-Type": "application/json",
    "Authorization": "Bearer " + token
  },
  body: JSON.stringify({
    score: avg.toFixed(2),
    total: finalScores.length
  })
})
.then(res => res.json())
.then(data => {
  console.log("SAVE RESULT RESPONSE:", data);
});
  setMode("normal");

  alert("Interview Ended! Avg Score: " + avg.toFixed(2));
};

const fetchHistory = () => {
  fetch(`${API_URL}/results`)
    .then(res => res.json())
    .then(data => setHistory(data));
};

const deleteResult = (id) => {
  fetch(`${API_URL}/delete-result/${id}`, {
    method: "DELETE",
    headers: {
  "Authorization": "Bearer " + token
}
  })
    .then(res => res.json())
.then(data => {
  if (data.detail === "Unauthorized") {
  alert("Session expired. Login again.");
  logout();
  return;
}
  if (data.message === "Unauthorized") {
    alert("Admin login required");
    return;
  }
  fetchHistory();
  loadLeaderboard();
})
    .catch((err) => {
  console.error(err);
  alert("Delete failed");
});
};

const clearResults = () => {
  fetch(`${API_URL}/clear-results`, {
  method: "DELETE",
  headers: {
  "Authorization": "Bearer " + token
}
})
    .then(res => res.json())
  .then(data => {
    if (data.detail === "Unauthorized") {
  alert("Session expired. Login again.");
  logout();
  return;
}
    if (data.message === "Unauthorized") {
      alert("Admin login required");
      return;
    }
    setHistory([]);  // only clear if success
  })
    .catch(() => alert("Clear failed"));
};

// const deleteHistory = (id) => {
//   fetch(`http://127.0.0.1:8000/delete-result/${id}`, {
//     method: "DELETE",
//     headers: {
//       "Authorization": "Bearer " + token
//     }
//   })
//   .then(res => res.json())
//   .then(data => {
//     console.log("DELETE HISTORY:", data);

//     if (data.message === "Unauthorized") {
//       alert("Admin login required");
//       return;
//     }

//     fetchHistory();
//     loadLeaderboard();
//   })
//   .catch(err => {
//     console.error(err);
//     alert("Delete failed");
//   });
// };

const clearLeaderboard = () => {
  fetch(`${API_URL}/clear-results`, {
    method: "DELETE",
    headers: {
  "Authorization": "Bearer " + token
}
  })
    .then(res => res.json())
.then(data => {
  if (data.message === "Unauthorized") {
    alert("Admin login required");
    return;
  }
  loadLeaderboard();
})
    .catch(() => alert("Clear failed"));
};

const clearHistory = () => {
  fetch(`${API_URL}/clear-results`, {
    method: "DELETE",
    headers: {
      "Authorization": "Bearer " + token
    }
  })
  .then(res => res.json())
  .then(data => {
    if (data.message === "Unauthorized") {
      alert("Admin login required");
      return;
    }

    fetchHistory();
  });
};

const deleteLeaderboard = (id) => {
  fetch(`${API_URL}/delete-leaderboard/${id}`, {
    method: "DELETE",
    headers: {
      "Authorization": "Bearer " + token
    }
  })
  .then(res => res.json())
  .then(data => {
    console.log("DELETE LEADERBOARD:", data);

    if (data.message === "Unauthorized") {
      alert("Admin login required");
      return;
    }

    loadLeaderboard();
  })
  .catch(err => {
    console.error(err);
    alert("Delete failed");
  });
};



const loadLeaderboard = () => {
  fetch(`${API_URL}/leaderboard`)
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

if (!token) {
  return (
    
    <div className="login-container">
  <div className="login-box">
      <h1>Login</h1>

      <button onClick={() => setLoginMode("student")}>
        Student Login
      </button>
        
      <button 
      className="secondary"
      onClick={() => setLoginMode("admin")}>
        Admin Login
      </button>

      <br /><br />

      {loginMode === "student" && (
        <>

<GoogleLogin
  clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}
  onSuccess={credentialResponse => {
    fetch(`${API_URL}/google-login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        token: credentialResponse.credential
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        setToken(data.token);
        localStorage.setItem("token", data.token);
        setRole("student");
        localStorage.setItem("role", "student");
        setName(data.name); // from Google
      }
    });
  }}
  onError={() => {
    console.log("Login Failed");
  }}
/>

          <input
            placeholder="Email"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <br />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button onClick={handleLogin}>Login</button>

          <button
            onClick={() => {
              fetch(`${API_URL}/signup`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  email: username,
                  password: password
                })
              })
                .then(res => res.json())
                .then(data => {
                  alert(data.success ? "Signup success" : "User exists");
                });
            }}
          >
            Signup
          </button>
        </>
      )}

      {loginMode === "admin" && (
        <>
          <input
            placeholder="Admin username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            type="password"
            placeholder="Admin password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button onClick={handleLogin}>Login as Admin</button>
        </>
      )}
      </div>
</div>
);
}

return (
  <div className="container">
    
    <div className="header">
  <h1>🎯 Interview Simulator</h1>

  {token && (
    <button className="logout-btn" onClick={logout}>
      Logout
    </button>
  )}
</div>
{/* <h2>🔐 Admin Login</h2>

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
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  setRole(null);
  setToken("");
  alert("Logged out");
}}
    style={{ marginLeft: "10px" }}
  >
    Logout
  </button>
)}
<hr />
<br></br> */}
{/* 🧑‍🎓 Student Interview */}
<div className="card">
  <h2>🧑‍🎓 Student Interview</h2>

  <input
    placeholder="Enter your name"
    value={name}
    onChange={(e) => setName(e.target.value)}
  />

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
  </button>
</div>

{mode === "interview" && question && (
  <div className="card question-box">
    
    <h2>{question}</h2>

    <p>Question {currentIndex + 1} / 10</p>
    <p>⏳ Time Left: {timeLeft}s</p>

    <textarea
      placeholder="Type your answer..."
      value={answer}
      onChange={(e) => setAnswer(e.target.value)}
      rows={4}
      disabled={locked}
    />

    <button onClick={startListening}>🎤 Speak</button>
    <button onClick={submitAnswer} disabled={locked}>Submit</button>

    <button onClick={endInterview} className="danger">
      End Interview
    </button>
    {result && (
  <div className="result-box">
    <h3>Score: {(result?.score ?? 0).toFixed(2)}</h3>
    <p>Feedback: {result.feedback}</p>
  </div>
)}
  </div>
)}

    


{/* ⚡ Quick Practice */}
<div className="card">
  <h2>⚡ Quick Practice</h2>

  <input
    placeholder="Enter topic (os, dbms, oops)"
    value={topic}
    onChange={(e) => setTopic(e.target.value)}
  />
  {invalidTopic && (
  <p style={{ color: "red", marginTop: "8px" }}>
    Invalid topic. Choose from os, dbms, oops.
  </p>
)}

  <button onClick={generateQuestion}>
    Generate Question
  </button>
</div>

{quickQuestion && (
  <div className="card question-box">



    <h2>{quickQuestion}</h2>

    <textarea
      placeholder="Type your answer..."
      value={answer}
      onChange={(e) => setAnswer(e.target.value)}
      rows={4}
    />

    <button onClick={startListening}>🎤 Speak</button>
<button onClick={submitAnswer}>Submit</button>

{mode === "quick" && (
  <button className="secondary" onClick={nextQuickQuestion}>
    Next Question
  </button>
  
)}
{result && (
  <div className="result-box">
    <h3>Score: {(result?.score ?? 0).toFixed(2)}</h3>
    <p>Feedback: {result.feedback}</p>
  </div>
)}
  </div>
)}


    {/* Admin Panel */}
    <div className="card">

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
  <button onClick={clearLeaderboard}>
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
{leaderboard.length > 0 && (
  <ul>
    {leaderboard.map((item) => (
  <li key={item.id}>
    #{item.id} — {item.username} : {item.score} / {item.total}

    {role === "admin" && (
  <button
    style={{ marginLeft: "10px" }}
onClick={() => deleteLeaderboard(item.id)}  >
    Delete
  </button>
)}
  </li>
))}
  </ul>
)}

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

{role === "admin" && (
  <div>
    <h2>Admin Dashboard</h2>

    <button onClick={loadUsers}>Load Users</button>

{users.length > 0 && (
  <>
    <h3>Users</h3>

    {users.map((u, i) => (
      <div className="user-row" key={i}>
        
        <div>
          <b>{u.email}</b>

          {/* RESULTS UNDER USER */}
          {results
            .filter(r =>
              
              r.username === u.email
            )
            .map((r, idx) => (
              <div key={idx} style={{ marginLeft: "15px", marginTop: "5px" }}>
                <div className="user-result">
                Score: {r.score}/{r.total}
        </div>

                <button
                  style={{ marginLeft: "10px" }}
                  onClick={() => deleteAdminResult(r.id)}
                >
                  Delete
                </button>
              </div>
            ))}
        </div>

        <button onClick={() => deleteUser(u.email)}>
          Delete
        </button>

      </div>
    ))}
  </>
)}    


  </div>
)}

    </div>
    
    


  </div>

);
}

export default App;