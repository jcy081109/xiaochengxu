from pathlib import Path
from uuid import uuid4

from flask import Flask, jsonify, request
from werkzeug.utils import secure_filename

from services.ocr_service import recognize_image


BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}

app = Flask(__name__)


@app.after_request
def apply_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS"
    return response


def build_json(payload: dict, status_code: int = 200):
    response = jsonify(payload)
    response.status_code = status_code
    return response


@app.get("/ping")
def ping():
    return build_json({"success": True, "message": "服务运行中"})


@app.post("/ocr")
def ocr():
    file = request.files.get("file")
    if file is None:
        return build_json({"success": False, "message": "缺少 file 文件字段"}, 400)

    original_name = secure_filename(file.filename or "")
    extension = Path(original_name).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        return build_json(
            {
                "success": False,
                "text": "",
                "lines": [],
                "message": "不支持的图片格式",
            },
            400,
        )

    filename = f"{uuid4().hex}{extension}"
    saved_path = UPLOAD_DIR / filename
    file.save(saved_path)

    try:
        result = recognize_image(str(saved_path))
        return build_json(result)
    finally:
        if saved_path.exists():
            saved_path.unlink()


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
