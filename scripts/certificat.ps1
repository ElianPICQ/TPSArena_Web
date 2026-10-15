# Crée ou refait le certificat HTTPS du site pour l'adresse IP de la machine, signé par la CA
# locale de mkcert, puis redémarre le conteneur pour l'utiliser. Version Windows de
# scripts/certificat.sh (mêmes fichiers dans certs\).
#
#   .\scripts\certificat.ps1             IP de l'interface qui a une passerelle par défaut
#   .\scripts\certificat.ps1 10.0.0.12   IP donnée
#
# La clé de la CA (rootCA-key.pem) n'est jamais copiée.
param([string]$Ip = "")
$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

if (-not (Get-Command mkcert -ErrorAction SilentlyContinue)) {
    Write-Error "mkcert introuvable. Windows : winget install FiloSottile.mkcert (ou choco install mkcert)."
}

if (-not $Ip) {
    $Ip = (Get-NetIPConfiguration |
        Where-Object { $_.IPv4DefaultGateway -and $_.NetAdapter.Status -eq "Up" } |
        Select-Object -First 1).IPv4Address.IPAddress
}
if ($Ip -notmatch '^(\d{1,3}\.){3}\d{1,3}$') {
    Write-Error "Adresse IP introuvable ou invalide (« $Ip ») : passe-la en argument."
}

if (Test-Path certs\rootCA-key.pem) {
    Write-Error "certs\rootCA-key.pem existe : c'est la clé privée de la CA, elle n'a rien à faire ici. Supprime-la."
}

$caroot = (mkcert -CAROOT).Trim()
New-Item -ItemType Directory -Force certs | Out-Null
# Crée aussi la CA dans $caroot si elle n'existe pas encore (sans l'installer sur ce PC).
mkcert -cert-file certs\site.crt -key-file certs\site.key $Ip localhost 127.0.0.1 ::1
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Copy-Item (Join-Path $caroot "rootCA.pem") certs\tps-arena-ca.crt -Force

Write-Host ""
Write-Host "Certificat créé pour $Ip (valable aussi pour localhost)."
$ca = [System.Security.Cryptography.X509Certificates.X509Certificate2]::new((Resolve-Path certs\tps-arena-ca.crt).Path)
$sha = [System.Security.Cryptography.SHA256]::Create().ComputeHash($ca.RawData)
Write-Host "Empreinte SHA-256 de la CA, à comparer sur le téléphone :"
Write-Host ("  " + (($sha | ForEach-Object { $_.ToString("X2") }) -join ":"))

$running = docker compose ps --status running --services 2>$null
if ($running -contains "site") {
    docker compose restart site
    Write-Host "Site redémarré : app sur https://${Ip}:8443/app/ ; certificat de la CA sur http://${Ip}:8080/ca.crt (ports par défaut)"
} else {
    Write-Host "Le conteneur ne tourne pas : docker compose up -d --build"
}
