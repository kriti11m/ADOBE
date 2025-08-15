# Enhanced Embeddings Setup Guide

## Option 1: Ollama (Recommended - Free, Local, High Quality)

### Installation:
1. **Download Ollama**: Visit https://ollama.ai/download
2. **Install Ollama** for your operating system
3. **Start Ollama** (runs as a service on port 11434)

### Model Installation:
```bash
# Install the embedding model (1.5GB)
ollama pull nomic-embed-text

# Or for better quality (2.3GB)
ollama pull mxbai-embed-large
```

### Verify Installation:
```bash
# Test if Ollama is running
curl http://localhost:11434/api/tags

# Test embeddings
curl http://localhost:11434/api/embeddings -d '{
  "model": "nomic-embed-text",
  "prompt": "test text"
}'
```

## Option 2: OpenAI API (Highest Quality, Costs ~$0.13/1M tokens)

### Setup:
1. Get API key from: https://platform.openai.com/api-keys
2. Set environment variable:
   ```bash
   export OPENAI_API_KEY=your_key_here
   ```
3. Update `.env.embeddings`:
   ```
   EMBEDDING_API_TYPE=openai
   ```

## Option 3: Cohere API (Good Quality, ~$0.10/1M tokens)

### Setup:
1. Get API key from: https://dashboard.cohere.ai/api-keys
2. Set environment variable:
   ```bash
   export COHERE_API_KEY=your_key_here
   ```
3. Update `.env.embeddings`:
   ```
   EMBEDDING_API_TYPE=cohere
   ```

## Configuration:
Copy `.env.embeddings` to `.env` or set environment variables:
```bash
cp .env.embeddings .env
```

## Model Comparison:

| Model | Size | Quality | Speed | Cost |
|-------|------|---------|-------|------|
| SentenceTransformer (fallback) | 90MB | Good | Fast | Free |
| nomic-embed-text (Ollama) | 1.5GB | Very Good | Fast | Free |
| mxbai-embed-large (Ollama) | 2.3GB | Excellent | Medium | Free |
| OpenAI text-embedding-3-large | API | Best | Medium | $0.13/1M |
| Cohere embed-english-v3.0 | API | Excellent | Fast | $0.10/1M |

## Testing:
After setup, restart your backend and test the text selection feature. You should see improved relevance in related sections!
