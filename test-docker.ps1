# Docker Test Script - Run this to test your container
# Make sure you're in the C:\ADOBE directory

# Step 1: Create test credentials directory
Write-Host "Creating test credentials directory..."
New-Item -ItemType Directory -Force -Path "C:\temp\test-credentials" | Out-Null

# Step 2: Create dummy credentials file (for testing without real keys)
$dummyCredentials = @"
{
  "type": "service_account",
  "project_id": "test-project",
  "client_email": "test@test.iam.gserviceaccount.com"
}
"@
$dummyCredentials | Out-File -FilePath "C:\temp\test-credentials\adbe-gcp.json" -Encoding UTF8

# Step 3: Run the container exactly as contest specifies
Write-Host "Starting Docker container with contest requirements..."
Write-Host "Container will be accessible at: http://localhost:8080" -ForegroundColor Green

docker run --rm `
  -v "C:\temp\test-credentials:/credentials" `
  -e ADOBE_EMBED_API_KEY="test_embed_key" `
  -e LLM_PROVIDER="gemini" `
  -e GOOGLE_APPLICATION_CREDENTIALS="/credentials/adbe-gcp.json" `
  -e GEMINI_MODEL="gemini-2.5-flash" `
  -e TTS_PROVIDER="azure" `
  -e AZURE_TTS_KEY="test_tts_key" `
  -e AZURE_TTS_ENDPOINT="test_tts_endpoint" `
  -p 8080:8080 `
  yourimageidentifier

Write-Host "Container stopped." -ForegroundColor Yellow
