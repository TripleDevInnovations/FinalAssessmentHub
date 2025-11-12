from fastapi import APIRouter, Request, HTTPException
import threading
import os
import time

router = APIRouter()

@router.get("/health")
def health():
    return {"status": "ok"}

@router.post("/shutdown")
def shutdown(request: Request):
    # optional: Sicherheitsprüfung (nur lokal erlaubt)
    client = request.client.host
    if client not in ("127.0.0.1", "localhost"):
        raise HTTPException(status_code=403, detail="Forbidden")

    def stopper():
        time.sleep(0.3)  # kurze Verzögerung, damit Response gesendet wird
        os._exit(0)      # hartes, aber sauberes Beenden des Prozesses

    threading.Thread(target=stopper, daemon=True).start()
    return {"message": "Backend shutting down"}
