import os
from pathlib import Path
from fastapi import FastAPI, Depends
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi_clerk_auth import ClerkConfig, ClerkHTTPBearer, HTTPAuthorizationCredentials
from openai import OpenAI

app = FastAPI()

# Add CORS middleware (allows frontend to call backend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Clerk authentication setup
clerk_config = ClerkConfig(jwks_url=os.getenv("CLERK_JWKS_URL"))
clerk_guard = ClerkHTTPBearer(clerk_config)

class Visit(BaseModel):
    patient_name: str
    date_of_visit: str
    notes: str

system_prompt = """
Vous disposez des notes prises par un médecin suite à la consultation d'un patient.
Votre tâche consiste à résumer la consultation pour le médecin et à lui envoyer un courriel.
Répondez en trois parties exactement, intitulées comme suit:
### Résumé de la consultation pour le dossier médical
### Prochaines étapes pour le médecin
### Rédaction du courriel au patient (en langage clair et accessible)
"""

def user_prompt_for(visit: Visit) -> str:
    return f"""Créez le résumé, les prochaines étapes et le brouillon de l'e-mail pour:
Nom du Patient: {visit.patient_name}
Date de Visite: {visit.date_of_visit}
Notes:
{visit.notes}"""

@app.post("/api/consultation")
def consultation_summary(
    visit: Visit,
    creds: HTTPAuthorizationCredentials = Depends(clerk_guard),
):
    try:
        user_id = creds.decoded["sub"]
        print(f"User {user_id} requesting consultation for {visit.patient_name}")
        
        client = OpenAI()
        
        user_prompt = user_prompt_for(visit)
        prompt = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]
        
        # ✅ RÉPONSE COMPLÈTE SANS STREAMING
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=prompt,
            stream=False,  # ← IMPORTANT: streaming désactivé
        )
        
        # ✅ RETOURNER DIRECTEMENT LE RÉSULTAT COMPLET
        summary_text = response.choices[0].message.content
        print(f"Generated summary length: {len(summary_text)} characters")
        return {"summary": summary_text}
    
    except Exception as e:
        print(f"Error in consultation_summary: {e}")
        return {"error": str(e)}

@app.get("/health")
def health_check():
    """Health check endpoint for AWS App Runner"""
    return {"status": "healthy"}

# Serve static files (our Next.js export) - MUST BE LAST!
static_path = Path("static")
if static_path.exists():
    # Serve index.html for the root path
    @app.get("/")
    async def serve_root():
        return FileResponse(static_path / "index.html")
    
    # Mount static files for all other routes
    app.mount("/", StaticFiles(directory="static", html=True), name="static")