from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
import cv2
import numpy as np
import mediapipe as mp

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = YOLO("yolov8n.pt")

face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)

mp_face_mesh = mp.solutions.face_mesh
face_mesh_detector = mp_face_mesh.FaceMesh(
    static_image_mode=True,
    max_num_faces=1,
    refine_landmarks=True,
    min_detection_confidence=0.5,
)

TARGET_CLASSES = ["person", "book", "cell phone"]

# Practical tolerance windows for real-world webcam interviews.
IDEAL_HEAD_YAW_DEG = 28.0
IDEAL_HEAD_PITCH_DEG = 22.0
IDEAL_GAZE_CENTER_DELTA_X = 0.22
IDEAL_GAZE_CENTER_DELTA_Y = 0.22

# Only raise a gaze/head violation when clearly off-center.
SEVERE_HEAD_YAW_DEG = 40.0
SEVERE_HEAD_PITCH_DEG = 30.0
SEVERE_GAZE_DELTA_X = 0.30
SEVERE_GAZE_DELTA_Y = 0.30


def _normalize_angle(angle: float) -> float:
    normalized = angle
    while normalized > 180:
        normalized -= 360
    while normalized < -180:
        normalized += 360
    return normalized


def _landmark_xy(face_landmarks, index: int, frame_w: int, frame_h: int):
    landmark = face_landmarks.landmark[index]
    return np.array([landmark.x * frame_w, landmark.y * frame_h], dtype=np.float64)


def _estimate_head_pose(face_landmarks, frame_w: int, frame_h: int):
    # Canonical 3D face model points used for coarse pose estimation.
    model_points = np.array(
        [
            (0.0, 0.0, 0.0),  # Nose tip
            (0.0, -63.6, -12.5),  # Chin
            (-43.3, 32.7, -26.0),  # Left eye outer corner
            (43.3, 32.7, -26.0),  # Right eye outer corner
            (-28.9, -28.9, -24.1),  # Left mouth corner
            (28.9, -28.9, -24.1),  # Right mouth corner
        ],
        dtype=np.float64,
    )

    image_points = np.array(
        [
            _landmark_xy(face_landmarks, 1, frame_w, frame_h),
            _landmark_xy(face_landmarks, 152, frame_w, frame_h),
            _landmark_xy(face_landmarks, 33, frame_w, frame_h),
            _landmark_xy(face_landmarks, 263, frame_w, frame_h),
            _landmark_xy(face_landmarks, 61, frame_w, frame_h),
            _landmark_xy(face_landmarks, 291, frame_w, frame_h),
        ],
        dtype=np.float64,
    )

    focal_length = float(frame_w)
    camera_matrix = np.array(
        [
            [focal_length, 0.0, frame_w / 2.0],
            [0.0, focal_length, frame_h / 2.0],
            [0.0, 0.0, 1.0],
        ],
        dtype=np.float64,
    )
    dist_coeffs = np.zeros((4, 1), dtype=np.float64)

    success, rotation_vector, translation_vector = cv2.solvePnP(
        model_points,
        image_points,
        camera_matrix,
        dist_coeffs,
        flags=cv2.SOLVEPNP_ITERATIVE,
    )

    if not success:
        return None

    rotation_matrix, _ = cv2.Rodrigues(rotation_vector)
    projection_matrix = np.hstack((rotation_matrix, translation_vector))
    _, _, _, _, _, _, euler_angles = cv2.decomposeProjectionMatrix(projection_matrix)

    pitch = _normalize_angle(float(euler_angles[0]))
    yaw = _normalize_angle(float(euler_angles[1]))
    roll = _normalize_angle(float(euler_angles[2]))

    return {
        "yaw": round(yaw, 2),
        "pitch": round(pitch, 2),
        "roll": round(roll, 2),
    }


def _estimate_iris_gaze(face_landmarks, frame_w: int, frame_h: int):
    left_iris_ids = [468, 469, 470, 471, 472]
    right_iris_ids = [473, 474, 475, 476, 477]

    left_corner_outer = _landmark_xy(face_landmarks, 33, frame_w, frame_h)
    left_corner_inner = _landmark_xy(face_landmarks, 133, frame_w, frame_h)
    right_corner_inner = _landmark_xy(face_landmarks, 362, frame_w, frame_h)
    right_corner_outer = _landmark_xy(face_landmarks, 263, frame_w, frame_h)

    left_top = _landmark_xy(face_landmarks, 159, frame_w, frame_h)
    left_bottom = _landmark_xy(face_landmarks, 145, frame_w, frame_h)
    right_top = _landmark_xy(face_landmarks, 386, frame_w, frame_h)
    right_bottom = _landmark_xy(face_landmarks, 374, frame_w, frame_h)

    left_iris = np.mean(
        [_landmark_xy(face_landmarks, idx, frame_w, frame_h) for idx in left_iris_ids], axis=0
    )
    right_iris = np.mean(
        [_landmark_xy(face_landmarks, idx, frame_w, frame_h) for idx in right_iris_ids], axis=0
    )

    left_eye_width = max(1e-6, left_corner_inner[0] - left_corner_outer[0])
    right_eye_width = max(1e-6, right_corner_outer[0] - right_corner_inner[0])

    left_ratio_x = (left_iris[0] - left_corner_outer[0]) / left_eye_width
    right_ratio_x = (right_iris[0] - right_corner_inner[0]) / right_eye_width
    horizontal_ratio = float(np.clip((left_ratio_x + right_ratio_x) / 2.0, 0.0, 1.0))

    left_eye_height = max(1e-6, left_bottom[1] - left_top[1])
    right_eye_height = max(1e-6, right_bottom[1] - right_top[1])
    left_ratio_y = (left_iris[1] - left_top[1]) / left_eye_height
    right_ratio_y = (right_iris[1] - right_top[1]) / right_eye_height
    vertical_ratio = float(np.clip((left_ratio_y + right_ratio_y) / 2.0, 0.0, 1.0))

    horizontal_delta = horizontal_ratio - 0.5
    vertical_delta = vertical_ratio - 0.5

    direction = "center"
    if abs(horizontal_delta) >= abs(vertical_delta):
        if horizontal_delta < -0.12:
            direction = "left"
        elif horizontal_delta > 0.12:
            direction = "right"
    else:
        if vertical_delta < -0.12:
            direction = "up"
        elif vertical_delta > 0.12:
            direction = "down"

    eye_quality = min((left_eye_width + right_eye_width) / max(frame_w, 1) * 2.2, 1.0)
    center_score = 1.0 - min(max(abs(horizontal_delta), abs(vertical_delta)) * 2.2, 1.0)
    confidence = float(np.clip(0.35 + 0.45 * eye_quality + 0.2 * center_score, 0.0, 0.99))

    return {
        "direction": direction,
        "confidence": round(confidence, 3),
        "horizontal_ratio": round(horizontal_ratio, 3),
        "vertical_ratio": round(vertical_ratio, 3),
        "horizontal_delta": round(float(horizontal_delta), 3),
        "vertical_delta": round(float(vertical_delta), 3),
    }

