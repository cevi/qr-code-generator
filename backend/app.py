import logging
import os
import re
import unicodedata
from urllib.parse import quote

import requests
from cairosvg import svg2png
from flask import Flask, jsonify, request, Response
from flask_cors import CORS

from log_helper import setup_recursive_logger

setup_recursive_logger(logging.INFO)

from generator import create_qr_code, create_pdf

app = Flask(__name__)
cors = CORS(app, resources={r"/*": {"origins": "*"}})

logger = logging.getLogger(__name__)

# Cevi.Tools URL shortener (a kutt.it instance). The API key is read from the
# environment and never leaves the backend, so it is not exposed to the browser.
SHORTENER_API_URL = os.environ.get("SHORTENER_API_URL", "https://backend-go.cevi.tools/api/v2/links")
SHORTENER_DOMAIN = os.environ.get("SHORTENER_DOMAIN", "go.cevi.tools")
SHORTENER_API_KEY = os.environ.get("SHORTENER_API_KEY", "")
SHORTENER_TIMEOUT = int(os.environ.get("SHORTENER_TIMEOUT", 10))

MAX_TARGET_LENGTH = 2048


@app.route('/svg', methods=['POST'])
def svg_qr_code():
    """

    Creates a QR code from the given text and returns it as SVG.
    :return: svg as string

    """

    content = request.get_json(silent=True) or {}

    if "text" not in content:
        return jsonify({"error": "Es wurde kein Text für den QR-Code angegeben."}), 400

    logger.info('Create QR Code with content: ' + str(content['text']))
    try:
        return create_svg_text(content)
    except Exception as error:
        logger.error('Could not generate SVG QR Code: ' + str(error))
        return jsonify({"error": f"Der QR-Code konnte nicht generiert werden: {error}"}), 500


def create_svg_text(content):
    if 'options' in content:
        svg_text = create_qr_code(link=content['text'], options=content['options'])
    else:
        svg_text = create_qr_code(link=content['text'])
    return svg_text


@app.route('/png', methods=['POST'])
def png_qr_code():
    """

    Creates a QR code from the given text and returns it as PNG.
    :return: png bytes

    """

    content = request.get_json(silent=True) or {}

    if "text" not in content:
        return jsonify({"error": "Es wurde kein Text für den QR-Code angegeben."}), 400

    logger.info('Create QR Code with content: ' + str(content['text']))

    try:
        svg_text = create_svg_text(content)
        png_image = svg2png(bytestring=svg_text, dpi=300, output_width=1000, output_height=1000)
        return png_image
    except Exception as error:
        logger.error('Could not generate PNG QR Code: ' + str(error))
        return jsonify({"error": f"Der QR-Code konnte nicht generiert werden: {error}"}), 500


@app.route('/pdf', methods=['POST'])
def pdf_qr_code():
    """

    Creates an A4 PDF from the given text, optional title, optional subtitle, and returns it as PDF bytes.
    :return: pdf bytes

    """

    content = request.get_json(silent=True) or {}

    if "text" not in content:
        return jsonify({"error": "Es wurde kein Text für den QR-Code angegeben."}), 400

    logger.info('Create PDF QR Code with content: ' + str(content['text']))

    title = content.get('title', '')
    subtitle = content.get('subtitle', '')
    show_url = content.get('show_url', True)
    options = content.get('options')
    try:
        pdf_bytes = create_pdf(link=content['text'], title=title, subtitle=subtitle, show_url=show_url, options=options)
    except Exception as error:
        logger.error('Could not generate PDF QR Code: ' + str(error))
        return jsonify({"error": f"Der QR-Code konnte nicht generiert werden: {error}"}), 500

    raw_name = (title or subtitle or "cevi-qr-code").strip()

    # ASCII fallback for latin-1 WSGI header compliance
    ascii_clean = unicodedata.normalize('NFKD', raw_name).encode('ascii', 'ignore').decode('ascii')
    ascii_clean = re.sub(r'[\\/*?:"<>|]', '', ascii_clean).strip().replace(' ', '-').lower()
    ascii_clean = re.sub(r'-+', '-', ascii_clean).strip('-')
    ascii_name = ascii_clean or "cevi-qr-code"

    # RFC 5987 / RFC 6266 UTF-8 encoded filename* supporting emojis and umlauts
    clean_utf8_name = re.sub(r'[\\/*?:"<>|]', '', raw_name).strip().replace(' ', '-')
    clean_utf8_name = re.sub(r'-+', '-', clean_utf8_name).strip('-') or "cevi-qr-code"
    encoded_name = quote(f"{clean_utf8_name}.pdf")

    return Response(
        pdf_bytes,
        mimetype='application/pdf',
        headers={'Content-Disposition': f'inline; filename="{ascii_name}.pdf"; filename*=UTF-8\'\'{encoded_name}'}
    )


@app.route('/shorten', methods=['POST'])
def shorten_url():
    """

    Shortens the given URL with the Cevi.Tools URL shortener and returns the
    short link. The QR code itself is still created through /svg and /png; this
    endpoint only exchanges a long URL for a short one.
    :return: {"link": "https://go.cevi.tools/<slug>"}

    """

    content = request.get_json(silent=True) or {}

    if "text" not in content:
        return jsonify({"error": "Es wurde keine URL angegeben."}), 400

    target = str(content["text"]).strip()

    if not target:
        return jsonify({"error": "Es wurde keine URL angegeben."}), 400

    if len(target) > MAX_TARGET_LENGTH:
        return jsonify({"error": "Die angegebene URL ist zu lang."}), 400

    if not target.startswith(("http://", "https://")):
        return jsonify({"error": "Es können nur http- und https-Links gekürzt werden."}), 400

    if not SHORTENER_API_KEY:
        logger.warning('Shortening requested but SHORTENER_API_KEY is not configured')
        return jsonify({"error": "Der Kürzungsdienst ist nicht konfiguriert."}), 503

    logger.info('Shorten URL: ' + target)

    try:
        response = requests.post(
            SHORTENER_API_URL,
            headers={"x-api-key": SHORTENER_API_KEY, "Content-Type": "application/json"},
            json={
                "target": target,
                "domain": SHORTENER_DOMAIN,
                "description": "Erstellt mit dem Cevi QR-Code-Generator",
                # Hand back the existing link when the same target was shortened
                # before, so repeated clicks do not burn through the daily quota.
                "reuse": True,
            },
            timeout=SHORTENER_TIMEOUT,
        )
    except requests.RequestException as error:
        logger.error('Could not reach the URL shortener: ' + str(error))
        return jsonify({"error": "Der Kürzungsdienst ist nicht erreichbar."}), 502

    if not response.ok:
        logger.error('URL shortener responded with status ' + str(response.status_code))
        return jsonify({"error": _shortener_error(response)}), 502

    link = (response.json() or {}).get("link")

    if not link:
        logger.error('URL shortener returned no link')
        return jsonify({"error": "Der Kürzungsdienst hat keinen Link zurückgegeben."}), 502

    return jsonify({"link": link})


def _shortener_error(response):
    """Pull the shortener's own error message out of the response, if it has one."""

    try:
        error = (response.json() or {}).get("error")
    except ValueError:
        error = None

    if error:
        return error

    return "Der Kürzungsdienst meldete den Status " + str(response.status_code) + "."


if __name__ == "__main__":
    app.run(debug=(os.environ.get("DEBUG", "False").lower() in ('true', '1', 't')), host="0.0.0.0",
            port=int(os.environ.get("PORT", 8080)))
