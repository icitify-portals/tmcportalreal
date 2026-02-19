
# Deployment Script for TMC Portal
$ServerIP = "147.93.84.90"
$User = "deploy"
$RemotePath = "/var/www/tmcportal"

Write-Host "Connecting to $User@$ServerIP..."

# Commands to execute on the server
$Commands = "cd $RemotePath && git pull origin main && docker-compose down && docker-compose up -d --build && docker image prune -f"

# Execute SSH command
# Note: This will prompt for the password (Deploy123@) if plink or key-based auth is not set up.
ssh -t $User@$ServerIP $Commands

Write-Host "Deployment command finished."
