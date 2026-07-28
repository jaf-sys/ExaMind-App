import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

function StudentProgressDashboard({ userId }) {
  const [dateRange, setDateRange] = useState('all')
  const [topics, setTopics] = useState([])
  const [selectedTopic, setSelectedTopic] = useState('')
  const [quizData, setQuizData] = useState([])
  const [trendData, setTrendData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    totalAttempts: 0,
    avgScore: 0,
    bestScore: 0
  })

  const BASE = "http://127.0.0.1:5000"

  useEffect(() => {
    fetchAnalytics()
  }, [userId, dateRange])

  useEffect(() => {
    if (topics.length > 0 && !selectedTopic) {
      setSelectedTopic(topics[0])
    }
  }, [topics])

  useEffect(() => {
    if (selectedTopic) {
      fetchQuizDataForTopic(selectedTopic)
    }
  }, [selectedTopic, dateRange])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${BASE}/analytics/student/${userId}?range=${dateRange}`)
      const data = await res.json()
      
      if (res.ok) {
        setTopics(data.topics || [])
        setTrendData(data.score_trend || [])
        setStats(data.stats || { totalQuizzes: 0, totalAttempts: 0, avgScore: 0, bestScore: 0 })
      } else {
        setError(data.error || "Failed to fetch analytics")
      }
    } catch (error) {
      console.error("Error fetching analytics:", error)
      setError("Failed to connect to server")
    } finally {
      setLoading(false)
    }
  }

  const fetchQuizDataForTopic = async (topic) => {
    try {
      const res = await fetch(`${BASE}/analytics/topic/${userId}?topic=${encodeURIComponent(topic)}&range=${dateRange}`)
      const data = await res.json()
      
      if (res.ok) {
        setQuizData(data.quizzes || [])
      }
    } catch (error) {
      console.error("Error fetching quiz data:", error)
    }
  }

  const getDateRangeLabel = () => {
    switch(dateRange) {
      case '7days': return 'Last 7 Days'
      case '30days': return 'Last 30 Days'
      default: return 'All Time'
    }
  }

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={loadingContainerStyle}>
          <div style={spinnerStyle}></div>
          <p style={loadingTextStyle}>Loading your learning analytics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={containerStyle}>
        <div style={errorContainerStyle}>
          <p style={errorTextStyle}>{error}</p>
        </div>
      </div>
    )
  }

  if (topics.length === 0) {
    return (
      <div style={containerStyle}>
        <div style={headerStyle}>
          <h2 style={titleStyle}>Learning Analytics</h2>
          <div style={dateRangeSelectorStyle}>
            <button onClick={() => setDateRange('7days')} style={dateButtonStyle(dateRange === '7days')}>7 Days</button>
            <button onClick={() => setDateRange('30days')} style={dateButtonStyle(dateRange === '30days')}>30 Days</button>
            <button onClick={() => setDateRange('all')} style={dateButtonStyle(dateRange === 'all')}>All Time</button>
          </div>
        </div>
        <div style={emptyStateStyle}>
          <p style={emptyTitleStyle}>No quiz attempts yet</p>
          <p style={emptySubtextStyle}>Take your first practice quiz to see your performance analytics!</p>
        </div>
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div>
          <h2 style={titleStyle}>Learning Analytics</h2>
          <p style={subtitleStyle}>Track your performance across different quizzes</p>
        </div>
        <div style={dateRangeSelectorStyle}>
          <button onClick={() => setDateRange('7days')} style={dateButtonStyle(dateRange === '7days')}>7 Days</button>
          <button onClick={() => setDateRange('30days')} style={dateButtonStyle(dateRange === '30days')}>30 Days</button>
          <button onClick={() => setDateRange('all')} style={dateButtonStyle(dateRange === 'all')}>All Time</button>
        </div>
      </div>

      <p style={dateRangeLabelStyle}>{getDateRangeLabel()}</p>

      <div style={statsGridStyle}>
        <div style={statCardStyle}>
          <span style={statNumberStyle}>{stats.totalQuizzes}</span>
          <span style={statLabelStyle}>Quizzes Taken</span>
        </div>
        <div style={statCardStyle}>
          <span style={statNumberStyle}>{stats.totalAttempts}</span>
          <span style={statLabelStyle}>Total Attempts</span>
        </div>
        <div style={statCardStyle}>
          <span style={statNumberStyle}>{stats.avgScore}%</span>
          <span style={statLabelStyle}>Average Score</span>
        </div>
        <div style={statCardStyle}>
          <span style={statNumberStyle}>{stats.bestScore}%</span>
          <span style={statLabelStyle}>Best Score</span>
        </div>
      </div>

      {topics.length > 0 && (
        <div style={topicSelectorStyle}>
          <label style={topicLabelStyle}>Select Topic:</label>
          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            style={topicSelectStyle}
          >
            {topics.map(topic => (
              <option key={topic} value={topic}>{topic}</option>
            ))}
          </select>
          <div style={topicHintStyle}>
            Showing all quizzes under <strong>{selectedTopic}</strong>
          </div>
        </div>
      )}

      {selectedTopic && quizData.length > 0 && (
        <div style={chartSectionStyle}>
          <div style={chartHeaderStyle}>
            <h3 style={sectionTitleStyle}>
              Quiz Performance: {selectedTopic}
            </h3>
            <div style={chartNoteStyle}>
              Each bar represents a quiz with its average score
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={quizData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="title" 
                angle={-45} 
                textAnchor="end" 
                height={100} 
                tick={{ fill: '#475569', fontSize: 12 }}
              />
              <YAxis 
                domain={[0, 100]}
                label={{ value: 'Score (%)', angle: -90, position: 'insideLeft', fill: '#475569' }}
                tick={{ fill: '#475569' }}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                formatter={(value) => [`${value}%`, 'Average Score']}
              />
              <Legend />
              <Bar 
                dataKey="avg_score" 
                name="Average Score (%)" 
                fill="#7071ae" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>

          <div style={tableContainerStyle}>
            <h4 style={tableTitleStyle}>Quiz Breakdown</h4>
            <div style={tableStyle}>
              <div style={tableHeaderStyle}>
                <span style={tableHeaderCellStyle}>Quiz Title</span>
                <span style={tableHeaderCellStyle}>Attempts</span>
                <span style={tableHeaderCellStyle}>Average Score</span>
                <span style={tableHeaderCellStyle}>Best Score</span>
              </div>
              {quizData.map((quiz, idx) => (
                <div key={idx} style={tableRowStyle}>
                  <span style={tableCellStyle}>{quiz.title}</span>
                  <span style={tableCellStyle}>{quiz.attempt_count}</span>
                  <span style={tableCellStyle}>
                    <span style={scoreBadgeStyle(quiz.avg_score)}>{quiz.avg_score}%</span>
                  </span>
                  <span style={tableCellStyle}>
                    <span style={bestScoreStyle}>{quiz.best_score}%</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedTopic && quizData.length === 0 && (
        <div style={noDataStyle}>
          <p>No quizzes found for {selectedTopic}. Try a different topic or take some quizzes!</p>
        </div>
      )}

      {trendData.length > 0 && (
        <div style={trendSectionStyle}>
          <h3 style={sectionTitleStyle}>
            Score Trend Over Time
          </h3>
          <div style={trendListStyle}>
            {trendData.map((item, idx) => (
              <div key={idx} style={trendItemStyle}>
                <div style={trendDateStyle}>{item.date}</div>
                <div style={trendScoreStyle}>
                  <div style={{...trendBarStyle, width: `${item.score}%`}} />
                  <span style={trendScoreTextStyle}>{item.score}%</span>
                </div>
                <div style={trendQuizStyle}>{item.quiz_title}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const containerStyle = {
  backgroundColor: "#ffffff",
  borderRadius: "16px",
  padding: "32px",
  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.02)",
  marginTop: "20px"
}

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: "16px",
  flexWrap: "wrap",
  gap: "16px"
}

const titleStyle = {
  fontSize: "24px",
  fontWeight: "600",
  color: "#0f172a",
  margin: 0
}

const subtitleStyle = {
  fontSize: "14px",
  color: "#64748b",
  margin: "4px 0 0 0"
}

const dateRangeSelectorStyle = {
  display: "flex",
  gap: "8px",
  backgroundColor: "#f1f5f9",
  padding: "4px",
  borderRadius: "12px"
}

const dateButtonStyle = (isActive) => ({
  padding: "6px 16px",
  backgroundColor: isActive ? "#ffffff" : "transparent",
  color: isActive ? "#7071ae" : "#64748b",
  border: "none",
  borderRadius: "8px",
  fontSize: "13px",
  fontWeight: "500",
  cursor: "pointer",
  transition: "all 0.2s",
  boxShadow: isActive ? "0 1px 2px rgba(0,0,0,0.05)" : "none"
})

const dateRangeLabelStyle = {
  fontSize: "13px",
  color: "#64748b",
  marginBottom: "24px"
}

const statsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: "16px",
  marginBottom: "32px"
}

const statCardStyle = {
  backgroundColor: "#f8fafc",
  padding: "20px",
  borderRadius: "12px",
  textAlign: "center",
  border: "1px solid #e2e8f0"
}

const statNumberStyle = {
  display: "block",
  fontSize: "28px",
  fontWeight: "700",
  color: "#0f172a",
  lineHeight: "1.2"
}

const statLabelStyle = {
  fontSize: "12px",
  color: "#64748b",
  fontWeight: "500"
}

const topicSelectorStyle = {
  marginBottom: "24px",
  padding: "16px",
  backgroundColor: "#f8fafc",
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  display: "flex",
  alignItems: "center",
  gap: "16px",
  flexWrap: "wrap"
}

const topicLabelStyle = {
  fontSize: "14px",
  fontWeight: "500",
  color: "#475569"
}

const topicSelectStyle = {
  padding: "8px 16px",
  borderRadius: "8px",
  border: "1px solid #e2e8f0",
  fontSize: "14px",
  backgroundColor: "#ffffff",
  cursor: "pointer",
  minWidth: "200px"
}

const topicHintStyle = {
  fontSize: "12px",
  color: "#64748b",
  marginLeft: "auto"
}

const chartSectionStyle = {
  marginBottom: "32px",
  padding: "24px",
  backgroundColor: "#f8fafc",
  borderRadius: "12px",
  border: "1px solid #e2e8f0"
}

const chartHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "20px",
  flexWrap: "wrap",
  gap: "12px"
}

const sectionTitleStyle = {
  fontSize: "18px",
  fontWeight: "600",
  color: "#0f172a",
  margin: 0
}

const chartNoteStyle = {
  fontSize: "12px",
  color: "#64748b"
}

const tableContainerStyle = {
  marginTop: "24px"
}

const tableTitleStyle = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#475569",
  margin: "0 0 12px 0"
}

const tableStyle = {
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  border: "1px solid #e2e8f0",
  overflow: "hidden"
}

const tableHeaderStyle = {
  display: "grid",
  gridTemplateColumns: "2fr 1fr 1fr 1fr",
  backgroundColor: "#f1f5f9",
  padding: "12px 16px",
  borderBottom: "1px solid #e2e8f0"
}

const tableHeaderCellStyle = {
  fontSize: "12px",
  fontWeight: "600",
  color: "#475569",
  textTransform: "uppercase",
  letterSpacing: "0.5px"
}

const tableRowStyle = {
  display: "grid",
  gridTemplateColumns: "2fr 1fr 1fr 1fr",
  padding: "12px 16px",
  borderBottom: "1px solid #e2e8f0"
}

const tableCellStyle = {
  fontSize: "13px",
  color: "#334155"
}

const scoreBadgeStyle = (score) => ({
  display: "inline-block",
  padding: "4px 10px",
  borderRadius: "20px",
  fontSize: "12px",
  fontWeight: "500",
  backgroundColor: score >= 80 ? "#d1fae5" : score >= 60 ? "#fef3c7" : "#fee2e2",
  color: score >= 80 ? "#065f46" : score >= 60 ? "#92400e" : "#991b1b"
})

const bestScoreStyle = {
  fontWeight: "600",
  color: "#0f172a"
}

const noDataStyle = {
  textAlign: "center",
  padding: "40px",
  backgroundColor: "#f8fafc",
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  marginBottom: "32px",
  color: "#64748b"
}

const trendSectionStyle = {
  padding: "24px",
  backgroundColor: "#f8fafc",
  borderRadius: "12px",
  border: "1px solid #e2e8f0"
}

const trendListStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  marginTop: "16px"
}

const trendItemStyle = {
  display: "flex",
  alignItems: "center",
  gap: "16px",
  padding: "12px",
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  border: "1px solid #e2e8f0"
}

const trendDateStyle = {
  minWidth: "100px",
  fontSize: "13px",
  fontWeight: "500",
  color: "#475569"
}

const trendScoreStyle = {
  flex: 1,
  display: "flex",
  alignItems: "center",
  gap: "8px"
}

const trendBarStyle = {
  height: "8px",
  backgroundColor: "#7071ae",
  borderRadius: "4px",
  transition: "width 0.3s ease"
}

const trendScoreTextStyle = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#0f172a",
  minWidth: "45px"
}

const trendQuizStyle = {
  fontSize: "13px",
  color: "#64748b",
  minWidth: "150px"
}

const loadingContainerStyle = {
  textAlign: "center",
  padding: "60px"
}

const spinnerStyle = {
  width: "40px",
  height: "40px",
  border: "3px solid #e2e8f0",
  borderTopColor: "#7071ae",
  borderRadius: "50%",
  animation: "spin 1s linear infinite",
  margin: "0 auto 16px auto"
}

const loadingTextStyle = {
  color: "#64748b",
  fontSize: "14px"
}

const errorContainerStyle = {
  textAlign: "center",
  padding: "60px",
  backgroundColor: "#fef2f2",
  borderRadius: "12px"
}

const errorTextStyle = {
  color: "#b91c1c",
  fontSize: "14px"
}

const emptyStateStyle = {
  textAlign: "center",
  padding: "60px",
  backgroundColor: "#f8fafc",
  borderRadius: "12px",
  border: "1px solid #e2e8f0"
}

const emptyTitleStyle = {
  fontSize: "18px",
  fontWeight: "500",
  color: "#0f172a",
  margin: "0 0 8px 0"
}

const emptySubtextStyle = {
  fontSize: "14px",
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

export default StudentProgressDashboard