# Model Evaluation Report

Generated: 2026-04-10T02:55:50.550793+00:00

This report evaluates the saved phishing-detection models on the deterministic holdout split
created with `test_size=0.2`, `random_state=42`, and stratified labels.

## EMAIL

- Dataset rows: 5000
- Test rows: 1000
- Label distribution: {'legitimate': 2500, 'phishing': 2500}
- Accuracy: 0.997
- Macro F1: 0.997
- Weighted F1: 0.997
- Macro recall: 0.997
- ROC AUC: 1.0

| Class | Precision | Recall | F1 | Support |
| --- | ---: | ---: | ---: | ---: |
| legitimate | 0.994 | 1.0 | 0.997 | 500 |
| phishing | 1.0 | 0.994 | 0.997 | 500 |

Confusion matrix (`true x predicted` with labels `legitimate`, `phishing`):

`[[500, 0], [3, 497]]`

## SMS

- Dataset rows: 5158
- Test rows: 1032
- Label distribution: {'legitimate': 4516, 'phishing': 642}
- Accuracy: 0.9826
- Macro F1: 0.9601
- Weighted F1: 0.9826
- Macro recall: 0.9632
- ROC AUC: 0.9918

| Class | Precision | Recall | F1 | Support |
| --- | ---: | ---: | ---: | ---: |
| legitimate | 0.9911 | 0.9889 | 0.99 | 904 |
| phishing | 0.9231 | 0.9375 | 0.9302 | 128 |

Confusion matrix (`true x predicted` with labels `legitimate`, `phishing`):

`[[894, 10], [8, 120]]`

## SOCIAL

- Dataset rows: 1779
- Test rows: 356
- Label distribution: {'legitimate': 925, 'phishing': 854}
- Accuracy: 0.9494
- Macro F1: 0.9493
- Weighted F1: 0.9494
- Macro recall: 0.9491
- ROC AUC: 0.9811

| Class | Precision | Recall | F1 | Support |
| --- | ---: | ---: | ---: | ---: |
| legitimate | 0.9465 | 0.9568 | 0.9516 | 185 |
| phishing | 0.9527 | 0.9415 | 0.9471 | 171 |

Confusion matrix (`true x predicted` with labels `legitimate`, `phishing`):

`[[177, 8], [10, 161]]`

## URL

- Dataset rows: 235370
- Test rows: 47074
- Label distribution: {'legitimate': 134850, 'phishing': 100520}
- Accuracy: 0.9965
- Macro F1: 0.9964
- Weighted F1: 0.9965
- Macro recall: 0.9959
- ROC AUC: 0.9992

| Class | Precision | Recall | F1 | Support |
| --- | ---: | ---: | ---: | ---: |
| legitimate | 0.9939 | 1.0 | 0.997 | 26970 |
| phishing | 1.0 | 0.9918 | 0.9959 | 20104 |

Confusion matrix (`true x predicted` with labels `legitimate`, `phishing`):

`[[26970, 0], [165, 19939]]`
