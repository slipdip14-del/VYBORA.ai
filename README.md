# VYBORA.ai 🕵️‍♂️

**VYBORA.ai** is an AI-powered study interrogation web application built for students and Gen Z (ages 15–30). Instead of standard flashcards or passive quizzes, an AI examiner interrogates the student on their chosen topic according to a selected personality mode, escalating in difficulty across 5 rounds before handing down an official verdict.

---

## ⚡ Tech Stack & Architecture

- **Frontend**: Vite + React (JavaScript), zero external styling libraries.
- **Backend**: Vercel Serverless Functions (`/api/health`, `/api/chat`).
- **AI Engine**: Google AI Studio Gemma API (`gemma-4-26b-a4b-it`, fallback: `gemma-4-31b-it`).
- **Styling Hook**: Plain unstyled HTML elements with simple semantic classes. The root element dynamically receives a `data-theme` attribute matching the selected mode (`interrogation`, `lovable`, `warrior`, `sadist`) for future design and theme customization.

---

## 🎭 Persona Modes

All mode metadata is stored in `src/modes.js`:
- **Interrogation** (`interrogation`): Tense noir detective grilling a suspect.
- **Lovable** (`lovable`): Warm, gentle, encouraging mentor.
- **Warrior** (`warrior`): Intense battle coach driving peak performance.
- **Sadist** (`sadist`): Savage, merciless roasting examiner delivering tough love.

---

## 🚀 Getting Started Locally

### 1. Prerequisites
- Node.js (v18+)
- npm

### 2. Installation
```bash
npm install
```

### 3. Environment Variables
Create a `.env.local` file in the root directory (this file is gitignored):
```env
GEMINI_API_KEY=your_google_ai_studio_api_key_here
```

> **Security Note**: `GEMINI_API_KEY` is strictly used on the serverless backend (`/api/*`) and is never exposed to client-side code.

### 4. Run Development Server
```bash
npm run dev
```

The frontend will run at `http://localhost:5173`.

---

## 🌐 Deployment on Vercel

1. Push this repository to GitHub or GitLab.
2. Import the project into [Vercel](https://vercel.com).
3. Set the Environment Variable in Vercel:
   - `GEMINI_API_KEY`: Your Google AI Studio API key.
4. Deploy! Vercel will automatically build the Vite app and serve the serverless functions under `/api/`.

---

## 📡 API Endpoints

- **`GET /api/health`**: Returns `{ ok: true, hasApiKey: boolean }` for verification.
- **`POST /api/chat`**: Handles conversation rounds and verdict generation with timeout and automatic model fallback.

---

## 🎨 Styling Hook for Designers & Teammates

Target CSS based on `data-theme` on `:root` or `html`:
```css
[data-theme="interrogation"] {
  /* Noir detective styling */
}

[data-theme="lovable"] {
  /* Gentle, warm styling */
}

[data-theme="warrior"] {
  /* High-energy battle styling */
}

[data-theme="sadist"] {
  /* Dark, fiery roasting styling */
}
```
