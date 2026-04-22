# Backend

Minimal FastAPI server that stores images uploaded from the editor.

## Run

Requires [uv](https://docs.astral.sh/uv/).

```bash
cd backend
uv sync
uv run uvicorn main:app --reload --port 8000
```

Uploaded files are written to `backend/uploads/` and served at
`http://localhost:8000/uploads/<filename>`.

## Endpoint

`POST /images` — multipart form with a `file` field.
Returns `{ "url": "http://localhost:8000/uploads/<uuid>.<ext>" }`.

Accepts PNG, JPEG, GIF, WEBP up to 10 MB.
