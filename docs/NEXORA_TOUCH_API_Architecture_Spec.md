
# NEXORA TOUCH API & System Architecture Specification

Technical architecture and API specification for NEXORA TOUCH by VLINKPAY.


## 1. System Architecture

Frontend: Next.js + TailwindCSS

Backend: Node.js / NestJS

Database: PostgreSQL

Storage: AWS S3 / Cloudflare R2

Authentication: JWT + Refresh Tokens

Hosting: AWS / Vercel

Analytics Queue: Redis + Worker

QR Generator: Dynamic QR Service

Optional NFC Mapping Layer


## 2. Authentication APIs

POST /auth/register

POST /auth/login

POST /auth/refresh-token

POST /auth/forgot-password

POST /auth/reset-password

POST /auth/logout


## 3. Business APIs

POST /business/create

GET /business/{id}

PUT /business/{id}

POST /business/logo-upload

GET /business/{slug}/public-profile


## 4. Staff APIs

POST /staff/create

PUT /staff/{id}

DELETE /staff/{id}

GET /staff/{id}

POST /staff/payment-methods


## 5. QR / NFC APIs

POST /touch-point/create

GET /touch-point/{id}

POST /touch-point/generate-qr

POST /touch-point/assign-nfc

GET /touch-point/analytics


## 6. Tip APIs

POST /tip/create-session

POST /tip/confirm

GET /tip/history

GET /tip/staff/{id}


## 7. Review APIs

POST /review/submit

GET /review/business/{id}

POST /review/private-feedback

POST /review/google-redirect

POST /review/yelp-redirect


## 8. Dashboard APIs

GET /dashboard/overview

GET /dashboard/top-staff

GET /dashboard/top-touch-points

GET /dashboard/reviews

GET /dashboard/analytics


## 9. Recommended Database Relations

Business has many Staff Profiles

Business has many Touch Points

Touch Point has many Tips

Touch Point has many Reviews

Staff has many Tips

Staff has many Reviews


## 10. QR / NFC Logic

QR and NFC open the same URL

QR is default activation method

NFC is premium upgrade

Every scan/tap must log touch_point_id

Every touch point must support analytics


## 11. Analytics Tracking

QR scan count

NFC tap count

Tip conversion rate

Review conversion rate

Top staff

Top touch points

Google/Yelp review conversion


## 12. Security Requirements

JWT authentication

Role-based access control

Encrypted payment method storage

Rate limiting

API request logging

Cloudflare WAF recommended


## 13. DevOps Requirements

CI/CD deployment pipeline

Environment separation

Staging environment

Automated backup

Monitoring and alerts

Error logging


## 14. Future Expansion

AI review analysis

AI auto-response

Multi-location enterprise system

White-label merchant portal

Integrated payment processor

NFC order management


## Conclusion

This API & Architecture document should be used by Backend, Frontend, Mobile, QC, and DevOps teams as the technical foundation for the NEXORA TOUCH platform.
