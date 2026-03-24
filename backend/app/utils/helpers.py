import os
from pathlib import Path
from typing import Dict, Any


def create_app_directories() -> None:
    """Create necessary application directories if they don't exist"""
    directories = ['logs', 'models', 'temp']
    for directory in directories:
        Path(directory).mkdir(exist_ok=True)


def format_timestamp(timestamp_str: str) -> str:
    """Format ISO timestamp to readable format"""
    try:
        from datetime import datetime
        dt = datetime.fromisoformat(timestamp_str)
        return dt.strftime('%Y-%m-%d %H:%M:%S')
    except Exception:
        return timestamp_str


def calculate_duration(start_time: float, end_time: float) -> str:
    """Calculate duration between two timestamps in seconds and return formatted string"""
    duration_seconds = end_time - start_time
    minutes = int(duration_seconds // 60)
    seconds = int(duration_seconds % 60)
    return f"{minutes}m {seconds}s"


def get_gaze_direction_emoji(direction: str) -> str:
    """Get emoji for gaze direction"""
    emoji_map = {
        'left': '⬅️',
        'right': '➡️',
        'up': '⬆️',
        'down': '⬇️',
        'center': '👁️',
        'away': '👀'
    }
    return emoji_map.get(direction, '👁️')


def calculate_focus_percentage(total_time: float, focus_time: float) -> float:
    """Calculate focus percentage"""
    if total_time == 0:
        return 0.0
    return (focus_time / total_time) * 100


def generate_alert_summary(alerts: list) -> Dict[str, Any]:
    """Generate summary statistics from alerts"""
    summary = {
        'total_alerts': len(alerts),
        'high_severity': len([a for a in alerts if a.get('severity') == 'high']),
        'medium_severity': len([a for a in alerts if a.get('severity') == 'medium']),
        'low_severity': len([a for a in alerts if a.get('severity') == 'low']),
        'gaze_alerts': len([a for a in alerts if a.get('type') == 'gaze_alert']),
        'tab_switches': len([a for a in alerts if a.get('type') == 'tab_switch']),
        'object_detections': len([a for a in alerts if a.get('type') == 'object_detected']),
    }
    return summary


def log_alert(alert: Dict[str, Any]) -> None:
    """Log alert to console with formatting"""
    severity_colors = {
        'high': '\033[91m',  # Red
        'medium': '\033[93m',  # Yellow
        'low': '\033[92m'  # Green
    }
    reset_color = '\033[0m'
    
    severity = alert.get('severity', 'low')
    color = severity_colors.get(severity, reset_color)
    
    print(f"{color}[{alert.get('type', 'unknown').upper()}] {alert.get('message', 'No message')}{reset_color}")
