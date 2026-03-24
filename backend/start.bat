@echo off

REM Interview Monitoring Backend Startup Script for Windows

echo ==================================
echo Interview Monitoring Backend
echo ==================================

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Python 3 is not installed
    exit /b 1
)

REM Check if we're in the right directory
if not exist "requirements.txt" (
    echo requirements.txt not found. Please run this script from the backend directory
    exit /b 1
)

REM Create virtual environment if it doesn't exist
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
echo Installing dependencies...
python -m pip install --upgrade pip
pip install -r requirements.txt

REM Check .env file
if not exist ".env" (
    echo Creating .env file from .env.example...
    copy .env.example .env
    echo Please update .env with your configuration
)

REM Start the server
echo Starting FastAPI server...
python -m app.main
