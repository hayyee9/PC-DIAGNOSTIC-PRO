<#
.SYNOPSIS
    PC Diagnostic Collector Script
    Script ringan untuk mengumpulkan data diagnostik komputer Windows 10/11
    Data dikumpulkan dan disimpan sebagai file JSON yang bisa di-upload ke
    PC Diagnostic Pro web dashboard.

.DESCRIPTION
    Script ini mengumpulkan data dari:
    - Sistem Operasi (versi, uptime, Windows Update)
    - Hardware (CPU, RAM, Storage, GPU)
    - Kesehatan Disk (SMART)
    - Jaringan (latensi, DNS)
    - Event Logs (BSOD, Error, Critical)
    - Layanan Windows
    - Program Startup
    - Antivirus & Security
    - Integritas Sistem (SFC, DISM)

.NOTES
    - Tidak memerlukan instalasi apapun
    - Tidak memerlukan hak administrator untuk sebagian besar data
    - Beberapa data memerlukan Run as Administrator
    - Output: File JSON di folder Desktop
    - Estimasi waktu: 30-60 detik

.AUTHOR
    PC Diagnostic Pro
.VERSION
    1.0.0
#>

# ============================================================
# Konfigurasi
# ============================================================
$OutputFolder = [Environment]::GetFolderPath("Desktop")
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$OutputFile = Join-Path $OutputFolder "pc-diagnostic-$Timestamp.json"

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  PC Diagnostic Pro - Data Collector" -ForegroundColor Cyan
Write-Host "  Mengumpulkan data diagnostik komputer..." -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

$DiagnosticData = @{}

# ============================================================
# 1. SISTEM OPERASI
# ============================================================
Write-Host "[1/10] Mengumpulkan data Sistem Operasi..." -ForegroundColor Yellow -NoNewline

$OS = Get-CimInstance -ClassName Win32_OperatingSystem -ErrorAction SilentlyContinue
$ComputerSystem = Get-CimInstance -ClassName Win32_ComputerSystem -ErrorAction SilentlyContinue

$DiagnosticData.computerName = $ComputerSystem.Name
$DiagnosticData.osVersion = if ($OS.Caption) { "$($OS.Caption)" } else { "Unknown" }
$DiagnosticData.osBuild = if ($OS.BuildNumber) { $OS.BuildNumber } else { "Unknown" }
$DiagnosticData.uptime = if ($OS.LastBootUpTime) {
    $uptime = (Get-Date) - $OS.LastBootUpTime
    "$($uptime.Days) hari $($uptime.Hours) jam $($uptime.Minutes) menit"
} else { "Unknown" }

Write-Host " Selesai" -ForegroundColor Green

# ============================================================
# 2. CPU
# ============================================================
Write-Host "[2/10] Mengumpulkan data CPU..." -ForegroundColor Yellow -NoNewline

$CPU = Get-CimInstance -ClassName Win32_Processor -ErrorAction SilentlyContinue

$DiagnosticData.cpuModel = if ($CPU.Name) { $CPU.Name.Trim() } else { "Unknown" }
$DiagnosticData.cpuCores = if ($CPU.NumberOfLogicalProcessors) { $CPU.NumberOfLogicalProcessors } else { 0 }

# CPU Usage (sample over 2 seconds)
try {
    $cpu1 = (Get-Counter '\Processor(_Total)\% Processor Time' -ErrorAction Stop).CounterSamples.CookedValue
    Start-Sleep -Seconds 2
    $cpu2 = (Get-Counter '\Processor(_Total)\% Processor Time' -ErrorAction Stop).CounterSamples.CookedValue
    $DiagnosticData.cpuUsage = [math]::Round(($cpu1 + $cpu2) / 2, 1)
} catch {
    $DiagnosticData.cpuUsage = 0
}

# CPU Temperature (hanya jika tersedia)
try {
    $Temp = Get-CimInstance -Namespace "root\wmi" -ClassName MSAcpi_ThermalZoneTemperature -ErrorAction Stop
    $DiagnosticData.cpuTemperature = [math]::Round(($Temp.CurrentTemperature[0] - 2732) / 10, 1)
} catch {
    $DiagnosticData.cpuTemperature = 0
}

Write-Host " Selesai" -ForegroundColor Green

# ============================================================
# 3. RAM / MEMORY
# ============================================================
Write-Host "[3/10] Mengumpulkan data RAM..." -ForegroundColor Yellow -NoNewline

