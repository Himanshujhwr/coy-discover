# Coy Discover

A swipe-based **Discover** tab for Coy (SDE intern assignment, Part B), plus two product suggestions (Part A).
Coy's core promise is that **nobody learns who liked them unless it is mutual**. Every part of this
app is built around that rule.

- Mobile-first Next.js app with a placeholder **Home** tab and a fully working **Discover** tab
- Swipe with drag gestures (mobile) or buttons / arrow keys (desktop)
- Matches only on mutual likes, with an "It's a Match!" screen and a Matches list
- Filters, undo, detailed profile view, block and report, loading / empty / error states, live stats

The SQLite file is created and seeded on first request at `data/coy.db`. Delete the `data/` folder
(or run `npm run db:reset`) to start over. Set `DATABASE_FILE` to use a different location.

> **Status of this build:** the backend (database, services, API route handlers) was run and tested end
> to end: 37 passing tests, including real `Request`/`Response` calls to every route against a real
> SQLite file. The Next.js UI was written against the same API but **has not been compiled or run
> yet**, because package installs were blocked in the environment it was built in. Run `npm install`
> and `npm run dev`, and expect to fix the odd typo or styling nit on first launch.

## Deviations from the requested stack

| Requested  | Used                                         | Why                                                                                                                                                                                                                                                                                                                                                          |
| ---------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Prisma ORM | Node's built-in `node:sqlite` with plain SQL | Prisma and its engines couldn't be installed in the build environment, and this was the only way to run and test the data layer. The schema uses real foreign keys, `UNIQUE` and `CHECK` constraints. Moving to Prisma means translating `src/server/db.ts` into a `schema.prisma`; the services take a `Db` handle and are the only code that would change. |

Everything else (Next.js App Router, React, TypeScript, Tailwind, Framer Motion, Lucide) is as requested.
The Coy screenshots supplied were pages of the assignment text, not app screens, so the palette
(white, ink, pink accent, soft lavender) follows the written design brief.

## Architecture

```
src/
  server/                  # framework-free business logic (no React, no Next imports)
    db.ts                  # schema, constraints, transactions
    seed.ts                # 32 profiles + the demo user; 9 of the profiles already liked the demo user
    client.ts              # lazy DB singleton for API routes
    services/              # feed, swipe (+undo), matches, safety (block/report), stats, profiles
    http.ts, errors.ts     # error -> HTTP status mapping
  app/api/**/route.ts      # thin HTTP handlers: parse, call a service, respond
  app/                     # pages: Home (blank) and Discover
  components/discover/     # SwipeDeck, MatchOverlay, sheets, lists, states
  lib/                     # API client + useDiscover hook (all client state)
tests/                     # node:test suites
```

**Privacy by construction**

- A like is stored as a private row in `swipes`. A match row is created _only_ inside the swipe
  transaction, and _only_ when the reverse like already exists.
- The profile shape has no field that could carry like information, and a test asserts no API
  payload contains the word "like".
- Feed order is by id, never by "likes you", so ordering can't leak either.
- Passing on someone permanently settles that pair: re-swiping is a `409`, so a pass can't be
  flipped into a match later.
- Undo is the only way to reverse a swipe, and it removes any match the swipe created.

**Data model** (`users`, `user_photos`, `interests`, `user_interests`, `swipes`, `matches`, `blocks`,
`reports`): `UNIQUE(swiper_id, target_id)` blocks duplicate swipes at the database level,
`CHECK(user_a_id < user_b_id)` stores each match pair exactly once, and all relations cascade.

**Swipe consistency (frontend):** swipes are applied optimistically, then sent through a serial request
queue so they reach the server in order. If a request fails, the deck reloads from the server, the
source of truth. Deck refills run in the same queue, and a client-side set stops an in-flight card
from reappearing.

## API

All responses are JSON. Errors look like `{ "error": { "code": "conflict", "message": "..." } }`.
The single logged-in user is fixed as `id = 1` (no auth, per the assignment).

| Method & path           | Purpose                                                                                                                                            | Success                                   | Errors                                                     |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | ---------------------------------------------------------- |
| `GET /api/feed`         | Unswiped, unblocked profiles. Query: `limit` (1-50, default 10), `minAge`, `maxAge`, `city`, `college`, `interests` (comma-separated, matches any) | `200 { profiles, remaining }`             | `400` bad params                                           |
| `POST /api/swipe`       | Body `{ targetId, action: "like" \| "pass" }`                                                                                                      | `201 { swipeId, action, matched, match }` | `400` invalid, `404` unknown/blocked, `409` already swiped |
| `POST /api/swipe/undo`  | Reverses the latest swipe and any match it made                                                                                                    | `200 { profile, action }`                 | `404` nothing to undo                                      |
| `GET /api/matches`      | Mutual matches only, newest first                                                                                                                  | `200 { matches }`                         |                                                            |
| `GET /api/profiles/:id` | Full profile (all photos, interests)                                                                                                               | `200` profile                             | `400`, `404`                                               |
| `POST /api/blocks`      | Body `{ targetId }`                                                                                                                                | `201`                                     | `400`, `404`, `409`                                        |
| `POST /api/reports`     | Body `{ targetId, reason, details? }`; also blocks. Reasons: `fake_profile`, `inappropriate_photos`, `harassment`, `spam`, `underage`, `other`     | `201`                                     | `400`, `404`, `409`                                        |
| `GET /api/stats`        | `{ viewed, likes, passes, matches }`                                                                                                               | `200`                                     |                                                            |
| `GET /api/filters`      | Cities, colleges, interests, age range for the filter UI                                                                                           | `200`                                     |                                                            |
| `GET /api/me`           | The demo user (for the match screen)                                                                                                               | `200`                                     |                                                            |

