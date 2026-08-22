import hashlib


def anonymize_identifier(identifier, salt="drishti-local"):
    """
    Converts an internal identifier into a non-human-readable ID.

    Example:
        "camera1_person7" -> "student_a13f..."
    """
    raw = f"{salt}:{identifier}".encode("utf-8")
    digest = hashlib.sha256(raw).hexdigest()[:10]
    return f"student_{digest}"


def privacy_policy():
    return {
        "store_names": False,
        "store_roll_numbers": False,
        "store_face_images": False,
        "store_face_embeddings": False,
        "identity_recognition": False,
        "anonymous_student_ids": True,
        "behavioural_keypoints": True,
    }
