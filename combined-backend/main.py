"""
Combined FastAPI Backend
Integrates PDF Structure Extractor (Part 1A) and Document Analysis System (Part 1B)
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
import uvicorn

# Import routers from all parts
from app.part1a.router import router as part1a_router
from app.part1b.router import router as part1b_router
from app.documents.router import router as documents_router

# Create FastAPI application
app = FastAPI(
    title="Combined PDF Processing Backend with AI Insights",
    description="A comprehensive backend that integrates PDF structure extraction, document analysis, and AI-powered insights generation using Gemini 2.5 Flash",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(part1a_router)
app.include_router(part1b_router)
app.include_router(documents_router)

@app.get("/", response_class=HTMLResponse)
async def root():
    return """
    <html>
        <body>
            <h1>Combined PDF Processing Backend</h1>
            <p>Welcome to the combined PDF processing backend with AI insights!</p>
            <ul>
                <li><a href="/docs">API Documentation (Swagger)</a></li>
                <li><a href="/redoc">API Documentation (ReDoc)</a></li>
            </ul>
            <h2>Available Services:</h2>
            <ul>
                <li><strong>Part 1A:</strong> PDF Structure Extraction (prefix: /part1a)</li>
                <li><strong>Part 1B:</strong> Document Analysis System (prefix: /part1b)</li>
                <li><strong>Profiles:</strong> User Profile Management (prefix: /profiles)</li>
                <li><strong>Collections:</strong> Profile-based PDF Collection Management (prefix: /collections)</li>
            </ul>
        </body>
    </html>
    """

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
