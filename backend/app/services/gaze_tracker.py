import cv2
import numpy as np
from typing import Dict, Tuple, Any
import mediapipe as mp

class GazeTracker:
    """
    Tracks eye gaze direction using MediaPipe Face Mesh
    """
    def __init__(self):
        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            static_image_mode=False,
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        # Key facial landmarks for gaze direction
        self.LEFT_EYE_LANDMARKS = [33, 160, 158, 133, 153, 144]
        self.RIGHT_EYE_LANDMARKS = [263, 387, 385, 362, 382, 381]
        self.NOSE_LANDMARK = 1

    def process_frame(self, frame: np.ndarray) -> Dict[str, Any]:
        """
        Process a video frame to extract gaze direction
        Returns: Dictionary with gaze metrics
        """
        h, w, c = frame.shape
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.face_mesh.process(rgb_frame)
        
        gaze_data = {
            'gaze_direction': 'center',
            'gaze_x': 0.5,
            'gaze_y': 0.5,
            'confidence': 0.0,
            'is_looking_at_screen': True,
            'eye_aspect_ratio': 0.0,
            'landmarks': None
        }
        
        if results.multi_face_landmarks:
            landmarks = results.multi_face_landmarks[0].landmark
            
            # Extract eye landmarks
            left_eye = np.array([(landmarks[i].x, landmarks[i].y) for i in self.LEFT_EYE_LANDMARKS])
            right_eye = np.array([(landmarks[i].x, landmarks[i].y) for i in self.RIGHT_EYE_LANDMARKS])
            nose = np.array([landmarks[self.NOSE_LANDMARK].x, landmarks[self.NOSE_LANDMARK].y])
            
            # Calculate gaze direction
            gaze_direction, gaze_x, gaze_y = self._calculate_gaze_direction(left_eye, right_eye, nose)
            
            # Calculate eye aspect ratio (to detect if eyes are open)
            ear = self._eye_aspect_ratio(left_eye)
            
            gaze_data.update({
                'gaze_direction': gaze_direction,
                'gaze_x': gaze_x,
                'gaze_y': gaze_y,
                'confidence': 0.9,
                'is_looking_at_screen': ear > 0.2,  # Eyes open threshold
                'eye_aspect_ratio': ear,
                'landmarks': landmarks
            })
        
        return gaze_data
    
    def _calculate_gaze_direction(self, left_eye: np.ndarray, right_eye: np.ndarray, nose: np.ndarray) -> Tuple[str, float, float]:
        """
        Calculate gaze direction from eye landmarks
        Returns: (direction_string, x_ratio, y_ratio)
        """
        # Calculate eye centers
        left_eye_center = left_eye.mean(axis=0)
        right_eye_center = right_eye.mean(axis=0)
        eye_center = (left_eye_center + right_eye_center) / 2
        
        # Calculate relative position
        gaze_x = eye_center[0]
        gaze_y = eye_center[1]
        
        # Determine direction based on position
        direction = 'center'
        if gaze_x < 0.35:
            direction = 'left'
        elif gaze_x > 0.65:
            direction = 'right'
        elif gaze_y < 0.35:
            direction = 'up'
        elif gaze_y > 0.65:
            direction = 'down'
        
        return direction, gaze_x, gaze_y
    
    def _eye_aspect_ratio(self, eye: np.ndarray) -> float:
        """
        Calculate eye aspect ratio (EAR)
        """
        # Eye aspect ratio uses vertical and horizontal distances
        A = np.linalg.norm(eye[1] - eye[5])
        B = np.linalg.norm(eye[2] - eye[4])
        C = np.linalg.norm(eye[0] - eye[3])
        
        ear = (A + B) / (2.0 * C)
        return ear
    
    def release(self):
        """Release resources"""
        self.face_mesh.close()
