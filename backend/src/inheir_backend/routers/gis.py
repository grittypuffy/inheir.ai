from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any
import json
import os
import logging
from openai import AzureOpenAI
from ..config import AppConfig

router = APIRouter(tags=["GIS Analysis"])

config: AppConfig = AppConfig()

class LocationRequest(BaseModel):
    address: str

class GISResponse(BaseModel):
    property_buying_risk: float
    property_renting_risk: float
    flood_risk: float
    crime_rate: float
    air_quality_index: float
    proximity_to_amenities: float
    transportation_score: float
    neighborhood_rating: float
    environmental_hazards: float
    economic_growth_potential: float

gis_prompt = f"""Analyze the following address for real estate investment potential and return a JSON response with the following metrics:
Address: {request.address} 
Please provide a detailed analysis and return a JSON object with the following keys and their values (all values should be between 0 and 1):
- property_buying_risk (0-1, where 1 is highest risk)
- property_renting_risk (0-1, where 1 is highest risk)
- flood_risk (0-1, where 1 is highest risk)
- crime_rate (0-1, where 1 is highest risk)
- air_quality_index (0-1, where 1 is best)
- proximity_to_amenities (0-1, where 1 is best)
- transportation_score (0-1, where 1 is best)
- neighborhood_rating (0-1, where 1 is best)
- environmental_hazards (0-1, where 1 is highest risk)
- economic_growth_potential (0-1, where 1 is highest potential)

Return ONLY the JSON object, without any explanation or formatting. No surrounding text, no markdown."""


@router.post("/analyze", response_model=GISResponse)
async def analyze_location(request: LocationRequest) -> Dict[str, Any]:
    try:
        client = config.llm

        prompt = f"""Analyze the following address for real estate investment potential and return a JSON response with the following metrics:
        Address: {request.address}
        
        Please provide a detailed analysis and return a JSON object with the following keys and their values (all values should be between 0 and 1):
        - property_buying_risk (0-1, where 1 is highest risk)
        - property_renting_risk (0-1, where 1 is highest risk)
        - flood_risk (0-1, where 1 is highest risk)
        - crime_rate (0-1, where 1 is highest risk)
        - air_quality_index (0-1, where 1 is best)
        - proximity_to_amenities (0-1, where 1 is best)
        - transportation_score (0-1, where 1 is best)
        - neighborhood_rating (0-1, where 1 is best)
        - environmental_hazards (0-1, where 1 is highest risk)
        - economic_growth_potential (0-1, where 1 is highest potential)
        
        Return ONLY the JSON object, without any explanation or formatting. No surrounding text, no markdown."""

        response = client.chat.completions.create(
            model=config.env.azure_openai_deployment,
            messages=[
                {"role": "system", "content": "You are a real estate GIS analysis expert. Provide accurate and detailed analysis of locations."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=500
        )
        logging.info(response)
        # Extract the JSON response from the model's output
        analysis_result = response.choices[0].message.content
        print(analysis_result)
        # Parse the JSON string into a dictionary
        result_dict = json.loads(analysis_result)
        
        return result_dict

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing location: {str(e)}") 