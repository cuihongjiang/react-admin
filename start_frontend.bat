@echo off
chcp 65001 >nul
title react-admin frontend :5173
cd /d %~dp0
echo Starting Vite dev server at http://localhost:5173 ...
call pnpm dev
pause
