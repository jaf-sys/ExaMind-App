import { useState, useEffect } from "react"
import RoomList from "../components/rooms/RoomList"
import QuizList from "../components/quizzes/QuizList"
import CreateQuiz from "../components/quizzes/CreateQuiz/CreateQuiz"
import CheatLogs from "../components/analytics/CheatLogs"

function InstructorDashboard({ user, currentView }) {
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [selectedQuiz, setSelectedQuiz] = useState(null)
  const [showCreateQuiz, setShowCreateQuiz] = useState(false)
  const [quizRefreshTrigger, setQuizRefreshTrigger] = useState(0)
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    totalStudents: 0,
    activeRooms: 0
  })

  const BASE = "http://127.0.0.1:5000"

  useEffect(() => {
    fetchStats()
  }, [user.user_id])

  const fetchStats = async () => {
    try {
      const roomsRes = await fetch(`${BASE}/room/my-rooms/${user.user_id}`)
      const roomsData = await roomsRes.json()
      
      let totalQuizzes = 0
      const studentsSet = new Set()
      
      for (const room of roomsData) {
        const quizzesRes = await fetch(`${BASE}/quiz/by-room/${room.room_id}?user_id=${user.user_id}`)
        const quizzesData = await quizzesRes.json()
        totalQuizzes += quizzesData.length
        
        const membersRes = await fetch(`${BASE}/room/${room.room_id}/members?user_id=${user.user_id}`)
        const membersData = await membersRes.json()
        membersData.forEach(m => {
          if (m.role === 'student') studentsSet.add(m.user_id)
        })
      }
      
      setStats({
        activeRooms: roomsData.length,
        totalQuizzes: totalQuizzes,
        totalStudents: studentsSet.size
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
              role="instructor"
            />

            {selectedRoom && (
              <div style={sectionStyle}>
                <div style={sectionHeaderStyle}>
                  <h2 style={sectionTitleStyle}>Room: {selectedRoom}</h2>
                  <button 
                    onClick={() => setShowCreateQuiz(true)}
                    style={createButtonStyle}
                  >
                    + New Quiz
                  </button>
                </div>
                
                <QuizList
                  user={user}
                  roomId={selectedRoom}
                  role="instructor"
                  onSelectQuiz={setSelectedQuiz}
                  refreshTrigger={quizRefreshTrigger}
                />
              </div>
            )}
          </div>
        )

      case "analytics":
        return selectedQuiz ? (
          <CheatLogs quizId={selectedQuiz} instructorId={user.user_id} />
        ) : (
          <div style={emptyStateStyle}>
            <p>Select a quiz to view cheat logs</p>
          </div>
        )

      default:
        return (
          <div>
            <h1 style={welcomeStyle}>Welcome back, {user.name}</h1>
            <div style={statsGridStyle}>
              <div style={statCardStyle}>
                <span style={statNumberStyle}>{stats.totalQuizzes}</span>
                <span style={statLabelStyle}>Total Quizzes</span>
              </div>
              <div style={statCardStyle}>
                <span style={statNumberStyle}>{stats.totalStudents}</span>
                <span style={statLabelStyle}>Students</span>
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

  return (
    <>
      {renderContent()}

      {showCreateQuiz && selectedRoom && (
        <CreateQuiz
          user={user}
          roomId={selectedRoom}
          onQuizCreated={() => {
            setShowCreateQuiz(false)
            setQuizRefreshTrigger(prev => prev + 1)
            fetchStats()
          }}
          onClose={() => setShowCreateQuiz(false)}
        />
      )}
    </>
  )
}

const colors = {
  primary: '#7071ae',
  secondary: '#f88397',
  primaryLight: '#e0e7ff',
  secondaryLight: '#ffe4e6',
  text: '#1e293b',
  textLight: '#64748b',
  border: '#e2e8f0',
  surface: '#ffffff',
  background: '#f9fafb'
}

const sectionStyle = {
  marginTop: '32px'
}

const sectionHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '20px'
}

const sectionTitleStyle = {
  fontSize: '18px',
  fontWeight: '500',
  color: colors.text,
  margin: 0
}

const createButtonStyle = {
  padding: '8px 20px',
  backgroundColor: colors.primary,
  color: 'white',
  border: 'none',
  borderRadius: '20px',
  fontSize: '14px',
  fontWeight: '500',
  cursor: 'pointer',
  transition: 'all 0.2s'
}

const emptyStateStyle = {
  backgroundColor: colors.surface,
  padding: '48px',
  textAlign: 'center',
  borderRadius: '8px',
  border: `1px solid ${colors.border}`,
  color: colors.textLight,
  fontSize: '14px'
}

const welcomeStyle = {
  fontSize: '24px',
  fontWeight: '500',
  color: colors.text,
  marginBottom: '24px'
}

const statsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '20px'
}

const statCardStyle = {
  backgroundColor: colors.surface,
  padding: '24px',
  borderRadius: '8px',
  border: `1px solid ${colors.border}`,
  textAlign: 'center',
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
}

const statNumberStyle = {
  display: 'block',
  fontSize: '32px',
  fontWeight: '600',
  color: colors.primary,
  marginBottom: '4px'
}

const statLabelStyle = {
  fontSize: '14px',
  color: colors.textLight
}

export default InstructorDashboard