import re
from pathlib import Path
from random import Random

import pandas as pd

BASE_DIR = Path(__file__).resolve().parents[1]
RAW_DIR = BASE_DIR / "data" / "raw"
PROCESSED_DIR = BASE_DIR / "data" / "processed"

LEGITIMATE_RAW_PATH = RAW_DIR / "phishing_emails.csv"
SMS_PATH = PROCESSED_DIR / "sms_processed.csv"
SOCIAL_PATH = PROCESSED_DIR / "social_processed.csv"
OUTPUT_PATH = RAW_DIR / "phishing_emails_labeled.csv"

TARGET_LEGITIMATE = 2500
TARGET_PHISHING = 2500
RANDOM_SEED = 42

HEADER_PATTERN = re.compile(r"^(From|Subject):\s*(.*)$", re.IGNORECASE)
WHITESPACE_PATTERN = re.compile(r"\s+")

LEGITIMATE_FALLBACK_SUBJECTS = [
    "Project update",
    "Meeting notes",
    "Travel request",
    "Contract review",
    "Quarterly report",
]

CURATED_SCENARIOS = [
    {
        "category": "account_verify",
        "subject_templates": [
            "Urgent: Verify your {brand} account",
            "Security alert for your {brand} login",
            "Action required: Confirm your {brand} details",
        ],
        "body_templates": [
            "We detected unusual activity on your {brand} account. Verify your details immediately using {url} to avoid suspension.",
            "Your {brand} access will be limited unless you confirm your identity today. Open {url} and complete the verification form.",
        ],
    },
    {
        "category": "invoice",
        "subject_templates": [
            "Outstanding invoice requires payment today",
            "Final notice: unpaid invoice {ref_code}",
            "Payment failed for invoice {ref_code}",
        ],
        "body_templates": [
            "Please review the attached invoice copy {attachment_name} and complete payment before end of day to prevent service interruption.",
            "We could not process your recent payment. Use {url} to update billing details or open {attachment_name} for the invoice summary.",
        ],
    },
    {
        "category": "document_share",
        "subject_templates": [
            "Shared document awaiting your review",
            "Secure document delivery notice",
            "Encrypted message available for collection",
        ],
        "body_templates": [
            "A confidential document has been shared with you. Sign in at {url} to review it securely.",
            "You have received a protected document. Download the secure viewer attachment {attachment_name} or sign in at {url}.",
        ],
    },
    {
        "category": "delivery",
        "subject_templates": [
            "Delivery on hold: confirm your shipping details",
            "Parcel tracking update requires action",
            "Address validation needed for your package",
        ],
        "body_templates": [
            "Your parcel is currently on hold because the delivery address could not be verified. Update the shipment using {url}.",
            "We attempted delivery today but require a small redelivery fee. Open {url} to confirm your address and payment details.",
        ],
    },
    {
        "category": "reward",
        "subject_templates": [
            "Congratulations: claim your reward today",
            "You have been selected for a member prize",
            "Final reminder: redeem your gift reward",
        ],
        "body_templates": [
            "You have been selected to receive a limited member reward. Submit your details at {url} to process the release.",
            "Your reward claim is waiting for confirmation. Open {url} and follow the instructions to avoid losing the prize.",
        ],
    },
]

BRAND_PROFILES = {
    "account_verify": [
        ("PayPal", "paypal-support-alert.com"),
        ("Microsoft 365", "microsoft-security-mail.com"),
        ("Apple", "apple-id-check.com"),
        ("Google", "google-account-review.com"),
        ("ATO", "ato-secure-message.com"),
    ],
    "invoice": [
        ("Xero", "billing-update-center.com"),
        ("QuickBooks", "invoice-securecopy.com"),
        ("NAB", "nab-payment-alerts.com"),
        ("Westpac", "westpac-billing-check.com"),
    ],
    "document_share": [
        ("DocuSign", "document-review-center.com"),
        ("SharePoint", "sharepoint-securefiles.com"),
        ("OneDrive", "onedrive-file-review.com"),
        ("Dropbox", "dropbox-share-notify.com"),
    ],
    "delivery": [
        ("Australia Post", "auspost-track-update.com"),
        ("DHL", "dhl-delivery-support.com"),
        ("FedEx", "fedex-shipping-notice.com"),
        ("Aramex", "aramex-delivery-team.com"),
    ],
    "reward": [
        ("Amazon", "reward-redemption-center.com"),
        ("Netflix", "member-reward-notice.com"),
        ("Reward Centre", "claim-now-portal.com"),
    ],
}

