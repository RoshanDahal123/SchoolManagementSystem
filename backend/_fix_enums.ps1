$enumMappings = @{
    'UserRole' = 'SchoolManagementSystem.Domain.Features.Auth.Enums'
    'AttendanceStatus' = 'SchoolManagementSystem.Domain.Features.Attendance.Enums'
    'EnrollmentStatus' = 'SchoolManagementSystem.Domain.Features.StudentEnrollments.Enums'
    'SubmissionStatus' = 'SchoolManagementSystem.Domain.Features.Coursework.Enums'
}

$buildOutput = Get-Content "_build_final.txt"
$filesToFix = @{}

foreach ($line in $buildOutput) {
    if ($line -match '([^(]+)\(\d+,\d+\): error CS0103: The name ''(\w+)''') {
        $file = $matches[1]
        $type = $matches[2]
        
        if ($enumMappings.ContainsKey($type)) {
            if (-not $filesToFix.ContainsKey($file)) {
                $filesToFix[$file] = @()
            }
            if ($filesToFix[$file] -notcontains $type) {
                $filesToFix[$file] += $type
            }
        }
    }
}

foreach ($file in $filesToFix.Keys) {
    Write-Host "Fixing $file ..." -ForegroundColor Cyan
    
    $content = Get-Content $file -Raw
    $lines = $content -split "`r`n"
    
    $lastUsingIndex = -1
    for ($i = 0; $i -lt $lines.Length; $i++) {
        if ($lines[$i] -match '^using ') {
            $lastUsingIndex = $i
        }
        elseif ($lines[$i] -match '^namespace ') {
            break
        }
    }
    
    if ($lastUsingIndex -ge 0) {
        $newUsings = @()
        foreach ($type in $filesToFix[$file]) {
            $ns = $enumMappings[$type]
            $usingLine = "using $ns;"
            
            $alreadyExists = $false
            foreach ($line in $lines[0..$lastUsingIndex]) {
                if ($line -eq $usingLine) {
                    $alreadyExists = $true
                    break
                }
            }
            
            if (-not $alreadyExists) {
                $newUsings += $usingLine
            }
        }
        
        if ($newUsings.Count -gt 0) {
            $lines = $lines[0..$lastUsingIndex] + $newUsings + $lines[($lastUsingIndex+1)..($lines.Length-1)]
            $content = $lines -join "`r`n"
            [System.IO.File]::WriteAllText($file, $content)
            Write-Host "  Added $($newUsings.Count) using directive(s)" -ForegroundColor Green
        }
    }
}

Write-Host "`nFixed $($filesToFix.Count) files" -ForegroundColor Green
