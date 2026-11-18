# Only affects this terminal. Normal Node.js installations already include npm.
$toolBin = Join-Path $PSScriptRoot '../.tools/bin'
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw 'Please install Node.js 24 LTS (including npm), then reopen the terminal.'
}
if (-not (Test-Path (Join-Path $toolBin 'npm.cmd'))) {
  throw 'Local npm fallback is unavailable. Install Node.js 24 LTS including npm.'
}
$env:Path = "$toolBin;$env:Path"
Write-Host 'npm enabled in this terminal. Run: npm run dev'
