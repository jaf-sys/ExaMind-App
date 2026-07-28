import { useState } from "react"

function AIFromText({ user, roomId, onQuizCreated, onBack, onClose }) {
  const [step, setStep] = useState(1)
  const [textContent, setTextContent] = useState("")
  const [quizDetails, setQuizDetails] = useState({
    title: "",
    numQuestions: 5,
    timeLimit: 30,
    difficulty: "Medium",
    attemptsAllowed: 1,
    publish_at: "",
    start_time: "",
    end_time: ""
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const BASE = "http://127.0.0.1:5000"

  const handleTextSubmit = (e) => {
    e.preventDefault()
    if (!textContent.trim()) {
      alert("Please paste some text content")
      return
    }
    if (textContent.trim().length < 50) {
      alert("Please paste more text (at least 50 characters)")
      return
    }
    setStep(2)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!quizDetails.title.trim()) {
      alert("Please enter quiz title")
      return
    }

    setLoading(true)
    setError("")

    try {
      const quizRes = await fetch(`${BASE}/quiz/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: quizDetails.title,
          time_limit: parseInt(quizDetails.timeLimit),
          room_id: roomId,
          user_id: user.user_id,
          topic: textContent.substring(0, 200),
          difficulty: quizDetails.difficulty,
          is_self_assessment: true,
          publish_at: quizDetails.publish_at || null,
          start_time: quizDetails.start_time || null,
          end_time: quizDetails.end_time || null
        })
      })

      const quizData = await quizRes.json()
      
      if (!quizRes.ok) {
        throw new Error(quizData.error || "Failed to create quiz")
      }

      const aiRes = await fetch(`${BASE}/ai/generate-from-text/${quizData.quiz_id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: textContent,
          num_questions: quizDetails.numQuestions,
          difficulty: quizDetails.difficulty
        })
      })

      const aiData = await aiRes.json()
      
      if (!aiRes.ok) {
        throw new Error(aiData.error || "AI generation failed")
      }

      alert(`Quiz created successfully with questions from your text!`)
      onQuizCreated(quizData.quiz_id)
      onClose()
      
    } catch (error) {
      console.error("Error:", error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (step === 1) {
    return (
      <div style={containerStyle}>
        <h3 style={titleStyle}>Generate from Text</h3>
        <p style={subtitleStyle}>Paste your study material and AI will create questions from it</p>
        
        {error && (
          <div style={errorStyle}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleTextSubmit}>
          <div style={formGroupStyle}>
            <label style={labelStyle}>
              Your Content <span style={requiredStyle}>*</span>
            </label>
            <textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              style={textareaStyle}
              placeholder="Paste your text content here... (articles, notes, chapters, etc.)"
              rows={8}
              required
            />
            <div style={charCounterStyle}>
              <span style={charCountStyle}>{textContent.length}</span> characters 
              {textContent.length < 50 && (
                <span style={warningStyle}> (minimum 50 required)</span>
              )}
            </div>
          </div>

          <div style={infoBoxStyle}>
            <span style={infoTextStyle}>
              Paste any study material - lecture notes, articles, or textbook excerpts. 
              AI will analyze the content and create relevant questions.
            </span>
          </div>

          <div style={actionRowStyle}>
            <button type="button" onClick={onBack} style={secondaryButtonStyle}>
              Back
            </button>
            <button 
              type="submit" 
              style={textContent.length < 50 ? disabledButtonStyle : primaryButtonStyle}
              disabled={textContent.length < 50}
            >
              Continue to Settings
            </button>
          </div>
        </form>
      </div>
    )
  }
  
  return (
    <div style={containerStyle}>
      <h3 style={titleStyle}>Quiz Settings</h3>
      
      {error && (
        <div style={errorStyle}>
          {error}
        </div>
      )}
      
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
            placeholder="e.g., Chapter 1 Review"
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

        <div style={previewBoxStyle}>
          <div style={previewHeaderStyle}>
            <span style={previewTitleStyle}>Content Preview</span>
            <button 
              type="button" 
              onClick={() => setStep(1)} 
              style={editButtonStyle}
            >
              Edit
            </button>
          </div>
          <p style={previewTextStyle}>
            {textContent.substring(0, 200)}...
            {textContent.length > 200 && (
              <span style={previewMoreStyle}> (truncated)</span>
            )}
          </p>
        </div>

        <div style={infoBoxStyle}>
          <span style={infoTextStyle}>
            AI will generate {quizDetails.numQuestions} questions based on your text
          </span>
        </div>

        <div style={actionRowStyle}>
          <button 
            type="button" 
            onClick={() => setStep(1)} 
            style={secondaryButtonStyle}
            disabled={loading}
          >
            Back to Text
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

const errorStyle = {
  backgroundColor: "#fef5f5",
  color: "#c0392b",
  padding: "10px 12px",
  borderRadius: "4px",
  fontSize: "12px",
  marginBottom: "16px",
  border: "1px solid #fadbd8"
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

const textareaStyle = {
  ...inputStyle,
  resize: "vertical",
  minHeight: "150px",
  fontFamily: "inherit"
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

const charCounterStyle = {
  marginTop: "4px",
  fontSize: "11px",
  color: "#95a5a6"
}

const charCountStyle = {
  fontWeight: "500",
  color: "#2c3e50"
}

const warningStyle = {
  color: "#e67e22"
}

const previewBoxStyle = {
  backgroundColor: "#f8f9fa",
  padding: "12px",
  borderRadius: "6px",
  marginBottom: "16px",
  border: "1px solid #e9ecef"
}

const previewHeaderStyle = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  marginBottom: "8px"
}

const previewTitleStyle = {
  fontSize: "11px",
  fontWeight: "600",
  color: "#546e7a",
  textTransform: "uppercase",
  letterSpacing: "0.3px",
  flex: 1
}

const editButtonStyle = {
  background: "none",
  border: "none",
  color: "#3498db",
  fontSize: "11px",
  fontWeight: "500",
  cursor: "pointer",
  padding: "2px 6px"
}

const previewTextStyle = {
  fontSize: "11px",
  color: "#2c3e50",
  lineHeight: "1.5",
  margin: 0
}

const previewMoreStyle = {
  color: "#95a5a6",
  fontStyle: "italic"
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

const disabledButtonStyle = {
  flex: 1,
  padding: "8px 16px",
  backgroundColor: "#bdc3c7",
  color: "white",
  border: "none",
  borderRadius: "4px",
  fontSize: "13px",
  fontWeight: "500",
  cursor: "not-allowed",
  opacity: 0.6
}

const loadingButtonStyle = {
  ...primaryButtonStyle,
  opacity: 0.8,
  cursor: "not-allowed"
}

export default AIFromText