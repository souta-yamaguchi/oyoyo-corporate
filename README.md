# oyoyo-corporate

オヨヨ株式会社 コーポレートサイト（静的）。

## 構成

- `index.html` — 1ページ集約（Hero / 会社情報 / AIX推進室 / お問い合わせ）
- `privacy.html` — プライバシーポリシー単独
- `static/style.css` — ダーク × 紫オーラ × グラスモーフィズム
- `static/script.js` — ハンバーガー、スクロール表示
- `static/img/` — ロゴ＆作品サムネ（souta-portal から流用）

## デプロイ

GitHub `oyoyo-corporate` → Render Static Site

## お問い合わせフォーム

Formspree 無料プラン使用。`index.html` の form action を `https://formspree.io/f/<FORM_ID>` に置換要。
