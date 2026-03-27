# Design: AI Merger Summary Feature

**Objective**: Implement an AI-powered merger summary feature that provides concise, plain-English context for complex arbitrage deals directly in the `MergerCard`.

## 1. Context & Background
Currently, users must manually interpret merger data (target, buyer, spread, dates). The AI summary reduces cognitive load by providing an instant, readable summary of the deal's status and potential.

## 2. Proposed Solution

### 2.1 Backend: SSE & Gemini Integration
- **Endpoint**: `GET /api/mergers/:id/analyze/stream`
- **Dependencies**: `@google/generative-ai` SDK.
- **Environment**: `GEMINI_API_KEY` required in `.env`.
- **Logic**:
    1. Fetch merger data by ID using `MergerService`.
    2. Construct a prompt with the merger data and a system instruction: "Summarize this merger in plain English. Stay under 250 characters. Focus on the deal's health and potential arbitrage risk."
    3. Initialize the Gemini 1.5 model and stream the response.
    4. Format each chunk as an SSE message (`data: { "chunk": "..." }\n\n`).
    5. Handle client disconnects to abort the Gemini stream.

### 2.2 Frontend: `useAISummaryStream` Hook
- **Purpose**: Manage the SSE connection and provide the streaming text state to the Modal.
- **Features**:
    - `summary`: The progressively updated summary text.
    - `isStreaming`: Boolean indicating if the stream is active.
    - `error`: Any errors encountered during the stream.
    - `startStream(mergerId)`: Function to initiate the SSE connection.
    - `reset()`: Clear the current state.
    - Automatic cleanup: Close the SSE connection on unmount.

### 2.3 UI Integration: `MergerCard` & `Modal`
- **MergerCard**: Add an "Analyze" button that opens the `Modal` and calls `startStream(merger.id)`.
- **Modal**:
    - Displays "Analyzing merger data..." while the stream is starting.
    - Progressively renders the summary as it's received.
    - Includes a close button that aborts the stream.
    - Matches the design in `Modal.example.tsx`.

## 3. Alternative Approaches Considered
- **Standard REST API (no streaming)**: Rejected because it provides a poor UX with a long wait time before any text appears.
- **WebSocket**: Rejected as overkill for a simple one-way stream. SSE is more lightweight and better suited for this use case.
- **Client-side Gemini API Calls**: Rejected for security reasons (exposes API key).

## 4. Security & Performance
- **Security**: The Gemini API key remains server-side. The client only sees the final summary text.
- **Performance**: SSE allows for near-instant feedback as the first words are generated. The modal opens immediately to provide feedback.
- **Error Handling**: Graceful handling of API failures or merger data missing.

## 5. Domain Analysis
- **Engineering**: Backend SSE, Gemini SDK, Frontend Hooks, React UI.
- **Product**: Concise summaries (<250 chars) for better user understanding.
- **Design**: Consistent with existing Modal patterns and streaming effects.

## 6. Questions & Clarifications
- **Rate Limiting**: Should we implement a per-user rate limit on the backend for AI requests? (For now, we'll disable the "Analyze" button on the card while a request is in-flight).
- **Gemini Model Selection**: 1.5 Flash is recommended for its speed and lower cost for this type of summarization task.
