from typing import Any


_OCR_INSTANCE: Any = None
_OCR_ERROR: Exception | None = None
_RAPID_OCR_INSTANCE: Any = None
_RAPID_OCR_ERROR: Exception | None = None


def get_ocr_instance():
    global _OCR_INSTANCE, _OCR_ERROR

    if _OCR_INSTANCE is not None:
        return _OCR_INSTANCE

    if _OCR_ERROR is not None:
        return None

    try:
        from paddleocr import PaddleOCR

        _OCR_INSTANCE = PaddleOCR(
            lang="ch",
            use_doc_orientation_classify=False,
            use_doc_unwarping=False,
            use_textline_orientation=True,
        )
        return _OCR_INSTANCE
    except Exception as exc:  # pragma: no cover
        _OCR_ERROR = exc
        return None


def get_rapid_ocr_instance():
    global _RAPID_OCR_INSTANCE, _RAPID_OCR_ERROR

    if _RAPID_OCR_INSTANCE is not None:
        return _RAPID_OCR_INSTANCE

    if _RAPID_OCR_ERROR is not None:
        return None

    try:
        from rapidocr_onnxruntime import RapidOCR

        _RAPID_OCR_INSTANCE = RapidOCR()
        return _RAPID_OCR_INSTANCE
    except Exception as exc:  # pragma: no cover
        _RAPID_OCR_ERROR = exc
        return None


def extract_lines(raw_result: Any) -> list[str]:
    lines: list[str] = []

    if not raw_result:
        return lines

    if isinstance(raw_result, dict):
        rec_texts = raw_result.get("rec_texts")
        if isinstance(rec_texts, list):
            return [str(text).strip() for text in rec_texts if str(text).strip()]

        data = raw_result.get("data")
        if data is not None:
            return extract_lines(data)

    groups = raw_result if isinstance(raw_result, list) else [raw_result]
    for group in groups:
        if isinstance(group, dict):
            lines.extend(extract_lines(group))
            continue

        if (
            isinstance(group, (list, tuple))
            and len(group) >= 2
            and isinstance(group[1], str)
        ):
            text = group[1].strip()
            if text:
                lines.append(text)
            continue

        if not isinstance(group, list):
            continue

        for item in group:
            if isinstance(item, dict):
                lines.extend(extract_lines(item))
                continue

            if (
                isinstance(item, (list, tuple))
                and len(item) >= 2
                and isinstance(item[1], str)
            ):
                text = item[1].strip()
                if text:
                    lines.append(text)
                continue

            if not isinstance(item, list) or len(item) < 2:
                continue

            text_info = item[1]
            if not isinstance(text_info, (list, tuple)) or not text_info:
                continue

            text = str(text_info[0]).strip()
            if text:
                lines.append(text)

    return lines


def recognize_with_paddle(ocr: Any, image_path: str) -> list[str]:
    if hasattr(ocr, "predict"):
        raw_result = ocr.predict(image_path)
    else:
        raw_result = ocr.ocr(image_path)

    return extract_lines(raw_result)


def recognize_with_rapidocr(image_path: str) -> list[str]:
    ocr = get_rapid_ocr_instance()
    if ocr is None:
        message = "RapidOCR 未安装或初始化失败。"
        if _RAPID_OCR_ERROR is not None:
            message = f"{message} 错误信息：{_RAPID_OCR_ERROR}"
        raise RuntimeError(message)

    raw_result, _elapsed = ocr(image_path)
    return extract_lines(raw_result)


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
        engine = "paddleocr"
        try:
            lines = recognize_with_paddle(ocr, image_path)
        except Exception:
            lines = recognize_with_rapidocr(image_path)
            engine = "rapidocr"

        text = "\n".join(lines).strip()

        if not text:
            return {
                "success": False,
                "text": "",
                "lines": [],
                "message": "图片中未识别到可读文字。",
                "engine": engine,
            }

        return {
            "success": True,
            "text": text,
            "lines": lines,
            "message": "OCR 识别成功",
            "engine": engine,
        }
    except Exception as exc:  # pragma: no cover
        return {
            "success": False,
            "text": "",
            "lines": [],
            "message": f"OCR 识别失败：{exc}",
            "engine": "paddleocr",
        }
