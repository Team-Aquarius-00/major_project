from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
import cv2
import numpy as np

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

TARGET_CLASSES = ["person", "book", "cell phone"]

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

    face_present = len(faces) > 0

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

    return {
        "classes": list(set(classes)),
        "person_count": person_count,
        "phone_count": phone_count,
        "book_count": book_count,
        "face_present": face_present,
        "violations": violations,
        "score": score
    }
