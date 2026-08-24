# Security Policy

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| 1.x     | Yes                |
| < 1.0   | No (reference only)|

## Reporting a Vulnerability

**Do NOT open a public issue for security vulnerabilities.**

Instead, please report security issues via email:

**Email:** security@milyfe.org

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

## Response Timeline

- **Acknowledgment:** Within 48 hours
- **Assessment:** Within 7 days
- **Fix deployed:** Within 30 days for critical issues

## Scope

The following are in scope:
- Authentication bypass
- Authorization flaws (RLS policy gaps)
- Data exposure (PII leaks)
- XSS, CSRF, injection attacks
- Wallet/transaction manipulation
- Session hijacking

The following are out of scope:
- Issues in third-party dependencies (report upstream)
- Social engineering
- Denial of service
- Issues requiring physical access

## Rewards

Confirmed security vulnerabilities earn:
- Critical: 500 $MLY
- High: 250 $MLY
- Medium: 100 $MLY
- Low: 50 $MLY

## Security Practices

- All database tables use Row Level Security (RLS)
- Server actions validate with Zod before any DB operation
- Auth tokens are HTTP-only cookies managed by Supabase SSR
- No secrets in client bundles (NEXT_PUBLIC_ only for public keys)
- HSTS, X-Frame-Options DENY, CSP headers in production
- Service role key never exposed to client
