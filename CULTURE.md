# US Product Culture Rule

This rule applies to every role working on this product — design, engineering, QA, product management, support, content — with no role-specific exception. Whether you are designing, developing, reviewing, testing, or improving any part of the product, always think and act as a member of a US product team operating in the US market.

> **You are not designing a Vietnamese product for US users. You are designing a US product from the perspective of an American product team — this applies equally regardless of your role.**

## Core Principles

- Prioritize **US user expectations, behaviors, and business culture**.
- Design products to feel **natural and familiar to American users**, not merely translated from another market.
- Use **US English** by default for UI, UX copy, documentation, error messages, notifications, and product terminology.
- Follow common US conventions for:
  - Date: `MM/DD/YYYY`
  - Time: 12-hour format with AM/PM when appropriate
  - Timezone: when no business-specific or user-specific timezone is available, always fall back to **Central Time (`America/Chicago`) — Texas, US** — never to UTC, the server's timezone, or a non-US default
  - Currency: USD `$`
  - Phone numbers: US format
  - Address: US address conventions
  - Names: First Name / Last Name
  - States: standard US state abbreviations when appropriate
- Consider common American expectations around:
  - Privacy
  - Consent
  - Transparency
  - Accessibility
  - Customer support
  - Refunds and cancellations
  - Subscription management
  - Pricing transparency
  - Notifications and communication
  - Trust and security

## Product Thinking

Do not only ask:

> "Does this feature work?"

Always also ask:

> "Would an American user understand this immediately?"  
> "Would this behavior feel normal in a US product?"  
> "Would a US customer trust this?"  
> "Is the UX consistent with products commonly used in the US?"  
> "Could this create unnecessary friction or confusion for a US user?"

## UX Culture

Prefer:

- Simple and direct language
- Clear calls to action
- Explicit confirmation for important actions
- Transparent pricing
- Predictable navigation
- Minimal unnecessary steps
- Self-service whenever possible
- Clear error messages
- Human-friendly terminology

Avoid:

- Literal translations from Vietnamese/Asian UX patterns
- Ambiguous wording
- Excessive confirmation dialogs
- Hidden fees or unexpected charges
- Overly formal language
- Unnecessary administrative steps
- Interfaces that assume users already understand the business process

## Business Culture

When proposing product behavior, consider common US business practices such as:

- Subscription-based products
- Free trials
- Cancellation flows
- Refund policies
- Tax handling
- Tipping
- Promotions and discounts
- Affiliate/referral programs
- Customer support expectations
- Email/SMS communication
- Role-based business accounts
- Compliance and auditability

## Default Decision Rule

When multiple valid product decisions are possible, prefer the option that:

1. Feels most natural to a US user.
2. Minimizes user friction.
3. Clearly communicates what will happen.
4. Builds trust and transparency.
5. Is consistent with established US SaaS/product conventions.
6. Can scale to a professional US-market product.

Never assume that a UX pattern is appropriate simply because it is common in Vietnam or another Asian market.
