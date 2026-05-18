# Financial MIS Startup Script
# Run both backend and frontend servers

$projectPath = "c:\Users\niyaz\OneDrive\Desktop\Financial MIS with Ai Based Fraud Detection & Cyber security alert system\financial-mis-project"
$venvPath = "c:/Users/niyaz/OneDrive/Desktop/Financial MIS with Ai Based Fraud Detection & Cyber security alert system/.venv/Scripts/python.exe"

Write-Host "Starting Financial MIS..." -ForegroundColor Cyan

# Start Backend (Flask)
Set-Location $projectPath
Start-Process -FilePath $venvPath -ArgumentList "-m backend.app" -WindowStyle Minimized
Start-Sleep -Seconds 2

# Start Frontend (Static Server)
Start-Process -FilePath $venvPath -ArgumentList "-m http.server 5500" -WindowStyle Minimized
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "SUCCESS! Both servers running" -ForegroundColor Green
Write-Host "Dashboard: http://127.0.0.1:5500/frontend/index.html" -ForegroundColor Cyan
Write-Host ""
Write-Host "Opening browser in 3 seconds..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

$browser = "http://127.0.0.1:5500/frontend/index.html"
Start-Process $browser
