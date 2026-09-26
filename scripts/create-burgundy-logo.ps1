Add-Type -AssemblyName System.Drawing
$width = 512
$height = 512
$bmp = New-Object System.Drawing.Bitmap($width, $height)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

# Velvet Burgundy rich radial gradient / background (#721323 center, #4A0B16 outer)
$rect = New-Object System.Drawing.Rectangle(0, 0, $width, $height)
$c1 = [System.Drawing.ColorTranslator]::FromHtml("#8A1C2E")
$c2 = [System.Drawing.ColorTranslator]::FromHtml("#4A0B16")
$gradBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $c1, $c2, 45)
$g.FillRectangle($gradBrush, $rect)

# Draw the website logo centered
$logo = [System.Drawing.Image]::FromFile("C:\Users\LENOVO\shop.at-1\public\logo.png")
$size = 420
$x = [int](($width - $size) / 2)
$y = [int](($height - $size) / 2)
$g.DrawImage($logo, $x, $y, $size, $size)

$outPath = "C:\Users\LENOVO\shop.at-1\public\discord_logo_burgundy.png"
$bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)

$logo.Dispose()
$gradBrush.Dispose()
$g.Dispose()
$bmp.Dispose()

Write-Host "Created $outPath successfully"
