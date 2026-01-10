@echo off
cd /d "C:\Users\GIGABTYE AORUS'\Herd\eksporyuk\nextjs-eksporyuk"
set NEXT_TELEMETRY_DISABLED=1
if exist .next\trace del /f /q .next\trace
npx next dev -p 3005
