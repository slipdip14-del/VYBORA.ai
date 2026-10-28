import React, { useState } from 'react'

export default function LearnScreen({
  modeInfo,
  name,
  age,
  topic,
  messages,
  isLoading,
  errorMessage,
  onAskQuestion,
  onStartTest,
  onChangeModeForTest,
  onNewTopic
}) {
  const [questionText, setQuestionText] = useState('')

  function handleSubmit(e) {
    if (e) e.preventDefault()
    const trimmed = questionText.trim()
    if (!trimmed || isLoading) return
    onAskQuestion(trimmed)
    setQuestionText('')
  }

  const quickPrompts = [
    "Explain like I'm 10 years old",
    "Give me another memorable analogy",
    "What's the #1 trap examiners test on?",
    "Can you give me a real-world example?"
  ]

  // Formatter to render clean paragraphs, headers, and bold text
  function renderFormattedContent(text) {
    if (!text) return null
    const lines = text.split('\n')
    return lines.map((line, idx) => {
      const trimmed = line.trim()
      if (!trimmed) return <div key={idx} style={{ height: '8px' }} />

      if (trimmed.startsWith('### ')) {
        return (
          <h3 key={idx} style={{ marginTop: '16px', marginBottom: '8px' }}>
            {trimmed.replace('### ', '')}
          </h3>
        )
      }
      if (trimmed.startsWith('## ')) {
        return (
          <h2 key={idx} style={{ marginTop: '18px', marginBottom: '8px' }}>
            {trimmed.replace('## ', '')}
          </h2>
        )
      }
      if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        const itemText = trimmed.replace(/^[\*\-]\s+/, '')
        return (
          <li key={idx} style={{ marginLeft: '20px', marginBottom: '4px' }}>
            {renderBoldText(itemText)}
          </li>
        )
      }

      return (
        <p key={idx} style={{ margin: '0 0 10px 0', lineHeight: '1.6' }}>
          {renderBoldText(trimmed)}
        </p>
      )
    })
  }

  function renderBoldText(str) {
    const parts = str.split(/(\*\*[^*]+\*\*)/g)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>
      }
      return part
    })
  }

  return (
    <div className="screen screen-learn">
      <div className="learn-container">
        <h1 className="screen-title">{modeInfo.learnTitle}</h1>
        <div className="round-badge" style={{ background: 'rgba(255,255,255,0.06)' }}>
          CONCEPT STUDY ROOM 📖
        </div>
        <div className="subject-dossier-pill" style={{ marginBottom: '20px' }}>
          Topic: <strong>{topic}</strong> &bull; Student: <strong>{name}</strong> (Age {age}) &bull; Tutor: <strong>{modeInfo.personaName}</strong>
        </div>

        {/* Masterclass & Tutor Chat Messages */}
        <div className="chat-history" style={{ maxHeight: '60vh' }}>
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`bubble ${msg.role === 'ai' ? 'bubble-examiner' : 'bubble-student'}`}
            >
              <strong>{msg.role === 'ai' ? `${modeInfo.label} Tutor:` : `${name}:`}</strong>
              <div className="bubble-content">
                {renderFormattedContent(msg.text)}
              </div>
            </div>
          ))}
        </div>

        {isLoading && (
          <div className="loading-indicator">
            {modeInfo.label} is formulating educational breakdown...
          </div>
        )}

        {errorMessage && (
          <div className="error-banner">
            <p>{errorMessage}</p>
          </div>
        )}

        {/* Quick Question Prompts */}
        <div className="quick-chips-container">
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              className="chip-btn"
              disabled={isLoading}
              onClick={() => onAskQuestion(prompt)}
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Ask Question Input */}
        <form onSubmit={handleSubmit} className="defense-form" style={{ marginTop: '10px' }}>
          <div className="defense-form-row">
            <textarea
              className="defense-input"
              value={questionText}
              disabled={isLoading}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder={`Ask ${modeInfo.label} any question about ${topic}...`}
              rows={2}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit()
                }
              }}
            />
            <button type="submit" disabled={isLoading || !questionText.trim()}>
              {isLoading ? '...' : 'ASK TUTOR'}
            </button>
          </div>
        </form>

        {/* The Test Bridge Banner */}
        <div className="test-bridge-banner">
          <h3>⚡ FEEL READY FOR THE TEST?</h3>
          <p>
            You have studied <strong>{topic}</strong>. Now put your understanding on the line
            across 5 escalating rounds of scrutiny!
          </p>
          <div className="test-bridge-actions">
            <button
              type="button"
              style={{ background: 'var(--accent)', fontWeight: 'bold' }}
              onClick={() => onStartTest(modeInfo.id)}
            >
              ⚡ TAKE 5-ROUND TEST (in {modeInfo.label} Mode)
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={onChangeModeForTest}
            >
              🎭 CHANGE TEST PERSONA
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={onNewTopic}
            >
              🚪 CHOOSE NEW TOPIC
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
