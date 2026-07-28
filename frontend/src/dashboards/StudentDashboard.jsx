import { useState, useEffect } from "react"
import RoomList from "../components/rooms/RoomList"
import QuizList from "../components/quizzes/QuizList"
import SelfAssessmentPanel from "../components/self-assessment/SelfAssessmentPanel"
import StudentProgressDashboard from "../components/analytics/StudentProgressDashboard"

function StudentDashboard({ user, currentView }) {
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [stats, setStats] = useState({
    quizzesTaken: 0,
    avgScore: 0,
    activeRooms: 0
  })

  const BASE = "http://127.0.0.1:5000"

  useEffect(() => {
    fetchStats()
  }, [user.user_id])

  const fetchStats = async () => {
    try {
      const attemptsRes = await fetch(`${BASE}/attempt/user/${user.user_id}/history`)
      const attemptsData = await attemptsRes.json()
      
      const roomsRes = await fetch(`${BASE}/room/my-rooms/${user.user_id}`)
      const roomsData = await roomsRes.json()
      
      const validAttempts = attemptsData.filter(a => a.total_questions > 0)
      const avgScore = validAttempts.length > 0
        ? (validAttempts.reduce((sum, a) => sum + a.percentage, 0) / validAttempts.length).toFixed(1)
        : 0
      
      setStats({
        quizzesTaken: validAttempts.length,
        avgScore: avgScore,
        activeRooms: roomsData.length
      })
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }

  const renderContent = () => {
    switch(currentView) {
      case "rooms":
        return (
          <div>
            <RoomList
              user={user}
              onSelectRoom={setSelectedRoom}
              role="student"
            />

            {selectedRoom && (
              <div style={sectionStyle}>
                <QuizList
                  user={user}
                  roomId={selectedRoom}
                  role="student"
                />
              </div>
            )}
          </div>
        )

      case "analytics":
        return <StudentProgressDashboard userId={user.user_id} />

      case "practice":
        return <SelfAssessmentPanel user={user} />

      default:
        return (
          <div>
            <h1 style={welcomeStyle}>Hi, {user.name}</h1>
            <div style={statsGridStyle}>
              <div style={statCardStyle}>
                <span style={statNumberStyle}>{stats.quizzesTaken}</span>
                <span style={statLabelStyle}>Quizzes Taken</span>
              </div>
              <div style={statCardStyle}>
                <span style={statNumberStyle}>{stats.avgScore}%</span>
                <span style={statLabelStyle}>Avg Score</span>
              </div>
              <div style={statCardStyle}>
                <span style={statNumberStyle}>{stats.activeRooms}</span>
                <span style={statLabelStyle}>Active Rooms</span>
              </div>
            </div>
          </div>
        )
    }
  }

  return <>{renderContent()}</>
}

const colors = {
  primary: '#7071ae',
  text: '#1e293b',
  textLight: '#64748b',
  border: '#e2e8f0',
  surface: '#ffffff'
}

const sectionStyle = {
  marginTop: '32px'
}

const sectionTitleStyle = {
  fontSize: '18px',
  fontWeight: '500',
  color: colors.text,
  marginBottom: '20px'
}

const welcomeStyle = {
  fontSize: '24px',
  fontWeight: '500',
  color: colors.text,
  marginBottom: '24px'
}

const statsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
  gap: '16px'
}

const statCardStyle = {
  backgroundColor: colors.surface,
  padding: '20px',
  borderRadius: '8px',
  border: `1px solid ${colors.border}`,
  textAlign: 'center'
}

const statNumberStyle = {
  display: 'block',
  fontSize: '24px',
  fontWeight: '600',
  color: colors.primary,
  marginBottom: '4px'
}

const statLabelStyle = {
  fontSize: '12px',
  color: colors.textLight,
  textTransform: 'uppercase',
  letterSpacing: '0.3px'
}

export default StudentDashboard