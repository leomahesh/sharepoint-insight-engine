
import json
import os
from pydantic import BaseModel

FLASHER_CONFIG_FILE = "flasher_config.json"

class FlasherUpdate(BaseModel):
    message: str
    active: bool = True

def get_flasher_config():
    if not os.path.exists(FLASHER_CONFIG_FILE):
        return {"message": "Welcome to HUC Dashboard", "active": True}
    with open(FLASHER_CONFIG_FILE, "r") as f:
        return json.load(f)

def update_flasher_config(config: FlasherUpdate):
    data = config.dict()
    with open(FLASHER_CONFIG_FILE, "w") as f:
        json.dump(data, f)
    return data
