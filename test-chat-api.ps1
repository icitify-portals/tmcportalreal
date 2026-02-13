try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/chat" -Method Post -ContentType "application/json" -Body '{"messages":[{"role":"user","content":"Hello"}],"provider":"deepseek"}'
    Write-Host "Success:"
    Write-Host $response.Content
} catch {
    Write-Host "Error:"
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    $body = $reader.ReadToEnd()
    Write-Host $body
}
