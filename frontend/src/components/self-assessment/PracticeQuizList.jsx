import { useState, useEffect } from "react"

function PracticeQuizList({ userId, refreshTrigger, onRetakeQuiz }) {
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [deleting, setDeleting] = useState(null)
  const [expandedQuiz, setExpandedQuiz] = useState(null)
  const [attempts, setAttempts] = useState({})

  const BASE = "http://127.0.0.1:5000"

  useEffect(() => {
    fetchPracticeQuizzes()
  }, [userId, refreshTrigger])

  const fetchPracticeQuizzes = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${BASE}/quiz/self/${userId}`)
      const data = await res.json()
      
      if (res.ok) {
        setQuizzes(data)
        fetchAttemptsForQuizzes(data)
      } else {
        setError("Failed to fetch quizzes")
      }
    } catch (error) {
      console.error("Error fetching practice quizzes:", error)
      setError("Failed to connect to server")
    } finally {
      setLoading(false)
    }
  }

  const fetchAttemptsForQuizzes = async (quizzes) => {
    try {
      const attemptsRes = await fetch(`${BASE}/attempt/user/${userId}/history`)
      const attemptsData = await attemptsRes.json()
      
      const attemptsMap = {}
      quizzes.forEach(quiz => {
        const quizAttempts = attemptsData.filter(a => a.quiz_id === quiz.quiz_id)
        attemptsMap[quiz.quiz_id] = {
          attempts: quizAttempts,
          lastScore: quizAttempts.length > 0 ? quizAttempts[0].percentage : null,
          attemptCount: quizAttempts.length,
          bestScore: quizAttempts.length > 0 ? Math.max(...quizAttempts.map(a => a.percentage)) : null
        }
      })
      setAttempts(attemptsMap)
    } catch (error) {
      console.error("Error fetching attempts:", error)
    }
  }

  const deleteQuiz = async (quizId, quizTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${quizTitle}"? This will also delete all attempts.`)) {
      return
    }
    
    setDeleting(quizId)
    try {
      const res = await fetch(`${BASE}/quiz/delete/${quizId}`, {
        method: "DELETE"
      })
      
      if (res.ok) {
        setQuizzes(quizzes.filter(q => q.quiz_id !== quizId))
        setExpandedQuiz(null)
      } else {
        const data = await res.json()
        alert(data.error || "Failed to delete quiz")
      }
    } catch (error) {
      console.error("Error deleting quiz:", error)
      alert("Failed to delete quiz")
    } finally {
      setDeleting(null)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return "#10b981"
    if (percentage >= 60) return "#f59e0b"
    return "#ef4444"
  }

  if (loading) {
    return (
      <div style={containerStyle}>
        <h3 style={sectionTitleStyle}>My Practice Quizzes</h3>
        <div style={loadingStyle}>Loading your practice quizzes...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={containerStyle}>
        <h3 style={sectionTitleStyle}>My Practice Quizzes</h3>
        <div style={errorStyle}>{error}</div>
      </div>
    )
  }

  if (quizzes.length === 0) {
    return (
      <div style={containerStyle}>
        <h3 style={sectionTitleStyle}>My Practice Quizzes</h3>
        <div style={emptyStyle}>
          <p>No practice quizzes yet. Generate your first quiz above!</p>
        </div>
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      <h3 style={sectionTitleStyle}>
        My Practice Quizzes
        <span style={countStyle}>{quizzes.length} quiz{quizzes.length !== 1 ? 'zes' : ''}</span>
      </h3>

      <div style={quizzesGridStyle}>
        {quizzes.map(quiz => {
          const quizAttempts = attempts[quiz.quiz_id] || { attempts: [], lastScore: null, attemptCount: 0, bestScore: null }
          
          return (
            <div key={quiz.quiz_id} style={quizCardStyle}>
              <div style={quizHeaderStyle}>
                <div style={quizTitleSectionStyle}>
                  <h4 style={quizTitleStyle}>{quiz.title}</h4>
                  <span style={difficultyBadgeStyle(quiz.difficulty)}>
                    {quiz.difficulty || "Medium"}
                  </span>
                </div>
                <div style={quizActionsStyle}>
                  <button
                    onClick={() => onRetakeQuiz(quiz.quiz_id)}
                    style={retakeButtonStyle}
                  >
                    Take Quiz
                  </button>
                  <button
                    onClick={() => deleteQuiz(quiz.quiz_id, quiz.title)}
                    disabled={deleting === quiz.quiz_id}
                    style={deleteButtonStyle}
                  >
                    {deleting === quiz.quiz_id ? "..." : "Delete"}
                  </button>
                </div>
              </div>

              <div style={quizInfoStyle}>
                <div style={infoRowStyle}>
                  <span style={infoLabelStyle}>Topic:</span>
                  <span style={infoValueStyle}>{quiz.topic || "General"}</span>
                </div>
                <div style={infoRowStyle}>
                  <span style={infoLabelStyle}>Time Limit:</span>
                  <span style={infoValueStyle}>{quiz.time_limit} minutes</span>
                </div>
                <div style={infoRowStyle}>
                  <span style={infoLabelStyle}>Created:</span>
                  <span style={infoValueStyle}>{formatDate(quiz.created_at)}</span>
                </div>
              </div>

              {quizAttempts.attemptCount > 0 && (
                <div style={statsContainerStyle}>
                  <div style={statBoxStyle}>
                    <span style={statLabelStyle}>Attempts</span>
                    <span style={statValueStyle}>{quizAttempts.attemptCount}</span>
                  </div>
                  <div style={statBoxStyle}>
                    <span style={statLabelStyle}>Best Score</span>
                    <span style={{...statValueStyle, color: getScoreColor(quizAttempts.bestScore)}}>
                      {quizAttempts.bestScore ? `${quizAttempts.bestScore}%` : "N/A"}
                    </span>
                  </div>
                  <div style={statBoxStyle}>
                    <span style={statLabelStyle}>Last Score</span>
                    <span style={{...statValueStyle, color: getScoreColor(quizAttempts.lastScore)}}>
                      {quizAttempts.lastScore ? `${quizAttempts.lastScore}%` : "N/A"}
                    </span>
                  </div>
                </div>
              )}

              <button
                onClick={() => setExpandedQuiz(expandedQuiz === quiz.quiz_id ? null : quiz.quiz_id)}
                style={expandButtonStyle}
              >
                {expandedQuiz === quiz.quiz_id ? "▼ Hide Attempts" : "▶ View Attempt History"}
              </button>

              {expandedQuiz === quiz.quiz_id && (
                <div style={attemptsSectionStyle}>
                  {quizAttempts.attempts.length === 0 ? (
                    <p style={noAttemptsStyle}>No attempts yet. Take the quiz to see your results!</p>
                  ) : (
                    <div style={attemptsListStyle}>
                      {quizAttempts.attempts.map((attempt, idx) => (
                        <div key={attempt.attempt_id} style={attemptItemStyle}>
                          <div style={attemptNumberStyle}>
                            Attempt #{quizAttempts.attempts.length - idx}
                          </div>
                          <div style={attemptScoreStyle}>
                            <span style={{...scoreValueStyle, color: getScoreColor(attempt.percentage)}}>
                              {attempt.percentage}%
                            </span>
                            <span style={scoreDetailStyle}>
                              ({attempt.score}/{attempt.total_questions})
                            </span>
                          </div>
                          <div style={attemptDateStyle}>
                            {formatDate(attempt.start_time)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

const containerStyle = {
  marginTop: "32px",
  paddingTop: "24px",
  borderTop: "2px solid #e2e8f0"
}

const sectionTitleStyle = {
  fontSize: "18px",
  fontWeight: "500",
  color: "#1e293b",
  margin: "0 0 20px 0",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center"
}

const countStyle = {
  fontSize: "13px",
  color: "#64748b",
  backgroundColor: "#f1f5f9",
  padding: "4px 10px",
  borderRadius: "20px"
}

const quizzesGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))",
  gap: "20px"
}

const quizCardStyle = {
  backgroundColor: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "10px",
  padding: "20px",
  transition: "box-shadow 0.2s"
}

const quizHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: "16px",
  flexWrap: "wrap",
  gap: "12px"
}

const quizTitleSectionStyle = {
  flex: 1
}

const quizTitleStyle = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#0f172a",
  margin: "0 0 8px 0"
}

const difficultyBadgeStyle = (difficulty) => ({
  display: "inline-block",
  padding: "2px 8px",
  borderRadius: "12px",
  fontSize: "11px",
  fontWeight: "500",
  backgroundColor: difficulty === "Easy" ? "#d1fae5" : difficulty === "Hard" ? "#fee2e2" : "#fef3c7",
  color: difficulty === "Easy" ? "#065f46" : difficulty === "Hard" ? "#991b1b" : "#92400e"
})

const quizActionsStyle = {
  display: "flex",
  gap: "8px"
}

const retakeButtonStyle = {
  padding: "6px 14px",
  backgroundColor: "#7071ae",
  color: "white",
  border: "none",
  borderRadius: "6px",
  fontSize: "12px",
  fontWeight: "500",
  cursor: "pointer",
  transition: "background-color 0.2s"
}

const deleteButtonStyle = {
  padding: "6px 14px",
  backgroundColor: "#ffffff",
  color: "#ef4444",
  border: "1px solid #ef4444",
  borderRadius: "6px",
  fontSize: "12px",
  fontWeight: "500",
  cursor: "pointer",
  transition: "all 0.2s"
}

const quizInfoStyle = {
  marginBottom: "16px",
  padding: "12px",
  backgroundColor: "#f8fafc",
  borderRadius: "6px"
}

const infoRowStyle = {
  display: "flex",
  gap: "8px",
  marginBottom: "4px",
  fontSize: "12px"
}

const infoLabelStyle = {
  fontWeight: "500",
  color: "#475569",
  minWidth: "70px"
}

const infoValueStyle = {
  color: "#1e293b"
}

const statsContainerStyle = {
  display: "flex",
  gap: "12px",
  marginBottom: "16px",
  padding: "12px",
  backgroundColor: "#f1f5f9",
  borderRadius: "6px"
}

const statBoxStyle = {
  flex: 1,
  textAlign: "center"
}

const statLabelStyle = {
  display: "block",
  fontSize: "11px",
  color: "#64748b",
  marginBottom: "4px"
}

const statValueStyle = {
  display: "block",
  fontSize: "18px",
  fontWeight: "600",
  color: "#0f172a"
}

const expandButtonStyle = {
  width: "100%",
  padding: "8px",
  backgroundColor: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "6px",
  fontSize: "12px",
  color: "#7071ae",
  cursor: "pointer",
  marginTop: "8px"
}

const attemptsSectionStyle = {
  marginTop: "12px",
  paddingTop: "12px",
  borderTop: "1px solid #e2e8f0"
}

const attemptsListStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "8px"
}

const attemptItemStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "8px 12px",
  backgroundColor: "#f8fafc",
  borderRadius: "6px",
  fontSize: "12px"
}

const attemptNumberStyle = {
  fontWeight: "500",
  color: "#475569"
}

const attemptScoreStyle = {
  display: "flex",
  alignItems: "center",
  gap: "6px"
}

const scoreValueStyle = {
  fontWeight: "600",
  fontSize: "14px"
}

const scoreDetailStyle = {
  color: "#64748b",
  fontSize: "11px"
}

const attemptDateStyle = {
  color: "#94a3b8",
  fontSize: "11px"
}

const noAttemptsStyle = {
  textAlign: "center",
  color: "#94a3b8",
  fontSize: "12px",
  padding: "12px"
}

const loadingStyle = {
  textAlign: "center",
  padding: "40px",
  color: "#64748b"
}

const errorStyle = {
  textAlign: "center",
  padding: "40px",
  color: "#ef4444",
  backgroundColor: "#fef2f2",
  borderRadius: "8px"
}

const emptyStyle = {
  textAlign: "center",
  padding: "40px",
  color: "#64748b",
  backgroundColor: "#f8fafc",
  borderRadius: "8px"
}

export default PracticeQuizList