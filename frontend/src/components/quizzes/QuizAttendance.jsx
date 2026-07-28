import { useState, useEffect } from "react"

function QuizAttendance({ quizId, instructorId }) {
  const [attempts, setAttempts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [isExpanded, setIsExpanded] = useState(false)

  const BASE = "http://127.0.0.1:5000"

  useEffect(() => {
    if (quizId && isExpanded) {
      fetchAttendance()
    }
  }, [quizId, isExpanded])

  const fetchAttendance = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`${BASE}/analytics/quiz/${quizId}?user_id=${instructorId}`)
      const data = await res.json()
      
      if (res.ok) {
        setAttempts(data.attempts || [])
      } else {
        setError(data.error || "Failed to fetch attendance")
        setAttempts([])
      }
    } catch (error) {
      console.error("Error fetching attendance:", error)
      setError("Failed to connect to server")
      setAttempts([])
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (start, end) => {
    if (!start || !end) return '—'
    const startTime = new Date(start)
    const endTime = new Date(end)
    const diffSeconds = Math.round((endTime - startTime) / 1000)
    
    if (diffSeconds < 60) return `${diffSeconds} sec`
    const diffMinutes = Math.floor(diffSeconds / 60)
    const remainingSeconds = diffSeconds % 60
    return `${diffMinutes}m ${remainingSeconds}s`
  }

  if (loading) {
    return (
      <div style={containerStyle}>
        <button style={headerStyle}>
          <span>Attendance</span>
        </button>
        <div style={contentStyle}>
          <div style={loadingStyle}>Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={headerStyle}
      >
        <span> Attendance ({attempts.length})</span>
        <span>{isExpanded ? '−' : '+'}</span>
      </button>

      {isExpanded && (
        <div style={contentStyle}>
          {error ? (
            <div style={errorStyle}>{error}</div>
          ) : attempts.length === 0 ? (
            <div style={emptyStyle}>No attempts yet</div>
          ) : (
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Student</th>
                  <th style={thStyle}>Duration</th>
                  <th style={thStyle}>Score</th>
                  <th style={thStyle}>%</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((attempt, idx) => (
                  <tr key={idx}>
                    <td style={tdStyle}>
                      <span style={studentNameStyle}>{attempt.user_name || 'Unknown'}</span>
                    </td>
                    <td style={tdStyle}>{formatDuration(attempt.start_time, attempt.end_time)}</td>
                    <td style={tdStyle}>{attempt.score} / {attempt.total}</td>
                    <td style={tdStyle}>
                      <span style={percentageStyle(attempt.percentage)}>
                        {attempt.percentage}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}

const colors = {
  success: '#10b981',
  successLight: '#d1fae5',
  warning: '#f59e0b',
  warningLight: '#fef3c7',
  danger: '#f43f5e',
  dangerLight: '#ffe4e6',
  text: '#1e293b',
  textLight: '#64748b',
  border: '#e2e8f0',
  background: '#f9fafb'
}

const containerStyle = {
  marginTop: '12px',
  border: `1px solid ${colors.border}`,
  borderRadius: '6px',
  overflow: 'hidden'
}

const headerStyle = {
  width: '100%',
  padding: '10px 16px',
  backgroundColor: colors.background,
  border: 'none',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: '13px',
  color: colors.text,
  cursor: 'pointer',
  borderBottom: `1px solid ${colors.border}`
}

const contentStyle = {
  padding: '16px',
  backgroundColor: 'white'
}

const loadingStyle = {
  textAlign: 'center',
  color: colors.textLight,
  fontSize: '13px',
  padding: '20px'
}

const errorStyle = {
  textAlign: 'center',
  color: colors.danger,
  fontSize: '13px',
  padding: '20px'
}

const emptyStyle = {
  textAlign: 'center',
  color: colors.textLight,
  fontSize: '13px',
  padding: '20px'
}

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '13px'
}

const thStyle = {
  textAlign: 'left',
  padding: '8px 12px',
  color: colors.textLight,
  fontWeight: '500',
  borderBottom: `1px solid ${colors.border}`
}

const tdStyle = {
  padding: '8px 12px',
  color: colors.text,
  borderBottom: `1px solid ${colors.border}`
}

const studentNameStyle = {
  fontWeight: '500',
  color: colors.text
}

const percentageStyle = (percentage) => ({
  display: 'inline-block',
  padding: '2px 8px',
  borderRadius: '12px',
  fontSize: '11px',
  fontWeight: '500',
  backgroundColor: percentage >= 70 ? colors.successLight : 
                  percentage >= 50 ? colors.warningLight : colors.dangerLight,
  color: percentage >= 70 ? colors.success : 
         percentage >= 50 ? colors.warning : colors.danger
})

export default QuizAttendance