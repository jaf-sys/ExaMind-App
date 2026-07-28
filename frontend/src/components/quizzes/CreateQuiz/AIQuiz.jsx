import { useState } from "react"

function AIQuiz({ user, roomId, onQuizCreated, onBack, onClose }) {
  const [quizDetails, setQuizDetails] = useState({
    title: "",
    topic: "",
    numQuestions: 5,
    timeLimit: 30,
    difficulty: "Medium",
    attemptsAllowed: 1,
    publish_at: "",
    start_time: "",
    end_time: ""
  })
  const [loading, setLoading] = useState(false)

  const BASE = "http://127.0.0.1:5000"

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!quizDetails.title.trim()) {
      alert("Please enter quiz title")
      return
    }
    
    if (!quizDetails.topic.trim()) {
      alert("Please enter a topic")
      return
    }

    setLoading(true)

    try {
      const quizData = {
        title: quizDetails.title,
        time_limit: parseInt(quizDetails.timeLimit),
        room_id: roomId,
        user_id: user.user_id,
        topic: quizDetails.topic,
        difficulty: quizDetails.difficulty,
        publish_at: quizDetails.publish_at || null,
        start_time: quizDetails.start_time || null,
        end_time: quizDetails.end_time || null
      }
      
      if (roomId) {
        quizData.attempts_allowed = quizDetails.attemptsAllowed
      }

      const quizRes = await fetch(`${BASE}/quiz/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quizData)
      })

      const responseData = await quizRes.json()

      if (!quizRes.ok) {
        throw new Error(responseData.error || "Failed to create quiz")
      }

      const aiRes = await fetch(`${BASE}/ai/generate-and-save/${responseData.quiz_id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          num_questions: quizDetails.numQuestions
        })
      })

      const aiData = await aiRes.json()
      
      if (!aiRes.ok) {
        throw new Error(aiData.error || "AI generation failed")
      }

      alert(`Quiz created with ${quizDetails.numQuestions} AI-generated questions!`)
      onQuizCreated()
      onClose()
      
    } catch (error) {
      console.error("Error:", error)
      alert("Failed: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={containerStyle}>
      <h3 style={titleStyle}>AI Quiz from Topic</h3>
      <p style={subtitleStyle}>Enter a topic and AI will generate questions automatically</p>
      
      <form onSubmit={handleSubmit}>
        <div style={formGroupStyle}>
          <label style={labelStyle}>
            Quiz Title <span style={requiredStyle}>*</span>
          </label>
          <input
            type="text"
            value={quizDetails.title}
            onChange={(e) => setQuizDetails({...quizDetails, title: e.target.value})}
            style={inputStyle}
            placeholder="e.g., JavaScript Basics Quiz"
            required
          />
        </div>

        <div style={formGroupStyle}>
          <label style={labelStyle}>
            Topic <span style={requiredStyle}>*</span>
          </label>
          <input
            type="text"
            value={quizDetails.topic}
            onChange={(e) => setQuizDetails({...quizDetails, topic: e.target.value})}
            style={inputStyle}
            placeholder="e.g., Python, World History, Algebra"
            required
          />
        </div>

        <div style={rowStyle}>
          <div style={halfWidthStyle}>
            <label style={labelStyle}>Number of Questions</label>
            <input
              type="number"
              value={quizDetails.numQuestions}
              onChange={(e) => setQuizDetails({...quizDetails, numQuestions: parseInt(e.target.value) || 5})}
              min="1"
              max="20"
              style={inputStyle}
            />
          </div>

          <div style={halfWidthStyle}>
            <label style={labelStyle}>Difficulty</label>
            <select
              value={quizDetails.difficulty}
              onChange={(e) => setQuizDetails({...quizDetails, difficulty: e.target.value})}
              style={selectStyle}
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
        </div>

        <div style={formGroupStyle}>
          <label style={labelStyle}>Time Limit (minutes)</label>
          <input
            type="number"
            value={quizDetails.timeLimit}
            onChange={(e) => setQuizDetails({...quizDetails, timeLimit: e.target.value})}
            min="1"
            max="180"
            style={inputStyle}
          />
        </div>

        {roomId && (
          <div style={formGroupStyle}>
            <label style={labelStyle}>Attempts Allowed</label>
            <input
              type="number"
              value={quizDetails.attemptsAllowed}
              onChange={(e) => setQuizDetails({...quizDetails, attemptsAllowed: parseInt(e.target.value) || 1})}
              min="1"
              max="10"
              style={inputStyle}
            />
            <span style={helperTextStyle}>Number of times students can attempt this quiz</span>
          </div>
        )}

        <div style={formGroupStyle}>
          <label style={labelStyle}>Auto-Publish Date & Time (Optional)</label>
          <input
            type="datetime-local"
            value={quizDetails.publish_at}
            onChange={(e) => setQuizDetails({...quizDetails, publish_at: e.target.value})}
            style={inputStyle}
          />
          <span style={helperTextStyle}>Quiz will automatically publish at this time</span>
        </div>

        <div style={rowStyle}>
          <div style={halfWidthStyle}>
            <label style={labelStyle}>Available From (Optional)</label>
            <input
              type="datetime-local"
              value={quizDetails.start_time}
              onChange={(e) => setQuizDetails({...quizDetails, start_time: e.target.value})}
              style={inputStyle}
            />
          </div>
          <div style={halfWidthStyle}>
            <label style={labelStyle}>Available Until (Optional)</label>
            <input
              type="datetime-local"
              value={quizDetails.end_time}
              onChange={(e) => setQuizDetails({...quizDetails, end_time: e.target.value})}
              style={inputStyle}
            />
          </div>
        </div>

        <div style={infoBoxStyle}>
          <span style={infoIconStyle}>✨</span>
          <span style={infoTextStyle}>
            AI will generate {quizDetails.numQuestions} multiple-choice questions about "{quizDetails.topic || 'your topic'}"
          </span>
        </div>

        <div style={actionRowStyle}>
          <button 
            type="button" 
            onClick={onBack} 
            style={secondaryButtonStyle}
            disabled={loading}
          >
            Back
          </button>
          <button 
            type="submit" 
            style={loading ? loadingButtonStyle : primaryButtonStyle}
            disabled={loading}
          >
            {loading ? "Generating..." : "Generate Quiz"}
          </button>
        </div>
      </form>
    </div>
  )
}

