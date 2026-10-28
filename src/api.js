/**
 * VYBORA.ai API Client Helper
 * Calls backend serverless function /api/chat when available,
 * with local simulation fallback if running Vite dev without Vercel backend.
 */

export async function checkHealth() {
  try {
    const res = await fetch('/api/health')
    if (res.ok) {
      return await res.json()
    }
  } catch {
    // ignore
  }
  return { ok: true, simulated: true }
}

export async function sendChat({
  mode,
  name,
  age,
  topic,
  messages = [],
  final = false,
  action = 'interrogate'
}) {
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        mode,
        name: name.trim(),
        age: Number(age),
        topic: topic.trim(),
        messages,
        final,
        action
      })
    })

    if (res.ok) {
      const data = await res.json()
      if (data && data.ok) {
        return data
      }
      if (data && data.error) {
        throw new Error(data.error)
      }
    } else if (res.status !== 404 && res.status !== 502) {
      const errData = await res.json().catch(() => null)
      if (errData?.error) {
        throw new Error(errData.error)
      }
    }
  } catch (err) {
    if (err.message && !err.message.includes('fetch') && !err.message.includes('Failed to fetch')) {
      throw err
    }
  }

  // Local fallback simulation
  await new Promise((r) => setTimeout(r, 600))
  return generateSimulatedResponse({ mode, name, topic, messages, final, action })
}

function generateSimulatedResponse({ mode, name, topic, messages, final, action }) {
  if (action === 'learn') {
    if (messages.length === 0) {
      return {
        ok: true,
        text: `### 💡 1. The Core Truth\n${name}, pay close attention to **${topic}**. At its core, this topic describes how underlying principles interact to produce observable reality.\n\n### ⚙️ 2. How the Mechanism Works\nEvery process here operates in structured stages: initial trigger, intermediate transformation, and final equilibrium.\n\n### 🎯 3. The Analogy\nThink of ${topic} like an intricate machine where every gear depends on the friction of the previous one.\n\n### ⚠️ 4. The Examination Trap\nExaminers will try to trick you into confusing causation with correlation here. Don't fall for it.\n\n*Feel free to ask me any questions, or click below when you're ready to test your knowledge in the 5-Round Scrutiny!*`
      }
    } else {
      return {
        ok: true,
        text: `That is a sharp question regarding ${topic}, ${name}. The key connection here is remembering that each component operates under strict constraints. Are you ready to face the 5-Round Test, or do you want to probe another detail?`
      }
    }
  }

  const round = Math.floor(messages.length / 2) + 1

  if (final) {
    const verdictPresets = {
      interrogation: {
        verdict: 'PROBATIONARY CLEARANCE',
        score: 82,
        summary: `Subject ${name} endured 5 rounds of cross-examination on '${topic}'. The testimony was largely coherent with minor cracks in edge-case mechanics.`,
        revise: [
          `Foundational definitions of ${topic}`,
          'Boundary constraints and exception handling',
          'Cross-application logic under scrutiny'
        ]
      },
      lovable: {
        verdict: 'SURVIVED WITH SCARS',
        score: 88,
        summary: `Even through the melancholy and heavy weight of '${topic}', you held on, ${name}. Your dedication to understanding this fragile truth was evident.`,
        revise: [
          `Connecting the core relationships in ${topic}`,
          'Pacing yourself through difficult multi-step problems'
        ]
      },
      warrior: {
        verdict: 'BATTLE-READY SURVIVOR',
        score: 85,
        summary: `Recruit ${name} held the line against unrelenting pressure. Your command of '${topic}' showed discipline, focus, and warrior resilience.`,
        revise: [
          `Sharpen tactical execution on core ${topic} rules`,
          'Eliminate hesitation during complex recall'
        ]
      },
      sadist: {
        verdict: 'TORTURE SURVIVED',
        score: 76,
        summary: `You didn't break entirely, ${name}. While your answers on '${topic}' gave me plenty to mock, a spark of genuine comprehension actually managed to survive.`,
        revise: [
          `Review primary theorems of ${topic}`,
          'Stop relying on vague intuition—memorize the hard details'
        ]
      }
    }

    const preset = verdictPresets[mode] || verdictPresets.interrogation
    return {
      ok: true,
      verdict: preset
    }
  }

  const questionPresets = {
    interrogation: [
      `Take a seat, ${name}. We are examining '${topic}'. State the foundational principle or definition right now—and make sure your story doesn't change.`,
      `Your previous answer was partially accurate. In reality, the mechanism relies on specific energy transfers. Now tell me: what happens when standard assumptions fail under stress?`,
      `Good grasp on the basics, but the intermediate step has cracks. Walk me through the step-by-step mechanism of '${topic}'. Detail matters.`,
      `You're hesitating. The real truth is more nuanced. If an opposing expert grilled you on the most misunderstood aspect of '${topic}', how would you refute them?`,
      `Final round before sentencing. Give me your absolute strongest synthesis of '${topic}'. Everything rests on this.`
    ],
    lovable: [
      `Oh ${name}... '${topic}' feels so overwhelmingly heavy and fragile, doesn't it? Tell me the simple core idea you're holding onto so we don't get lost in the dark.`,
      `You did well, though a small piece slipped away—the truth is more connected than that. When '${topic}' is tested, how does it hold together?`,
      `It's so easy to slip, but you're finding your footing. Can you gently explain how its key components relate to one another?`,
      `We're almost through the mist, ${name}. What is the deepest, most melancholic truth about '${topic}' that most people overlook?`,
      `One final breath together. Summarize everything '${topic}' means to you in this study session.`
    ],
    warrior: [
      `STAND AT ATTENTION, ${name}! You want to conquer '${topic}'?! State the primary tactical objective and core definition—NOW!`,
      `DECENT EFFORT, RECRUIT, BUT NOT BULLETPROOF! The real battlefield principle demands faster reaction. How do you deploy '${topic}' under maximum load?! PUSH FORWARD!`,
      `I DEMAND PRECISION! Break down the moving parts of '${topic}' like a combat-ready machine! NO HESITATION!`,
      `PRESSURE TEST! What is the single biggest trap or failure mode when dealing with '${topic}', and how do you smash through it?!`,
      `FINAL REP! EMPTY THE TANK! Give me the total operational summary of '${topic}'!`
    ],
    sadist: [
      `Oh, delightful! Look what crawled into my chamber to debate '${topic}'. Go on, ${name}, state your basic understanding so I can ridicule it properly.`,
      `Hahaha! Half-right at best, you pitiful mortal! The actual truth is far more devious than your crude answer. Explain what *actually* happens inside '${topic}' before I lose my patience!`,
      `Your logic is leaking like a cracked beaker! How do you account for the critical complexities in '${topic}'? Or do you need me to hold your hand?`,
      `Still squirming? I expected better sport! What makes you think your grasp on '${topic}' wouldn't crumble the moment an actual exam starts?`,
      `One last gasp before I hand down your judgment. Make your final stand on '${topic}'—entertain me!`
    ]
  }

  const modeQuestions = questionPresets[mode] || questionPresets.interrogation
  const qIdx = Math.min(round - 1, modeQuestions.length - 1)
  const questionText = modeQuestions[qIdx]

  return {
    ok: true,
    text: questionText
  }
}
