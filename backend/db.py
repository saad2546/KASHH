import logging
from utils.mock_medicines import get_mock_medicines # I'll assume I can optionally keep a small mock db of meds or just an empty list

logger = logging.getLogger(__name__)

# Collections as in-memory data structures
medicines = []
prescriptions = []
queue = []

# If we have some initial mock medicines, we can load them or let them be empty
from utils.mock_medicines import INITIAL_MEDS
medicines.extend(INITIAL_MEDS)

def init_db():
    logger.info("[DB] Initialized in-memory dictionaries for medicines, prescriptions, and queue.")

init_db()
