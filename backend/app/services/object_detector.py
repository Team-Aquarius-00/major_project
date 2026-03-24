import cv2
import numpy as np
from typing import List, Dict, Any
from ultralytics import YOLO

class ObjectDetector:
    """
    YOLOv8n based object detection for monitoring interview environment
    """
    def __init__(self, model_name: str = "yolov8n.pt"):
        """Initialize YOLO model"""
        try:
            self.model = YOLO(model_name)
        except Exception as e:
            print(f"Warning: Could not load YOLO model {model_name}: {e}")
            self.model = None
    
    def detect_objects(self, frame: np.ndarray) -> Dict[str, Any]:
        """
        Detect objects in a video frame
        Returns: Dictionary with detection results
        """
        detection_data = {
            'detected_objects': [],
            'total_detections': 0,
            'has_phone': False,
            'has_multiple_people': False,
            'has_unknown_objects': False,
            'confidence': 0.0
        }
        
        if self.model is None:
            return detection_data
        
        try:
            # Run inference
            results = self.model(frame, verbose=False)
            
            if results and len(results) > 0:
                result = results[0]
                detections = result.boxes
                
                # Process each detection
                for box in detections:
                    cls_id = int(box.cls[0])
                    confidence = float(box.conf[0])
                    class_name = self.model.names[cls_id]
                    
                    # Get bounding box coordinates
                    x1, y1, x2, y2 = box.xyxy[0]
                    
                    detection_data['detected_objects'].append({
                        'class': class_name,
                        'confidence': confidence,
                        'bbox': {
                            'x1': float(x1),
                            'y1': float(y1),
                            'x2': float(x2),
                            'y2': float(y2)
                        },
                        'class_id': cls_id
                    })
                    
                    # Check for specific alert conditions
                    if 'cell phone' in class_name.lower() or 'phone' in class_name.lower():
                        detection_data['has_phone'] = True
                    
                    if class_name.lower() == 'person':
                        detection_data['total_detections'] += 1
                
                # Check for multiple people (distraction alert)
                if detection_data['total_detections'] > 1:
                    detection_data['has_multiple_people'] = True
                
                detection_data['confidence'] = float(np.mean([d['confidence'] for d in detection_data['detected_objects']])) if detection_data['detected_objects'] else 0.0
        
        except Exception as e:
            print(f"Error during object detection: {e}")
        
        return detection_data
    
    def process_frame(self, frame: np.ndarray) -> Dict[str, Any]:
        """
        Wrapper method for ease of use
        """
        return self.detect_objects(frame)
    
    def release(self):
        """Release resources"""
        pass
