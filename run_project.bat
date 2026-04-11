@echo off
title Khoi dong Project Spring Boot & ReactJS

:: 1. Chạy Spring Boot ở cửa sổ mới
echo Dang khoi dong Backend (Spring Boot)...
start "Backend - Spring Boot" cmd /k "cd /d %~dp0backend\api && mvn spring-boot:run"

:: 2. Chạy ReactJS ở cửa sổ mới
echo Dang khoi dong Frontend (ReactJS)...
start "Frontend - ReactJS" cmd /k "cd /d %~dp0frontend && npm start"

echo.
echo Da kich hoat lenh chay cho ca hai. Vui long kiem tra cac cua so moi mo.
pause