Add-Type -AssemblyName System.Drawing

$resDir = "android/app/src/main/res"

$densities = @(
    @{ name = "mdpi"; size = 48; fgSize = 108 },
    @{ name = "hdpi"; size = 72; fgSize = 162 },
    @{ name = "xhdpi"; size = 96; fgSize = 216 },
    @{ name = "xxhdpi"; size = 144; fgSize = 324 },
    @{ name = "xxxhdpi"; size = 192; fgSize = 432 }
)

function Draw-RoundedRectangle($graphics, $brush, $x, $y, $w, $h, $r) {
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $d = $r * 2
    if ($d -gt $w) { $d = $w }
    if ($d -gt $h) { $d = $h }
    
    $path.AddArc($x, $y, $d, $d, 180, 90)
    $path.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
    $path.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
    $path.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
    $path.CloseFigure()
    
    $graphics.FillPath($brush, $path)
    $path.Dispose()
}

function Draw-HeeyakuLogo($graphics, $cx, $cy, $targetWidth) {
    # Base dimensions from HeeyakuLogo.tsx:
    # Content width: 48, content height: 38.25
    $scale = $targetWidth / 48.0
    $contentHeight = 38.25 * $scale
    $barHeight = 9.75 * $scale
    $barRadius = 3.5 * $scale
    $dotRadius = 4.5 * $scale

    $x0 = $cx - ($targetWidth / 2.0)
    $y0 = $cy - ($contentHeight / 2.0)

    $whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 255, 255))
    $blueBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 0x25, 0x63, 0xEB))

    # 1. Top Bar: width 48 * scale, height barHeight
    Draw-RoundedRectangle $graphics $whiteBrush $x0 $y0 ($targetWidth) ($barHeight) ($barRadius)

    # 2. Middle Bar: width 30.75 * scale, height barHeight, right-aligned
    $midWidth = 30.75 * $scale
    $midX = $x0 + $targetWidth - $midWidth
    $gap = ($contentHeight - (3 * $barHeight)) / 2.0
    $midY = $y0 + $barHeight + $gap
    Draw-RoundedRectangle $graphics $whiteBrush $midX $midY $midWidth $barHeight ($barRadius)

    # 3. Bottom Row:
    $botY = $y0 + (2 * $barHeight) + (2 * $gap)
    # Accent Dot:
    $dotDiameter = $dotRadius * 2.0
    $dotX = $x0 + (1.5 * $scale)
    $dotY = $botY + (($barHeight - $dotDiameter) / 2.0)
    $graphics.FillEllipse($blueBrush, [float]$dotX, [float]$dotY, [float]$dotDiameter, [float]$dotDiameter)

    # Short Bar: width 18.75 * scale, right-aligned
    $shortWidth = 18.75 * $scale
    $shortX = $x0 + $targetWidth - $shortWidth
    Draw-RoundedRectangle $graphics $whiteBrush $shortX $botY $shortWidth $barHeight ($barRadius)

    $whiteBrush.Dispose()
    $blueBrush.Dispose()
}

$navyColor = [System.Drawing.Color]::FromArgb(255, 0x0B, 0x1F, 0x33)
$navyBrush = New-Object System.Drawing.SolidBrush($navyColor)

foreach ($d in $densities) {
    $size = $d.size
    $folder = Join-Path $resDir "mipmap-$($d.name)"
    if (-not (Test-Path $folder)) {
        New-Item -ItemType Directory -Path $folder -Force | Out-Null
    }

    # =========================================================================
    # A. Legacy Rounded Square: ic_launcher.png
    # =========================================================================
    $bmpSquare = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $gSquare = [System.Drawing.Graphics]::FromImage($bmpSquare)
    $gSquare.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $gSquare.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $gSquare.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $gSquare.Clear([System.Drawing.Color]::Transparent)

    # Background squircle / rounded rectangle (22% corner radius)
    $bgRadius = [float]($size * 0.22)
    Draw-RoundedRectangle $gSquare $navyBrush 0 0 $size $size $bgRadius

    # Draw logo centered, logo width ~ 58% of canvas
    $logoWidth = [float]($size * 0.58)
    Draw-HeeyakuLogo $gSquare ($size / 2.0) ($size / 2.0) $logoWidth

    $squarePath = Join-Path $folder "ic_launcher.png"
    $bmpSquare.Save($squarePath, [System.Drawing.Imaging.ImageFormat]::Png)
    $gSquare.Dispose()
    $bmpSquare.Dispose()

    # =========================================================================
    # B. Legacy Circular: ic_launcher_round.png
    # =========================================================================
    $bmpRound = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $gRound = [System.Drawing.Graphics]::FromImage($bmpRound)
    $gRound.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $gRound.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $gRound.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $gRound.Clear([System.Drawing.Color]::Transparent)

    # Background circle
    $gRound.FillEllipse($navyBrush, 0, 0, $size, $size)

    # Draw logo centered, logo width ~ 54% of canvas so it stays inside circle comfortably
    $logoWidthRound = [float]($size * 0.54)
    Draw-HeeyakuLogo $gRound ($size / 2.0) ($size / 2.0) $logoWidthRound

    $roundPath = Join-Path $folder "ic_launcher_round.png"
    $bmpRound.Save($roundPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $gRound.Dispose()
    $bmpRound.Dispose()

    # =========================================================================
    # C. Adaptive Foreground PNG: ic_launcher_foreground.png
    # =========================================================================
    $fgSize = $d.fgSize
    $bmpFg = New-Object System.Drawing.Bitmap($fgSize, $fgSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $gFg = [System.Drawing.Graphics]::FromImage($bmpFg)
    $gFg.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $gFg.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $gFg.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $gFg.Clear([System.Drawing.Color]::Transparent)

    # In Android adaptive icons, the 108dp canvas has safe zone diameter 66-72dp.
    # 54 / 108 = 50% of canvas width
    $fgLogoWidth = [float]($fgSize * 0.44)
    Draw-HeeyakuLogo $gFg ($fgSize / 2.0) ($fgSize / 2.0) $fgLogoWidth

    $fgPath = Join-Path $folder "ic_launcher_foreground.png"
    $bmpFg.Save($fgPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $gFg.Dispose()
    $bmpFg.Dispose()

    Write-Host "Generated icons for $folder"
}

# =========================================================================
# D. Play Store 512x512 Master Icon
# =========================================================================
$bmpMaster = New-Object System.Drawing.Bitmap(512, 512, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$gMaster = [System.Drawing.Graphics]::FromImage($bmpMaster)
$gMaster.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$gMaster.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$gMaster.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$gMaster.Clear([System.Drawing.Color]::Transparent)

# Master squircle
Draw-RoundedRectangle $gMaster $navyBrush 0 0 512 512 (512 * 0.22)
Draw-HeeyakuLogo $gMaster 256 256 (512 * 0.58)

$masterPath = Join-Path $resDir "drawable/ic_launcher_master.png"
$bmpMaster.Save($masterPath, [System.Drawing.Imaging.ImageFormat]::Png)
$gMaster.Dispose()
$bmpMaster.Dispose()
Write-Host "Generated Master icon at $masterPath"

$navyBrush.Dispose()
