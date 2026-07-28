import { useState, useEffect } from "react"
import AttemptPanel from "../quizzes/AttemptPanel"
import AIFromText from "../quizzes/CreateQuiz/AIFromText"
import PracticeQuizList from "./PracticeQuizList"

function SelfAssessmentPanel({ user }) {
  const [broadCategory, setBroadCategory] = useState("")
  const [specificSubject, setSpecificSubject] = useState("")
  const [difficulty, setDifficulty] = useState("Easy")
  const [createdQuizId, setCreatedQuizId] = useState(null)
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [generationType, setGenerationType] = useState("topic")
  const [showTextGenerator, setShowTextGenerator] = useState(false)
  const [activeQuiz, setActiveQuiz] = useState(null)
  const [activeAttempt, setActiveAttempt] = useState(null)
  const [refreshList, setRefreshList] = useState(0)

  const BASE = "http://127.0.0.1:5000"

  const fetchQuizQuestions = async (quizId) => {
    try {
      const res = await fetch(`${BASE}/question/by-quiz/${quizId}`)
      const data = await res.json()
      return data.length > 0
    } catch (error) {
      console.error("Error fetching questions:", error)
      return false
    }
  }

  const startAttempt = async (quizId) => {
    try {
      const res = await fetch(`${BASE}/attempt/start/${quizId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.user_id })
      })
      
      const data = await res.json()
      
      if (res.ok) {
        setActiveAttempt(data.attempt_id)
        return true
      } else {
        alert(data.error || "Failed to start attempt")
        return false
      }
    } catch (error) {
      console.error("Error starting attempt:", error)
      alert("Failed to start attempt")
      return false
    }
  }

  const createSelfQuiz = async () => {
    if (!broadCategory.trim() || !specificSubject.trim()) {
      setError("Both fields are required")
      return
    }

    setLoading(true)
    setError("")
    
    try {
      const quizRes = await fetch(`${BASE}/quiz/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: specificSubject,
          time_limit: 20,
          room_id: null,
          user_id: user.user_id,
          topic: broadCategory,
          difficulty,
          is_self_assessment: true
        })
      })

      const quizData = await quizRes.json()

      if (!quizRes.ok) {
        throw new Error(quizData.error || "Quiz creation failed")
      }

      const aiRes = await fetch(`${BASE}/ai/generate-and-save/${quizData.quiz_id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          num_questions: 5
        })
      })

      const aiData = await aiRes.json()
      
      if (!aiRes.ok) {
        throw new Error(aiData.error || "AI generation failed")
      }

      const hasQuestions = await fetchQuizQuestions(quizData.quiz_id)
      
      if (hasQuestions) {
        setCreatedQuizId(quizData.quiz_id)
        setReady(true)
        const started = await startAttempt(quizData.quiz_id)
        if (started) {
          setActiveQuiz(quizData.quiz_id)
        }
        setRefreshList(prev => prev + 1)
      } else {
        throw new Error("No questions were generated")
      }
      
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setCreatedQuizId(null)
    setReady(false)
    setBroadCategory("")
    setSpecificSubject("")
    setDifficulty("Easy")
    setError("")
    setActiveQuiz(null)
    setActiveAttempt(null)
  }

  const handleTextQuizCreated = async (quizId) => {
    const hasQuestions = await fetchQuizQuestions(quizId)
    
    if (hasQuestions) {
      setCreatedQuizId(quizId)
      setReady(true)
      const started = await startAttempt(quizId)
      if (started) {
        setActiveQuiz(quizId)
      }
      setShowTextGenerator(false)
      setRefreshList(prev => prev + 1)
    } else {
      setError("Quiz was created but no questions were generated")
    }
  }

  const handleRetakeQuiz = async (quizId) => {
    const started = await startAttempt(quizId)
    if (started) {
      setActiveQuiz(quizId)
    }
  }

  const handleCloseAttempt = () => {
    setActiveQuiz(null)
    setActiveAttempt(null)
    setRefreshList(prev => prev + 1)
  }

  if (showTextGenerator) {
    return (
      <AIFromText
        user={user}
        roomId={null}
        onQuizCreated={handleTextQuizCreated}
        onBack={() => setShowTextGenerator(false)}
        onClose={() => setShowTextGenerator(false)}
      />
    )
  }

  if (activeQuiz && activeAttempt) {
    return (
      <AttemptPanel
        quizId={activeQuiz}
        attemptId={activeAttempt}
        user={user}
        onClose={handleCloseAttempt}
      />
    )
  }

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h2 style={titleStyle}>Self Assessment</h2>
        <p style={subtitleStyle}>Practice anytime with AI-generated quizzes</p>
      </div>

      <div style={toggleContainerStyle}>
        <button
          onClick={() => {
            setGenerationType("topic")
            setShowTextGenerator(false)
          }}
          style={{
            ...toggleButtonStyle,
            backgroundColor: generationType === "topic" && !showTextGenerator ? "#2c3e50" : "#f5f5f5",
            color: generationType === "topic" && !showTextGenerator ? "white" : "#666"
          }}
        >
          Generate from Topic
        </button>
        <button
          onClick={() => setShowTextGenerator(true)}
          style={{
            ...toggleButtonStyle,
            backgroundColor: showTextGenerator ? "#2c3e50" : "#f5f5f5",
            color: showTextGenerator ? "white" : "#666"
          }}
        >
          Generate from Text
        </button>
      </div>

      {error && (
        <div style={errorStyle}>
          {error}
        </div>
      )}

      {!createdQuizId && generationType === "topic" && !showTextGenerator && (
        <div style={formContainerStyle}>
          <div style={formGroupStyle}>
            <label style={labelStyle}>Broad Category</label>
            <input
              type="text"
              placeholder="e.g., Python, Algebra, World History"
              value={broadCategory}
              onChange={(e) => setBroadCategory(e.target.value)}
              style={inputStyle}
            />
            <span style={helperTextStyle}>For grouping your quizzes in analytics</span>
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>Quiz Subject</label>
            <input
              type="text"
              placeholder="e.g., Lists in Python, Quadratic Equations, World War II"
              value={specificSubject}
              onChange={(e) => setSpecificSubject(e.target.value)}
              style={inputStyle}
            />
            <span style={helperTextStyle}>What the AI will generate questions about</span>
          </div>

          <div style={actionRowStyle}>
            <div style={selectWrapperStyle}>
              <label style={labelStyle}>Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                style={selectStyle}
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            <button 
              onClick={createSelfQuiz} 
              disabled={loading}
              style={{
                ...createButtonStyle,
                opacity: loading ? 0.6 : 1,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? "Generating..." : "Generate Practice Quiz"}
            </button>
          </div>

          <div style={infoBoxStyle}>
            <span style={infoIconStyle}>✨</span>
            <div style={infoContentStyle}>
              <strong>How it works:</strong>
              <p>Enter a broad category for grouping, and a specific subject for the quiz. AI will generate questions about the specific subject.</p>
            </div>
          </div>
        </div>
      )}

      {createdQuizId && ready && !activeQuiz && (
        <div style={quizReadyContainerStyle}>
          <div style={quizReadyHeaderStyle}>
            <div>
              <h3 style={quizReadyTitleStyle}>{specificSubject || "AI Generated Quiz"}</h3>
              <p style={quizReadyMetaStyle}>
                {difficulty} • {broadCategory || "Custom"}
              </p>
            </div>
            <button 
              onClick={resetForm}
              style={newQuizButtonStyle}
            >
              + New Quiz
            </button>
          </div>
        </div>
      )}

      {createdQuizId && !ready && (
        <div style={generatingContainerStyle}>
          <div style={generatingSpinnerStyle}></div>
          <p style={generatingTextStyle}>AI is generating your questions...</p>
          <p style={generatingSubtextStyle}>This may take a few seconds</p>
        </div>
      )}

      <PracticeQuizList 
        userId={user.user_id} 
        refreshTrigger={refreshList}
        onRetakeQuiz={handleRetakeQuiz}
      />
    </div>
  )
}

const containerStyle = {
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  padding: "24px",
  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
  marginTop: "20px"
}

const headerStyle = {
  marginBottom: "24px"
}

const titleStyle = {
  fontSize: "18px",
  fontWeight: "500",
  color: "#1e293b",
  margin: "0 0 4px 0"
}

const subtitleStyle = {
  fontSize: "14px",
  color: "#64748b",
  margin: 0
}

const toggleContainerStyle = {
  display: "flex",
  gap: "12px",
  marginBottom: "24px",
  borderBottom: "1px solid #e2e8f0",
  paddingBottom: "16px"
}

const toggleButtonStyle = {
  padding: "8px 20px",
  borderRadius: "20px",
  fontSize: "14px",
  fontWeight: "500",
  border: "none",
  cursor: "pointer",
  transition: "all 0.2s"
}

const errorStyle = {
  backgroundColor: "#fef2f2",
  color: "#b91c1c",
  padding: "12px 16px",
  borderRadius: "8px",
  marginBottom: "20px",
  fontSize: "14px",
  border: "1px solid #fee2e2"
}

const formContainerStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "20px"
}

const formGroupStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "6px"
}

const labelStyle = {
  fontSize: "13px",
  fontWeight: "500",
  color: "#475569"
}

const helperTextStyle = {
  fontSize: "11px",
  color: "#94a3b8",
  marginTop: "2px"
}

const inputStyle = {
  padding: "10px 14px",
  borderRadius: "8px",
  border: "1px solid #e2e8f0",
  fontSize: "14px",
  outline: "none",
  transition: "border-color 0.2s",
  backgroundColor: "#ffffff",
  color: "#1e293b"
}

const actionRowStyle = {
  display: "flex",
  gap: "16px",
  alignItems: "flex-end",
  flexWrap: "wrap"
}

const selectWrapperStyle = {
  flex: 1,
  minWidth: "150px"
}

const selectStyle = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: "8px",
  border: "1px solid #e2e8f0",
  fontSize: "14px",
  outline: "none",
  backgroundColor: "#ffffff",
  color: "#1e293b",
  cursor: "pointer"
}

const createButtonStyle = {
  flex: 2,
  minWidth: "200px",
  padding: "10px 20px",
  backgroundColor: "#0f172a",
  color: "white",
  border: "none",
  borderRadius: "8px",
  fontSize: "14px",
  fontWeight: "500",
  transition: "background-color 0.2s"
}

const infoBoxStyle = {
  backgroundColor: "#f8fafc",
  borderRadius: "8px",
  padding: "16px",
  display: "flex",
  gap: "12px",
  border: "1px solid #e2e8f0",
  marginTop: "24px"
}

const infoIconStyle = {
  fontSize: "20px"
}

const infoContentStyle = {
  flex: 1,
  fontSize: "13px",
  color: "#475569",
  lineHeight: "1.5"
}

const quizReadyContainerStyle = {
  marginTop: "8px",
  marginBottom: "32px"
}

const quizReadyHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "20px",
  paddingBottom: "16px",
  borderBottom: "1px solid #eaeef2",
  flexWrap: "wrap",
  gap: "12px"
}

const quizReadyTitleStyle = {
  fontSize: "16px",
  fontWeight: "500",
  color: "#1e293b",
  margin: "0 0 4px 0"
}

const quizReadyMetaStyle = {
  fontSize: "13px",
  color: "#64748b",
  margin: 0
}

const newQuizButtonStyle = {
  padding: "8px 16px",
  backgroundColor: "#ffffff",
  color: "#0f172a",
  border: "1px solid #e2e8f0",
  borderRadius: "6px",
  fontSize: "13px",
  fontWeight: "500",
  cursor: "pointer",
  transition: "all 0.2s"
}

const generatingContainerStyle = {
  textAlign: "center",
  padding: "48px 24px",
  backgroundColor: "#f8fafc",
  borderRadius: "10px",
  border: "1px solid #e2e8f0",
  marginBottom: "32px"
}

const generatingSpinnerStyle = {
  width: "40px",
  height: "40px",
  border: "3px solid #e2e8f0",
  borderTopColor: "#0f172a",
  borderRadius: "50%",
  animation: "spin 1s linear infinite",
  margin: "0 auto 16px auto"
}

const generatingTextStyle = {
  fontSize: "16px",
  fontWeight: "500",
  color: "#1e293b",
  margin: "0 0 4px 0"
}

const generatingSubtextStyle = {
  fontSize: "13px",
  color: "#64748b",
  margin: 0
}

const style = document.createElement('style')
style.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`
document.head.appendChild(style)

export default SelfAssessmentPanel