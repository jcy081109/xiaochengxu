from typing import Any


_OCR_INSTANCE: Any = None
_OCR_ERROR: Exception | None = None


def get_ocr_instance():
    global _OCR_INSTANCE, _OCR_ERROR

    if _OCR_INSTANCE is not None:
        return _OCR_INSTANCE

    if _OCR_ERROR is not None:
        return None

    try:
        from paddleocr import PaddleOCR

        _OCR_INSTANCE = PaddleOCR(use_angle_cls=True, lang="ch")
        return _OCR_INSTANCE
    except Exception as exc:  # pragma: no cover
        _OCR_ERROR = exc
        return None


def extract_lines(raw_result: Any) -> list[str]:
    lines: list[str] = []

    if not raw_result:
        return lines

    groups = raw_result if isinstance(raw_result, list) else [raw_result]
    for group in groups:
        if not isinstance(group, list):
            continue

        for item in group:
            if not isinstance(item, list) or len(item) < 2:
                continue

            text_info = item[1]
            if not isinstance(text_info, (list, tuple)) or not text_info:
                continue

            text = str(text_info[0]).strip()
            if text:
                lines.append(text)

    return lines


def recognize_image(image_path: str) -> dict:
    ocr = get_ocr_instance()
    if ocr is None:
        message = "PaddleOCR 未安装或初始化失败，请先安装 paddlepaddle 和 paddleocr。"
        if _OCR_ERROR is not None:
            message = f"{message} 错误信息：{_OCR_ERROR}"
        return {
            "success": False,
            "text": "",
            "lines": [],
            "message": message,
            "engine": "不可用",
        }

    try:
        raw_result = ocr.ocr(image_path, cls=True)
        lines = extract_lines(raw_result)
        text = "\n".join(lines).strip()

        if not text:
            return {
                "success": False,
                "text": "",
                "lines": [],
                "message": "图片中未识别到可读文字。",
                "engine": "paddleocr",
            }

        return {
            "success": True,
            "text": text,
            "lines": lines,
            "message": "OCR 识别成功",
            "engine": "paddleocr",
        }
    except Exception as exc:  # pragma: no cover
        return {
            "success": False,
            "text": "",
            "lines": [],
            "message": f"OCR 识别失败：{exc}",
            "engine": "paddleocr",
        }
