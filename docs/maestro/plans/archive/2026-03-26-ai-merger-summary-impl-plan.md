# Implementation Plan: AI Merger Summary Feature

**Objective**: Implement an AI-powered merger summary feature with SSE streaming from a Gemini-powered backend.

## 1. Prerequisites & Environment
- [ ] Add `@google/generative-ai` to `packages/backend/package.json`.
- [ ] Add `GEMINI_API_KEY` to `packages/backend/.env`.
- [ ] Run `npm install` in `packages/backend/`.

## 2. Backend Implementation
- [ ] **SSE Utility**: Create a simple utility for formatting SSE messages if needed, or implement it directly in the route.
- [ ] **AI Service/Route**:
    - [ ] Create a new endpoint `GET /api/mergers/:id/analyze/stream` in `packages/backend/server.ts`.
    - [ ] Fetch the merger by ID. Return 404 if not found.
    - [ ] Set correct SSE headers:
        ```javascript
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        ```
    - [ ] Initialize Gemini 1.5 Flash client.
    - [ ] Construct the prompt:
        ```text
        Summarize the following merger deal in plain English for an arbitrage trader.
        Target: [Target]
        Buyer: [Buyer]
        Spread: [Spread]%
        Status: [Status]
        Expected Closing: [Date]
        Offer Price: [Offer Price]
        
        Instruction: Keep it under 250 characters. Focus on deal health and risks.
        ```
    - [ ] Use `model.generateContentStream(prompt)` to stream the AI response.
    - [ ] Loop through chunks and send as SSE: `res.write(`data: ${JSON.stringify({ chunk })}\n\n`);`.
    - [ ] Handle `req.on('close', ...)` to stop the stream and end the response.

## 3. Frontend Implementation
- [ ] **Custom Hook**: Create `packages/frontend/src/features/arbitrage/hooks/useAISummaryStream.ts`.
    - [ ] State for `summary`, `isStreaming`, and `error`.
    - [ ] `startStream(mergerId)` function that:
        - [ ] Resets state.
        - [ ] Creates a new `EventSource` (or uses `fetch` with readable stream if `EventSource` is too limited for this use case - though the PRD specifically mentions SSE).
        - [ ] Listens for `message` events and appends `data.chunk` to `summary`.
        - [ ] Closes connection on completion or error.
- [ ] **MergerCard Integration**:
    - [ ] Add "Analyze" button to the card.
    - [ ] Use `Modal` components to wrap the analysis flow.
    - [ ] Pass `isStreaming` and `summary` from the hook to the `Modal`.
    - [ ] Disable the button while `isStreaming` is true for that specific card.

## 4. Verification & Testing
- [ ] **Backend Test**: Verify the endpoint returns an SSE stream with valid JSON chunks.
- [ ] **Frontend Test**: Verify the "Analyze" button opens the modal and displays the streaming text correctly.
- [ ] **Character Count**: Ensure summaries are consistently under 250 characters.
- [ ] **Cleanup**: Ensure the SSE connection is closed when the modal is dismissed.

## 5. Security Check
- [ ] Verify `GEMINI_API_KEY` is not exposed to the client.
- [ ] Ensure only the summarized text is sent to the client, not the raw Gemini response or metadata.
