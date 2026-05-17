@echo off
echo Starting AlphaAI Backend...
start cmd /k "cd backend && .\venv\Scripts\python main.py"
echo Starting AlphaAI Frontend...
start cmd /k "cd frontend && npm run dev"
echo Both servers are starting. You can access the dashboard at http://localhost:3000/portfolio
pause
