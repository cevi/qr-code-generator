import logging
import os

from cairosvg import svg2png
from flask import Flask, request
from flask_cors import CORS

from log_helper import setup_recursive_logger

setup_recursive_logger(logging.INFO)

from generator import create_qr_code

app = Flask(__name__)
cors = CORS(app, resources={r"/*": {"origins": "*"}})

logger = logging.getLogger(__name__)


@app.route('/svg', methods=['POST'])
def svg_qr_code():
    """

    Creates a QR code from the given link and returns it as SVG.
    :return: svg as string

    """

    content = request.get_json()

    if "link" not in content:
        return "", 500

    logger.info('Create QR Code with content: ' + content['link'])

    svg_image = create_qr_code(link=content['link'])
    return svg_image


@app.route('/png', methods=['POST'])
def png_qr_code():
    """

    Creates a QR code from the given link and returns it as PNG.
    :return: png bytes

    """

    content = request.get_json()

    if "link" not in content:
        return "", 500

    logger.info('Create QR Code with content: ' + content['link'])

    svg_text = create_qr_code(link=content['link'])
    png_image = svg2png(bytestring=svg_text, dpi=300, output_width=1000, output_height=1000)

    return png_image


if __name__ == "__main__":
    app.run(debug=(os.environ.get("DEBUG", "False").lower() in ('true', '1', 't')), host="0.0.0.0",
            port=int(os.environ.get("PORT", 8080)))
