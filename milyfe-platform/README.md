# MiLyfe Platform

Complete public + private structure:

- `/` — public landing page only
- `/onboarding` — founding citizen onboarding + secure account creation
- `/login` — citizen login
- `/citizen` — private Citizen Dashboard
- `/admin` — organizer/admin command center

## Run locally

```bash
cd /home/user/milyfe-platform
npm start
```

Open:

```text
http://localhost:3000
```

For a local pilot where the first registered user becomes admin:

```bash
FIRST_USER_ADMIN=true npm start
```

In production, do not use first-user-admin. Create admin accounts deliberately.

## Security built in

- Server-side auth, not localStorage auth
- Password hashing with Node `scrypt`
- HttpOnly session cookies
- SameSite cookie protection
- CSRF token on protected writes
- Role-based access:
  - citizen
  - organizer
  - admin
- Citizen dashboard only exposes the logged-in citizen’s data
- Admin dashboard requires organizer/admin role
- Basic login/register rate limiting
- JSON data store for pilot use

## Citizen private dashboard features

- Citizen Pass
- Founding citizen code
- Pledge/signature
- Values Agenda
- Community need submission
- Circle Hub
- First assembly RSVP
- Role Missions
- Invite Center
- Account / Privacy
- Data export

## Admin/Organizer features

- Citizen list
- Search/filter by name, email, city, role, status
- Update citizen status
- Assign Circle
- Create assemblies/events
- Export citizens CSV

## Production recommendation

This scaffold is a secure pilot server. For high-scale production, move the data layer to Postgres/Supabase and add email verification, password reset, 2FA/passkeys, audit dashboards, and managed backups.
