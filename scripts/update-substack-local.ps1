param(
    [switch]$WhatIf,
    [string]$Branch = "main"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $line = "[$timestamp] $Message"
    Add-Content -Path $script:LogPath -Value $line
    Write-Host $line
}

function Ensure-Command {
    param([string]$Name)
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        Write-Log "Missing required command: $Name"
        exit 1
    }
}

function Invoke-LoggedCommand {
    param(
        [string]$Label,
        [string]$Command,
        [string[]]$Arguments
    )
    Write-Log $Label
    if ($WhatIf) {
        Write-Log ("WhatIf: {0} {1}" -f $Command, ($Arguments -join " "))
        return @{ ExitCode = 0; Output = @() }
    }
    $output = & $Command @Arguments 2>&1
    $exitCode = $LASTEXITCODE
    if ($output) {
        foreach ($line in $output) {
            Write-Log $line
        }
    }
    return @{ ExitCode = $exitCode; Output = $output }
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$current = $scriptDir
$repoRoot = $null

while ($true) {
    if (Test-Path (Join-Path $current ".git")) {
        $repoRoot = $current
        break
    }
    $parent = Split-Path $current -Parent
    if ([string]::IsNullOrEmpty($parent) -or $parent -eq $current) {
        break
    }
    $current = $parent
}

if (-not $repoRoot) {
    Write-Error "Could not locate repo root (missing .git)."
    exit 1
}

$logDir = Join-Path $repoRoot "_local_logs"
if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir | Out-Null
}
$script:LogPath = Join-Path $logDir "substack-update.log"

Set-Location $repoRoot
Write-Log "Starting Substack update in $repoRoot"

Ensure-Command "git"
Ensure-Command "node"

if ($WhatIf) {
    Write-Log "WhatIf enabled. No git or node commands will run."
    Write-Log "Would verify branch is $Branch and working tree is clean."
    Write-Log "Would run: git pull --rebase"
    Write-Log "Would run: node scripts/fetch-substack-archive.js"
    Write-Log "Would stage and commit assets/data/farewellfiles.json and assets/data/essay-tags.json"
    Write-Log "Would run: git push origin $Branch"
    exit 0
}

$branchResult = Invoke-LoggedCommand -Label "Checking current branch" -Command "git" -Arguments @("rev-parse", "--abbrev-ref", "HEAD")
if ($branchResult.ExitCode -ne 0) {
    exit 1
}
$currentBranch = ($branchResult.Output | Select-Object -First 1).Trim()
if ($currentBranch -ne $Branch) {
    Write-Log "Current branch is '$currentBranch', expected '$Branch'. Exiting."
    exit 1
}

$statusResult = Invoke-LoggedCommand -Label "Checking working tree status" -Command "git" -Arguments @("status", "--porcelain")
if ($statusResult.ExitCode -ne 0) {
    exit 1
}
$dirtyEntries = $statusResult.Output | Where-Object { $_ -and $_.Trim().Length -gt 0 }
if ($dirtyEntries) {
    Write-Log "Working tree is dirty; exiting without changes."
    exit 0
}

$pullResult = Invoke-LoggedCommand -Label "Pulling latest changes" -Command "git" -Arguments @("pull", "--rebase")
if ($pullResult.ExitCode -ne 0) {
    Write-Log "git pull --rebase failed."
    exit 1
}

$fetchResult = Invoke-LoggedCommand -Label "Running Substack fetch script" -Command "node" -Arguments @("scripts/fetch-substack-archive.js")
if ($fetchResult.ExitCode -ne 0) {
    Write-Log "Substack fetch failed."
    exit 1
}

$diffResult = Invoke-LoggedCommand -Label "Checking for data changes" -Command "git" -Arguments @("diff", "--name-only", "--", "assets/data/farewellfiles.json", "assets/data/essay-tags.json")
if ($diffResult.ExitCode -ne 0) {
    exit 1
}

$changedFiles = $diffResult.Output | Where-Object { $_ -and $_.Trim().Length -gt 0 }
if (-not $changedFiles) {
    Write-Log "No changes."
    exit 0
}

$addResult = Invoke-LoggedCommand -Label "Staging data files" -Command "git" -Arguments @("add", "--", "assets/data/farewellfiles.json", "assets/data/essay-tags.json")
if ($addResult.ExitCode -ne 0) {
    exit 1
}

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$commitResult = Invoke-LoggedCommand -Label "Committing changes" -Command "git" -Arguments @("commit", "-m", "chore: update Substack data (local)", "-m", "Updated: $timestamp")
if ($commitResult.ExitCode -ne 0) {
    exit 1
}

$pushResult = Invoke-LoggedCommand -Label "Pushing to origin/$Branch" -Command "git" -Arguments @("push", "origin", $Branch)
if ($pushResult.ExitCode -ne 0) {
    Write-Log "git push failed."
    exit 1
}

Write-Log "Substack update completed successfully."