const containerStyle = {
  padding: "20px 24px"
}

const titleStyle = {
  fontSize: "15px",
  fontWeight: "500",
  color: "#2c3e50",
  margin: "0 0 4px 0"
}

const subtitleStyle = {
  fontSize: "12px",
  color: "#7f8c8d",
  margin: "0 0 20px 0",
  paddingBottom: "12px",
  borderBottom: "1px solid #e9ecef"
}

const formGroupStyle = {
  marginBottom: "16px"
}

const labelStyle = {
  display: "block",
  fontSize: "12px",
  fontWeight: "500",
  color: "#546e7a",
  marginBottom: "4px"
}

const requiredStyle = {
  color: "#e74c3c"
}

const helperTextStyle = {
  display: "block",
  fontSize: "11px",
  color: "#95a5a6",
  marginTop: "4px"
}

const inputStyle = {
  width: "100%",
  padding: "8px 12px",
  borderRadius: "4px",
  border: "1px solid #dee2e6",
  fontSize: "13px",
  outline: "none",
  transition: "border-color 0.2s",
  backgroundColor: "#ffffff",
  color: "#2c3e50",
  boxSizing: "border-box"
}

const selectStyle = {
  ...inputStyle,
  cursor: "pointer",
  backgroundColor: "#ffffff"
}

const rowStyle = {
  display: "flex",
  gap: "12px",
  marginBottom: "16px"
}

const halfWidthStyle = {
  flex: 1,
  minWidth: 0
}

const infoBoxStyle = {
  backgroundColor: "#f0f7ff",
  padding: "12px",
  borderRadius: "6px",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  marginBottom: "20px",
  border: "1px solid #d4e6f1"
}

const infoIconStyle = {
  fontSize: "16px"
}

const infoTextStyle = {
  fontSize: "12px",
  color: "#2c3e50",
  lineHeight: "1.5",
  flex: 1
}

const actionRowStyle = {
  display: "flex",
  gap: "10px",
  marginTop: "20px"
}

const primaryButtonStyle = {
  flex: 1,
  padding: "8px 16px",
  backgroundColor: "#2c3e50",
  color: "white",
  border: "none",
  borderRadius: "4px",
  fontSize: "13px",
  fontWeight: "500",
  cursor: "pointer"
}

const secondaryButtonStyle = {
  flex: 1,
  padding: "8px 16px",
  backgroundColor: "#ffffff",
  color: "#546e7a",
  border: "1px solid #dee2e6",
  borderRadius: "4px",
  fontSize: "13px",
  fontWeight: "500",
  cursor: "pointer"
}

const loadingButtonStyle = {
  ...primaryButtonStyle,
  opacity: 0.8,
  cursor: "not-allowed"
}

export default AIQuiz