@echo off
setlocal enabledelayedexpansion

if "%~1"=="" (
    echo Usage: run-with-monitoring.bat ^<test-script-path^>
    echo.
    echo Examples:
    echo   run-with-monitoring.bat scripts\createProject.js
    echo   run-with-monitoring.bat performanceTests\load\createProjectAndSpecLoadTest.js
    echo   run-with-monitoring.bat performanceTests\stress\createProjectAndSpecStressTest.js
    echo.
    pause
    exit /b 1
)

set TEST_SCRIPT=%~1

echo ============================================================
echo   Running k6 Test with Real-time Monitoring
echo ============================================================
echo.
echo   Test Script: %TEST_SCRIPT%
echo   InfluxDB:    http://localhost:8086
echo   Grafana:     http://localhost:3000
echo.
echo ============================================================
echo.

echo [Checking monitoring stack status...]
docker-compose ps | findstr "Up" > nul
if errorlevel 1 (
    echo.
    echo ERROR: Monitoring stack is not running!
    echo Please start it first: start-monitoring.bat
    echo.
    pause
    exit /b 1
)

echo [Monitoring stack is running]
echo.
echo [Starting k6 test...]
echo.

k6 run --out influxdb=http://localhost:8086/k6 %TEST_SCRIPT%

echo.
echo ============================================================
echo   Test Completed
echo ============================================================
echo.
echo   View results in Grafana:
echo   http://localhost:3000/d/k6-performance/k6-performance-testing-dashboard
echo.
pause
