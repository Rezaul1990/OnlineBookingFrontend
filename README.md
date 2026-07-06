# OnlineBooking Frontend

Next.js App Router frontend for creating and viewing bookings.

## Environment

Create `.env.local` from `.env.example`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## Scripts

```bash
npm install
npm run dev
npm run build
npm run lint
```

Local URL: `http://localhost:3000`

## Admin Routes

- `/admin/login`
- `/admin/dashboard`
- `/admin/users`
- `/admin/roles`

The admin area uses the backend HTTP-only cookie auth flow. Seed the first owner from the backend before signing in.
