@echo off
echo ============================================================
echo   Stopping k6 Performance Monitoring Stack
echo ============================================================
echo.

echo [1/2] Stopping Docker containers...
docker-compose down

echo.
echo [2/2] Service status...
docker-compose ps

echo.
echo ============================================================
echo   Monitoring Stack Stopped
echo ============================================================
echo.
echo   To start again: scripts\start-monitoring.bat
echo.
pause
