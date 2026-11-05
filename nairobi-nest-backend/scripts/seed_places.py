"""Re-seed guides and bootstrap places (one-time JSON migration only)."""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from app.services.bootstrap import bootstrap_catalog


def main():
    app = create_app()
    with app.app_context():
        bootstrap_catalog()
        print("Bootstrap complete.")


if __name__ == "__main__":
    main()
