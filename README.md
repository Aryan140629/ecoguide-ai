# EcoGuide AI

EcoGuide AI is an intelligent, full-stack application designed to help users track, understand, and reduce their carbon footprint. Powered by a responsive React frontend and a robust Node.js backend integrated with the Google Gemini API, EcoGuide AI delivers personalized, real-time insights and a conversational AI coach.

---

## 🎯 Problem Statement Alignment

This project tackles the urgent need for accessible environmental education by offering actionable, data-driven climate advice. Instead of generic suggestions, the AI Carbon Coach uses the user's specific emissions data to formulate realistic impact reduction goals. 

The architecture is carefully structured to separate concerns, optimize efficiency, ensure top-tier security (such as strict rate limiting, input validation, and zero API key leakage), and provide deep test coverage, making it a highly reliable and maintainable production system.

---

## ✨ Features

* **Personalized AI Carbon Coach:** An interactive chat interface powered by Gemini 2.5 Flash, leveraging Server-Sent Events (SSE) for seamless, real-time streaming.
* **Real-time Input Validation:** Strict payload checking using Zod to ensure safe interactions.
* **Security & Rate Limiting:** Hardened IP-based rate limiting to prevent abuse, coupled with robust, sanitized error handling.
* **Modular Backend Architecture:** Clear separation of Routes, Controllers, Services, and Middleware.
* **Comprehensive Testing:** Frontend coverage via Vitest and React Testing Library, alongside deep backend API coverage using Supertest.

---

## 🏗️ System Architecture

The application implements a clear Client-Server architecture:

```text
+-----------------------+           +-------------------------+           +-----------------------+
|       Frontend        |           |         Backend         |           |    External APIs      |
|  (React + Vite + TS)  |   POST    |    (Node + Express)     |  HTTPS    |                       |
|                       | --------> |   - Routes              | --------> |                       |
| - UI Components       |   SSE     |   - Controllers         |  Stream   |  Google Gemini API    |
| - State Management    | <-------- |   - Services (Gemini)   | <-------- |                       |
| - Context Builders    |           |   - Middleware (Zod)    |           |                       |
+-----------------------+           +-------------------------+           +-----------------------+
```

### Flow: Frontend → Backend → Gemini API
1. **User Action**: The user submits a chat message in the React UI (`AIChatPanel`).
2. **Context Assembly**: The frontend gathers the user's emissions profile and historical chat context.
3. **API Request**: A POST request is sent to `/api/chat`.
4. **Validation & Security**: The backend validates the payload structure (Zod) and enforces rate limits.
5. **AI Processing**: The `GeminiService` constructs the prompt and interfaces with the Google Gemini API.
6. **Streaming Response**: The response is streamed back to the client in real-time via Server-Sent Events (SSE), enabling a snappy, interactive UI.

---

## 💻 Tech Stack

* **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Recharts
* **Backend**: Node.js, Express, TypeScript, Zod
* **AI Integration**: `@google/genai` (Gemini 2.5 Flash)
* **Testing**: Vitest, React Testing Library, Supertest

---

## 🚀 Setup & Installation

### Prerequisites
* Node.js v20+
* A valid Google Gemini API Key.

### 1. Clone the Repository
```bash
git clone <repository_url>
cd ecoguide-ai
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory:
```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3001
NODE_ENV=development
```

### 4. Run the Application
Start both the frontend and backend concurrently:
```bash
npm run dev:all
```
The frontend will be available at `http://localhost:5173`.

---

## 🧪 Testing

The project uses a unified Vitest workspace to seamlessly run both frontend and backend tests.

To run the entire test suite:
```bash
npm run test
```

* **Frontend tests** (`jsdom` environment) assert component rendering, user interactions, and state updates.
* **Backend tests** (`node` environment + `supertest`) validate API routing, rate limits, Zod schema validation, and mocked AI stream handling.

---

## 🌐 Deployment

*(Insert deployment link here when live)*
