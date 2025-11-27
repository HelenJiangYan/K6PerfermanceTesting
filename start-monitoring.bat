@echo off
echo ============================================================
echo   Starting k6 Performance Monitoring Stack
echo   InfluxDB + Grafana
echo ============================================================
echo.

echo [1/3] Starting Docker containers...
docker-compose up -d

echo.
echo [2/3] Waiting for services to be ready...
timeout /t 10 /nobreak > nul

echo.
echo [3/3] Checking service status...
docker-compose ps

echo.
echo ============================================================
echo   Monitoring Stack is Ready!
echo ============================================================
echo.
echo   InfluxDB: http://localhost:8086
echo   Grafana:  http://localhost:3000
echo.
echo   Grafana Credentials:
echo   Username: admin
echo   Password: admin
echo.
echo   k6 Dashboard URL:
echo   http://localhost:3000/d/k6-performance/k6-performance-testing-dashboard
echo.
echo ============================================================
echo.
pause