if ($OS) {
    $DiagnosticData.totalRAMMB = [math]::Round($OS.TotalVisibleMemorySize / 1024, 0)
    $DiagnosticData.availableRAMMB = [math]::Round($OS.FreePhysicalMemory / 1024, 0)
} else {
    $DiagnosticData.totalRAMMB = 0
    $DiagnosticData.availableRAMMB = 0
}

Write-Host " Selesai" -ForegroundColor Green

# ============================================================
# 4. STORAGE / DISK
# ============================================================
Write-Host "[4/10] Mengumpulkan data Storage..." -ForegroundColor Yellow -NoNewline

$Disks = Get-CimInstance -ClassName Win32_LogicalDisk -Filter "DriveType=3" -ErrorAction SilentlyContinue
$PhysicalDisks = Get-CimInstance -ClassName Win32_DiskDrive -ErrorAction SilentlyContinue

$TotalStorageGB = 0
$FreeStorageGB = 0
$DiskInfo = @()

foreach ($Disk in $Disks) {
    $TotalStorageGB += [math]::Round($Disk.Size / 1GB, 1)
    $FreeStorageGB += [math]::Round($Disk.FreeSpace / 1GB, 1)
    $DiskInfo += @{
        drive = $Disk.DeviceID
        totalGB = [math]::Round($Disk.Size / 1GB, 1)
        freeGB = [math]::Round($Disk.FreeSpace / 1GB, 1)
        usedPercent = if ($Disk.Size -gt 0) { [math]::Round((($Disk.Size - $Disk.FreeSpace) / $Disk.Size) * 100, 1) } else { 0 }
    }
}

$DiagnosticData.totalStorageGB = $TotalStorageGB
$DiagnosticData.freeStorageGB = $FreeStorageGB
$DiagnosticData.diskUsage = if ($DiskInfo.Count -gt 0) { ($DiskInfo | Measure-Object -Property usedPercent -Maximum).Maximum } else { 0 }

# Disk Type (SSD/HDD)
$DiagnosticData.diskType = "Unknown"
try {
    # Try WMI for disk media type
    $MediaType = Get-CimInstance -ClassName Win32_DiskDrive | Select-Object -First 1 -ExpandProperty MediaType
    if ($MediaType -match "SSD|Solid State") {
        $DiagnosticData.diskType = "SSD"
    } elseif ($MediaType -match "Fixed hard") {
        $DiagnosticData.diskType = "HDD"
    }
} catch {
    # Fallback: try using MSStorageDriver
    try {
        $DiskDrives = Get-CimInstance -ClassName MSStorageDriver_ATAPISmartData -Namespace "root\wmi" -ErrorAction Stop
        foreach ($dd in $DiskDrives) {
            $type = $dd | Get-CimInstance -ClassName Win32_DiskDrive -ErrorAction SilentlyContinue
            # We'll just mark as detected
        }
    } catch {
        # Cannot determine disk type
    }
}

# Disk Health (SMART - basic check)
$DiagnosticData.diskHealth = "OK"
$DiagnosticData.smartWarnings = @()

try {
    # Check for disk errors via Win32_DiskDrive
    foreach ($pd in $PhysicalDisks) {
        if ($pd.Status -ne "OK") {
            $DiagnosticData.diskHealth = $pd.Status
            $DiagnosticData.smartWarnings += "Disk status: $($pd.Status)"
        }
        if ($pd.MediaType -eq "Fixed hard disk media") {
            $DiagnosticData.diskType = "HDD"
        }
    }
} catch {
    # SMART not available
}

Write-Host " Selesai" -ForegroundColor Green

# ============================================================
# 5. GPU
# ============================================================
Write-Host "[5/10] Mengumpulkan data GPU..." -ForegroundColor Yellow -NoNewline

$GPU = Get-CimInstance -ClassName Win32_VideoController -ErrorAction SilentlyContinue | Select-Object -First 1

$DiagnosticData.gpuModel = if ($GPU.Name) { $GPU.Name.Trim() } else { "Unknown" }
$DiagnosticData.gpuDriver = if ($GPU.DriverVersion) { $GPU.DriverVersion } else { "Unknown" }
$DiagnosticData.gpuTemperature = 0

Write-Host " Selesai" -ForegroundColor Green

# ============================================================
# 6. JARINGAN / NETWORK
# ============================================================
Write-Host "[6/10] Mengumpulkan data Jaringan..." -ForegroundColor Yellow -NoNewline

# Latency (ping to Google DNS)
$DiagnosticData.networkLatency = 0
$DiagnosticData.packetLoss = 0

