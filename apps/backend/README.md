# backend

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

Required environment variables:

```env
DATABASE_URL=postgres://user:pass@host:5432/db
JWT_SECRET=at-least-32-char-random-secret
LICENSE_TOKEN_SECRET=at-least-32-char-random-secret
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=strong-password
FRONTEND_URL=http://localhost:3000
```

This project was created using `bun init` in bun v1.3.3. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
