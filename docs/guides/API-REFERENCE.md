# REST API Reference

Short overview of the Collab-Board REST surface. **Interactive API documentation** is the source of truth: when the server is running, open **Swagger UI** at:

- **Local:** [http://localhost:3000/api-docs](http://localhost:3000/api-docs)
- **Production:** `https://<your-render-service>.onrender.com/api-docs`

For local URL and env setup, see [DEVELOPER-SETUP.md](DEVELOPER-SETUP.md). For architecture and modules, see [Design Document](../research/5-BASIC-DESIGN-DOCUMENT.md).

---

## Authentication

All protected endpoints require a valid Clerk JWT:

```http
Authorization: Bearer <Clerk session token>
```

The client obtains the token via Clerk (e.g. `getToken()` from the React SDK) and sends it with each request.

---

## Key endpoints

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/health` | No | Health check; returns 200 when the server is up. |
| GET | `/api/boards` | Yes | List boards for the authenticated user (owner + collaborator). |
| POST | `/api/boards` | Yes | Create a new board. Body: e.g. `{ title: string }`. |
| GET | `/api/boards/:id` | Yes | Get a single board by ID (if user has access). |
| PATCH | `/api/boards/:id` | Yes | Update board (e.g. title, collaborators). |
| DELETE | `/api/boards/:id` | Yes | Delete board and its objects (owner or permitted role). |
| POST | `/api/ai/execute` | Yes | Run the AI agent. Body: `{ command: string; boardId: string }`. Server executes via Gemini, persists changes, and broadcasts results to the board room via Socket.io (`ai:result`). Response: success and/or created/updated objects. |

Request/response schemas, status codes, and examples are defined in Swagger and in the server code (e.g. Zod schemas, route docs). Use Swagger UI for try-it-out and exact payload shapes.