try {
    $PingResult = New-Object System.Net.NetworkInformation.Ping
    $Reply = $PingResult.Send("8.8.8.8", 3000)
    $DiagnosticData.networkLatency = $Reply.RoundtripTime

    # Check packet loss with multiple pings
    $Pings = 1..5 | ForEach-Object {
        try { $PingResult.Send("8.8.8.8", 2000) } catch { $null }
    }
    $FailedPings = ($Pings | Where-Object { $_ -eq $null -or $_.Status -ne "Success" }).Count
    $DiagnosticData.packetLoss = [math]::Round(($FailedPings / 5) * 100, 1)
} catch {
    $DiagnosticData.networkLatency = -1
    $DiagnosticData.packetLoss = -1
}

# DNS Status
$DiagnosticData.dnsStatus = "OK"
try {
    $DnsTest = Resolve-DnsName "google.com" -ErrorAction Stop
} catch {
    $DiagnosticData.dnsStatus = "FAIL"
}

Write-Host " Selesai" -ForegroundColor Green

# ============================================================
# 7. EVENT LOGS
# ============================================================
Write-Host "[7/10] Mengumpulkan Event Logs..." -ForegroundColor Yellow -NoNewline

$DiagnosticData.bsodHistory = @()
$DiagnosticData.criticalEvents = 0
$DiagnosticData.recentErrors = @()

try {
    # BSOD from System event log
    $BSODEvents = Get-EventLog -LogName System -Source "BugCheck" -ErrorAction SilentlyContinue |
        Select-Object -First 10 TimeGenerated, Message

    foreach ($bsod in $BSODEvents) {
        $code = ""
        if ($bsod.Message -match "0x([0-9a-fA-F]+)") {
            $code = $matches[1]
        }
        $DiagnosticData.bsodHistory += @{
            code = $code
            date = $bsod.TimeGenerated.ToString("yyyy-MM-dd HH:mm:ss")
        }
    }

    # Also check for bugcheck from kernel source
    $KernelBSOD = Get-WinEvent -FilterHashtable @{LogName="System"; ProviderName="Microsoft-Windows-Kernel-Power"; Id=41} -MaxEvents 5 -ErrorAction SilentlyContinue
    foreach ($event in $KernelBSOD) {
        $DiagnosticData.bsodHistory += @{
            code = "KERNEL_POWER_41"
            date = $event.TimeCreated.ToString("yyyy-MM-dd HH:mm:ss")
        }
    }

    # Critical events count (last 7 days)
    $SevenDaysAgo = (Get-Date).AddDays(-7)
    $CriticalCount = (Get-WinEvent -FilterHashtable @{LogName="System"; Level=1; StartTime=$SevenDaysAgo} -ErrorAction SilentlyContinue | Measure-Object).Count
    $DiagnosticData.criticalEvents = $CriticalCount

    # Recent error events (last 24 hours, top 10)
    $OneDayAgo = (Get-Date).AddDays(-1)
    $ErrorEvents = Get-WinEvent -FilterHashtable @{LogName="System"; Level=2; StartTime=$OneDayAgo} -MaxEvents 10 -ErrorAction SilentlyContinue |
        Select-Object TimeCreated, ProviderName, Message

    foreach ($err in $ErrorEvents) {
        $DiagnosticData.recentErrors += @{
            source = $err.ProviderName
            message = $err.Message.Substring(0, [Math]::Min(200, $err.Message.Length))
            date = $err.TimeCreated.ToString("yyyy-MM-dd HH:mm:ss")
        }
    }
} catch {
    Write-Host " (sebagian data tidak tersedia)" -ForegroundColor DarkYellow
}

Write-Host " Selesai" -ForegroundColor Green

# ============================================================
# 8. SERVICES & STARTUP
# ============================================================
Write-Host "[8/10] Mengumpulkan data Services & Startup..." -ForegroundColor Yellow -NoNewline

$DiagnosticData.importantServices = @()

# Check important services
$ImportantServiceNames = @(
    @{ Name = "Windows Update"; Service = "wuauserv" },
    @{ Name = "Security Center"; Service = "wscsvc" },
    @{ Name = "DNS Client"; Service = "Dnscache" },
    @{ Name = "SysMain"; Service = "SysMain" },
    @{ Name = "Windows Defender"; Service = "WinDefend" },
    @{ Name = "Remote Procedure Call"; Service = "RpcSs" },
    @{ Name = "Plug and Play"; Service = "PlugPlay" }
)

