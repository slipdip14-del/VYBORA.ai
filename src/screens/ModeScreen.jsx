import React from 'react'
import { MODES } from '../modes.js'

export default function ModeScreen({ currentPath = 'learn', onPathChange, onSelect }) {
  const isLearn = currentPath === 'learn'

  return (
    <div className="landing-wrapper" id="landing">
      {/* Floating Atmosphere Emojis */}
      <div className="floating-emoji" style={{ top: '10%', left: '10%' }}>💀</div>
      <div className="floating-emoji" style={{ top: '20%', right: '15%' }}>🥀</div>
      <div className="floating-emoji" style={{ bottom: '15%', left: '20%' }}>⛓️</div>
      <div className="floating-emoji" style={{ bottom: '10%', right: '10%' }}>👁️</div>
      <div className="floating-emoji" style={{ top: '50%', left: '5%' }}>🩸</div>
      <div className="floating-emoji" style={{ top: '40%', right: '5%' }}>🔥</div>

      <h1 className="wordmark">VYBORA.ai</h1>
      <p className="tagline">Survive the Scrutiny. Knowledge is your only exit. 🚪</p>

      {/* Two-Section Switcher: Learn Concept vs Direct Test */}
      <div className="path-selector-container">
        <button
          type="button"
          className={`path-tab-btn ${isLearn ? 'active' : ''}`}
          onClick={() => onPathChange('learn')}
        >
          <span>📖</span>
          <span>1. LEARN THE CONCEPT</span>
        </button>

        <button
          type="button"
          className={`path-tab-btn ${!isLearn ? 'active' : ''}`}
          onClick={() => onPathChange('test')}
        >
          <span>⚡</span>
          <span>2. DIRECT TEST</span>
        </button>
      </div>

      <div className="path-description-banner">
        {isLearn ? (
          <span>
            <strong>Mastery Mode:</strong> Select an examiner persona to give you an unforgettable,
            deep briefing on your topic before deciding whether to take the test.
          </span>
        ) : (
          <span>
            <strong>Survival Mode:</strong> Skip the theory. Pick your interrogator and face 5 rounds
            of escalating cross-examination immediately.
          </span>
        )}
      </div>

      {/* 4 Persona Cards */}
      <div className="mode-grid">
        {Object.values(MODES).map((mode) => (
          <div
            key={mode.id}
            className={`mode-card ${mode.cardClass}`}
            role="button"
            tabIndex={0}
            onClick={() => onSelect(mode.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onSelect(mode.id)
              }
            }}
          >
            <div className="mode-emoji">{mode.emoji}</div>
            <div className="card-role-badge">
              {isLearn ? 'TUTOR MODE' : 'EXAMINER MODE'}
            </div>
            <h2 style={{ fontFamily: mode.font }}>{mode.label}</h2>
            <p>{isLearn ? mode.learnTagline : mode.tagline}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
