"""
Minimal test to verify routers are working
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Test minimal imports
try:
    from app.documents.router import router as documents_router
    print("✅ Documents router OK")
except Exception as e:
    print(f"❌ Documents router: {e}")

try:
    from app.part1a.router import router as part1a_router  
    print("✅ Part1A router OK")
except Exception as e:
    print(f"❌ Part1A router: {e}")

app = FastAPI(title="Test App")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Test health endpoint
@app.get("/health")
async def health():
    return {"status": "healthy", "message": "Test server running"}

# Try to include one router at a time
try:
    app.include_router(documents_router)
    print("✅ Documents router included")
except Exception as e:
    print(f"❌ Documents router include error: {e}")

@app.get("/")
async def root():
    return {"message": "Test server running"}

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.getenv("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