FREE_DOMAINS = ["gmail.com", "outlook.com", "hotmail.com", "yahoo.com"]
SUSPICIOUS_ATTACHMENTS = [
    "secure_message.html",
    "invoice_copy.docm",
    "payment_receipt.zip",
    "voicemail_note.htm",
    "review_document.scr",
]
GREETINGS = [
    "Dear customer,",
    "Hello,",
    "Attention user,",
    "Dear account holder,",
]
SIGN_OFFS = [
    "Security Team",
    "Billing Department",
    "Support Desk",
    "Customer Care",
]


def normalize_text(text: str) -> str:
    return WHITESPACE_PATTERN.sub(" ", str(text or "")).strip()


def parse_enron_message(raw_message: str) -> dict[str, str]:
    raw_message = str(raw_message or "")
    header_block, _, body = raw_message.partition("\n\n")

    sender = ""
    subject = ""
    for line in header_block.splitlines():
        match = HEADER_PATTERN.match(line.strip())
        if not match:
            continue
        key = match.group(1).lower()
        value = normalize_text(match.group(2))
        if key == "from":
            sender = value
        elif key == "subject":
            subject = value

    return {
        "sender": sender,
        "subject": subject,
        "body": normalize_text(body),
    }


def load_legitimate_samples(rng: Random) -> list[dict[str, str]]:
    df = pd.read_csv(LEGITIMATE_RAW_PATH, usecols=["message"])
    sample_size = min(len(df), TARGET_LEGITIMATE * 6)
    sampled = df.sample(n=sample_size, random_state=RANDOM_SEED)

    rows: list[dict[str, str]] = []
    seen: set[tuple[str, str]] = set()

    for raw_message in sampled["message"]:
        parsed = parse_enron_message(raw_message)
        body = parsed["body"]
        subject = parsed["subject"] or rng.choice(LEGITIMATE_FALLBACK_SUBJECTS)
        sender = parsed["sender"] or "employee@enron.com"

        if len(body) < 40:
            continue
        if len(body) > 3500:
            continue

        key = (subject.lower(), body[:240].lower())
        if key in seen:
            continue
        seen.add(key)

        rows.append(
            {
                "sender": sender,
                "subject": subject,
                "body": body,
                "label": "legitimate",
                "source": "enron_corpus",
            }
        )

        if len(rows) >= TARGET_LEGITIMATE:
            break

    if len(rows) < TARGET_LEGITIMATE:
        raise ValueError(
            f"Could only extract {len(rows)} legitimate emails from {LEGITIMATE_RAW_PATH.name}."
        )

    return rows


def classify_seed(text: str) -> str:
    text = text.lower()
    if any(token in text for token in ("parcel", "delivery", "tracking", "shipment")):
        return "delivery"
    if any(token in text for token in ("invoice", "payment", "bank", "billing", "wire transfer")):
        return "invoice"
    if any(token in text for token in ("document", "shared", "sign", "attachment", "review")):
        return "document_share"
    if any(token in text for token in ("winner", "prize", "reward", "lottery", "gift")):
        return "reward"
    return "account_verify"


def build_sender(brand: str, domain: str, rng: Random) -> str:
    brand_token = re.sub(r"[^a-z0-9]", "", brand.lower()) or "support"
    local_part_templates = [
        f"{brand_token}.support",
        f"security.{brand_token}",
        f"billing.{brand_token}",
        f"{brand_token}.notice",
        f"{brand_token}.team",
    ]

    if rng.random() < 0.35:
        return f"{rng.choice(local_part_templates)}@{rng.choice(FREE_DOMAINS)}"
    return f"{rng.choice(local_part_templates)}@{domain}"


