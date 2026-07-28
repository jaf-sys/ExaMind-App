import { useState, useEffect } from "react"

function CheatLogs({ quizId, instructorId }) {
  const [logs, setLogs] = useState([])
  const [summary, setSummary] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [view, setView] = useState('summary')

  const BASE = "http://127.0.0.1:5000"

  useEffect(() => {
    if (quizId && instructorId) {
      fetchLogs()
      fetchSummary()
    }
  }, [quizId, instructorId])

  const fetchLogs = async () => {
    try {
      const res = await fetch(`${BASE}/cheat/logs/${quizId}?user_id=${instructorId}`)
      const data = await res.json()
      
      if (res.ok) {
        setLogs(data)
      }
    } catch (error) {
      console.error("Failed to fetch logs:", error)
    }
  }

  const fetchSummary = async () => {
    try {
      const res = await fetch(`${BASE}/cheat/summary/${quizId}?user_id=${instructorId}`)
      const data = await res.json()
      
      if (res.ok) {
        setSummary(data)
      }
    } catch (error) {
      console.error("Failed to fetch summary:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatDateTime = (timestamp) => {
    if (!timestamp) return 'N/A'
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const getEventTypeColor = (eventType) => {
    switch(eventType) {
      case 'TAB_SWITCH':
        return { bg: '#fff3e0', text: '#e65100' }
      case 'WINDOW_BLUR':
        return { bg: '#ffebee', text: '#c62828' }
      case 'INACTIVITY':
        return { bg: '#f3e5f5', text: '#6a1b9a' }
      default:
        return { bg: '#f5f5f5', text: '#616161' }
    }
  }

  const getRiskLevel = (count) => {
    if (count >= 5) return { label: 'High', bg: '#ffebee', text: '#c62828' }
    if (count >= 3) return { label: 'Medium', bg: '#fff8e1', text: '#ff6f00' }
    return { label: 'Low', bg: '#e8f5e9', text: '#2e7d32' }
  }

  if (loading) {
    return <div style={loadingStyle}>Loading cheat logs...</div>
  }

  if (error) {
    return <div style={errorStyle}>{error}</div>
  }

  if (logs.length === 0 && summary.length === 0) {
    return (
      <div style={containerStyle}>
        <div style={headerStyle}>
          <h3 style={titleStyle}>Cheating Detection Logs</h3>
        </div>
        <div style={emptyStyle}>No cheating events detected for this quiz.</div>
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h3 style={titleStyle}>Cheating Detection Logs</h3>
        <div style={toggleStyle}>
          <button
            onClick={() => setView('summary')}
            style={{
              ...tabStyle,
              backgroundColor: view === 'summary' ? '#7071ae' : '#f5f5f5',
              color: view === 'summary' ? 'white' : '#666'
            }}
          >
            Summary
          </button>
          <button
            onClick={() => setView('detailed')}
            style={{
              ...tabStyle,
              backgroundColor: view === 'detailed' ? '#7071ae' : '#f5f5f5',
              color: view === 'detailed' ? 'white' : '#666'
            }}
          >
            Detailed
          </button>
        </div>
      </div>

      {view === 'summary' ? (
        <div style={tableContainerStyle}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Student</th>
                <th style={thStyle}>Event Type</th>
                <th style={thStyle}>Count</th>
                <th style={thStyle}>First Seen</th>
                <th style={thStyle}>Last Seen</th>
                <th style={thStyle}>Risk</th>
              </tr>
            </thead>
            <tbody>
              {summary.map((item, index) => {
                const colors = getEventTypeColor(item.event_type)
                const risk = getRiskLevel(item.count)
                return (
                  <tr key={index}>
                    <td style={tdStyle}>
                      <div style={studentNameStyle}>{item.user_name}</div>
                      <div style={studentEmailStyle}>{item.user_email}</div>
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        ...eventBadgeStyle,
                        backgroundColor: colors.bg,
                        color: colors.text
                      }}>
                        {item.event_type.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={countStyle}>{item.count}</span>
                    </td>
                    <td style={tdStyle}>{formatDateTime(item.first_seen)}</td>
                    <td style={tdStyle}>{formatDateTime(item.last_seen)}</td>
                    <td style={tdStyle}>
                      <span style={{
                        ...riskBadgeStyle,
                        backgroundColor: risk.bg,
                        color: risk.text
                      }}>
                        {risk.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={logsContainerStyle}>
          {logs.map((log, index) => {
            const colors = getEventTypeColor(log.event_type)
            return (
              <div key={index} style={logEntryStyle}>
                <div style={logHeaderStyle}>
                  <div>
                    <span style={logUserNameStyle}>{log.user_name}</span>
                    <span style={logUserEmailStyle}>{log.user_email}</span>
                  </div>
                  <span style={logTimeStyle}>{formatDateTime(log.timestamp)}</span>
                </div>
                <div style={logDetailStyle}>
                  <span style={{
                    ...eventBadgeStyle,
                    backgroundColor: colors.bg,
                    color: colors.text
                  }}>
                    {log.event_type.replace('_', ' ')}
                  </span>
                  <span style={logAttemptStyle}>Attempt #{log.attempt_id}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const containerStyle = {
  backgroundColor: 'white',
  borderRadius: '8px',
  padding: '24px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  marginTop: '20px'
}

const loadingStyle = {
  padding: '40px',
  textAlign: 'center',
  color: '#666',
  fontSize: '14px'
}

const errorStyle = {
  padding: '40px',
  textAlign: 'center',
  color: '#dc3545',
  fontSize: '14px'
}

const emptyStyle = {
  padding: '40px',
  textAlign: 'center',
  color: '#666',
  fontSize: '14px',
  backgroundColor: '#f9f9f9',
  borderRadius: '4px'
}

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '20px'
}

const titleStyle = {
  fontSize: '18px',
  fontWeight: '500',
  color: '#333',
  margin: 0
}

const toggleStyle = {
  display: 'flex',
  gap: '8px'
}

const tabStyle = {
  padding: '6px 16px',
  border: 'none',
  borderRadius: '20px',
  fontSize: '13px',
  fontWeight: '500',
  cursor: 'pointer',
  transition: 'all 0.2s'
}

const tableContainerStyle = {
  overflowX: 'auto',
  border: '1px solid #e9ecef',
  borderRadius: '6px'
}

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '13px'
}

const thStyle = {
  textAlign: 'left',
  padding: '12px 16px',
  backgroundColor: '#f8f9fa',
  color: '#495057',
  fontWeight: '500',
  borderBottom: '1px solid #e9ecef'
}

const tdStyle = {
  padding: '12px 16px',
  color: '#333',
  borderBottom: '1px solid #e9ecef'
}

const studentNameStyle = {
  fontWeight: '500',
  marginBottom: '2px'
}

const studentEmailStyle = {
  fontSize: '11px',
  color: '#666'
}

const eventBadgeStyle = {
  padding: '4px 8px',
  borderRadius: '4px',
  fontSize: '11px',
  fontWeight: '500',
  display: 'inline-block'
}

const countStyle = {
  fontWeight: '600',
  color: '#333',
  backgroundColor: '#f1f3f5',
  padding: '2px 6px',
  borderRadius: '4px'
}

const riskBadgeStyle = {
  padding: '4px 8px',
  borderRadius: '4px',
  fontSize: '11px',
  fontWeight: '500',
  display: 'inline-block'
}

const logsContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  maxHeight: '500px',
  overflowY: 'auto'
}

const logEntryStyle = {
  backgroundColor: 'white',
  borderRadius: '6px',
  padding: '16px',
  border: '1px solid #e9ecef'
}

const logHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '8px'
}

const logUserNameStyle = {
  fontWeight: '500',
  color: '#333',
  fontSize: '14px',
  marginRight: '8px'
}

const logUserEmailStyle = {
  color: '#666',
  fontSize: '12px'
}

const logTimeStyle = {
  color: '#999',
  fontSize: '11px'
}

const logDetailStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px'
}

const logAttemptStyle = {
  color: '#666',
  fontSize: '12px'
}

export default CheatLogs