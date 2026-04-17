$principal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
$isAdmin = $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
  Write-Host "Please run this script from PowerShell as Administrator." -ForegroundColor Yellow
  Write-Host "Right-click PowerShell, choose 'Run as administrator', then run this file again."
  exit 1
}

$rules = @(
  @{
    Name = "PhishGuard QR Frontend 5173"
    Port = 5173
    Description = "Allows phones and other devices on the same private Wi-Fi to open the PhishGuard QR landing page."
  },
  @{
    Name = "PhishGuard API 8000"
    Port = 8000
    Description = "Allows LAN testing of the PhishGuard backend health endpoint when needed."
  }
)

foreach ($rule in $rules) {
  $existing = Get-NetFirewallRule -DisplayName $rule.Name -ErrorAction SilentlyContinue
  if ($existing) {
    Write-Host "Firewall rule already exists: $($rule.Name)" -ForegroundColor Cyan
    continue
  }

  New-NetFirewallRule `
    -DisplayName $rule.Name `
    -Direction Inbound `
    -Action Allow `
    -Protocol TCP `
    -LocalPort $rule.Port `
    -Profile Private `
    -Description $rule.Description | Out-Null

  Write-Host "Added firewall rule: $($rule.Name)" -ForegroundColor Green
}

Write-Host ""
Write-Host "Done. Restart the frontend with: npm run dev:lan" -ForegroundColor Green
Write-Host "Then open this from your phone: http://192.168.1.109:5173" -ForegroundColor Green
