# Test Docker run command as specified in contest requirements
# This creates a test credentials directory and runs the container

# Create test credentials directory
New-Item -ItemType Directory -Force -Path "C:\temp\test-credentials"

# Create a dummy credentials file for testing
@"
{
  "type": "service_account",
  "project_id": "test-project"
}
"@ | Out-File -FilePath "C:\temp\test-credentials\adbe-gcp.json" -Encoding UTF8

# Run the Docker container with contest requirements
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

Write-Host "Container should be accessible at http://localhost:8080"
