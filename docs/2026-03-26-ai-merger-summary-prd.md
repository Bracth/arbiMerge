# Product Requirements Document (PRD): AI Merger Summary Feature

## 1. Overview

**Project**: arbiMerge
**Feature**: AI-Powered Merger Summaries
**Status**: Draft
**Date**: March 26, 2026

### 1.1 Objective
To enhance the user experience by providing an instant, plain-English summary of complex merger data directly from the `MergerCard`. This reduces cognitive load on the user, who currently must manually interpret disparate data points (target, buyer, spread, dates) to understand the operation's context.

### 1.2 Target Audience
Arbitrage traders, financial analysts, and investors using the arbiMerge dashboard to monitor active M&A deals.

## 2. Scope

### 2.1 In Scope
*   Adding a UI trigger (button) to the existing `MergerCard` component in the frontend.
*   Integrating the existing `Modal` component to display the summary.
*   Developing a new backend endpoint to handle requests and communicate with the Google Gemini API.
*   Implementing Server-Sent Events (SSE) to stream the AI response word-by-word to the frontend, simulating a typing effect.
*   Enforcing a strict 250-character limit on the AI-generated summary via system prompting.

### 2.2 Out of Scope
*   Historical caching or saving of generated summaries in the database (summaries are generated on-the-fly per click).
*   User customization of the AI prompt or summary length.
*   Support for multiple LLM providers (only Google Gemini is supported).
*   Batch summarization of multiple mergers at once.

## 3. User Experience (UX) Flow

1.  **Discovery**: The user views the dashboard containing multiple `MergerCard`s.
2.  **Action**: The user clicks a new "Analyze" (or "AI Summary") button located on a specific `MergerCard`.
3.  **Immediate Feedback**: The existing `Modal` component opens immediately over the dashboard.
4.  **Loading State**: The modal displays a loading indicator or initial text (e.g., "Analyzing merger data...").
5.  **Streaming Delivery**: The modal begins to display the summary text sequentially, word-by-word, matching the visual style demonstrated in `packages/frontend/src/components/ui/Modal.example.tsx`.
6.  **Completion**: The stream completes, displaying a concise (max 250 characters) summary of the merger.
7.  **Dismissal**: The user closes the modal (via 'X' button or clicking outside) to return to the dashboard.

## 4. Functional Requirements

| Req ID | Requirement | Description | Priority |
| :--- | :--- | :--- | :--- |
| **FR-01** | UI Trigger | A button must be added to `MergerCard` that initiates the summary flow. | High |
| **FR-02** | Modal Integration | The feature must use the existing `Modal` compound component (`Modal.Trigger`, `Modal.Content`, etc.) for display. | High |
| **FR-03** | Data Payload | The frontend must pass relevant `Merger` data (Target, Buyer, Spread, Status, Dates, Offer Price) to the backend. | High |
| **FR-04** | Backend Endpoint | A new SSE-enabled endpoint (e.g., `GET /api/mergers/analyze/stream`) must be created on the backend. | High |
| **FR-05** | LLM Integration | The backend must use the official `@google/genai` Node.js SDK to communicate with the Gemini API. | High |
| **FR-06** | Prompt Constraint | The system prompt must explicitly instruct the LLM to restrict its response to a maximum of 250 characters. | High |
| **FR-07** | Streaming Response | The backend must stream the LLM response chunks to the frontend using Server-Sent Events (SSE). | High |
| **FR-08** | Progressive Rendering | The frontend must render the SSE chunks progressively to create a typing effect. | High |
| **FR-09** | Connection Management | The frontend must close the SSE connection if the user closes the modal before the stream finishes. | Medium |

## 5. Non-Functional Requirements

*   **Security (NFR-01)**: The Gemini API key must reside exclusively on the backend (`packages/backend/.env`). Under no circumstances should the key or the direct Google API call happen on the client-side.
*   **Performance (NFR-02)**: The modal must open instantly (< 100ms) upon button click, even if the AI response takes a few seconds to begin streaming.
*   **Consistency (NFR-03)**: The streaming text animation must visually match the existing behavior found in `Modal.example.tsx`.

## 6. Technical Architecture

*   **Frontend**: React, Vite, Custom Hooks (`useAISummaryStream`).
*   **Backend**: Node.js, Express (or existing router), `@google/genai` SDK.
*   **Communication**: Server-Sent Events (SSE) for one-way streaming from server to client.

## 7. Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation Strategy |
| :--- | :--- | :--- | :--- |
| **Prompt Non-Compliance** | Low | Medium | The LLM might occasionally exceed 250 characters. Mitigation: Write strong system prompts ("You MUST keep the response under 250 characters"). Ensure the UI modal can scroll or elegantly handle text slightly over the limit. |
| **API Rate Limiting** | Medium | Low | Rapid, repeated clicks by users could hit Gemini API limits. Mitigation: Disable the "Analyze" button on a card while a request is already in-flight for that card. |
| **Connection Leaks** | Medium | Medium | Abandoned SSE streams. Mitigation: Implement robust `useEffect` cleanup in the React hook to call `eventSource.close()` and abort the fetch request when the modal unmounts. |

## 8. Success Metrics

*   Feature deployed and accessible on all `MergerCard`s.
*   100% of API calls to Gemini occur server-side.
*   Average generated summary length is < 260 characters.
*   Zero reported memory leaks related to SSE connections in frontend performance profiling.
