import os

from flask import Flask, request
from flask_cors import CORS

from main import create_qr_code

app = Flask(__name__)
cors = CORS(app, resources={r"/*": {"origins": "*"}})


@app.route('/', methods=['POST'])
def qr_code():
    content = request.get_json()

    if "link" not in content:
        return "", 500

    print('Create QR Code with content: ', content)

    svg_text = create_qr_code(link=content['link'])
    return svg_text


if __name__ == "__main__":
    app.run(debug=(os.environ.get("DEBUG", "False").lower() in ('true', '1', 't')), host="0.0.0.0",
            port=int(os.environ.get("PORT", 8080)))
