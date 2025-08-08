"""
Combined FastAPI Backend
Integrates PDF Structure Extractor (Part 1A) and Document Analysis System (Part 1B)
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
import uvicorn

# Import routers from both parts
from app.part1a.router import router as part1a_router
from app.part1b.router import router as part1b_router

# Create FastAPI application
app = FastAPI(
    title="Combined PDF Processing Backend",
    description="A combined backend that integrates PDF structure extraction and document analysis capabilities",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(part1a_router)
app.include_router(part1b_router)

@app.get("/", response_class=HTMLResponse)
async def root():
    """Root endpoint with service information"""
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Combined PDF Processing Backend</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; background-color: #f5f5f5; }
            .container { background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            h1 { color: #333; border-bottom: 2px solid #007acc; padding-bottom: 10px; }
            h2 { color: #555; margin-top: 30px; }
            .service { background-color: #f8f9fa; padding: 15px; margin: 10px 0; border-left: 4px solid #007acc; }
            .endpoint { background-color: #e9ecef; padding: 10px; margin: 5px 0; font-family: monospace; }
            a { color: #007acc; text-decoration: none; }
            a:hover { text-decoration: underline; }
            .features { list-style-type: none; padding-left: 0; }
            .features li { background-color: #e7f3ff; margin: 5px 0; padding: 5px 10px; border-radius: 5px; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🚀 Combined PDF Processing Backend</h1>
            <p>Welcome to the combined backend that integrates two powerful PDF processing services:</p>
            
            <div class="service">
                <h2>📄 Part 1A: PDF Structure Extractor</h2>
                <p><strong>Purpose:</strong> Extracts title and headings (H1, H2, H3) from PDF files with page numbers</p>
                <ul class="features">
                    <li>✨ Multilingual support</li>
                    <li>🔍 Font analysis and spatial reasoning</li>
                    <li>🚀 Offline processing with minimal memory usage</li>
                    <li>📊 Content pattern recognition</li>
                </ul>
                <div class="endpoint">POST /part1a/extract - Extract PDF structure</div>
                <div class="endpoint">GET /part1a/info - Service information</div>
            </div>
            
            <div class="service">
                <h2>🧠 Part 1B: Document Analysis System</h2>
                <p><strong>Purpose:</strong> Extracts and ranks relevant sections from PDF documents based on user personas and tasks</p>
                <ul class="features">
                    <li>🎯 Persona-based relevance ranking</li>
                    <li>🔍 Semantic analysis using sentence transformers</li>
                    <li>📖 Section detection and extraction</li>
                    <li>📊 Multi-document processing</li>
                </ul>
                <div class="endpoint">POST /part1b/analyze - Analyze multiple documents</div>
                <div class="endpoint">POST /part1b/analyze-single - Analyze single document</div>
                <div class="endpoint">GET /part1b/sample-personas - Get sample personas</div>
            </div>
            
            <h2>📚 API Documentation</h2>
            <p>
                <a href="/docs">📖 Interactive API Documentation (Swagger UI)</a><br>
                <a href="/redoc">📋 Alternative Documentation (ReDoc)</a>
            </p>
            
            <h2>🔧 Quick Start</h2>
            <p>
                <strong>Part 1A Example:</strong><br>
                <code>curl -X POST "/part1a/extract" -F "file=@your_document.pdf"</code>
            </p>
            <p>
                <strong>Part 1B Example:</strong><br>
                <code>curl -X POST "/part1b/analyze-single" -F "file=@your_document.pdf" -F "persona=Researcher" -F "job=Extract key findings"</code>
            </p>
            
            <h2>🏥 Health Checks</h2>
            <div class="endpoint">GET /part1a/health - Part 1A health status</div>
            <div class="endpoint">GET /part1b/health - Part 1B health status</div>
            <div class="endpoint">GET /health - Combined health status</div>
        </div>
    </body>
    </html>
    """
    return html_content

@app.get("/health")
async def health_check():
    """Combined health check endpoint"""
    try:
        # You could add more sophisticated health checks here
        return {
            "status": "healthy",
            "services": {
                "part1a": "PDF Structure Extractor - Ready",
                "part1b": "Document Analysis System - Ready"
            },
            "message": "All services are operational"
        }
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Service unhealthy: {str(e)}")

@app.get("/info")
async def get_combined_info():
    """Get information about all services"""
    return {
        "application": "Combined PDF Processing Backend",
        "version": "1.0.0",
        "services": {
            "part1a": {
                "name": "PDF Structure Extractor",
                "endpoint": "/part1a",
                "description": "Extracts title and headings from PDF files"
            },
            "part1b": {
                "name": "Document Analysis System", 
                "endpoint": "/part1b",
                "description": "Analyzes and ranks document sections based on user needs"
            }
        },
        "documentation": {
            "swagger": "/docs",
            "redoc": "/redoc"
        }
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
