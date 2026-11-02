# Voluntary support with TWINT

The compact support section below the map is hidden until a real payment destination is configured. No donation destination is currently configured or published.

1. Obtain a provider-approved donation checkout that explicitly supports voluntary contributions to the operator. A generic TWINT merchant payment link is not confirmed suitable: TWINT’s published guidelines require a purchase reference or purchase information, and its website payment-button rules must be followed. Verify the account holder, provider eligibility, charges and payment terms with that provider. Private person-to-person TWINT transfers do not provide an equivalent website QR checkout.
2. Set `paymentUrl` in `src/donations.js` to the provider-issued HTTPS payment link. Do not invent a TWINT URL, use a one-time request, or publish a private phone number. Confirm that donors can choose their amount.
3. Preview all five languages on desktop and mobile, and open the link to verify the recipient and amount controls. Do not make a payment as a test without authorization.
4. Build with `npm run build:static` and publish using [the AWS instructions](aws-static.md). No backend, payment keys, analytics or external JavaScript are needed.

The link opens only on a user click, in a separate tab with no referrer. Payment and any payment-provider data processing happen on the external service. No success receipt is shown by this site: there is no payment webhook or independent payment verification. Wording makes no claim of tax deductibility or charitable status.

Official TWINT references: [website payment links](https://www.twint.ch/content/uploads/2024/12/Anleitung_Registration_Zahlungslink_EN.pdf) and [sending and receiving money](https://www.twint.ch/faq/worauf-soll-ich-beim-senden-und-empfangen-von-geld-achten/).

## Eligibility check — 2026-11-02

Direct TWINT merchant registration is available with or without a commercial-register entry, but the official FAQ describes businesses, not an unconditional route for private hobby projects. Its payment-link guidelines require purchase context; they do not establish eligibility for this project's voluntary tips. We therefore leave donations disabled rather than registering the operator or publishing an unapproved payment destination.

Sources: [registration FAQ](https://www.twint.ch/faq/wie-registriere-ich-mich-im-twint-haendler-portal/), [payment-link guidelines](https://www.twint.ch/content/uploads/2024/12/Anleitung_Registration_Zahlungslink_DE.pdf), [private transfers](https://www.twint.ch/faq/worauf-soll-ich-beim-senden-und-empfangen-von-geld-achten/). Revisit only with provider confirmation or a donation-specific provider that accepts the operator.