@app.post("/detect")
async def detect(file: UploadFile = File(...)):
    contents = await file.read()

    nparr = np.frombuffer(contents, np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    results = model(frame)

    classes = []
    person_count = 0
    phone_count = 0
    book_count = 0

    for r in results:
        for box in r.boxes:
            cls_id = int(box.cls[0])
            cls_name = model.names[cls_id]

            if cls_name in TARGET_CLASSES:
                classes.append(cls_name)

                if cls_name == "person":
                    person_count += 1
                elif cls_name == "cell phone":
                    phone_count += 1
                elif cls_name == "book":
                    book_count += 1

    # Face detection
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, 1.3, 5)

    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    mesh_result = face_mesh_detector.process(frame_rgb)
    face_landmarks = (
        mesh_result.multi_face_landmarks[0]
        if mesh_result.multi_face_landmarks
        else None
    )

    face_present = len(faces) > 0 or face_landmarks is not None

    gaze = {
        "direction": "unknown",
        "is_focused": False,
        "confidence": 0.0,
        "method": "mediapipe",
    }
    head_pose = {
        "yaw": None,
        "pitch": None,
        "roll": None,
    }

    if face_landmarks is not None:
        frame_h, frame_w = gray.shape[:2]
        iris_gaze = _estimate_iris_gaze(face_landmarks, frame_w, frame_h)
        estimated_head_pose = _estimate_head_pose(face_landmarks, frame_w, frame_h)

        if estimated_head_pose is not None:
            head_pose = estimated_head_pose

        yaw = abs(head_pose["yaw"]) if head_pose["yaw"] is not None else 0.0
        pitch = abs(head_pose["pitch"]) if head_pose["pitch"] is not None else 0.0
        head_is_centered = yaw <= IDEAL_HEAD_YAW_DEG and pitch <= IDEAL_HEAD_PITCH_DEG

        gaze_direction = iris_gaze["direction"]
        horizontal_delta = abs(iris_gaze.get("horizontal_delta", 0.0))
        vertical_delta = abs(iris_gaze.get("vertical_delta", 0.0))

        gaze_is_center = (
            horizontal_delta <= IDEAL_GAZE_CENTER_DELTA_X
            and vertical_delta <= IDEAL_GAZE_CENTER_DELTA_Y
        )

        # Consider candidate focused if either eyes or head are reasonably centered.
        is_focused = person_count == 1 and (head_is_centered or gaze_is_center)

        severe_head_off = yaw > SEVERE_HEAD_YAW_DEG or pitch > SEVERE_HEAD_PITCH_DEG
        severe_gaze_off = (
            horizontal_delta > SEVERE_GAZE_DELTA_X
            or vertical_delta > SEVERE_GAZE_DELTA_Y
        )
        severe_off_center = severe_head_off and severe_gaze_off

        gaze = {
            "direction": gaze_direction,
            "is_focused": is_focused,
            "confidence": iris_gaze["confidence"],
            "method": "mediapipe",
            "head_centered": head_is_centered,
            "gaze_centered": gaze_is_center,
            "severe_off_center": severe_off_center,
        }

    violations = []
    score = 0

    if person_count > 1:
        violations.append("Multiple persons detected")
        score += 40

    if phone_count > 0:
        violations.append("Phone detected")
        score += 30

    if book_count > 0:
        violations.append("Book detected")
        score += 20

    if not face_present:
        violations.append("Face not visible")
        score += 25

    if (
        face_present
        and gaze["direction"] != "unknown"
        and gaze.get("severe_off_center")
        and gaze.get("confidence", 0.0) >= 0.45
    ):
        violations.append("Candidate gaze/head not centered")
        score += 10

    return {
        "classes": list(set(classes)),
        "person_count": person_count,
        "phone_count": phone_count,
        "book_count": book_count,
        "face_present": face_present,
        "gaze": gaze,
        "head_pose": head_pose,
        "ideal_position": {
            "head": f"Keep head within ±{int(IDEAL_HEAD_YAW_DEG)}° yaw and ±{int(IDEAL_HEAD_PITCH_DEG)}° pitch",
            "gaze": "Look near the camera/screen center (avoid long side glances)",
        },
        "violations": violations,
        "score": score
    }
