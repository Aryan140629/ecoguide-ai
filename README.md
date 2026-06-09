# EcoGuide AI

EcoGuide AI is a personal carbon footprint tracker and sustainability coach powered by Gemini AI. It helps users calculate their environmental impact, simulate hypothetical lifestyle changes, set reduction goals, and get personalized advice—all within a modern, accessible, and privacy-first web application.

## Features

- **Personalized Carbon Calculator**: Accurately calculates your CO₂ emissions based on EPA and IPCC emission factors across transportation, electricity, and food.
- **AI Sustainability Coach**: A smart chat assistant powered by Gemini. The coach understands your profile, goals, and history, but never hallucinates emissions data (the deterministic engine is the single source of truth).
- **Scenario Simulator**: An interactive "what-if" engine. Drag sliders to see the exact impact of driving less, switching to renewables, or eating less red meat.
- **Goal Tracking & Gamification**: Set customized reduction targets, earn achievements and badges (e.g., "EV Pioneer", "Zero Waste Hero"), and track progress over time.
- **Privacy-First Architecture**: All personal data, profiles, and histories are securely stored locally on your device (`localStorage`). The only data sent out is the anonymized context sent to the AI API.
- **Accessible & Responsive**: Built with screen-reader support (`aria-live`), high-contrast colors, and a fully mobile-responsive Tailwind UI.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, React Router, Recharts
- **Backend (AI Proxy)**: Express, Node.js, `@google/genai` (Gemini SDK)
- **Testing**: Vitest, React Testing Library (>85% coverage)
- **Quality**: ESLint, Prettier, TypeScript strict mode

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- A Gemini API Key (`GEMINI_API_KEY`)

### Installation

1. **Clone the repository**
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Set up environment variables**:
   Create a `.env` file in the `server` directory and add your API key:
   ```env
   GEMINI_API_KEY=your_api_key_here
   PORT=3000
   ```
4. **Start the backend and frontend concurrently**:
   ```bash
   npm run dev
   # In a separate terminal
   npm run server
   ```
5. **Open** `http://localhost:5173` in your browser.

## Demo Mode

For Hackathon judging or quick evaluations, you can instantly populate the app with realistic data (profile, goals, 6-month historical trend, and badges). 
- Simply **Double-click the leaf icon (🌿)** in the top-left corner next to the EcoGuide AI logo.

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for a deep dive into the deterministic carbon engine, the AI integration strategy, and security choices.

## Testing & Quality

Run the test suite with coverage:
```bash
npm run test:coverage
```
*Current test coverage is over 85% with 90+ passing tests.*

## Security Features

- Strict input validation on all backend endpoints.
- Rate limiting and garbage collection for API abuse prevention.
- Helmet security headers and strict CORS configuration.
- Markdown XSS sanitization in AI chat rendering.
