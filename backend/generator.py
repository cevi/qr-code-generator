import base64
import os
import subprocess
import tempfile
from typing import List, Tuple
from xml.sax.saxutils import escape as xml_escape

import cairosvg
import svgutils
from PIL import Image
from qrcodegen import QrCode


def create_qr_code(link, options=None, save_to_svg_file=False) -> str:
    """

    Creates a single QR Code, then prints it to the console.

    """

    # Make and print the QR Code symbol
    qr = QrCode.encode_text(link, QrCode.Ecc.HIGH)

    # Check if color_scheme is valid (cevi, black or white) or not set
    if options is not None and 'color_scheme' in options and options['color_scheme'] not in ['cevi', 'black', 'white']:
        raise ValueError("Invalid color scheme")

    color_scheme = 'cevi' if options is None or 'color_scheme' not in options else options['color_scheme']

    # Save QR code as SVG
    svg_text = to_svg_str(qr, border=2, color_scheme=color_scheme)

    if save_to_svg_file:
        with open('qr_code.svg', 'w') as f:
            f.write(svg_text)

    return svg_text


def _get_qr_components(qr: QrCode, border: int = 0, logo_size: int = 8, color_scheme="cevi") -> Tuple[int, List[str], List[str], str, str, str]:
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

    cevi_logo_string = str(cevi_logo.tostr())

    if color_scheme == 'black':
        cevi_logo_string = cevi_logo_string \
            .replace('fill:#e20031', 'fill:#000000') \
            .replace('fill:#003d8f', 'fill:#000000')

    if color_scheme == 'white':
        cevi_logo_string = cevi_logo_string \
            .replace('fill:#e20031', 'fill:#ffffff') \
            .replace('fill:#003d8f', 'fill:#ffffff')

    primary_fill = '#003d8f' if color_scheme == 'cevi' else ('#ffffff' if color_scheme == 'white' else '#000000')
    secondary_fill = '#e20031' if color_scheme == 'cevi' else ('#ffffff' if color_scheme == 'white' else '#000000')
    total_size = qr.get_size() + border * 2

    return total_size, qr_parts, qr_corners, cevi_logo_string, primary_fill, secondary_fill


def to_svg_str(qr: QrCode, border: int = 0, logo_size: int = 8, color_scheme="cevi") -> str:
    """

    Returns a string of SVG code for an image depicting the given QR Code, with the given number
    of border modules. The string always uses Unix newlines (\n), regardless of the platform.

    """
    total_size, qr_parts, qr_corners, cevi_logo_string, primary_fill, secondary_fill = _get_qr_components(
        qr, border=border, logo_size=logo_size, color_scheme=color_scheme
    )

    return f"""<?xml version="1.0" encoding="UTF-8"?>
    <!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
    <svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 {total_size} {total_size}" stroke="none">
        
        <path d="{" ".join(qr_parts)}" fill="{primary_fill}"/>
        <path d="{" ".join(qr_corners)}" fill="{secondary_fill}"/>

        { cevi_logo_string }

    </svg>
    """


def _render_text_to_svg_image(text: str, font_desc: str, color: str, center_x: float, center_y: float, max_width_mm: float = 170.0, dpi: int = 300) -> str:
    """Renders text with pango-view to a PNG at 300 DPI, supporting full color emojis, and embeds as SVG <image>."""
    if not text or not text.strip():
        return ""

    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
        tmp_png = tmp.name

    try:
        cmd = [
            "pango-view",
            "-q",
            "--background=transparent",
            f"--foreground={color}",
            f"--dpi={dpi}",
            f"--font={font_desc}",
            "-t", text.strip(),
            "-o", tmp_png
        ]
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if res.returncode != 0 or not os.path.exists(tmp_png) or os.path.getsize(tmp_png) == 0:
            return ""

        with Image.open(tmp_png) as img:
            w_px, h_px = img.size

        if w_px == 0 or h_px == 0:
            return ""

        w_mm = w_px * 25.4 / float(dpi)
        h_mm = h_px * 25.4 / float(dpi)

        if w_mm > max_width_mm:
            scale = max_width_mm / w_mm
            w_mm = max_width_mm
            h_mm = h_mm * scale

        x_mm = center_x - (w_mm / 2.0)
        y_mm = center_y - (h_mm / 2.0)

        with open(tmp_png, "rb") as f:
            b64_data = base64.b64encode(f.read()).decode("ascii")

        return f'<image x="{x_mm:.2f}" y="{y_mm:.2f}" width="{w_mm:.2f}" height="{h_mm:.2f}" xlink:href="data:image/png;base64,{b64_data}" />'
    except Exception:
        return ""
    finally:
        if os.path.exists(tmp_png):
            try:
                os.remove(tmp_png)
            except OSError:
                pass


