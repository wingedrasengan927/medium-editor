import json
import re
import shutil
import uuid
from pathlib import Path

import yaml
from fastapi import Body, FastAPI, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

BASE_DIR = Path(__file__).parent
ARTICLES_DIR = BASE_DIR / "articles"
CONFIG_PATH = BASE_DIR / "articles_config.yaml"
SEED_STATE_PATH = BASE_DIR.parent / "src" / "assets" / "initial_editor_state.json"

ALLOWED_MIME = {"image/png", "image/jpeg", "image/gif", "image/webp"}
MAX_BYTES = 10 * 1024 * 1024  # 10 MB
PUBLIC_BASE_URL = "http://localhost:8000"
ID_PATTERN = re.compile(r"^[a-z0-9-]+$")

EMPTY_EDITOR_STATE = {
    "root": {
        "children": [
            {
                "children": [],
                "direction": None,
                "format": "",
                "indent": 0,
                "type": "paragraph",
                "version": 1,
            }
        ],
        "direction": None,
        "format": "",
        "indent": 0,
        "type": "root",
        "version": 1,
    }
}


def load_config() -> list[dict]:
    with CONFIG_PATH.open() as f:
        data = yaml.safe_load(f) or {}
    return data.get("articles", []) or []


def media_url(article_id: str, filename: str) -> str:
    return f"{PUBLIC_BASE_URL}/media/{article_id}/uploads/{filename}"


def seed_default_state(state_path: Path) -> None:
    if SEED_STATE_PATH.exists():
        shutil.copyfile(SEED_STATE_PATH, state_path)
    else:
        state_path.write_text("{}")


def ensure_article_dirs() -> None:
    ARTICLES_DIR.mkdir(exist_ok=True)
    for article in load_config():
        aid = article.get("id", "")
        if not ID_PATTERN.match(aid):
            continue
        article_dir = ARTICLES_DIR / aid
        (article_dir / "uploads").mkdir(parents=True, exist_ok=True)
        state_path = article_dir / "editorState.json"
        if state_path.exists():
            continue
        if aid == "default":
            seed_default_state(state_path)
        else:
            state_path.write_text(json.dumps(EMPTY_EDITOR_STATE, indent=2))


ensure_article_dirs()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://localhost:51\d+",
    allow_methods=["GET", "POST", "PUT", "OPTIONS"],
    allow_headers=["*"],
)

app.mount("/media", StaticFiles(directory=ARTICLES_DIR), name="media")


def require_known_article(article_id: str) -> None:
    if not ID_PATTERN.match(article_id):
        raise HTTPException(status_code=400, detail="Invalid article id")
    if not any(a.get("id") == article_id for a in load_config()):
        raise HTTPException(status_code=404, detail="Unknown article")


@app.get("/articles")
def list_articles():
    return {"articles": load_config()}


@app.get("/articles/{article_id}")
def get_article(article_id: str):
    require_known_article(article_id)
    state_path = ARTICLES_DIR / article_id / "editorState.json"
    if not state_path.exists():
        raise HTTPException(status_code=404, detail="Editor state not found")
    raw = state_path.read_text().strip()
    return json.loads(raw) if raw else {}


@app.put("/articles/{article_id}")
async def put_article(article_id: str, editor_state: dict = Body(...)):
    require_known_article(article_id)
    article_dir = ARTICLES_DIR / article_id
    (article_dir / "uploads").mkdir(parents=True, exist_ok=True)
    (article_dir / "editorState.json").write_text(json.dumps(editor_state, indent=2))
    return {"ok": True}


@app.post("/articles/{article_id}/images")
async def upload_image(article_id: str, file: UploadFile):
    require_known_article(article_id)
    if file.content_type not in ALLOWED_MIME:
        raise HTTPException(status_code=400, detail="Unsupported image type")

    data = await file.read()
    if len(data) > MAX_BYTES:
        raise HTTPException(status_code=413, detail="Image too large")

    ext = Path(file.filename or "").suffix.lower() or ".bin"
    name = f"{uuid.uuid4().hex}{ext}"
    article_uploads = ARTICLES_DIR / article_id / "uploads"
    article_uploads.mkdir(parents=True, exist_ok=True)
    (article_uploads / name).write_bytes(data)
    return {"url": media_url(article_id, name)}
