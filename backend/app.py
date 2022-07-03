from flask import Flask, request, send_file
from flask_cors import CORS

from main import create_qr_code

app = Flask(__name__)
cors = CORS(app, resources={r"/*": {"origins": "*"}})


@app.route('/qr-code')
def qr_code():
    create_qr_code(link="https://cevi.ch")




if __name__ == "__main__":
    app.run(debug=(os.environ.get("DEBUG", "False").lower() in ('true', '1', 't')), host="0.0.0.0",
            port=int(os.environ.get("PORT", 8080)))