# Architecture & Design Decisions

EcoGuide AI was built with a strict separation of concerns, ensuring that the **AI acts as a coach, not a calculator**. This document outlines the core architectural principles that maximize reliability, security, and performance.

## 1. The Deterministic Engine (Source of Truth)

To prevent AI hallucinations regarding carbon footprint calculations, the application uses a strict deterministic engine (`src/engine/calculator.ts`).

- **Mathematical Accuracy**: Emissions are calculated using hardcoded constants derived from EPA and IPCC factors (e.g., `TRANSPORT_EMISSION_FACTORS`, `DIET_EMISSION_FACTORS`).
- **Separation of Concerns**: The AI is never asked to calculate a footprint. It is only given the pre-calculated `CarbonFootprint` object as context to provide advice.
- **Scenario Engine**: The `simulateScenario` function applies immutable transformations to the user profile and re-runs the deterministic engine to ensure that "what-if" simulations are perfectly accurate.

## 2. AI Integration Strategy

The Gemini AI model is utilized strictly for personalized coaching and motivational advice.

- **Context Injection**: Before each message is sent to Gemini, we build a structured context (`src/services/contextBuilder.ts`) containing the user's footprint, unadopted recommendations, and active goals.
- **Prompt Engineering**: The system prompt (`src/services/systemPrompt.ts`) strictly forbids the AI from giving medical advice, financial advice, or inventing emission numbers. It is instructed to explain the engine's outputs and motivate the user.
- **Streaming UI**: The chat interface uses Server-Sent Events (SSE) to stream the AI's response token-by-token for a fast, engaging UX.

## 3. Data Privacy & Local Storage

Because carbon footprints can reveal sensitive lifestyle information, **no personal data is stored in a backend database**.

- **Local Storage**: The `src/services/storage.ts` service acts as an embedded NoSQL store, saving the profile, goals, and historical snapshots entirely client-side.
- **Validation & Fallbacks**: Every read from `localStorage` undergoes shape validation. Corrupted JSON is handled gracefully.
- **Export/Clear**: Users have full control over their data, with the ability to export it or wipe it instantly.

## 4. Security Architecture

The Express backend acts exclusively as a secure proxy to the Gemini API.

- **Rate Limiting**: An in-memory rate limiter tracks requests per IP, preventing API abuse and cost overruns. A garbage collector periodically cleans up stale IPs to prevent memory leaks.
- **CORS & Headers**: Helmet is used to enforce strict HTTP security headers. CORS is restricted to the frontend origin.
- **Input Validation**: The `/api/chat` endpoint validates the structure of the incoming JSON body before passing it to Gemini.
- **XSS Prevention**: The React frontend uses a secure Markdown renderer with `rehype-sanitize` to ensure that AI-generated responses cannot inject malicious scripts.

## 5. Performance & React Rendering

- **Context Memoization**: The global state (Profile, Emissions, Goals) is managed via React Context. To prevent unnecessary re-renders, Context values are heavily memoized using `useMemo` and `useCallback`.
- **CSS Animations**: Transitions and micro-animations use Tailwind's hardware-accelerated utility classes, ensuring 60fps performance on mobile devices.

## 6. Accessibility (A11y)

- **Semantic HTML**: Proper use of `<main>`, `<nav>`, and `<section>` tags.
- **Screen Reader Support**: `aria-live="polite"` regions are used in the AI chat to announce new messages.
- **Focus Management**: The `AppShell` automatically manages focus on route transitions, and a "Skip to main content" link is provided for keyboard users.
