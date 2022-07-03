from typing import List

import svgutils
from qrcodegen import QrCode


def create_qr_code(link="https://cevi.ch") -> None:
    """

    Creates a single QR Code, then prints it to the console.

    """

    # Make and print the QR Code symbol
    qr = QrCode.encode_text(link, QrCode.Ecc.HIGH)

    # Save QR code as SVG
    svg_text = to_svg_str(qr, border=2)
    with open('qr_code.svg', 'w') as f:
        f.write(svg_text)


def to_svg_str(qr: QrCode, border: int = 0, logo_size: int = 8) -> str:
    """

    Returns a string of SVG code for an image depicting the given QR Code, with the given number
    of border modules. The string always uses Unix newlines (\n), regardless of the platform.

    """

    if border < 0:
        raise ValueError("Border must be non-negative")

    if logo_size < 0:
        raise ValueError("Logo size must be non-negative")

    # Load logo as SVG
    cevi_logo = svgutils.compose.SVG('cevi_logo.svg')

    # Original svg logo is of size 500x500 pixels
    cevi_logo.scale(0.002 * logo_size, 0.002 * logo_size)
    cevi_logo.moveto(border + qr.get_size() / 2.0 - logo_size / 2.0, border + qr.get_size() / 2.0 - logo_size / 2.0)
    cevi_logo.tostr()

    # Compute the width and height of the SVG image
    qr_parts: List[str] = []
    qr_corners: List[str] = []

    for y in range(qr.get_size()):
        for x in range(qr.get_size()):
            if qr.get_module(x, y):

                # Ignore a square in the very middle of the image
                if qr.get_size() // 2 - logo_size // 2 <= x <= qr.get_size() // 2 + logo_size // 2 \
                        and qr.get_size() // 2 - logo_size // 2 <= y <= qr.get_size() // 2 + logo_size // 2:
                    continue

                # check if it's a corner
                if x == 0 and y <= 6 or y == 0 and x <= 6 or y == 6 and x <= 6 or x == 6 and y <= 6 \
                        or x >= qr.get_size() - 7 and (y == 0 or y == 6) or (
                        x == qr.get_size() - 1 or x == qr.get_size() - 7) and y <= 6 \
                        or y >= qr.get_size() - 7 and (x == 0 or x == 6) or (
                        y == qr.get_size() - 1 or y == qr.get_size() - 7) and x <= 6:
                    qr_corners.append(f"M{x + border},{y + border}h1v1h-1z")
                else:
                    qr_parts.append(f"M{x + border},{y + border}h1v1h-1z")

    return f"""<?xml version="1.0" encoding="UTF-8"?>
    <!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
    <svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 {qr.get_size() + border * 2} {qr.get_size() + border * 2}" stroke="none">
        
        <path d="{" ".join(qr_parts)}" fill="#003d8f"/>
        <path d="{" ".join(qr_corners)}" fill="#e20031"/>

        {cevi_logo.tostr()}

    </svg>
    """


# Run the main program
if __name__ == "__main__":
    create_qr_code()
