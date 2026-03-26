import { useEffect, useState } from "react";

function App() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState({}); // store results per question
  const [totalScore, setTotalScore] = useState(0);


  // fetch questions from backend
  useEffect(() => {
    fetch("http://127.0.0.1:8000/questions")
      .then(res => res.json())
      .then(data => setQuestions(data));
  }, []);

  // handle input change
  const handleChange = (id, value) => {
    setAnswers(prev => ({
      ...prev,
      [id]: value
    }));
  };

  // submit answer
  const submitAnswer = (id) => {
    fetch("http://127.0.0.1:8000/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        id: id,
        answer: answers[id]
      })
    })
      .then(res => res.json())
      .then(data => {
        // store result instead of alert
        setResults(prev => {
  const updated = {
    ...prev,
    [id]: {
      score: data.score,
      feedback: data.feedback
    }
  };

  // calculate total score
  const scores = Object.values(updated).map(r => r.score);
  const avg =
    scores.reduce((a, b) => a + b, 0) / scores.length;

  setTotalScore(avg);

  return updated;
});
      });
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Interview Simulator</h1>
      {totalScore > 0 && (
  <div style={{ marginBottom: "20px" }}>
    <h2>Overall Score: {totalScore.toFixed(2)}</h2>
  </div>
)}

      {questions.map(q => (
        <div
  key={q.id}
  style={{
    marginBottom: "20px",
    border: "1px solid gray",
    padding: "15px",
    borderRadius: "10px"
  }}
>
          <h3>{q.question}</h3>

          <input
            type="text"
            placeholder="Type your answer"
            onChange={(e) => handleChange(q.id, e.target.value)}
          />

          <button
  onClick={() => submitAnswer(q.id)}
  disabled={!answers[q.id]}
>
            Submit
          </button>

          {/* show result under question */}
          {results[q.id] && (
            <div style={{ marginTop: "10px" }}>
              <p><b>Score:</b> {results[q.id].score.toFixed(2)}</p>
              <p><b>Feedback:</b> {results[q.id].feedback}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default App; 