def build_url(brand: str, rng: Random) -> str:
    brand_token = re.sub(r"[^a-z0-9]", "-", brand.lower()).strip("-") or "account"
    hosts = [
        f"{brand_token}-verify-account.com",
        f"secure-{brand_token}-review.net",
        f"{brand_token}-login-check.org",
        f"protect-{brand_token}-member.com",
    ]
    paths = [
        "/signin",
        "/verify",
        "/account/review",
        "/secure-login",
        "/update-details",
    ]
    return f"http://{rng.choice(hosts)}{rng.choice(paths)}"


def wrap_seed_as_email(seed_text: str, category: str, rng: Random) -> dict[str, str]:
    brand, domain = rng.choice(BRAND_PROFILES[category])
    url = build_url(brand, rng)
    attachment_name = rng.choice(SUSPICIOUS_ATTACHMENTS)
    greeting = rng.choice(GREETINGS)
    sign_off = rng.choice(SIGN_OFFS)

    scenario_templates = next(
        scenario for scenario in CURATED_SCENARIOS if scenario["category"] == category
    )
    subject = rng.choice(scenario_templates["subject_templates"]).format(
        brand=brand,
        ref_code=str(rng.randint(100000, 999999)),
    )
    intro = rng.choice(scenario_templates["body_templates"]).format(
        brand=brand,
        url=url,
        attachment_name=attachment_name,
    )
    sender = build_sender(brand, domain, rng)
    seed_text = normalize_text(seed_text)

    body = "\n\n".join(
        [
            greeting,
            intro,
            seed_text,
            f"Please complete the requested step here: {url}",
            f"If prompted, open the attached file {attachment_name} and follow the instructions.",
            f"Regards,\n{brand} {sign_off}",
        ]
    )

    return {
        "sender": sender,
        "subject": subject,
        "body": body,
        "label": "phishing",
        "source": f"bootstrapped_{category}",
    }


def load_phishing_seed_texts() -> list[str]:
    seed_texts: list[str] = []

    for path in (SMS_PATH, SOCIAL_PATH):
        df = pd.read_csv(path)
        texts = (
            df[df["label"].astype(str).str.lower() == "phishing"]["text"]
            .astype(str)
            .map(normalize_text)
        )
        seed_texts.extend(text for text in texts if len(text) >= 20)

    for scenario in CURATED_SCENARIOS:
        for template in scenario["body_templates"]:
            seed_texts.append(
                template.format(
                    brand="your service",
                    url="http://secure-update-now.com/verify",
                    attachment_name="account_update.html",
                )
            )

    # Keep ordering deterministic while removing duplicates.
    return list(dict.fromkeys(seed_texts))


def load_phishing_samples(rng: Random) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    seed_texts = load_phishing_seed_texts()

    if not seed_texts:
        raise ValueError("Could not load any phishing seed texts from SMS/social datasets.")

    index = 0
    while len(rows) < TARGET_PHISHING:
        seed_text = seed_texts[index % len(seed_texts)]
        category = classify_seed(seed_text)
        rows.append(wrap_seed_as_email(seed_text, category, rng))
        index += 1

    deduped = []
    seen: set[tuple[str, str]] = set()
    for row in rows:
        key = (row["subject"].lower(), row["body"][:260].lower())
        if key in seen:
            continue
        seen.add(key)
        deduped.append(row)

    if len(deduped) < TARGET_PHISHING:
        raise ValueError(
            f"Could only generate {len(deduped)} unique phishing emails, expected {TARGET_PHISHING}."
        )

    return deduped[:TARGET_PHISHING]


def main() -> None:
    rng = Random(RANDOM_SEED)
    legitimate_rows = load_legitimate_samples(rng)
    phishing_rows = load_phishing_samples(rng)

    labeled = pd.DataFrame(legitimate_rows + phishing_rows)
    labeled = labeled.sample(frac=1, random_state=RANDOM_SEED).reset_index(drop=True)
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    labeled.to_csv(OUTPUT_PATH, index=False)

    print(f"Saved bootstrap email dataset to {OUTPUT_PATH}")
    print(labeled["label"].value_counts().to_dict())


if __name__ == "__main__":
    main()
