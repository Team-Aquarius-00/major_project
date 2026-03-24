from typing import Dict, List, Any
from datetime import datetime
import json

class InterviewMonitor:
    """
    Monitors interview session and generates alerts based on gaze, tab switches, and object detection
    """
    
    # Alert thresholds
    GAZE_ALERT_THRESHOLD = 5000  # ms of continuous gaze away from screen
    TAB_SWITCH_ALERT_THRESHOLD = 2000  # ms
    PHONE_ALERT_THRESHOLD = 1000  # ms
    MULTIPLE_PEOPLE_ALERT_THRESHOLD = 2000  # ms
    
    def __init__(self, interview_id: str, candidate_id: str):
        self.interview_id = interview_id
        self.candidate_id = candidate_id
        self.alerts: List[Dict[str, Any]] = []
        self.metrics = {
            'gaze_alerts': [],
            'tab_switch_alerts': [],
            'object_detection_alerts': [],
            'total_focus_time': 0,
            'total_distractions': 0,
            'gaze_away_time': 0,
            'tab_switches': 0
        }
        self.gaze_away_start = None
        self.phone_detected_start = None
        self.multiple_people_start = None
    
    def process_gaze_data(self, gaze_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Process gaze data and generate alerts
        """
        new_alerts = []
        
        # Check if looking away from screen
        if not gaze_data.get('is_looking_at_screen', True) and gaze_data.get('gaze_direction') != 'center':
            if self.gaze_away_start is None:
                self.gaze_away_start = datetime.now()
            else:
                time_away = (datetime.now() - self.gaze_away_start).total_seconds() * 1000
                if time_away > self.GAZE_ALERT_THRESHOLD:
                    alert = {
                        'type': 'gaze_alert',
                        'message': f"Looking {gaze_data.get('gaze_direction', 'away')}",
                        'severity': 'high' if time_away > 10000 else 'medium',
                        'timestamp': datetime.now().isoformat(),
                        'data': {
                            'direction': gaze_data.get('gaze_direction'),
                            'time_away': time_away,
                            'confidence': gaze_data.get('confidence', 0)
                        }
                    }
                    new_alerts.append(alert)
                    self.metrics['gaze_alerts'].append(alert)
                    self.metrics['gaze_away_time'] += time_away
        else:
            self.gaze_away_start = None
        
        return new_alerts
    
    def process_tab_switch(self, tab_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Process tab switch events and generate alerts
        """
        new_alerts = []
        
        if tab_data.get('event_type') in ['switch_away', 'window_blur']:
            time_spent = tab_data.get('time_spent', 0)
            if time_spent > self.TAB_SWITCH_ALERT_THRESHOLD:
                alert = {
                    'type': 'tab_switch',
                    'message': f"Switched to {tab_data.get('tab_title', 'different tab')}",
                    'severity': 'high',
                    'timestamp': datetime.now().isoformat(),
                    'data': {
                        'tab_url': tab_data.get('tab_url'),
                        'time_spent': time_spent,
                        'event_type': tab_data.get('event_type')
                    }
                }
                new_alerts.append(alert)
                self.metrics['tab_switch_alerts'].append(alert)
                self.metrics['tab_switches'] += 1
        
        return new_alerts
    
    def process_object_detection(self, detection_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Process object detection and generate alerts
        """
        new_alerts = []
        
        # Phone detection alert
        if detection_data.get('has_phone'):
            if self.phone_detected_start is None:
                self.phone_detected_start = datetime.now()
            else:
                duration = (datetime.now() - self.phone_detected_start).total_seconds() * 1000
                if duration > self.PHONE_ALERT_THRESHOLD:
                    alert = {
                        'type': 'object_detected',
                        'message': '📱 Phone detected',
                        'severity': 'high',
                        'timestamp': datetime.now().isoformat(),
                        'data': {
                            'object': 'phone',
                            'duration': duration
                        }
                    }
                    new_alerts.append(alert)
                    self.metrics['object_detection_alerts'].append(alert)
        else:
            self.phone_detected_start = None
        
        # Multiple people detection alert
        if detection_data.get('has_multiple_people'):
            if self.multiple_people_start is None:
                self.multiple_people_start = datetime.now()
            else:
                duration = (datetime.now() - self.multiple_people_start).total_seconds() * 1000
                if duration > self.MULTIPLE_PEOPLE_ALERT_THRESHOLD:
                    alert = {
                        'type': 'object_detected',
                        'message': '👥 Multiple people detected',
                        'severity': 'medium',
                        'timestamp': datetime.now().isoformat(),
                        'data': {
                            'object': 'multiple_people',
                            'duration': duration,
                            'count': detection_data.get('total_detections', 0)
                        }
                    }
                    new_alerts.append(alert)
                    self.metrics['object_detection_alerts'].append(alert)
        else:
            self.multiple_people_start = None
        
        return new_alerts
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get current metrics"""
        return self.metrics
    
    def reset_metrics(self):
        """Reset metrics"""
        self.metrics = {
            'gaze_alerts': [],
            'tab_switch_alerts': [],
            'object_detection_alerts': [],
            'total_focus_time': 0,
            'total_distractions': 0,
            'gaze_away_time': 0,
            'tab_switches': 0
        }
