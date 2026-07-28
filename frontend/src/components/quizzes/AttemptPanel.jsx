import { useState, useEffect } from "react"
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vs } from 'react-syntax-highlighter/dist/esm/styles/prism'

function AttemptPanel({ quizId, attemptId, user, onClose }) {
  const [questions, setQuestions] = useState([])
  const [originalQuestions, setOriginalQuestions] = useState([])
  const [currentAttemptId] = useState(attemptId)
  const [answers, setAnswers] = useState({})
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState(null)
  const [fetchError, setFetchError] = useState("")
  const [timeLeft, setTimeLeft] = useState(null)
  const [quizTitle, setQuizTitle] = useState("")
  const [showTimeWarning, setShowTimeWarning] = useState(false)
  const [randomizedQuestions, setRandomizedQuestions] = useState([])
  const [optionMapping, setOptionMapping] = useState({})
  const [questionsWithAnswers, setQuestionsWithAnswers] = useState([])
  const [feedbackData, setFeedbackData] = useState({})

  const BASE = "http://127.0.0.1:5000"

  useEffect(() => {
    fetchQuizDetails()
    fetchQuestions()
  }, [quizId])

  useEffect(() => {
    if (!timeLeft || timeLeft <= 0 || submitted) return
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          handleTimeUp()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [timeLeft, submitted])

  useEffect(() => {
    if (timeLeft <= 300 && timeLeft > 0) {
      setShowTimeWarning(true)
    } else {
      setShowTimeWarning(false)
    }
  }, [timeLeft])

  useEffect(() => {
    if (!currentAttemptId) return

    const handleVisibility = () => {
      if (document.hidden) {
        fetch(`${BASE}/cheat/log`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            attempt_id: currentAttemptId,
            event_type: "TAB_SWITCH"
          })
        }).catch(err => console.error("Failed to log cheat:", err))
      }
    }

    const handleBlur = () => {
      fetch(`${BASE}/cheat/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attempt_id: currentAttemptId,
          event_type: "WINDOW_BLUR"
        })
      }).catch(err => console.error("Failed to log cheat:", err))
    }

    document.addEventListener("visibilitychange", handleVisibility)
    window.addEventListener("blur", handleBlur)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility)
      window.removeEventListener("blur", handleBlur)
    }
  }, [currentAttemptId])

  const fetchQuizDetails = async () => {
    try {
      const res = await fetch(`${BASE}/quiz/${quizId}`)
      const data = await res.json()
      if (res.ok) {
        setQuizTitle(data.title)
        setTimeLeft(data.time_limit * 60)
      }
    } catch (error) {
      console.error("Error fetching quiz details:", error)
    }
  }

  const fetchQuestions = async () => {
    try {
      const res = await fetch(`${BASE}/question/by-quiz/${quizId}`)
      if (!res.ok) {
        throw new Error("Failed to fetch questions")
      }
      const data = await res.json()
      setOriginalQuestions(data)
      
      const feedbackPromises = data.map(q => 
        fetch(`${BASE}/question/${q.question_id}/feedback`).then(res => res.json())
      )
      const feedbackResults = await Promise.all(feedbackPromises)
      
      const feedbackMap = {}
      data.forEach((q, idx) => {
        feedbackMap[q.question_id] = feedbackResults[idx]
      })
      setFeedbackData(feedbackMap)
      
      if (currentAttemptId) {
        try {
          const randRes = await fetch(`${BASE}/attempt/${currentAttemptId}/randomization`)

          if (randRes.ok) {
            const randData = await randRes.json()
          
            if (randData.length > 0) {
              const orderMap = {}
              randData.forEach(item => {
                const mapping = item.mapping
              
                const positionArray = [
                  Object.keys(mapping).findIndex(key => mapping[key] === 'A'),
                  Object.keys(mapping).findIndex(key => mapping[key] === 'B'),
                  Object.keys(mapping).findIndex(key => mapping[key] === 'C'),
                  Object.keys(mapping).findIndex(key => mapping[key] === 'D')
                ]
                orderMap[item.question_id] = positionArray
              })
              setOptionMapping(orderMap)
            
              const reordered = randData
                .sort((a,b) => a.display_order - b.display_order)
                .map(item => data.find(q => q.question_id === item.question_id))
                .filter(q => q)
              setRandomizedQuestions(reordered)
            } else {
              setRandomizedQuestions(data)
            }
          } else {
            setRandomizedQuestions(data)
          }
        } catch (error) {
          console.error("Error fetching randomization:", error)
          setRandomizedQuestions(data)
        }
      } else {
         setRandomizedQuestions(data)
      }
    } catch (error) {
      console.error("Error fetching questions:", error)
      setFetchError("Failed to load questions. Please try again.")
    }
  }

  const handleTimeUp = () => {
    if (Object.keys(answers).length > 0) {
      submitAttempt()
    } else {
      setSubmitted(true)
      setResult({
        score: 0,
        total: originalQuestions.length,
        percentage: 0
      })
      setQuestionsWithAnswers(originalQuestions)
    }
  }

  const getOptionContent = (question, positionIndex) => {
    const mapping = optionMapping[question.question_id]
    if (!mapping) {
      const optionKeys = ['option_a', 'option_b', 'option_c', 'option_d']
      return question[optionKeys[positionIndex]]
    }
    const originalIndex = mapping[positionIndex]
    const optionKeys = ['option_a', 'option_b', 'option_c', 'option_d']
    return question[optionKeys[originalIndex]]
  }

  const getOptionImage = (question, positionIndex) => {
    const mapping = optionMapping[question.question_id]
    if (!mapping) {
      const imageKeys = ['option_a_image', 'option_b_image', 'option_c_image', 'option_d_image']
      return question[imageKeys[positionIndex]]
    }
    const originalIndex = mapping[positionIndex]
    const imageKeys = ['option_a_image', 'option_b_image', 'option_c_image', 'option_d_image']
    return question[imageKeys[originalIndex]]
  }

  const getOriginalOptionLetter = (questionId, positionIndex) => {
    const mapping = optionMapping[questionId]
    if (!mapping) {
      return String.fromCharCode(65 + positionIndex)
    }
    const originalIndex = mapping[positionIndex]
    return String.fromCharCode(65 + originalIndex)
  }

  const getOptionText = (question, optionLetter) => {
    const optionKey = `option_${optionLetter.toLowerCase()}`
    return question[optionKey] || ''
  }

  const getOptionImageByLetter = (question, optionLetter) => {
    const imageKey = `option_${optionLetter.toLowerCase()}_image`
    return question[imageKey] || null
  }

  const handleAnswerSelect = (questionId, positionIndex) => {
    setAnswers({ ...answers, [questionId]: positionIndex })
  }

  const submitAttempt = async () => {
    if (!currentAttemptId) {
      alert("No active attempt found")
      return
    }
    const currentQuestions = randomizedQuestions.length > 0 ? randomizedQuestions : originalQuestions
    if (Object.keys(answers).length !== currentQuestions.length) {
      alert(`Please answer all questions. ${currentQuestions.length - Object.keys(answers).length} remaining.`)
      return
    }
    setLoading(true)
    
    const formatted = Object.keys(answers).map(qid => {
      const positionIndex = answers[qid]
      const originalLetter = getOriginalOptionLetter(parseInt(qid), positionIndex)
      return {
        question_id: parseInt(qid),
        selected_option: originalLetter
      }
    })

    try {
      const res = await fetch(`${BASE}/attempt/submit/${currentAttemptId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: formatted })
      })
      const data = await res.json()
      if (res.ok) {
        setQuestionsWithAnswers(currentQuestions)
        setResult(data)
        setSubmitted(true)
      } else {
        alert(data.error || "Failed to submit quiz")
      }
    } catch (error) {
      console.error("Error submitting attempt:", error)
      alert("Failed to submit quiz. Please check your connection.")
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (submitted && result) {
    return (
      <div style={modalOverlayStyle}>
        <div style={{...modalStyle, maxWidth: '800px'}}>
          <div style={modalHeaderStyle}>
            <h2 style={modalTitleStyle}>{quizTitle}</h2>
            <button onClick={onClose} style={closeButtonStyle}>✕</button>
          </div>
          <div style={resultSummaryStyle}>
            <div style={scoreCircleStyle}>
              <span style={scoreValueStyle}>{result.score}</span>
              <span style={scoreTotalStyle}>/{result.total}</span>
            </div>
            <div style={percentageStyle((result.score / result.total) * 100)}>
              {((result.score / result.total) * 100).toFixed(1)}%
            </div>
          </div>
          <div style={answersReviewStyle}>
            <h3 style={reviewTitleStyle}>Review Your Answers</h3>
            {questionsWithAnswers.map((q, idx) => {
              const selectedPosition = answers[q.question_id]
              const selectedOriginalLetter = selectedPosition !== undefined ? 
                getOriginalOptionLetter(q.question_id, selectedPosition) : null
              const isCorrect = selectedOriginalLetter === q.correct_option
              const feedback = feedbackData[q.question_id]
              
              return (
                <div key={q.question_id} style={reviewCardStyle}>
                  <div style={reviewHeaderStyle}>
                    <span style={questionNumberStyle}>Question {idx + 1}</span>
                    <span style={isCorrect ? correctTagStyle : incorrectTagStyle}>
                      {isCorrect ? '✓ Correct' : '✗ Incorrect'}
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
                  
                  <div style={correctAnswerBoxStyle}>
                    <strong>Correct Answer: </strong>
                    <span style={correctAnswerTextStyle}>
                      {getOptionText(q, q.correct_option)}
                    </span>
                    {getOptionImageByLetter(q, q.correct_option) && (
                      <img 
                        src={getOptionImageByLetter(q, q.correct_option)} 
                        alt="Correct option" 
                        style={optionImageStyle} 
                      />
                    )}
                  </div>
                  
                  {!isCorrect && selectedOriginalLetter && (
                    <div style={yourAnswerBoxStyle}>
                      <strong>Your Answer: </strong>
                      <span style={yourAnswerTextStyle}>
                        {getOptionText(q, selectedOriginalLetter)}
                      </span>
                      {getOptionImageByLetter(q, selectedOriginalLetter) && (
                        <img 
                          src={getOptionImageByLetter(q, selectedOriginalLetter)} 
                          alt="Your answer" 
                          style={optionImageStyle} 
                        />
                      )}
                    </div>
                  )}
                  
                  {feedback && feedback.explanation && (
                    <div style={explanationBoxStyle}>
                      <div style={explanationHeaderStyle}>
                        <span>📚 Explanation</span>
                      </div>
                      <div style={explanationTextStyle}>
                        {feedback.explanation}
                      </div>
                      {feedback.learning_resource && (
                        <div style={resourceLinkStyle}>
                          📖 Learn more: {feedback.learning_resource}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <div style={footerStyle}>
            <button onClick={onClose} style={closeFooterButtonStyle}>Close</button>
          </div>
        </div>
      </div>
    )
  }

  const displayQuestions = randomizedQuestions.length > 0 ? randomizedQuestions : originalQuestions

  return (
    <div style={modalOverlayStyle}>
      <div style={modalStyle}>
        <div style={modalHeaderStyle}>
          <div>
            <h2 style={quizTitleStyle}>{quizTitle}</h2>
            <p style={questionCountStyle}>
              {Object.keys(answers).length} of {displayQuestions.length} answered
            </p>
          </div>
          <div style={timerSectionStyle}>
            {showTimeWarning && (
              <span style={timeWarningStyle}>Time running out!</span>
            )}
            <div style={timerStyle(timeLeft)}>
              {formatTime(timeLeft || 0)}
            </div>
            <button onClick={onClose} style={closeButtonStyle}>✕</button>
          </div>
        </div>
        <div style={progressContainerStyle}>
          <div style={progressBarStyle}>
            <div style={{
              ...progressFillStyle,
              width: `${(Object.keys(answers).length / displayQuestions.length) * 100}%`
            }} />
          </div>
        </div>
        {fetchError ? (
          <div style={errorStyle}>{fetchError}</div>
        ) : displayQuestions.length === 0 ? (
          <div style={loadingStyle}>Loading questions...</div>
        ) : (
          <>
            {Object.keys(optionMapping).length > 0 && (
              <div style={randomizeIndicatorStyle}>
                Questions and options randomized for this attempt
              </div>
            )}
            <div style={questionsContainerStyle}>
              {displayQuestions.map((q, idx) => {
                const questionId = q.question_id
                const uniqueKey = `${questionId}-${idx}`
                
                return (
                  <div key={uniqueKey} style={questionCardStyle}>
                    <div style={questionHeaderStyle}>
                      <span style={questionNumberStyle}>Question {idx + 1}</span>
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
                      {[0, 1, 2, 3].map(positionIndex => {
                        const optionContent = getOptionContent(q, positionIndex)
                        const optionImage = getOptionImage(q, positionIndex)
                        const displayLetter = String.fromCharCode(65 + positionIndex)
                        const isSelected = answers[q.question_id] === positionIndex
                        return (
                          <label 
                            key={`${questionId}-opt-${positionIndex}`}
                            style={{
                              ...optionStyle,
                              backgroundColor: isSelected ? colors.primary : '#ffffff',
                              borderColor: isSelected ? colors.primary : colors.border,
                              color: isSelected ? '#ffffff' : colors.text
                            }}
                          >
                            <input
                              type="radio"
                              name={`q${q.question_id}`}
                              value={positionIndex}
                              checked={isSelected}
                              onChange={() => handleAnswerSelect(q.question_id, positionIndex)}
                              style={radioStyle}
                            />
                            <div style={optionContentWrapperStyle}>
                              <span style={optionTextStyle}>
                                <strong>{displayLetter}.</strong> {optionContent}
                              </span>
                              {optionImage && (
                                <img src={optionImage} alt={`Option ${displayLetter}`} style={optionImageStyle} />
                              )}
                            </div>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
            <button 
              onClick={submitAttempt}
              disabled={loading || Object.keys(answers).length !== displayQuestions.length}
              style={submitButtonStyle(loading, Object.keys(answers).length === displayQuestions.length)}
            >
              {loading ? 'Submitting...' : 
               Object.keys(answers).length !== displayQuestions.length ? 
               `Answer ${displayQuestions.length - Object.keys(answers).length} more` : 
               'Submit Quiz'}
            </button>
          </>
        )}
      </div>
    </div>
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

const modalStyle = {
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

const quizTitleStyle = {
  fontSize: '18px',
  fontWeight: '500',
  color: colors.text,
  margin: '0 0 4px 0'
}

const questionCountStyle = {
  fontSize: '13px',
  color: colors.textLight,
  margin: 0
}

const timerSectionStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px'
}

const timerStyle = (timeLeft) => ({
  padding: '8px 16px',
  backgroundColor: timeLeft < 60 ? colors.secondaryLight : colors.primaryLight,
  color: timeLeft < 60 ? colors.secondary : colors.primary,
  borderRadius: '4px',
  fontSize: '16px',
  fontWeight: '500',
  fontFamily: 'monospace'
})

const timeWarningStyle = {
  color: colors.secondary,
  fontSize: '13px',
  fontWeight: '500'
}

const closeButtonStyle = {
  background: 'none',
  border: 'none',
  fontSize: '20px',
  cursor: 'pointer',
  color: colors.textLight
}

const progressContainerStyle = {
  padding: '0 24px',
  marginBottom: '20px'
}

const progressBarStyle = {
  height: '4px',
  backgroundColor: colors.border,
  borderRadius: '2px',
  overflow: 'hidden'
}

const progressFillStyle = {
  height: '100%',
  backgroundColor: colors.primary,
  transition: 'width 0.3s ease'
}

const randomizeIndicatorStyle = {
  margin: '0 24px 16px 24px',
  padding: '8px 12px',
  backgroundColor: colors.primaryLight,
  color: colors.primary,
  borderRadius: '4px',
  fontSize: '12px',
  textAlign: 'center'
}

const errorStyle = {
  padding: '40px 24px',
  textAlign: 'center',
  color: colors.secondary,
  fontSize: '14px'
}

const loadingStyle = {
  padding: '60px 24px',
  textAlign: 'center',
  color: colors.textLight,
  fontSize: '14px'
}

const questionsContainerStyle = {
  padding: '0 24px 24px',
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
  marginBottom: '12px'
}

const questionNumberStyle = {
  fontSize: '12px',
  color: colors.textLight,
  textTransform: 'uppercase',
  letterSpacing: '0.3px'
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
  gap: '10px'
}

const optionStyle = {
  display: 'flex',
  alignItems: 'center',
  padding: '12px 16px',
  borderRadius: '4px',
  border: '1px solid',
  cursor: 'pointer',
  transition: 'all 0.2s',
  fontSize: '14px'
}

const radioStyle = {
  marginRight: '12px',
  cursor: 'pointer',
  accentColor: colors.primary
}

const optionContentWrapperStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  flex: 1,
  flexWrap: 'wrap'
}

const optionTextStyle = {
  fontSize: '14px',
  lineHeight: '1.5',
  flex: 1
}

const optionImageStyle = {
  maxWidth: '80px',
  maxHeight: '60px',
  borderRadius: '4px',
  objectFit: 'cover'
}

const submitButtonStyle = (loading, allAnswered) => ({
  margin: '0 24px 24px 24px',
  padding: '14px 24px',
  width: 'calc(100% - 48px)',
  backgroundColor: allAnswered ? colors.primary : colors.textLight,
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  fontSize: '15px',
  fontWeight: '500',
  cursor: loading ? 'not-allowed' : 'pointer',
  opacity: loading ? 0.6 : 1
})

const resultSummaryStyle = {
  padding: '24px',
  textAlign: 'center',
  borderBottom: `1px solid ${colors.border}`,
  backgroundColor: '#f8f9fa'
}

const scoreCircleStyle = {
  display: 'inline-block',
  marginBottom: '8px'
}

const scoreValueStyle = {
  fontSize: '48px',
  fontWeight: '600',
  color: colors.primary
}

const scoreTotalStyle = {
  fontSize: '24px',
  color: colors.textLight
}

const percentageStyle = (percentage) => ({
  display: 'inline-block',
  padding: '4px 12px',
  backgroundColor: percentage >= 70 ? colors.primaryLight : colors.secondaryLight,
  color: percentage >= 70 ? colors.primary : colors.secondary,
  borderRadius: '20px',
  fontSize: '14px',
  fontWeight: '500'
})

const answersReviewStyle = {
  padding: '24px',
  maxHeight: '500px',
  overflowY: 'auto'
}

const reviewTitleStyle = {
  fontSize: '18px',
  fontWeight: '500',
  color: colors.text,
  margin: '0 0 20px 0'
}

const reviewCardStyle = {
  border: `1px solid ${colors.border}`,
  borderRadius: '6px',
  padding: '20px',
  marginBottom: '20px'
}

const reviewHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '12px'
}

const correctTagStyle = {
  padding: '4px 8px',
  backgroundColor: '#e6f7e6',
  color: '#28a745',
  borderRadius: '4px',
  fontSize: '12px',
  fontWeight: '500'
}

const incorrectTagStyle = {
  padding: '4px 8px',
  backgroundColor: '#ffebee',
  color: '#dc3545',
  borderRadius: '4px',
  fontSize: '12px',
  fontWeight: '500'
}

const correctAnswerBoxStyle = {
  backgroundColor: "#e6f7e6",
  padding: "12px",
  borderRadius: "6px",
  marginBottom: "12px",
  borderLeft: "4px solid #28a745"
}

const correctAnswerTextStyle = {
  color: "#155724",
  fontWeight: "500"
}

const yourAnswerBoxStyle = {
  backgroundColor: "#ffebee",
  padding: "12px",
  borderRadius: "6px",
  marginBottom: "12px",
  borderLeft: "4px solid #dc3545"
}

const yourAnswerTextStyle = {
  color: "#721c24"
}

const explanationBoxStyle = {
  backgroundColor: "#f8f9fa",
  padding: "12px",
  borderRadius: "6px",
  marginTop: "12px",
  border: "1px solid #e2e8f0"
}

const explanationHeaderStyle = {
  fontSize: "13px",
  fontWeight: "600",
  color: "#475569",
  marginBottom: "8px"
}

const explanationTextStyle = {
  fontSize: "13px",
  color: "#1e293b",
  lineHeight: "1.6"
}

const resourceLinkStyle = {
  marginTop: "8px",
  fontSize: "12px",
  color: "#7071ae"
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

const modalTitleStyle = {
  fontSize: '18px',
  fontWeight: '500',
  color: colors.text,
  margin: 0
}

export default AttemptPanel