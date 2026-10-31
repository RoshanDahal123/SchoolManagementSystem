$mappings = @{
    'User' = 'SchoolManagementSystem.Domain.Features.Auth.Entities'
    'UserRole' = 'SchoolManagementSystem.Domain.Features.Auth.Enums'
    'AttendanceStatus' = 'SchoolManagementSystem.Domain.Features.Attendance.Enums'
    'EnrollmentStatus' = 'SchoolManagementSystem.Domain.Features.StudentEnrollments.Enums'
    'SubmissionStatus' = 'SchoolManagementSystem.Domain.Features.Coursework.Enums'
    'DomainException' = 'SchoolManagementSystem.Domain.Features.Shared.Exceptions'
    'JwtSettings' = 'SchoolManagementSystem.Infrastructure.Features.Auth.Settings'
    'EmailSettings' = 'SchoolManagementSystem.Infrastructure.Features.Email.Settings'
    'FileStorageSettings' = 'SchoolManagementSystem.Infrastructure.Features.Storage.Settings'
    'JwtTokenService' = 'SchoolManagementSystem.Infrastructure.Features.Auth.Services'
    'PasswordHasher' = 'SchoolManagementSystem.Infrastructure.Features.Auth.Services'
    'MailKitEmailService' = 'SchoolManagementSystem.Infrastructure.Features.Email.Services'
    'NotificationService' = 'SchoolManagementSystem.Infrastructure.Features.Notifications.Services'
    'LocalFileStorageService' = 'SchoolManagementSystem.Infrastructure.Features.Storage.Services'
    'UserRepository' = 'SchoolManagementSystem.Infrastructure.Features.Auth.Persistence.Repositories'
    'RefreshTokenRepository' = 'SchoolManagementSystem.Infrastructure.Features.Auth.Persistence.Repositories'
    'AccountSetupTokenRepository' = 'SchoolManagementSystem.Infrastructure.Features.Auth.Persistence.Repositories'
    'StudentRepository' = 'SchoolManagementSystem.Infrastructure.Features.Students.Persistence.Repositories'
    'TeacherRepository' = 'SchoolManagementSystem.Infrastructure.Features.Teachers.Persistence.Repositories'
    'TeacherSubjectRepository' = 'SchoolManagementSystem.Infrastructure.Features.Teachers.Persistence.Repositories'
    'AcademicYearRepository' = 'SchoolManagementSystem.Infrastructure.Features.AcademicStructure.Persistence.Repositories'
    'GradeLevelRepository' = 'SchoolManagementSystem.Infrastructure.Features.AcademicStructure.Persistence.Repositories'
    'SectionRepository' = 'SchoolManagementSystem.Infrastructure.Features.AcademicStructure.Persistence.Repositories'
    'SubjectRepository' = 'SchoolManagementSystem.Infrastructure.Features.AcademicStructure.Persistence.Repositories'
    'ClassSubjectRepository' = 'SchoolManagementSystem.Infrastructure.Features.AcademicStructure.Persistence.Repositories'
    'ClassSubjectTeacherRepository' = 'SchoolManagementSystem.Infrastructure.Features.AcademicStructure.Persistence.Repositories'
    'SectionHomeroomTeacherRepository' = 'SchoolManagementSystem.Infrastructure.Features.AcademicStructure.Persistence.Repositories'
    'StudentEnrollmentRepository' = 'SchoolManagementSystem.Infrastructure.Features.StudentEnrollments.Persistence.Repositories'
    'AttendanceRepository' = 'SchoolManagementSystem.Infrastructure.Features.Attendance.Persistence.Repositories'
    'AnnouncementRepository' = 'SchoolManagementSystem.Infrastructure.Features.Announcements.Persistence.Repositories'
    'CourseworkRepository' = 'SchoolManagementSystem.Infrastructure.Features.Coursework.Persistence.Repositories'
    'CourseworkSubmissionRepository' = 'SchoolManagementSystem.Infrastructure.Features.Coursework.Persistence.Repositories'
    'DashboardRepository' = 'SchoolManagementSystem.Infrastructure.Features.Dashboard.Persistence.Repositories'
    'AdminSeeder' = 'SchoolManagementSystem.Infrastructure.Features.Auth.Seeders'
}

$buildOutput = Get-Content "_build_final.txt"
$filesToFix = @{}

foreach ($line in $buildOutput) {
    if ($line -match '([^(]+)\(\d+,\d+\): error CS0246: The type or namespace name ''(\w+)''') {
        $file = $matches[1]
        $type = $matches[2]
        
        if ($mappings.ContainsKey($type)) {
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
            $ns = $mappings[$type]
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
