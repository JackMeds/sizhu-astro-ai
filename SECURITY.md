# Security Policy

## Supported code

Security fixes are applied to the current `main` branch. This project is still evolving quickly, so old commits and unmaintained forks are not separately supported.

## Reporting a vulnerability

Please do not publish exploit details, private user data, tokens or secrets in a normal public issue.

Use GitHub's private vulnerability reporting / Security Advisory flow when it is available for this repository. If a private reporting channel is not available, open a minimal public issue asking the maintainer for a private contact channel without including exploit details.

Useful reports include:

- affected route/component;
- impact;
- minimal reproduction steps that do not expose real personal data;
- suggested mitigation if known.

## Privacy-sensitive areas

Treat birth dates/times, precise locations, casting questions and generated chart payloads as potentially personal data. Production analytics/logging should not capture full user inputs. Never commit credentials or private MCP/API keys.

The public IndexNow key is intentionally public and is not an authentication secret.
