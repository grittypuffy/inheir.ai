from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional
import json
import os
import logging
from openai import AzureOpenAI
from ..config import AppConfig
from geopy.geocoders import OpenCage
from geopy.exc import GeocoderTimedOut, GeocoderServiceError
from tenacity import retry, stop_after_attempt, wait_exponential

router = APIRouter(tags=["GIS Analysis"])

config: AppConfig = AppConfig()

class LocationRequest(BaseModel):
    address: str

class Coordinates(BaseModel):
    latitude: float
    longitude: float

class GISResponse(BaseModel):
    coordinates: Optional[Coordinates] = None
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

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=4, max=10),
    reraise=True
)
def get_coordinates(address: str) -> Optional[Coordinates]:
    try:
        # Initialize OpenCage geocoder with a longer timeout
        geolocator = OpenCage(
            api_key=config.env.opencage_api_key,
            timeout=10
        )
        
        # Geocode the address
        location = geolocator.geocode(address)
        
        if location:
            return Coordinates(
                latitude=location.latitude,
                longitude=location.longitude
            )
        return None
    except (GeocoderTimedOut, GeocoderServiceError) as e:
        logging.error(f"Geocoding error: {str(e)}")
        raise  # Re-raise for retry
    except Exception as e:
        logging.error(f"Unexpected geocoding error: {str(e)}")
        return None

@router.post("/analyze", response_model=GISResponse)
async def analyze_location(request: LocationRequest) -> Dict[str, Any]:
    try:
        # Get coordinates first
        coordinates = get_coordinates(request.address)
        
        client = AzureOpenAI(
            api_key=config.env.azure_openai_api_key,
            api_version=config.env.azure_openai_api_version,
            azure_endpoint=config.env.azure_openai_endpoint
        )

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
        # Parse the JSON string into a dictionary
        result_dict = json.loads(analysis_result)
        
        # Add coordinates to the response
        if coordinates:
            result_dict["coordinates"] = coordinates.dict()
        
        return result_dict

    except Exception as e:
        print("error", e)
        raise HTTPException(status_code=500, detail=f"Error analyzing location: {str(e)}") 