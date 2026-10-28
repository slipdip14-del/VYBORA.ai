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
        text: `### 💡 1. The Core Truth\n${name}, pay close attention to **${topic}**. At its core, this topic describes how fundamental principles interact to produce observable reality.\n\n### ⚙️ 2. How the Mechanism Works\nEvery process here operates in structured stages: initial trigger, intermediate transformation, and final equilibrium.\n\n### 🎯 3. The Analogy\nThink of ${topic} like an intricate machine where every gear depends on the friction of the previous one.\n\n### ⚠️ 4. The Examination Trap\nExaminers will try to trick you into confusing causation with correlation here. Don't fall for it.\n\n*Feel free to ask me any questions, or click below when you're ready to test your knowledge in the 5-Round Scrutiny!*`
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
        verdict: 'SWEET MASTERY',
        score: 90,
        summary: `You did so wonderfully, ${name}! Your dedication to learning '${topic}' shone brightly, and you showed real understanding of the heart of the concept.`,
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
      },
      curious: {
        verdict: 'CERTIFIED BRAINIAC BRO',
        score: 89,
        summary: `Yo ${name}, you totally crushed the scrutiny on '${topic}'! Your curiosity and deep-dive logic were top-tier throughout all 5 rounds.`,
        revise: [
          `Fine-tune specific edge-case terminology in ${topic}`,
          'Explore advanced multi-system interactions'
        ]
      },
      chill: {
        verdict: 'SERENE MASTERY',
        score: 88,
        summary: `Smooth and steady, ${name}. You kept your cool under questioning and broke down '${topic}' with pure tranquil clarity.`,
        revise: [
          `Solidify fundamental definitions in ${topic}`,
          'Keep that calm composure on tricky questions'
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
      `Welcome, ${name}! '${topic}' is such a lovely, fascinating subject. Can you share the main core idea that excites you most about it?`,
      `That was such a thoughtful start! In truth, there is an even deeper layer here. When '${topic}' is applied in practice, what makes it hold together?`,
      `You're doing so well, ${name}. Let's take it one gentle step further. How do the primary pieces of '${topic}' support each other?`,
      `Almost there, my dear friend. What is the most beautiful, subtle truth about '${topic}' that people often miss?`,
      `Final round together! Give me your warmest, most complete summary of '${topic}'.`
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
    ],
    curious: [
      `Yo ${name}! So hyped to break down '${topic}' with you! What's the wildest, core fundamental law behind how this whole thing kicks off?!`,
      `Whoa, nice angle! That part is definitely true, but here's where it gets crazy: what actually happens when '${topic}' runs into unexpected friction?`,
      `Bro, you're on to something! Dig a little deeper into the gears—what is the exact sequence that makes '${topic}' tick?`,
      `Okay, imagine an examiner throws a curveball at you about the most controversial debate in '${topic}'. How would you defend it, bro?`,
      `Final round, ${name}! Drop your absolute sickest, most complete breakdown of '${topic}' right here!`
    ],
    chill: [
      `Hey ${name}. No rush, no stress at all. Whenever you're ready, just share the basic core idea of '${topic}' with me.`,
      `Good start, very clean. The actual concept is pretty straightforward when you look at it. How does '${topic}' usually handle unusual conditions?`,
      `Right on track. Let's look at the next step together. What are the key elements working behind the scenes in '${topic}'?`,
      `Doing great, nice and steady. What would you say is the most important thing to remember about '${topic}' when an exam question tries to trip you up?`,
      `Last question, ${name}. Keep that same relaxed composure and summarize '${topic}' in your own calm words.`
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
