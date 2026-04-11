from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from orchestrator.agent import run_analysis_workflow

app = FastAPI(title="Kisaan-Sense Orchestrator")

class AnalysisRequest(BaseModel):
    image_url: str
    latitude: float
    longitude: float
    preferred_language: str

@app.post("/analyze")
def analyze_crop(request: AnalysisRequest):
    """
    Given an image URL, GPS coordinates, and a preferred language, returns a localized, 
    hyper-specific agricultural advice payload.
    """
    result = run_analysis_workflow(
        image_url=request.image_url,
        lat=request.latitude,
        lon=request.longitude,
        preferred_language=request.preferred_language
    )
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
        
    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
