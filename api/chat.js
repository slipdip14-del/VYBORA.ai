import { PERSONAS } from './_personas.js'

const MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-flash-lite-latest',
  'gemma-4-26b-a4b-it'
]
const TIMEOUT_MS = 20000

/**
 * Extracts plain text from Google AI Studio / Gemma response,
 * ignoring any parts marked with "thought: true" or <thought> tags.
 */
function extractTextFromGemmaResponse(data) {
  const candidate = data?.candidates?.[0]
  if (!candidate?.content?.parts) return ''

  let text = candidate.content.parts
    .filter((p) => !p.thought)
    .map((p) => (typeof p.text === 'string' ? p.text : ''))
    .join('')

  // Strip any inline <thought> tags if present in plain text
  text = text.replace(/<thought>[\s\S]*?<\/thought>/gi, '').trim()
  return text
}

/**
 * Calls Gemma generateContent endpoint with 25s timeout
 */
async function callGemma(model, contents, apiKey) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({ contents }),
      signal: controller.signal
    })
    clearTimeout(timer)

    if (!response.ok) {
      return { ok: false, status: response.status }
    }

    const data = await response.json()
    const text = extractTextFromGemmaResponse(data)
    if (!text || text.trim().length === 0) {
      return { ok: false, status: 204, empty: true }
    }

    return { ok: true, status: 200, text }
  } catch (err) {
    clearTimeout(timer)
    const isTimeout = err.name === 'AbortError'
    return { ok: false, status: isTimeout ? 408 : 500, timeout: isTimeout }
  }
}

/**
 * Executes AI call with automatic fallback across available models
 */
async function executeWithRetry(contents, apiKey) {
  let lastResult = null
  for (const model of MODELS) {
    const result = await callGemma(model, contents, apiKey)
    if (result.ok && result.text) {
      return result
    }
    lastResult = result
  }
  return lastResult || { ok: false, status: 500 }
}

/**
 * Cleans and parses verdict JSON, returning safe fallback if invalid
 */
function parseVerdictJson(rawText, topic) {
  let cleaned = rawText.trim()
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  }

  const firstBrace = cleaned.indexOf('{')
  const lastBrace = cleaned.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1)
  }

  try {
    const parsed = JSON.parse(cleaned)
    const rawVerdict = String(parsed.verdict || '').toUpperCase()
    const verdict = rawVerdict.includes('INNOCENT') ? 'INNOCENT' : 'GUILTY'

    let score = parseInt(parsed.score, 10)
    if (isNaN(score) || score < 0) score = 60
    if (score > 100) score = 100

    const summary = String(parsed.summary || cleaned.slice(0, 200)).trim()

    let revise = []
    if (Array.isArray(parsed.revise)) {
      revise = parsed.revise.map((item) => String(item).trim()).filter(Boolean).slice(0, 3)
    }
    while (revise.length < 3) {
      revise.push(`Key principles of ${topic}`)
    }

    return { verdict, score, summary, revise }
  } catch {
    return null
  }
}

