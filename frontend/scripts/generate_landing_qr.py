from pathlib import Path

import qrcode
import qrcode.image.svg
from PIL import Image, ImageDraw, ImageFont


LANDING_URL = "http://192.168.1.109:5173"


def make_qr_image(url: str) -> Image.Image:
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=24,
        border=8,
    )
    qr.add_data(url)
    qr.make(fit=True)
    return qr.make_image(fill_color="#000000", back_color="#ffffff").convert("RGB")


def make_qr_svg(url: str):
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=24,
        border=8,
        image_factory=qrcode.image.svg.SvgPathImage,
    )
    qr.add_data(url)
    qr.make(fit=True)
    return qr.make_image(attrib={"class": "phishguard-landing-qr"})


def add_label(qr_image: Image.Image, url: str) -> Image.Image:
    label_height = 140
    canvas = Image.new(
        "RGB",
        (qr_image.width, qr_image.height + label_height),
        "#ffffff",
    )
    canvas.paste(qr_image, (0, 0))

    draw = ImageDraw.Draw(canvas)
    try:
      title_font = ImageFont.truetype("arialbd.ttf", 34)
      body_font = ImageFont.truetype("arial.ttf", 24)
    except OSError:
      title_font = ImageFont.load_default()
      body_font = ImageFont.load_default()

    title = "Scan for PhishGuard Showcase"
    subtitle = url
    title_box = draw.textbbox((0, 0), title, font=title_font)
    subtitle_box = draw.textbbox((0, 0), subtitle, font=body_font)

    title_x = (canvas.width - (title_box[2] - title_box[0])) // 2
    subtitle_x = (canvas.width - (subtitle_box[2] - subtitle_box[0])) // 2
    base_y = qr_image.height + 28

    draw.text((title_x, base_y), title, fill="#020617", font=title_font)
    draw.text((subtitle_x, base_y + 52), subtitle, fill="#334155", font=body_font)
    return canvas


def main():
    frontend_dir = Path(__file__).resolve().parents[1]
    public_dir = frontend_dir / "public"
    public_dir.mkdir(parents=True, exist_ok=True)

    qr_image = make_qr_image(LANDING_URL)
    labelled_image = add_label(qr_image, LANDING_URL)

    qr_png_path = public_dir / "phishguard-final-qr.png"
    qr_label_path = public_dir / "phishguard-final-qr-labelled.png"
    qr_svg_path = public_dir / "phishguard-final-qr.svg"

    qr_image.save(qr_png_path)
    labelled_image.save(qr_label_path)
    make_qr_svg(LANDING_URL).save(qr_svg_path)

    print(f"QR URL: {LANDING_URL}")
    print(f"QR PNG: {qr_png_path}")
    print(f"Labelled QR PNG: {qr_label_path}")
    print(f"QR SVG: {qr_svg_path}")


if __name__ == "__main__":
    main()
