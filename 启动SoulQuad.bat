@echo off
chcp 65001 >nul
title SoulQuad 灵魂象限

echo ==========================================
echo    SoulQuad 灵魂象限 启动器
echo ==========================================
echo.

cd /d "%~dp0"

REM Check if Node.js is installed
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未安装 Node.js
    echo 请先安装 Node.js: https://nodejs.org/
    pause
    exit /b 1
)

REM Check Node version
for /f "delims=" %%v in ('node -v') do set NODE_VERSION=%%v
echo [信息] Node.js 版本: %NODE_VERSION%

REM Install dependencies if needed
if not exist "node_modules" (
    echo [信息] 安装依赖包...
    call npm install
    if %errorlevel% neq 0 (
        echo [错误] 依赖安装失败
        pause
        exit /b 1
    )
)

REM Build frontend if needed
if not exist "dist" (
    echo [信息] 构建前端...
    call npm run build
    if %errorlevel% neq 0 (
        echo [错误] 前端构建失败
        pause
        exit /b 1
    )
)

REM Start server
echo.
echo [信息] 启动服务器...
echo [信息] 访问地址: http://localhost:3001
echo.
echo 按 Ctrl+C 停止服务器
echo.

node server/index.js

pause