import { useState, useEffect } from "react"
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vs } from 'react-syntax-highlighter/dist/esm/styles/prism'

function QuizViewModal({ quizId, onClose, onEdit }) {
  const [quiz, setQuiz] = useState(null)
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const BASE = "http://127.0.0.1:5000"

  useEffect(() => {
    fetchQuizDetails()
    fetchQuestions()
  }, [quizId])

  const fetchQuizDetails = async () => {
    try {
      const res = await fetch(`${BASE}/quiz/${quizId}`)
      const data = await res.json()
      if (res.ok) {
        setQuiz(data)
      }
    } catch (error) {
      console.error("Error fetching quiz:", error)
    }
  }

  const fetchQuestions = async () => {
    try {
      const res = await fetch(`${BASE}/question/by-quiz/${quizId}`)
      const data = await res.json()
      if (res.ok) {
        console.log("Questions data:", data)
        setQuestions(data)
      }
    } catch (error) {
      console.error("Error fetching questions:", error)
      setError("Failed to load questions")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={modalOverlayStyle} onClick={onClose}>
        <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
          <div style={loadingStyle}>Loading quiz...</div>
        </div>
      </div>
    )
  }

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
        <div style={modalHeaderStyle}>
          <h2 style={modalTitleStyle}>{quiz?.title || "Quiz View"}</h2>
          <div style={headerButtonsStyle}>
            <button onClick={onEdit} style={editButtonStyle}>Edit Quiz</button>
            <button onClick={onClose} style={closeButtonStyle}>✕</button>
          </div>
        </div>

        <div style={quizInfoStyle}>
          <span style={infoItemStyle}>⏱️ {quiz?.time_limit} minutes</span>
          <span style={infoItemStyle}>📊 {questions.length} questions</span>
          <span style={infoItemStyle}>🎯 {quiz?.difficulty || "Medium"}</span>
          <span style={infoItemStyle}>📚 {quiz?.topic || "General"}</span>
        </div>

        {error && <div style={errorStyle}>{error}</div>}

        <div style={questionsContainerStyle}>
          {questions.length === 0 ? (
            <p style={emptyStyle}>No questions in this quiz</p>
          ) : (
            questions.map((q, idx) => (
              <div key={q.question_id} style={questionCardStyle}>
                <div style={questionHeaderStyle}>
                  <span style={questionNumberStyle}>Question {idx + 1}</span>
                  <span style={correctAnswerLabelStyle}>
                    Correct Answer: {q.correct_option || 'Not set'}
                  </span>
                </div>
                <p style={questionTextStyle}>{q.question_text}</p>
                
                {q.question_image && (
                  <div style={imageContainerStyle}>
                    <img src={q.question_image} alt="Question" style={questionImageStyle} />
                  </div>
                )}
                
                {q.code_snippet && (
                  <div style={codeBlockStyle}>
                    <SyntaxHighlighter
                      language={q.language || 'python'}
                      style={vs}
                      customStyle={codeHighlighterStyle}
                    >
                      {q.code_snippet}
                    </SyntaxHighlighter>
                  </div>
                )}
                
                <div style={optionsStyle}>
                  {['A', 'B', 'C', 'D'].map(letter => {
                    const isCorrect = q.correct_option === letter
                    const optionImage = q[`option_${letter.toLowerCase()}_image`]
                    return (
                      <div 
                        key={letter} 
                        style={{
                          ...optionStyle,
                          backgroundColor: isCorrect ? '#e6f7e6' : '#f8f9fa',
                          borderColor: isCorrect ? '#28a745' : colors.border,
                          borderWidth: isCorrect ? '2px' : '1px',
                        }}
                      >
                        <div style={optionContentStyle}>
                          <span style={optionLetterStyle}>{letter}.</span>
                          <span style={optionTextStyle}>{q[`option_${letter.toLowerCase()}`]}</span>
                        </div>
                        {optionImage && (
                          <img src={optionImage} alt={`Option ${letter}`} style={optionImageStyle} />
                        )}
                        {isCorrect && (
                          <span style={correctBadgeStyle}>✓ Correct</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        <div style={footerStyle}>
          <button onClick={onClose} style={closeFooterButtonStyle}>Close</button>
        </div>
      </div>
    </div>
  )
}

const colors = {
  primary: '#7071ae',
  secondary: '#f88397',
  text: '#1e293b',
  textLight: '#64748b',
  border: '#e2e8f0',
  surface: '#ffffff'
}

const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
  padding: '20px'
}

const modalContentStyle = {
  backgroundColor: colors.surface,
  borderRadius: '8px',
  width: '100%',
  maxWidth: '800px',
  maxHeight: '90vh',
  overflowY: 'auto',
  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
}

const modalHeaderStyle = {
  padding: '20px 24px',
  borderBottom: `1px solid ${colors.border}`,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  position: 'sticky',
  top: 0,
  backgroundColor: colors.surface,
  zIndex: 10
}

const modalTitleStyle = {
  fontSize: '18px',
  fontWeight: '500',
  color: colors.text,
  margin: 0
}

const headerButtonsStyle = {
  display: 'flex',
  gap: '8px',
  alignItems: 'center'
}

const editButtonStyle = {
  padding: '6px 12px',
  backgroundColor: colors.primary,
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  fontSize: '12px',
  cursor: 'pointer'
}

const closeButtonStyle = {
  background: 'none',
  border: 'none',
  fontSize: '20px',
  cursor: 'pointer',
  color: colors.textLight
}

const quizInfoStyle = {
  padding: '16px 24px',
  display: 'flex',
  gap: '20px',
  flexWrap: 'wrap',
  borderBottom: `1px solid ${colors.border}`,
  backgroundColor: '#f8f9fa'
}

const infoItemStyle = {
  fontSize: '13px',
  color: colors.text
}

const loadingStyle = {
  padding: '40px',
  textAlign: 'center',
  color: colors.textLight
}

const errorStyle = {
  margin: '16px 24px',
  padding: '12px',
  backgroundColor: '#ffebee',
  color: '#c62828',
  borderRadius: '4px'
}

const emptyStyle = {
  padding: '40px',
  textAlign: 'center',
  color: colors.textLight
}

const questionsContainerStyle = {
  padding: '24px',
  display: 'flex',
  flexDirection: 'column',
  gap: '20px'
}

const questionCardStyle = {
  border: `1px solid ${colors.border}`,
  borderRadius: '6px',
  padding: '20px'
}

const questionHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '12px'
}

const questionNumberStyle = {
  fontSize: '12px',
  color: colors.textLight,
  textTransform: 'uppercase',
  letterSpacing: '0.3px'
}

const correctAnswerLabelStyle = {
  fontSize: '12px',
  color: '#28a745',
  fontWeight: '600',
  backgroundColor: '#e6f7e6',
  padding: '4px 8px',
  borderRadius: '4px'
}

const questionTextStyle = {
  fontSize: '15px',
  color: colors.text,
  margin: '0 0 16px 0',
  lineHeight: '1.5'
}

const imageContainerStyle = {
  margin: '16px 0',
  textAlign: 'center'
}

const questionImageStyle = {
  maxWidth: '100%',
  maxHeight: '200px',
  borderRadius: '8px',
  border: `1px solid ${colors.border}`
}

const codeBlockStyle = {
  margin: '16px 0',
  borderRadius: '4px',
  overflow: 'hidden',
  border: `1px solid ${colors.border}`
}

const codeHighlighterStyle = {
  margin: 0,
  borderRadius: 0,
  fontSize: '13px'
}

const optionsStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px'
}

const optionStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '10px 12px',
  borderRadius: '4px',
  border: '1px solid',
  fontSize: '14px'
}

const optionContentStyle = {
  display: 'flex',
  alignItems: 'center',
  flex: 1
}

const optionLetterStyle = {
  fontWeight: '500',
  marginRight: '12px',
  minWidth: '20px',
  color: colors.textLight
}

const optionTextStyle = {
  color: colors.text
}

const optionImageStyle = {
  maxWidth: '60px',
  maxHeight: '50px',
  borderRadius: '4px',
  marginLeft: '12px',
  objectFit: 'cover'
}

const correctBadgeStyle = {
  padding: '2px 8px',
  backgroundColor: '#28a745',
  color: 'white',
  borderRadius: '12px',
  fontSize: '11px',
  fontWeight: '500',
  marginLeft: '12px'
}

const footerStyle = {
  padding: '20px 24px',
  borderTop: `1px solid ${colors.border}`,
  textAlign: 'right'
}

const closeFooterButtonStyle = {
  padding: '8px 24px',
  backgroundColor: colors.primary,
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  fontSize: '13px',
  cursor: 'pointer'
}

export default QuizViewModal