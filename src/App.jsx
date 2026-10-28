import React, { useState, useEffect } from 'react'
import { MODES } from './modes.js'
import { sendChat } from './api.js'
import ModeScreen from './screens/ModeScreen.jsx'
import LearnScreen from './screens/LearnScreen.jsx'

export default function App() {
  const [path, setPath] = useState('learn') // 'learn' | 'test'
  const [screen, setScreen] = useState('mode') // 'mode' | 'info' | 'learn' | 'session' | 'verdict'
  const [mode, setMode] = useState(null)
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [topic, setTopic] = useState('')
  const [formErrors, setFormErrors] = useState({})

  // Learning room state
  const [learnMessages, setLearnMessages] = useState([])

  // Interrogation session state
  const [round, setRound] = useState(1)
  const [messages, setMessages] = useState([])
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [verdict, setVerdict] = useState(null)

  // Reliability & loading state
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)

  // Synchronize data-theme on root HTML element and smooth body background
  useEffect(() => {
    if (mode && MODES[mode]) {
      document.documentElement.setAttribute('data-theme', mode)
      document.body.style.backgroundColor = MODES[mode].bgColor || '#050505'
    } else {
      document.documentElement.removeAttribute('data-theme')
      document.body.style.backgroundColor = '#050505'
    }
  }, [mode])

  // Select Mode from Doorway
  function handleSelectMode(selectedModeId) {
    setMode(selectedModeId)
    setErrorMessage(null)
    setScreen('info')
  }

  // Back to Mode Doorway
  function handleBackToMode() {
    setErrorMessage(null)
    setScreen('mode')
  }

  // Start Session (handles either 'learn' or 'test' intake)
  async function handleStartSession(e) {
    if (e) e.preventDefault()
    setErrorMessage(null)
    const errors = {}

    const trimmedName = name.trim()
    if (!trimmedName) {
      errors.name = 'Name is required to establish your profile'
    } else if (trimmedName.length > 40) {
      errors.name = 'Name must be 40 characters or fewer'
    }

    const parsedAge = parseInt(age, 10)
    if (isNaN(parsedAge) || parsedAge < 10 || parsedAge > 100) {
      errors.age = 'Age must be between 10 and 100'
    }

    const trimmedTopic = topic.trim()
    if (!trimmedTopic) {
      errors.topic = 'Topic is required'
    } else if (trimmedTopic.length > 200) {
      errors.topic = 'Topic must be 200 characters or fewer'
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    setFormErrors({})
    setIsLoading(true)

    try {
      if (path === 'learn') {
        const data = await sendChat({
          mode,
          name: trimmedName,
          age: parsedAge,
          topic: trimmedTopic,
          messages: [],
          action: 'learn'
        })
        setLearnMessages([{ role: 'ai', text: data.text }])
        setScreen('learn')
      } else {
        const data = await sendChat({
          mode,
          name: trimmedName,
          age: parsedAge,
          topic: trimmedTopic,
          messages: [],
          action: 'interrogate'
        })
        setRound(1)
        setMessages([{ role: 'ai', text: data.text }])
        setCurrentAnswer('')
        setScreen('session')
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to connect. Please retry.')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle follow-up questions inside the Learn Room
  async function handleAskLearnQuestion(questionText) {
    const trimmed = questionText.trim()
    if (!trimmed || isLoading) return

    setErrorMessage(null)
    setIsLoading(true)

    const updated = [
      ...learnMessages,
      { role: 'student', text: trimmed }
    ]
    setLearnMessages(updated)

    try {
      const data = await sendChat({
        mode,
        name: name.trim(),
        age: parseInt(age, 10),
        topic: topic.trim(),
        messages: updated,
        action: 'learn'
      })
      setLearnMessages([
        ...updated,
        { role: 'ai', text: data.text }
      ])
    } catch (err) {
      setErrorMessage(err.message || 'Failed to get explanation. Please retry.')
    } finally {
      setIsLoading(false)
    }
  }

  // Transition from Learn Room directly into the 5-Round Test
  async function handleStartTestFromLearn(testModeId = mode) {
    setIsLoading(true)
    setErrorMessage(null)
    setMode(testModeId)

    try {
      const data = await sendChat({
        mode: testModeId,
        name: name.trim(),
        age: parseInt(age, 10),
        topic: topic.trim(),
        messages: [],
        action: 'interrogate'
      })

      setRound(1)
      setMessages([{ role: 'ai', text: data.text }])
      setCurrentAnswer('')
      setPath('test')
      setScreen('session')
    } catch (err) {
      setErrorMessage(err.message || 'Failed to launch test. Please retry.')
    } finally {
      setIsLoading(false)
    }
  }

  // Submit Answer in Interrogation test & advance
  async function handleSubmitAnswer(e) {
    if (e) e.preventDefault()

    const trimmed = currentAnswer.trim()
    if (!trimmed || isLoading) return

    setErrorMessage(null)
    setIsLoading(true)

    const updatedMessages = [
      ...messages,
      { role: 'student', text: trimmed }
    ]

    const isFinalRound = round >= 5

    try {
      const data = await sendChat({
        mode,
        name: name.trim(),
        age: parseInt(age, 10),
        topic: topic.trim(),
        messages: updatedMessages,
        final: isFinalRound,
        action: 'interrogate'
      })

      if (isFinalRound && data.verdict) {
        setMessages(updatedMessages)
        setVerdict(data.verdict)
        setCurrentAnswer('')
        setScreen('verdict')
      } else {
        setMessages([
          ...updatedMessages,
          { role: 'ai', text: data.text }
        ])
        setRound((prev) => prev + 1)
        setCurrentAnswer('')
      }
    } catch (err) {
      setErrorMessage(err.message || 'Examiner call failed. Your answer was preserved—please retry.')
    } finally {
      setIsLoading(false)
    }
  }

  // Transition from Verdict to Learn Room to master the revision points
  async function handleLearnFromVerdict() {
    setIsLoading(true)
    setErrorMessage(null)
    setPath('learn')

    try {
      const data = await sendChat({
        mode,
        name: name.trim(),
        age: parseInt(age, 10),
        topic: topic.trim(),
        messages: [],
        action: 'learn'
      })
      setLearnMessages([{ role: 'ai', text: data.text }])
      setScreen('learn')
    } catch (err) {
      setErrorMessage(err.message || 'Failed to start learning session.')
    } finally {
      setIsLoading(false)
    }
  }

  // Reset to initial mode screen
  function handleNewCase() {
    setScreen('mode')
    setMode(null)
    setName('')
    setAge('')
    setTopic('')
    setFormErrors({})
    setRound(1)
    setMessages([])
    setLearnMessages([])
    setCurrentAnswer('')
    setVerdict(null)
    setErrorMessage(null)
    setIsLoading(false)
  }

  const currentModeInfo = mode ? MODES[mode] : null

  return (
    <div className="vybora-container">
      {/* 1. Main Portal (Learn vs Direct Test + 4 Mode Cards) */}
      {screen === 'mode' && (
        <ModeScreen
          currentPath={path}
          onPathChange={(newPath) => setPath(newPath)}
          onSelect={handleSelectMode}
        />
      )}

      {/* 2. Intake Screen (Formatted for Learn vs Test) */}
      {screen === 'info' && currentModeInfo && (
        <div className="screen screen-info">
          <h1 className="screen-title">
            {path === 'learn' ? currentModeInfo.learnTitle : currentModeInfo.sessionTitle}
          </h1>
          <p className="screen-subtitle">
            {path === 'learn' ? currentModeInfo.learnTagline : currentModeInfo.tagline}
          </p>

          <div className="bubble bubble-examiner" style={{ marginBottom: '25px' }}>
            <strong>{path === 'learn' ? 'Tutor Briefing:' : 'Examiner:'}</strong>
            <p>
              {path === 'learn'
                ? `Welcome to the Study Room. Tell me who you are and what subject you wish to master. I will break down the mechanisms and traps in my signature style.`
                : `Your presence here is a mistake. Let us see if your mind is actually functioning. State your topic and prepare for cross-examination.`}
            </p>
          </div>

          {errorMessage && (
            <div className="error-banner">
              <p>{errorMessage}</p>
              <button type="button" onClick={() => handleStartSession()} disabled={isLoading}>
                RETRY
              </button>
            </div>
          )}

          <div className="form-card">
            <form onSubmit={handleStartSession}>
              <div className="form-group">
                <label htmlFor="name-input">STUDENT NAME (max 40 chars):</label>
                <input
                  id="name-input"
                  type="text"
                  value={name}
                  maxLength={40}
                  disabled={isLoading}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={currentModeInfo?.suggestedName ? `e.g. ${currentModeInfo.suggestedName}` : 'e.g. Subhan'}
                  autoFocus
                />
                {formErrors.name && <span className="error-text">{formErrors.name}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="age-input">STUDENT AGE (10 - 100):</label>
                <input
                  id="age-input"
                  type="number"
                  min={10}
                  max={100}
                  value={age}
                  disabled={isLoading}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="e.g. 20"
                />
                {formErrors.age && <span className="error-text">{formErrors.age}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="topic-input">
                  {path === 'learn' ? 'TOPIC TO MASTER:' : 'TOPIC UNDER SCRUTINY:'}
                </label>
                <textarea
                  id="topic-input"
                  value={topic}
                  maxLength={200}
                  disabled={isLoading}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Photosynthesis, Newton's Laws, French Revolution, Organic Chemistry..."
                  rows={3}
                />
                {formErrors.topic && <span className="error-text">{formErrors.topic}</span>}
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleBackToMode}
                  disabled={isLoading}
                >
                  ← BACK
                </button>
                <button type="submit" disabled={isLoading}>
                  {isLoading
                    ? 'PREPARING...'
                    : path === 'learn'
                    ? 'BEGIN LESSON 📖'
                    : 'ENTER SCRUTINY 🚪'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Learn Concept Screen (Masterclass + Q&A + Test Bridge) */}
      {screen === 'learn' && currentModeInfo && (
        <LearnScreen
          modeInfo={currentModeInfo}
          name={name}
          age={age}
          topic={topic}
          messages={learnMessages}
          isLoading={isLoading}
          errorMessage={errorMessage}
          onAskQuestion={handleAskLearnQuestion}
          onStartTest={(testModeId) => handleStartTestFromLearn(testModeId)}
          onChangeModeForTest={() => {
            setPath('test')
            setScreen('mode')
          }}
          onNewTopic={handleNewCase}
        />
      )}

      {/* 4. Session Screen (5-Round Interrogation with Educational Feedback) */}
      {screen === 'session' && currentModeInfo && (
        <div id="session" className="screen">
          <div className="session-container">
            <div className="session-header">
              <h1 id="session-title" className="screen-title">
                {currentModeInfo.sessionTitle}
              </h1>
              <div className="round-badge">
                ROUND {round} OF 5
              </div>
              <div className="subject-dossier-pill">
                Subject: <strong>{name}</strong> (Age {age}) &bull; Topic: <strong>{topic}</strong>
              </div>
            </div>

            <div className="chat-history">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`bubble ${msg.role === 'ai' ? 'bubble-examiner' : 'bubble-student'}`}
                >
                  <strong>{msg.role === 'ai' ? `${currentModeInfo.label} Examiner:` : `${name}:`}</strong>
                  <p>{msg.text}</p>
                </div>
              ))}
            </div>

            {isLoading && (
              <div className="loading-indicator">
                {currentModeInfo.label} is analyzing testimony & formulating judgment...
              </div>
            )}

            {errorMessage && (
              <div className="error-banner">
                <p>{errorMessage}</p>
                <button
                  type="button"
                  onClick={() => handleSubmitAnswer()}
                  disabled={isLoading}
                >
                  RETRY
                </button>
              </div>
            )}

            <form onSubmit={handleSubmitAnswer} className="defense-form">
              <div className="defense-form-row">
                <textarea
                  id="defense-input"
                  className="defense-input"
                  value={currentAnswer}
                  disabled={isLoading}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  placeholder="State your defense..."
                  rows={2}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSubmitAnswer()
                    }
                  }}
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={isLoading || !currentAnswer.trim()}
                >
                  {isLoading ? '...' : 'SUBMIT'}
                </button>
              </div>

              <div style={{ marginTop: '20px' }}>
                <button
                  type="button"
                  className="btn-abandon"
                  onClick={handleNewCase}
                >
                  ABANDON CASE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Verdict Screen */}
      {screen === 'verdict' && verdict && currentModeInfo && (
        <div className="screen screen-verdict">
          <div className="verdict-container">
            <h1 className="screen-title">FINAL VERDICT</h1>
            <p className="screen-subtitle">
              Case Examiner: <strong>{currentModeInfo.sessionTitle}</strong>
            </p>

            <div className="verdict-card">
              <h2 style={{ fontFamily: 'var(--font-heading)', margin: '0 0 10px 0', fontSize: '2.2rem' }}>
                {verdict.verdict}
              </h2>

              <div className="verdict-score-box">
                <div style={{ fontSize: '0.9rem', letterSpacing: '2px', opacity: 0.75 }}>
                  FINAL SCRUTINY SCORE
                </div>
                <div className="verdict-score-num">
                  {verdict.score}
                  <span style={{ fontSize: '1.8rem', opacity: 0.6 }}> / 100</span>
                </div>
              </div>

              <div className="bubble bubble-examiner" style={{ margin: '20px 0' }}>
                <strong>Examiner Assessment:</strong>
                <p>{verdict.summary}</p>
              </div>

              {verdict.revise && verdict.revise.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                  <h4 style={{ fontFamily: 'var(--font-heading)', margin: '0 0 10px 0', fontSize: '1.2rem', letterSpacing: '1px' }}>
                    TOPICS MARKED FOR REVISION:
                  </h4>
                  <ul className="verdict-revision-list">
                    {verdict.revise.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                style={{ background: 'var(--accent)' }}
                onClick={handleLearnFromVerdict}
              >
                📖 MASTER & REVISE THIS TOPIC
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => handleStartTestFromLearn(mode)}
              >
                ⚡ RETRY 5-ROUND TEST
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={handleNewCase}
              >
                🚪 CHOOSE NEW TOPIC
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
