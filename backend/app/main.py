from fastapi import FastAPI

app = FastAPI(title="AutoDoc AI")

@app.get("/")
def root():
    return {"status": "AutoDoc backend running"}
