import httpx
import json
from typing import Dict, Any, Optional
from datetime import datetime
from app.config import FRONTEND_URL

class DatabaseService:
    """
    Service to communicate with the Next.js API to store/update interview data in Prisma
    """
    
    def __init__(self):
        self.base_url = FRONTEND_URL
        self.api_base = f"{self.base_url}/api"
    
    async def save_interview_session(self, interview_data: Dict[str, Any]) -> bool:
        """
        Save or update interview session in database
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.api_base}/interview",
                    json=interview_data,
                    timeout=10.0
                )
                return response.status_code in [200, 201]
        except Exception as e:
            print(f"Error saving interview session: {e}")
            return False
    
    async def update_interview_tracking(self, interview_id: str, tracking_data: Dict[str, Any]) -> bool:
        """
        Update interview tracking metrics in database
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.api_base}/interview/{interview_id}/tracking",
                    json={
                        "interview_id": interview_id,
                        "tracking": tracking_data
                    },
                    timeout=10.0
                )
                return response.status_code in [200, 201]
        except Exception as e:
            print(f"Error updating interview tracking: {e}")
            return False
    
    async def save_interview_results(self, interview_id: str, results: Dict[str, Any]) -> bool:
        """
        Save final interview results
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.api_base}/interview/{interview_id}/results",
                    json={
                        "interview_id": interview_id,
                        "feedback": results.get('feedback'),
                        "scoring": results.get('scoring'),
                        "tracking": results.get('tracking'),
                        "completed": True
                    },
                    timeout=10.0
                )
                return response.status_code in [200, 201]
        except Exception as e:
            print(f"Error saving interview results: {e}")
            return False
    
    async def save_tab_monitoring_data(self, interview_id: str, tab_data: Dict[str, Any]) -> bool:
        """
        Save tab monitoring data via existing endpoint
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.api_base}/tab-monitoring",
                    json=tab_data,
                    timeout=10.0
                )
                return response.status_code in [200, 201]
        except Exception as e:
            print(f"Error saving tab monitoring data: {e}")
            return False
    
    async def get_interview_details(self, interview_id: str) -> Optional[Dict[str, Any]]:
        """
        Get interview details from database
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.api_base}/interview/{interview_id}",
                    timeout=10.0
                )
                if response.status_code == 200:
                    return response.json()
        except Exception as e:
            print(f"Error fetching interview details: {e}")
        return None
