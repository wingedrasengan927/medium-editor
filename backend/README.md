# Backend

FastAPI server that stores per-article editor states and their images.

## Run

Requires [uv](https://docs.astral.sh/uv/).

```bash
cd backend
uv sync
uv run uvicorn main:app --reload --port 8000
```

## Layout

```
backend/
  articles_config.yaml       # registry of known articles (id + title)
  articles/
    <id>/
      editorState.json       # serialized Lexical state
      uploads/               # images referenced by this article
```

On startup, the server reads `articles_config.yaml` and creates any missing
article folders. `default` is seeded from `../src/assets/initial_editor_state.json`;
other articles get a minimal empty-paragraph state.

To add an article: add an entry under `articles:` in `articles_config.yaml`
(id must match `^[a-z0-9-]+$`) and restart the server.

## Endpoints

### `GET /articles`

Lists every article from the config.

```json
{ "articles": [{ "id": "default", "title": "Default Article" }] }
```

### `GET /articles/{id}`

Returns the serialized Lexical editor state for an article.

### `PUT /articles/{id}`

Overwrites `articles/{id}/editorState.json` with the JSON body (shape of
`editorState.toJSON()`). Used by the Export button.

### `POST /articles/{id}/images`

Multipart upload with a `file` field, scoped to an article. Writes to
`articles/{id}/uploads/<uuid>.<ext>` and returns a URL served by the
`/media` mount.

```json
{ "url": "http://localhost:8000/media/<id>/uploads/<uuid>.<ext>" }
```

Accepts PNG, JPEG, GIF, WEBP up to 10 MB.

### `GET /media/{id}/uploads/{filename}`

Static file serving for uploaded images. Backed by the `articles/` directory.

## Notes

- `id` is validated against `^[a-z0-9-]+$` and checked for membership in
  `articles_config.yaml` on every article-scoped request.
- The server silently overwrites editor state on export — no versioning.
- Orphan images (uploaded then removed from the editor before export) are
  not cleaned up.
