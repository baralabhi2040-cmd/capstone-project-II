import sys
from pathlib import Path
from unittest.mock import patch

import pandas as pd
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from training.prepare_datasets import build_email_frame, normalize_label
from training.train_utils import load_training_frame


def test_build_email_frame_rejects_unlabeled_message_only_data():
    df = pd.DataFrame(
        {
            "file": ["sample.txt"],
            "message": ["Please review the attached agenda."],
        }
    )

    with pytest.raises(ValueError, match="does not include a label column"):
        build_email_frame(df)


def test_build_email_frame_combines_subject_and_body_when_structured_columns_exist():
    df = pd.DataFrame(
        {
            "sender": ["security@bank.com"],
            "subject": ["Urgent verification needed"],
            "body": ["Please confirm your account details immediately."],
            "label": ["phishing"],
        }
    )

    out = build_email_frame(df)

    assert out.loc[0, "sender"] == "security@bank.com"
    assert out.loc[0, "subject"] == "Urgent verification needed"
    assert "Urgent verification needed" in out.loc[0, "text"]
    assert "confirm your account" in out.loc[0, "text"]
    assert out.loc[0, "label"] == "phishing"


def test_url_numeric_labels_are_mapped_in_the_expected_direction():
    assert normalize_label("1", phishing_tokens={"0"}, legitimate_tokens={"1"}) == "legitimate"
    assert normalize_label("0", phishing_tokens={"0"}, legitimate_tokens={"1"}) == "phishing"


def test_load_training_frame_requires_enough_examples_per_class():
    frame = pd.DataFrame(
        {
            "text": [f"legitimate message {idx}" for idx in range(30)]
            + [f"phishing message {idx}" for idx in range(3)],
            "label": ["legitimate"] * 30 + ["phishing"] * 3,
        }
    )
    with patch("training.train_utils.Path.exists", return_value=True), patch(
        "training.train_utils.pd.read_csv",
        return_value=frame,
    ):
        with pytest.raises(ValueError, match="at least 25 samples per class"):
            load_training_frame(Path("tiny_email.csv"), dataset_name="email")