foreach ($svc in $ImportantServiceNames) {
    $Service = Get-Service -Name $svc.Service -ErrorAction SilentlyContinue
    if ($Service) {
        $DiagnosticData.importantServices += @{
            name = $svc.Name
            status = $Service.Status.ToString()
        }
    }
}

# Startup programs
$DiagnosticData.startupPrograms = @()
try {
    # Windows 10/11 startup apps via CIM
    $StartupApps = Get-CimInstance -ClassName Win32_StartupCommand -ErrorAction SilentlyContinue
    foreach ($app in $StartupApps) {
        $DiagnosticData.startupPrograms += @{
            name = $app.Name
            enabled = $true
        }
    }

    # Also check Task Scheduler startup tasks
    $ScheduledTasks = Get-ScheduledTask -ErrorAction SilentlyContinue |
        Where-Object { $_.State -eq "Ready" -and $_.Triggers -and $_.Triggers[0].LogonType -eq 1 } |
        Select-Object -First 20

    foreach ($task in $ScheduledTasks) {
        $DiagnosticData.startupPrograms += @{
            name = $task.TaskName
            enabled = $true
        }
    }
} catch {
    # Cannot read startup programs
}

Write-Host " Selesai" -ForegroundColor Green

# ============================================================
# 9. ANTIVIRUS & SECURITY
# ============================================================
Write-Host "[9/10] Mengumpulkan data Keamanan..." -ForegroundColor Yellow -NoNewline

$DiagnosticData.antivirusEnabled = $false

try {
    $AV = Get-CimInstance -Namespace "root\SecurityCenter2" -ClassName AntiVirusProduct -ErrorAction SilentlyContinue
    if ($AV) {
        $DiagnosticData.antivirusEnabled = $true
    }
} catch {
    $DiagnosticData.antivirusEnabled = $false
}

# Windows Update status
$DiagnosticData.windowsUpdateStatus = "Unknown"
try {
    $UpdateSession = New-Object -ComObject Microsoft.Update.Session -ErrorAction Stop
    $UpdateSearcher = $UpdateSession.CreateUpdateSearcher()
    $PendingUpdates = $UpdateSearcher.Search("IsInstalled=0 and Type='Software'")
    $DiagnosticData.windowsUpdateStatus = if ($PendingUpdates.Updates.Count -eq 0) { "Up to date" } else { "$($PendingUpdates.Updates.Count) updates pending" }
} catch {
    $DiagnosticData.windowsUpdateStatus = "Cannot check"
}

Write-Host " Selesai" -ForegroundColor Green

# ============================================================
# 10. SFC & DISM (MEMERLUKAN ADMIN)
# ============================================================
Write-Host "[10/10] Memeriksa Integritas Sistem..." -ForegroundColor Yellow -NoNewline

$DiagnosticData.sfcResult = "Not checked (requires admin)"
$DiagnosticData.dismHealth = "Not checked (requires admin)"

# Check if running as admin
$IsAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if ($IsAdmin) {
    # SFC Check (quick scan result only)
    $DiagnosticData.sfcResult = "Scan not performed (use sfc /scannow manually)"

    # DISM Check
    $DiagnosticData.dismHealth = "Check not performed (use DISM /Online /Check-Health manually)"
}

Write-Host " Selesai" -ForegroundColor Green

# ============================================================
# OUTPUT
# ============================================================
Write-Host ""
Write-Host "Menyimpan hasil ke: $OutputFile" -ForegroundColor Cyan

$JSON = $DiagnosticData | ConvertTo-Json -Depth 5 -Compress:$false
$JSON | Out-File -FilePath $OutputFile -Encoding UTF8 -Force

$fileSize = (Get-Item $OutputFile).Length
Write-Host "File tersimpan! Ukuran: $([math]::Round($fileSize / 1KB, 1)) KB" -ForegroundColor Green
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  LANGKAH SELANJUTNYA:" -ForegroundColor Cyan
Write-Host "  1. Buka PC Diagnostic Pro di browser" -ForegroundColor White
Write-Host "  2. Klik 'Diagnosa Baru'" -ForegroundColor White
Write-Host "  3. Upload file: $OutputFile" -ForegroundColor White
Write-Host "  4. Atau paste isi file JSON ke form" -ForegroundColor White
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Ask to open the file
$openFile = Read-Host "Buka file JSON di Notepad? (Y/N)"
if ($openFile -eq "Y" -or $openFile -eq "y") {
    notepad.exe $OutputFile
}
