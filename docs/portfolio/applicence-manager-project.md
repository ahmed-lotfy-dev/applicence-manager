# AppLicence Manager - Portfolio Entry

## Basic Information
- Title (English): AppLicence Manager
- Title (Arabic): مدير تراخيص التطبيقات
- Slug (URL Identifier): applicence-manager

## Short Description
- English: A secure multi-app license activation platform with an admin dashboard for managing apps, licenses, activations, and status workflows.
- Arabic: منصة آمنة متعددة التطبيقات لإدارة تفعيل التراخيص مع لوحة تحكم لإدارة التطبيقات والتراخيص وسجل التفعيلات.

## Categories
React, TypeScript, Bun, Elysia, PostgreSQL, Docker

## Published
Yes

## Links
- Repo Link: https://github.com/ahmed-lotfy-dev/applicence-manager
- Live Link: https://activation.ahmedlotfy.site

## Case Study Content (Markdown) - English
```md
# AppLicence Manager

## The Challenge
I needed a production-ready way to manage license activation for multiple desktop apps from one dashboard. The system had to support app-level separation, secure activation flows, and simple operational deployment.

## The Solution
I built a fullstack platform with a Bun + Elysia backend and a React + Vite frontend. The backend provides admin APIs, public activation endpoints, and PostgreSQL persistence. The frontend provides app management, license issuance, and activation monitoring.

I hardened the platform by moving to secure cookie sessions, CSRF protection, rate limiting on sensitive endpoints, stricter CORS behavior, safer token handling, and stronger license key generation.

## Key Outcome
The result is a deployable, multi-app licensing system with clearer security defaults, improved operational stability in Docker/Dokploy, and a cleaner admin workflow.
```

## Case Study Content (Markdown) - Arabic
```md
# AppLicence Manager

## التحدي
كنت أحتاج نظامًا موحدًا لإدارة تفعيل تراخيص عدة تطبيقات سطح مكتب من لوحة تحكم واحدة، مع فصل واضح بين التطبيقات وأمان قوي وسهولة في النشر.

## الحل
قمت ببناء منصة كاملة باستخدام Bun + Elysia في الخلفية وReact + Vite في الواجهة. الخلفية توفر واجهات إدارة وتفعيل عامة وربطًا مع PostgreSQL، والواجهة توفر إدارة التطبيقات وإصدار التراخيص ومتابعة التفعيل.

تم تحسين الأمان عبر جلسات Cookies آمنة، حماية CSRF، تحديد معدل الطلبات، تحسين CORS، وتقوية توليد مفاتيح التراخيص.

## النتيجة
منصة متعددة التطبيقات قابلة للنشر مع أمان أفضل واستقرار أعلى وتجربة إدارة أوضح.
```

## Suggested Images
- Dashboard overview (stats + licenses + activations)
- Create/edit app and license dialogs
- Deployment architecture screenshot (Frontend + Backend + DB)
