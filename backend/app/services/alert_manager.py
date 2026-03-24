from typing import Optional
import json

class AlertManager:
    """
    Manages alert storage and retrieval
    """
    
    def __init__(self):
        self.alerts = []
    
    def add_alert(self, alert: dict) -> None:
        """Add an alert to the queue"""
        self.alerts.append(alert)
    
    def get_pending_alerts(self, interview_id: str) -> list:
        """Get all pending alerts for an interview"""
        return [a for a in self.alerts if a.get('interview_id') == interview_id]
    
    def clear_alerts(self, interview_id: str) -> None:
        """Clear alerts for an interview"""
        self.alerts = [a for a in self.alerts if a.get('interview_id') != interview_id]
    
    def get_alert_summary(self, alerts: list) -> dict:
        """Generate summary statistics from alerts"""
        summary = {
            'total_alerts': len(alerts),
            'gaze_alerts': len([a for a in alerts if a.get('type') == 'gaze_alert']),
            'tab_switch_alerts': len([a for a in alerts if a.get('type') == 'tab_switch']),
            'object_detection_alerts': len([a for a in alerts if a.get('type') == 'object_detected']),
            'high_severity': len([a for a in alerts if a.get('severity') == 'high']),
            'medium_severity': len([a for a in alerts if a.get('severity') == 'medium']),
            'low_severity': len([a for a in alerts if a.get('severity') == 'low']),
        }
        return summary
