INITIAL_MEDS = [
    {
        "_id": "med1",
        "name": "Paracetamol",
        "category": "Analgesic",
        "dosageForm": "Tablet",
        "strength": "500mg",
        "manufacturer": "HealthCare Inc",
        "indication": "Fever, mild to moderate pain",
        "classification": "OTC"
    },
    {
        "_id": "med2",
        "name": "Amoxicillin",
        "category": "Antibiotic",
        "dosageForm": "Capsule",
        "strength": "250mg",
        "manufacturer": "PharmaCorp",
        "indication": "Bacterial infections",
        "classification": "Rx"
    },
    {
        "_id": "med3",
        "name": "Ibuprofen",
        "category": "NSAID",
        "dosageForm": "Tablet",
        "strength": "400mg",
        "manufacturer": "MediLife",
        "indication": "Pain, inflammation",
        "classification": "OTC"
    }
]

def get_mock_medicines():
    return INITIAL_MEDS
