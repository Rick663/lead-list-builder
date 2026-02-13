# LeadGen AI - B2B Lead List Builder

LeadGen AI is an intelligent B2B lead generation tool that turns company websites into qualified lead lists.

It scrapes a target company's website to understand their business model and Ideal Customer Profile (ICP), then uses AI (Groq) and real-time web search (Tavily) to identify and verify key decision-makers.

## Features

-   **AI-Powered Analysis**: Uses Groq (Llama 3) to analyze company websites and identify key roles.
-   **Real-Time Lead Verification**: Uses Tavily API to find and verify decision-makers on LinkedIn.
-   **Smart Filtering**: Validates that leads are *currently* at the target company (eliminates false positives).
-   **Export Options**:
    -   **CSV Download**: Instant download, no login required.
    -   **Google Sheets**: Export directly to your Google Drive (requires Google Login).
-   **Email Enrichment**: Integration with Findymail for email discovery (requires API key).

## Tech Stack

-   **Frontend**: React, Vite, Tailwind CSS, Framer Motion
-   **Backend**: Node.js, Express
-   **AI/Data**: Groq API (Llama 3.3), Tavily API (Search), Cheerio (Scraping)

## Prerequisites

-   Node.js (v18 or higher)
-   npm or yarn

## Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd lead-list-builder
```

### 2. Backend Setup
Navigate to the server directory and install dependencies:
```bash
cd server
npm install
```

Create a `.env` file in the `server` directory with the following keys:
```env
PORT=5000
GROQ_API_KEY=your_groq_api_key
TAVILY_API_KEY=your_tavily_api_key
FINDYMAIL_API_KEY=your_findymail_api_key
```

### 3. Frontend Setup
Navigate to the client directory and install dependencies:
```bash
cd ../client
npm install
```

Create a `.env` file in the `client` directory:
```env
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

## Running the Application

1.  **Start the Backend**:
    ```bash
    cd server
    node index.js
    ```
    (Runs on http://localhost:5000)

2.  **Start the Frontend**:
    ```bash
    cd client
    npm run dev
    ```
    (Runs on http://localhost:5173)

3.  Open http://localhost:5173 in your browser.

## Google Sheets Export Setup (OAuth)

To use the "Export to Sheets" feature, you need a Google Cloud Project with OAuth credentials.

1.  Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2.  Create a **OAuth 2.0 Client ID** (Web application).
3.  **Authorized JavaScript origins**: Add `http://localhost:5173`.
4.  Copy the **Client ID** into `client/.env`.

**Troubleshooting "Access blocked: This app's request is invalid"**:
-   Ensure `http://localhost:5173` is added to **Authorized JavaScript origins** in your Google Cloud Console.
-   Wait 5 minutes for changes to propagate.

## License

MIT
