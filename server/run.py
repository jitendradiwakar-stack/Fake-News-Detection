import sys
from pathlib import Path

# Ensure server directory is always on python path
sys.path.insert(0, str(Path(__file__).parent.resolve()))

from app import create_app

app = create_app()

if __name__ == '__main__':
    print("\n=======================================================")
    print("   SatyaCheck ML Backend Server running on port 5000   ")
    print("   URL: http://127.0.0.1:5000                          ")
    print("=======================================================\n")
    app.run(host='0.0.0.0', port=5000, debug=False)
