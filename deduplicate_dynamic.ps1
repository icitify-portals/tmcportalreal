$pages = Get-ChildItem -Path "app" -Recurse -Filter "page.tsx"
foreach ($page in $pages) {
    try {
        $content = [System.IO.File]::ReadAllText($page.FullName)
        $lines = $content -split "\r?\n"
        $count = ($lines | Where-Object { $_ -match "export const dynamic =" }).Count
        if ($count -gt 1) {
            Write-Output "Fixing duplicates in: $($page.FullName)"
            $found = $false
            $newLines = @()
            foreach ($line in $lines) {
                if ($line -match "export const dynamic =") {
                    if (-not $found) {
                        $newLines += "export const dynamic = 'force-dynamic'"
                        $found = $true
                    }
                } else {
                    $newLines += $line
                }
            }
            $newContent = $newLines -join "`r`n"
            [System.IO.File]::WriteAllText($page.FullName, $newContent)
        }
    } catch {
        Write-Warning "Failed to process $($page.FullName)"
    }
}