def create_pdf(link: str, title: str = "", subtitle: str = "", show_url: bool = True, options: dict = None) -> bytes:
    """

    Creates an A4 PDF containing the QR code, an optional title, optional subtitle, and the URL below.
    :return: PDF as bytes

    """
    if options is not None and 'color_scheme' in options and options['color_scheme'] not in ['cevi', 'black', 'white']:
        raise ValueError("Invalid color scheme")

    color_scheme = 'cevi' if options is None or 'color_scheme' not in options else options['color_scheme']

    qr = QrCode.encode_text(link, QrCode.Ecc.HIGH)
    total_size, qr_parts, qr_corners, cevi_logo_string, primary_fill, secondary_fill = _get_qr_components(
        qr, border=2, color_scheme=color_scheme
    )

    bg_color = "#000000" if color_scheme == "white" else "#ffffff"
    title_color = "#ffffff" if color_scheme == "white" else "#000000"
    subtitle_color = "#cccccc" if color_scheme == "white" else "#555555"
    url_color = "#ffffff" if color_scheme == "white" else ("#003d8f" if color_scheme == "cevi" else "#333333")

    title_str = str(title).strip() if title else ""
    subtitle_str = str(subtitle).strip() if subtitle else ""
    link_str = str(link).strip()

    title_element = ""
    subtitle_element = ""

    if title_str and subtitle_str:
        title_element = _render_text_to_svg_image(title_str, "Montserrat Bold 14", title_color, 105.0, 36.0, max_width_mm=170.0)
        subtitle_element = _render_text_to_svg_image(subtitle_str, "Montserrat 10", subtitle_color, 105.0, 47.0, max_width_mm=170.0)
        if not title_element:
            title_element = f'<text x="105" y="35" text-anchor="middle" font-family="Montserrat, \'DejaVu Sans\', Arial, sans-serif" font-size="7.5" font-weight="bold" fill="{title_color}">{xml_escape(title_str)}</text>'
        if not subtitle_element:
            subtitle_element = f'<text x="105" y="45" text-anchor="middle" font-family="Montserrat, \'DejaVu Sans\', Arial, sans-serif" font-size="4.5" font-weight="normal" fill="{subtitle_color}">{xml_escape(subtitle_str)}</text>'
        qr_y = 62
    elif title_str:
        title_element = _render_text_to_svg_image(title_str, "Montserrat Bold 16", title_color, 105.0, 42.0, max_width_mm=170.0)
        if not title_element:
            title_element = f'<text x="105" y="42" text-anchor="middle" font-family="Montserrat, \'DejaVu Sans\', Arial, sans-serif" font-size="8.0" font-weight="bold" fill="{title_color}">{xml_escape(title_str)}</text>'
        qr_y = 65
    elif subtitle_str:
        subtitle_element = _render_text_to_svg_image(subtitle_str, "Montserrat 12", subtitle_color, 105.0, 42.0, max_width_mm=170.0)
        if not subtitle_element:
            subtitle_element = f'<text x="105" y="42" text-anchor="middle" font-family="Montserrat, \'DejaVu Sans\', Arial, sans-serif" font-size="5.5" font-weight="normal" fill="{subtitle_color}">{xml_escape(subtitle_str)}</text>'
        qr_y = 65
    else:
        qr_y = 60 if show_url else 78.5

    url_element = ""
    if show_url and link_str:
        url_y = qr_y + 140 + 16
        url_element = _render_text_to_svg_image(link_str, "Montserrat Medium 9", url_color, 105.0, url_y, max_width_mm=170.0)
        if not url_element:
            url_element = f'<text x="105" y="{url_y}" text-anchor="middle" font-family="Montserrat, \'DejaVu Sans\', Arial, sans-serif" font-size="4.5" font-weight="500" fill="{url_color}">{xml_escape(link_str)}</text>'

    a4_svg = f"""<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="210mm" height="297mm" viewBox="0 0 210 297">
    <rect width="210" height="297" fill="{bg_color}"/>
    {title_element}
    {subtitle_element}
    <svg x="35" y="{qr_y}" width="140" height="140" viewBox="0 0 {total_size} {total_size}">
        <path d="{" ".join(qr_parts)}" fill="{primary_fill}"/>
        <path d="{" ".join(qr_corners)}" fill="{secondary_fill}"/>
        {cevi_logo_string}
    </svg>
    {url_element}
</svg>"""

    return cairosvg.svg2pdf(bytestring=a4_svg.encode('utf-8'))


# Run the main program
if __name__ == "__main__":
    svg_text = create_qr_code("https://cevi.ch")

