# Family Hub

This Azure Static Web App keeps our shared gift planning tools, message board, and calendar in one place. It was bootstrapped with [Create React App](https://github.com/facebook/create-react-app) and upgraded with React Router v6.

## Available pages

- `Home` – Shared 30-day message board (requires selecting your name in the header before posting).
- `Family` – Wish list browser with optional filtering per person.
- `Name Draw` – Assignment management, manual overrides, wish list editing, and reveal flow.
- `Calendar` – Birthdays and parties timeline with filters.

## Shared state API configuration

State is stored in Azure Table Storage via the `/api/state` function.

1. Provide a storage connection string through `STATE_STORAGE_CONNECTION` (or rely on `AzureWebJobsStorage` in production Static Web Apps).
2. When running `npm start`, proxy requests to the Azure Functions host or set `REACT_APP_STATE_ENDPOINT` to the full URL of the running function (e.g. `http://localhost:7071/api/state`).
3. If the API is offline during local testing, the UI will fall back to defaults and show a "Sync offline" badge until the backend is reachable again.

### Local development tips

- Run the Functions host (e.g. `npm install && npm start` inside `api`) alongside `npm start` for the React app.
- Use the navbar selector to simulate signing in as a specific family member.
- Messages and wish lists automatically prune data older than 30 days to keep storage tidy.