## Demo script

1. Open **Discover**. Swipe right on a few profiles; 4 of the first 11 profiles
   already liked you, so you'll hit **It's a Match!** quickly.
2. Tap **Undo** right after a match: the match disappears from **Matches** and the stats drop back.
3. Tap a card (or the info button) for the full profile, extra photos, and Block / Report.
4. Open **Filters**, narrow by city or interest, and note the empty state when nothing fits.
5. Reload the page: swipes, matches and stats are all still there.

---

# Part A: Product Analysis – Coy

## Understanding the Existing Product

Coy is an anonymous crush-discovery platform that helps people discover whether someone they know has mutual feelings for them, without the awkwardness of directly expressing their interest.

Unlike traditional dating applications, Coy focuses on connecting people who already know each other rather than discovering strangers.

Based on my exploration of the application, its core functionality includes:

- **Phone OTP Login:** Users can register and access their accounts using their mobile numbers.
- **Adding a Crush:** Users can add someone using their phone number or email address.
- **Anonymous Notifications:** The added person receives an anonymous SMS notification without knowing who added them.
- **Mutual Matching:** When two users add each other, both discover the match.
- **Limited Crush Slots:** Users receive three initial slots and can earn additional slots through referrals or purchase more.
- **Invite System:** Users can invite friends and earn an additional slot when three invited friends join and add a crush.
- **Settings:** Users can manage their personal information, email, notifications and account preferences.

Coy's strongest differentiator is its privacy-first approach. It makes expressing interest easier by revealing identities only when the interest is mutual.

Based on this experience, I identified two opportunities that could further improve the product.

## Feature 1: Crush Lifecycle Dashboard & Smart Reminders

**Problem:**

Coy uses a limited-slot system, where users need to carefully decide whom to add. The application already communicates the number of occupied slots and offers options to purchase additional ones.

However, managing multiple crush entries over time could become confusing, particularly when users want to understand the status of their entries, how long they have been active and when a slot may become available again.

**Proposed Solution:**

Introduce a dedicated Crush Lifecycle Dashboard that gives users a clearer overview of their existing crush entries and slot usage.

Key functionality:

- Display all added crushes in one organised view.
- Show the current status of each entry, such as Pending, Matched or Expired.
- Display the date on which each crush was added.
- Show the expiry timeline for unmatched entries.
- Provide reminders before an unmatched entry expires.
- Clearly communicate when a slot becomes available again.

**Why is this important?**

Since crush slots are limited and users can also purchase additional ones, better visibility into their usage can improve transparency and help users make informed decisions.

It can reduce confusion, improve the perceived value of purchased slots and encourage users to remain engaged with the platform.

The feature should only display information about crushes added by the user and must never reveal non-mutual interest or compromise Coy's anonymity principle.

## Feature 2: Smart Match Handoff & Conversation Starters

**Problem:**

Discovering a mutual crush is the most exciting moment in Coy. However, even after receiving a successful match, users may hesitate to initiate the first conversation because they are unsure how to approach the other person.

Although users can continue connecting through external platforms such as WhatsApp or email, starting that first conversation can still feel awkward.

**Proposed Solution:**

Introduce an optional Smart Match Handoff feature that helps users take the next step after a successful match.

Key functionality:

- Provide suggested conversation starters after a mutual match.
- Offer different categories such as Casual, Funny, Friendly and Romantic.
- Allow users to copy suggested messages with a single tap.
- Provide quick actions to continue through WhatsApp or email.
- Allow users to choose whether they want to initiate a conversation.
- Never send messages automatically or introduce unwanted communication.

**Why is this important?**

This feature addresses the hesitation users may experience after discovering mutual interest.

It makes the matching experience more meaningful, encourages real-world conversations and can improve user engagement and retention.

It also complements Coy's existing privacy-focused approach by keeping communication optional and allowing users to continue conversations outside the application.

## Conclusion

Coy already has a distinctive product concept built around anonymity, mutual consent and simplicity.

The two proposed features address different stages of the user journey:

1. **Crush Lifecycle Dashboard:** Improves transparency, slot management and the overall user experience.
2. **Smart Match Handoff:** Improves post-match engagement and helps users turn mutual interest into meaningful connections.

Both features build upon Coy's existing functionality rather than changing its core identity.

I believe these improvements could make Coy more transparent, engaging and user-friendly while preserving the privacy-first experience that differentiates it from traditional dating platforms.
