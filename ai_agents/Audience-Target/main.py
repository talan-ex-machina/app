from fastapi import FastAPI
from pydantic import BaseModel
import os
from dotenv import load_dotenv
from audience_cible_agent import AudienceCibleAgent
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

app = FastAPI()

origins = [
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "null"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  
    allow_credentials=True, 
    allow_methods=["*"],    
    allow_headers=["*"],  
)

audience_agent = AudienceCibleAgent()

class ProductData(BaseModel):
    product_idea: str
    strengths: list
    concrete_steps_to_launch: list
    differentiation_strategy: str

class BusinessData(BaseModel):
    industry: str
    country: str

@app.post("/get_audience_report")
def get_audience_report(product_data: ProductData, business_data: BusinessData):
    """
    Cette route permet de récupérer un rapport sur l'audience cible.
    """
    product_data_dict = product_data.model_dump()
    business_data_dict = business_data.model_dump()

    result = audience_agent.run(product_data_dict, business_data_dict)

    return result