function buildFallbackVerdict(rawText, topic) {
  return {
    verdict: 'GUILTY',
    score: 60,
    summary: rawText
      ? rawText.slice(0, 250).trim()
      : 'The interrogation has ended. Additional review is strongly recommended.',
    revise: [
      `${topic} core fundamentals`,
      `${topic} practical problem solving`,
      'Review of identified weak points'
    ]
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const rawKey =
    process.env.GEMINI_API_KEY ||
    process.env.gemini ||
    process.env.GEMINI ||
    process.env.GOOGLE_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    process.env.GEMINI_KEY ||
    ''
  const apiKey = rawKey.trim().replace(/^['"]|['"]$/g, '')
  if (!apiKey) {
    return res.status(500).json({ error: 'Server AI configuration is missing.' })
  }

  try {
    const body = req.body || {}
    let { mode, name, age, topic, messages, final, action } = body
    if (!action) {
      action = body.type === 'learn' ? 'learn' : 'interrogate'
    }

    // 1. Validation & sanitization
    if (typeof mode !== 'string' || !PERSONAS[mode.trim()]) {
      return res.status(400).json({
        error: 'Invalid mode. Allowed modes: interrogation, lovable, warrior, sadist.'
      })
    }
    mode = mode.trim()

    if (typeof name !== 'string' || !name.trim() || name.trim().length > 40) {
      return res.status(400).json({ error: 'Name is required (max 40 characters).' })
    }
    name = name.trim()

    const parsedAge = parseInt(age, 10)
    if (isNaN(parsedAge) || parsedAge < 10 || parsedAge > 100) {
      return res.status(400).json({ error: 'Age must be a number between 10 and 100.' })
    }
    age = parsedAge

    if (typeof topic !== 'string' || !topic.trim() || topic.trim().length > 200) {
      return res.status(400).json({ error: 'Topic is required (max 200 characters).' })
    }
    topic = topic.trim()

    if (!Array.isArray(messages)) {
      messages = []
    }
    if (messages.length > 12) {
      return res.status(400).json({ error: 'Message history exceeds the maximum limit of 12.' })
    }

    const sanitizedMessages = []
    for (const msg of messages) {
      if (!msg || typeof msg !== 'object') continue
      const role = msg.role === 'ai' ? 'ai' : msg.role === 'student' ? 'student' : null
      if (!role) continue
      const text = typeof msg.text === 'string' ? msg.text.trim().slice(0, 1500) : ''
      sanitizedMessages.push({ role, text })
    }

    const isFinal = Boolean(final)

    // 2. Build Age-adjusted Difficulty Rule
    let difficultyRule = ''
    if (age >= 15 && age <= 17) {
      difficultyRule = 'Target audience: School level (15-17). Keep concepts foundational, accessible, and strictly PG.'
    } else if (age >= 18 && age <= 24) {
      difficultyRule = 'Target audience: University level (18-24). Test deeper conceptual reasoning, mechanisms, and application.'
    } else {
      difficultyRule = 'Target audience: Advanced or professional level (25+). Probe edge cases, nuances, and advanced theory.'
    }

    const persona = PERSONAS[mode]

    // 3. Build Conversation Prompt (Learn vs Interrogate)
    let systemPromptText = ''
    if (action === 'learn') {
      systemPromptText = `You are roleplaying as ${persona.name}.
Persona: ${persona.description}

Tone Guidelines:
${persona.toneRules.map((r) => '- ' + r).join('\n')}

Role: You are a master teacher and tutor conducting an in-depth study briefing for ${name} (Age: ${age}) on the topic: "${topic}".
Your Mission: Make ${name} genuinely understand the concepts, mechanism, and real-world intuition behind "${topic}" so they feel fully confident before taking a test!

Structure of your initial lesson:
1. 💡 **The Core Truth**: 2-3 atmospheric, vivid sentences capturing what this concept is really about.
2. ⚙️ **The Breakdown (How It Works)**: Clear, accessible step-by-step mechanism and components.
3. 🎯 **The Analogy**: An unforgettable metaphor tailored to your persona.
4. ⚠️ **The Examination Trap**: The #1 tricky detail or misconception examiners test on.

Teaching Rules:
- ${difficultyRule}
- Stay 100% in character (${persona.name})!
- Use clean markdown formatting with bold headers and bullet points.
- If ${name} asks follow-up questions, answer directly with educational clarity, insightful examples, and your signature character voice.
- Encourage ${name} and remind them they can ask anything, or click "Start the 5-Round Test" whenever they feel ready.`
    } else {
      systemPromptText = `You are roleplaying as ${persona.name}.
Persona: ${persona.description}

Tone Guidelines:
${persona.toneRules.map((r) => '- ' + r).join('\n')}

Rules for this study interrogation session:
1. Student Name: ${name}, Age: ${age}, Study Topic: "${topic}".
2. ${difficultyRule}
3. Escalating difficulty: Each question must probe deeper than the previous one.
4. ONE question at a time: Ask exactly ONE question per turn.
5. EDUCATIONAL FEEDBACK & EXPLANATION (CRITICAL): When reacting to the student's previous answer:
   - State clearly if they are correct, partially correct, or wrong.
   - Explain the actual scientific or factual truth in 1-2 clear, insightful sentences so the student learns and understands the concept.
   - Then, pitch your next challenging question!
6. Use the student's name (${name}) naturally.
7. Safety guidelines:
   - Stay in character, but remain safe. Critique focuses ONLY on study effort, preparation, and answers.
   - NEVER insult the student's body, appearance, family, religion, ethnicity, or personal life.
   - If age is under 18, keep every mode clean and PG.
   - CRISIS SAFETY: If the student ever mentions self-harm, suicide, or crisis, immediately break character, respond with warmth and kindness, and encourage them to speak with someone they trust or contact a crisis helpline.`
    }

    const contents = [
      {
        role: 'user',
        parts: [{ text: systemPromptText }]
      },
      {
        role: 'model',
        parts: [
          {
            text:
              action === 'learn'
                ? `Understood. I am ${persona.name}. I will teach and explain "${topic}" to ${name} with full educational depth and my distinct character style.`
                : `Understood. I am ${persona.name}. I will examine ${name} on "${topic}" according to all rules.`
          }
        ]
      }
    ]

    if (sanitizedMessages.length === 0) {
      contents.push({
        role: 'user',
        parts: [
          {
            text:
              action === 'learn'
                ? `Begin the study lesson now! Greet ${name} in character and deliver the complete, structured briefing on "${topic}".`
                : `Begin Round 1 now. Address ${name} in character and ask your first question on "${topic}".`
          }
        ]
      })
    } else {
      sanitizedMessages.forEach((msg, idx) => {
        const isLastStudentMsg = idx === sanitizedMessages.length - 1 && msg.role === 'student'
        if (msg.role === 'ai') {
          contents.push({
            role: 'model',
            parts: [{ text: msg.text }]
          })
        } else {
          let text = msg.text
          if (isLastStudentMsg && isFinal) {
            text += `\n\n[EXAMINATION COMPLETE: Return ONLY a valid JSON object with NO markdown formatting, no code fences, no extra text, exactly in this structure: {"verdict":"INNOCENT or GUILTY","score":<0-100>,"summary":"<2 sentences in the examiner voice>","revise":["<topic 1>","<topic 2>","<topic 3>"]}]`
          }
          contents.push({
            role: 'user',
            parts: [{ text }]
          })
        }
      })
    }

    // 4. Call Gemma with fallback retry
    const result = await executeWithRetry(contents, apiKey)

    if (!result.ok || !result.text) {
      return res.status(503).json({
        error: 'Examiner is temporarily unavailable. Please try again.'
      })
    }

    // 5. Handle Final Verdict Response vs Normal Question
    if (isFinal) {
      let verdictData = parseVerdictJson(result.text, topic)

      // If parsing failed, retry once specifically prompting for clean JSON
      if (!verdictData) {
        const retryContents = [
          ...contents,
          { role: 'model', parts: [{ text: result.text }] },
          {
            role: 'user',
            parts: [
              {
                text: 'Your response was not valid JSON. Output ONLY the JSON object with keys "verdict", "score", "summary", and "revise".'
              }
            ]
          }
        ]
        const retryResult = await executeWithRetry(retryContents, apiKey)
        if (retryResult.ok && retryResult.text) {
          verdictData = parseVerdictJson(retryResult.text, topic)
        }
      }

      // If still invalid, use safe fallback verdict
      if (!verdictData) {
        verdictData = buildFallbackVerdict(result.text, topic)
      }

      return res.status(200).json({
        ok: true,
        final: true,
        verdict: verdictData
      })
    }

    // Regular question turn
    return res.status(200).json({
      ok: true,
      final: false,
      text: result.text
    })
  } catch {
    return res.status(500).json({
      error: 'An unexpected error occurred while processing your request.'
    })
  }
}
