import { useState, useEffect } from "react"
import AttemptPanel from "./AttemptPanel"
import EditQuizModal from "./EditQuizModal"
import QuizAttendance from "./QuizAttendance"
import QuizViewModal from "./QuizViewModal"
import CheatLogs from "../analytics/CheatLogs"

function QuizList({ user, roomId, role, onSelectQuiz, refreshTrigger }) {
  const [quizzes, setQuizzes] = useState([])
  const [selectedQuiz, setSelectedQuiz] = useState(null)
  const [selectedAttemptId, setSelectedAttemptId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [editingQuiz, setEditingQuiz] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [viewingQuiz, setViewingQuiz] = useState(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showCheatLogs, setShowCheatLogs] = useState(false)
  const [attemptStatus, setAttemptStatus] = useState({})

  const BASE = "http://127.0.0.1:5000"

  useEffect(() => {
    if (roomId) {
      fetchQuizzes()
    }
  }, [roomId, refreshTrigger])

  useEffect(() => {
    if (role === "student" && quizzes.length > 0) {
      fetchAttemptStatus()
    }
  }, [quizzes, user])

  const fetchQuizzes = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${BASE}/quiz/by-room/${roomId}?user_id=${user.user_id}`)
      const data = await res.json()
      setQuizzes(data)
    } catch (error) {
      console.error("Failed to fetch quizzes:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAttemptStatus = async () => {
    try {
      const res = await fetch(`${BASE}/attempt/user/${user.user_id}/history`)
      const data = await res.json()
      
      const status = {}
      quizzes.forEach(quiz => {
        const attempts = data.filter(a => a.quiz_id === quiz.quiz_id)
        const completedAttempts = attempts.filter(a => a.status === 'completed')
        const lastAttempt = completedAttempts.length > 0 ? completedAttempts[0] : null
        
        status[quiz.quiz_id] = {
          attempted: attempts.length > 0,
          count: attempts.length,
          completedCount: completedAttempts.length,
          lastScore: lastAttempt ? lastAttempt.percentage : null,
          maxAllowed: quiz.attempts_allowed || 1,
          canAttempt: attempts.length < (quiz.attempts_allowed || 1)
        }
      })
      setAttemptStatus(status)
    } catch (error) {
      console.error("Error fetching attempt status:", error)
    }
  }

  const publishQuiz = async (quizId) => {
    try {
      const res = await fetch(`${BASE}/quiz/publish/${quizId}`, {
        method: "POST"
      })
      if (res.ok) {
        fetchQuizzes()
      } else {
        const data = await res.json()
        alert(data.error || "Failed to publish quiz")
      }
    } catch (error) {
      console.error("Error publishing quiz:", error)
    }
  }

  const unpublishQuiz = async (quizId) => {
    try {
      const res = await fetch(`${BASE}/quiz/unpublish/${quizId}`, {
        method: "POST"
      })
      if (res.ok) {
        fetchQuizzes()
      } else {
        const data = await res.json()
        alert(data.error || "Failed to unpublish quiz")
      }
    } catch (error) {
      console.error("Error unpublishing quiz:", error)
    }
  }

  const deleteQuiz = async (quizId, quizTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${quizTitle}"?`)) {
      return
    }
    setDeleting(true)
    try {
      const res = await fetch(`${BASE}/quiz/delete/${quizId}`, {
        method: "DELETE"
      })
      if (res.ok) {
        fetchQuizzes()
      } else {
        const data = await res.json()
        alert(data.error || "Failed to delete quiz")
      }
    } catch (error) {
      console.error("Error deleting quiz:", error)
    } finally {
      setDeleting(false)
    }
  }

  const handleEditClick = (quizId) => {
    setEditingQuiz(quizId)
    setShowEditModal(true)
  }

  const handleViewClick = (quizId) => {
    setViewingQuiz(quizId)
    setShowViewModal(true)
  }

  const handleLogsClick = (quizId) => {
    setSelectedQuiz(quizId)
    setShowCheatLogs(true)
    if (onSelectQuiz) {
      onSelectQuiz(quizId)
    }
  }

  const handleAttemptClick = async (quizId) => {
    try {
      const res = await fetch(`${BASE}/attempt/start/${quizId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.user_id })
      })
    
      const data = await res.json()
    
      if (res.ok) {
        setSelectedQuiz({
          quizId: quizId,
          attemptId: data.attempt_id
        })
      } else {
        if (data.error && data.error.includes("maximum number of attempts")) {
          alert(data.error)
        } else {
          alert(data.error || "Failed to start attempt")
        }
      }
    } catch (error) {
      console.error("Error starting attempt:", error)
      alert("Failed to start attempt")
    }
  }

  const handleCloseAttempt = () => {
    setSelectedQuiz(null)
    setSelectedAttemptId(null)
    fetchAttemptStatus()
  }

  const formatDateTime = (dateString) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleString()
  }

  const isQuizAvailable = (quiz) => {
    const now = new Date()
    if (quiz.start_time && new Date(quiz.start_time) > now) return false
    if (quiz.end_time && new Date(quiz.end_time) < now) return false
    return true
  }

  const getAvailabilityStatus = (quiz) => {
    const now = new Date()
    if (quiz.start_time && new Date(quiz.start_time) > now) {
      return { text: `Available from ${formatDateTime(quiz.start_time)}`, color: "#f59e0b", available: false }
    }
    if (quiz.end_time && new Date(quiz.end_time) < now) {
      return { text: "Quiz closed", color: "#ef4444", available: false }
    }
    return { text: "Available now", color: "#10b981", available: true }
  }

  if (loading) {
    return <div style={{ color: "#000", padding: "20px", textAlign: "center" }}>Loading quizzes...</div>
  }

  return (
    <div style={{ marginTop: 20 }}>
      <h3 style={{ color: "#000", marginBottom: "15px" }}>Available Quizzes</h3>

      {quizzes.length === 0 ? (
        <div style={{ 
          padding: 30, 
          textAlign: "center", 
          border: "1px solid #ccc",
          borderRadius: 4,
          backgroundColor: "#f9f9f9"
        }}>
          <p style={{ color: "#000", fontSize: "16px" }}>No quizzes available in this room.</p>
          {role === "instructor" && (
            <p style={{ fontSize: "14px", color: "#666", marginTop: "10px" }}>
              Click "Create New Quiz" to create your first quiz!
            </p>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          {quizzes.map(q => {
            const status = attemptStatus[q.quiz_id] || { 
              attempted: false, 
              count: 0, 
              completedCount: 0,
              lastScore: null, 
              maxAllowed: 1 
            }
            const availability = getAvailabilityStatus(q)
            const canAttempt = availability.available && (!status.attempted || status.count < status.maxAllowed)
            
            return (
              <div key={q.quiz_id} style={{ 
                border: "1px solid #ccc",
                borderRadius: 4,
                overflow: "hidden",
                backgroundColor: "#fff"
              }}>
                <div style={{ 
                  padding: "15px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  backgroundColor: q.is_published ? "#f0fff0" : "#fff0f0",
                  borderBottom: "1px solid #ccc",
                  flexWrap: "wrap",
                  gap: "10px"
                }}>
                  <div>
                    <strong style={{ color: "#000", fontSize: "16px" }}>{q.title}</strong>
                    <span style={{ marginLeft: 10, color: "#666", fontSize: "14px" }}>
                      ({q.time_limit} min)
                    </span>
                    <span style={{ 
                      marginLeft: 10, 
                      padding: "3px 8px",
                      borderRadius: "4px",
                      backgroundColor: q.is_published ? "#d4edda" : "#f8d7da",
                      color: q.is_published ? "#155724" : "#721c24",
                      fontSize: "12px",
                      fontWeight: "bold"
                    }}>
                      {q.is_published ? "Published" : "Draft"}
                    </span>
                    
                    {role === "instructor" && q.publish_at && !q.is_published && (
                      <span style={{ 
                        marginLeft: 10, 
                        padding: "3px 8px",
                        borderRadius: "4px",
                        backgroundColor: "#fff3cd",
                        color: "#856404",
                        fontSize: "11px"
                      }}>
                        Auto-publish: {formatDateTime(q.publish_at)}
                      </span>
                    )}
                    
                    {role === "instructor" && (q.start_time || q.end_time) && (
                      <div style={{ marginTop: "5px", fontSize: "11px", color: "#666" }}>
                        {q.start_time && <span>From: {formatDateTime(q.start_time)} </span>}
                        {q.end_time && <span>Until: {formatDateTime(q.end_time)}</span>}
                      </div>
                    )}
                    
                    {role === "student" && q.is_published && (
                      <div style={{ marginTop: "5px", fontSize: "11px", color: availability.color }}>
                        {availability.text}
                      </div>
                    )}
                  </div>
                  
                  {role === "instructor" && (
                    <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                      {!q.is_published ? (
                        <button onClick={() => publishQuiz(q.quiz_id)} style={publishButtonStyle}>Publish</button>
                      ) : (
                        <button onClick={() => unpublishQuiz(q.quiz_id)} style={unpublishButtonStyle}>Unpublish</button>
                      )}
                      <button onClick={() => handleViewClick(q.quiz_id)} style={viewButtonStyle}>View</button>
                      <button onClick={() => handleLogsClick(q.quiz_id)} style={logsButtonStyle}>Logs</button>
                      <button onClick={() => deleteQuiz(q.quiz_id, q.title)} style={deleteButtonStyle}>Delete</button>
                    </div>
                  )}

                  {role === "student" && q.is_published && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {status.attempted && (
                        <div style={attemptInfoStyle}>
                          <span style={attemptCountStyle}>
                            {status.completedCount}/{status.maxAllowed}
                          </span>
                          {status.lastScore !== null && (
                            <span style={scoreStyle(status.lastScore)}>
                              Last: {status.lastScore}%
                            </span>
                          )}
                        </div>
                      )}
                      <button 
                        onClick={() => handleAttemptClick(q.quiz_id)}
                        style={{
                          ...attemptButtonStyle,
                          opacity: !canAttempt ? 0.5 : 1,
                          cursor: !canAttempt ? 'not-allowed' : 'pointer'
                        }}
                        disabled={!canAttempt}
                      >
                        {!canAttempt ? 'Not Available' : status.attempted ? 'Retake Quiz' : 'Attempt Quiz'}
                      </button>
                    </div>
                  )}
                </div>

                {role === "instructor" && q.is_published && (
                  <QuizAttendance quizId={q.quiz_id} instructorId={user.user_id} />
                )}
              </div>
            )
          })}
        </div>
      )}

      {selectedQuiz && role === "student" && (
        <AttemptPanel
          quizId={selectedQuiz.quizId}
          attemptId={selectedQuiz.attemptId}
          user={user}
          onClose={() => {
            setSelectedQuiz(null)
            fetchAttemptStatus()
          }}
        />
      )}

      {showCheatLogs && selectedQuiz && role === "instructor" && (
        <CheatLogs
          quizId={selectedQuiz}
          instructorId={user.user_id}
        />
      )}

      {showEditModal && editingQuiz && (
        <EditQuizModal
          quizId={editingQuiz}
          onClose={() => {
            setShowEditModal(false)
            setEditingQuiz(null)
          }}
          onQuizUpdated={() => fetchQuizzes()}
        />
      )}

      {showViewModal && viewingQuiz && (
        <QuizViewModal
          quizId={viewingQuiz}
          onClose={() => {
            setShowViewModal(false)
            setViewingQuiz(null)
          }}
          onEdit={() => {
            setShowViewModal(false)
            handleEditClick(viewingQuiz)
          }}
        />
      )}
    </div>
  )
}

const publishButtonStyle = {
  padding: "5px 12px",
  backgroundColor: "#28a745",
  color: "#fff",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  fontSize: "13px"
}

const unpublishButtonStyle = {
  padding: "5px 12px",
  backgroundColor: "#ffc107",
  color: "#000",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  fontSize: "13px"
}

const viewButtonStyle = {
  padding: "5px 12px",
  backgroundColor: "#6c757d",
  color: "#fff",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  fontSize: "13px"
}

const logsButtonStyle = {
  padding: "5px 12px",
  backgroundColor: "#17a2b8",
  color: "#fff",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  fontSize: "13px"
}

const deleteButtonStyle = {
  padding: "5px 12px",
  backgroundColor: "#dc3545",
  color: "#fff",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  fontSize: "13px"
}

const attemptButtonStyle = {
  padding: "8px 16px",
  backgroundColor: "#7071ae",
  color: "#fff",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  fontSize: "14px"
}

const attemptInfoStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  gap: "2px"
}

const attemptCountStyle = {
  fontSize: "11px",
  color: "#64748b",
  backgroundColor: "#f1f5f9",
  padding: "2px 6px",
  borderRadius: "4px"
}

const scoreStyle = (score) => ({
  fontSize: "11px",
  fontWeight: "500",
  color: score >= 70 ? "#28a745" : score >= 50 ? "#ffc107" : "#dc3545",
  backgroundColor: score >= 70 ? "#e6f7e6" : score >= 50 ? "#fff3cd" : "#ffebee",
  padding: "2px 6px",
  borderRadius: "4px"
})

export default QuizList