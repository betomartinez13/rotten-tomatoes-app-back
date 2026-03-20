# CineRank API — Frontend Integration Guide

## Base URL

```
https://rotten-tomatoes-app-back-production.up.railway.app
```

Interactive docs (Swagger UI): https://rotten-tomatoes-app-back-production.up.railway.app/docs

---

## Authentication

All endpoints except `POST /auth/register`, `POST /auth/login`, `POST /auth/verify-email`, `POST /auth/resend-verification`, `POST /auth/forgot-password`, and `POST /auth/reset-password` require a JWT token.

Send it in the `Authorization` header:

```
Authorization: Bearer <accessToken>
```

Tokens:
- **accessToken** — expires in 15 minutes
- **refreshToken** — expires in 7 days, use it to get new tokens via `POST /auth/refresh`

---

## Endpoints

### Auth

#### `POST /auth/register`
Create a new account. **Does NOT return tokens** — sends a 6-digit verification code to the user's email. Navigate to the verification screen after this call.

**Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Password123"
}
```

Password rules: min 8 chars, at least 1 uppercase, 1 lowercase, 1 number.

**Response `201`:**
```json
{
  "message": "Account created. Please check your email to verify your account."
}
```

**Errors:** `400` validation error · `409` email already exists

---

#### `POST /auth/verify-email`
Verify the account using the 6-digit code sent to email. **Returns tokens on success** — store them and navigate to the home screen.

**Body:**
```json
{
  "email": "john@example.com",
  "code": "483920"
}
```

**Response `200`:**
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "USER",
    "isVerified": true,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

**Errors:** `400` invalid or expired code (code expires in 15 minutes)

---

#### `POST /auth/resend-verification`
Resend the verification code if it expired or was not received.

**Body:**
```json
{
  "email": "john@example.com"
}
```

**Response `200`:**
```json
{
  "message": "If that email exists, a new code was sent"
}
```

**Errors:** `400` account is already verified

---

#### `POST /auth/login`
Login with email and password. The account must be verified first.

**Body:**
```json
{
  "email": "john@example.com",
  "password": "Password123"
}
```

**Response `200`:**
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "USER",
    "isVerified": true,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

**Errors:** `401` invalid credentials · `401` email not verified yet

---

#### `POST /auth/forgot-password`
Request a password reset code. The code is sent to the user's registered email.

**Body:**
```json
{
  "email": "john@example.com"
}
```

**Response `200`:**
```json
{
  "message": "If that email exists, a code was sent"
}
```

Always returns 200 regardless of whether the email exists (security measure).

---

#### `POST /auth/reset-password`
Reset the password using the code received by email.

**Body:**
```json
{
  "email": "john@example.com",
  "code": "483920",
  "newPassword": "NewPassword123"
}
```

**Response `200`:**
```json
{
  "message": "Password updated successfully"
}
```

**Errors:** `400` invalid or expired code (code expires in 15 minutes)

---

#### `POST /auth/refresh`
Exchange a refresh token for new access + refresh tokens.

**Body:**
```json
{
  "refreshToken": "eyJ..."
}
```

**Response `200`:** `{ "accessToken": "...", "refreshToken": "..." }`

**Errors:** `401` invalid or expired refresh token

---

#### `POST /auth/logout`
Invalidates the refresh token. Requires `Authorization` header.

**Response `204`:** No content.

---

### Users

All users endpoints require `Authorization` header.

#### `GET /users/me`
Get the authenticated user's profile.

**Response `200`:**
```json
{
  "id": "uuid",
  "email": "john@example.com",
  "name": "John Doe",
  "role": "USER",
  "createdAt": "...",
  "updatedAt": "..."
}
```

---

#### `PATCH /users/me`
Update name and/or email.

**Body (all fields optional):**
```json
{
  "name": "New Name",
  "email": "newemail@example.com"
}
```

**Response `200`:** Updated user object.

**Errors:** `409` email already in use

---

#### `PATCH /users/me/password`
Change password.

**Body:**
```json
{
  "currentPassword": "OldPassword123",
  "newPassword": "NewPassword456"
}
```

**Response `200`:** `{ "message": "Password updated successfully" }`

**Errors:** `401` current password is incorrect

---

#### `DELETE /users/me`
Delete the authenticated user's account.

**Response `204`:** No content.

---

#### `PATCH /users/:id/role`
Assign a role to any user by ID. Use this to promote a user to CRITIC.

**Body:**
```json
{
  "role": "CRITIC"
}
```

Available roles: `"USER"` | `"CRITIC"`

**Response `200`:** Updated user object.

> Note: This endpoint has no admin guard currently — any authenticated user can call it. Handle access control on the frontend if needed.

---

### Movies

All movies endpoints require `Authorization` header.

#### `GET /movies/search?q=<query>`
Search movies from TMDB. Results are automatically saved to the local database for future use.

**Query params:**
| Param | Type | Required | Description |
|---|---|---|---|
| `q` | string | yes | Search term |

**Response `200`:** Array of movie objects.

```json
[
  {
    "id": "uuid",
    "tmdbId": 27205,
    "title": "Inception",
    "synopsis": "A thief who steals...",
    "releaseDate": "2010-07-16T00:00:00.000Z",
    "posterUrl": "https://image.tmdb.org/t/p/w500/...",
    "backdropUrl": "https://image.tmdb.org/t/p/w500/...",
    "runtime": 148,
    "userRating": 0,
    "criticRating": 0,
    "popularity": 82.5,
    "categories": [
      { "category": { "id": 28, "name": "Action" } }
    ]
  }
]
```

---

#### `GET /movies`
List locally stored movies with filters and pagination.

**Query params (all optional):**
| Param | Type | Default | Description |
|---|---|---|---|
| `search` | string | — | Filter by title |
| `categories` | number[] | — | Filter by category IDs (e.g. `categories=28&categories=12`) |
| `releaseDateFrom` | ISO date string | — | e.g. `2000-01-01` |
| `releaseDateTo` | ISO date string | — | e.g. `2025-12-31` |
| `minUserRating` | number (0–10) | — | Minimum user rating |
| `minCriticRating` | number (0–10) | — | Minimum critic rating |
| `sortBy` | string | — | `userRating` \| `criticRating` \| `releaseDate` \| `popularity` \| `title` |
| `sortOrder` | string | — | `asc` \| `desc` |
| `page` | number | `1` | Page number |
| `limit` | number | `20` | Results per page |

**Response `200`:**
```json
{
  "data": [ ...movies ],
  "total": 150,
  "page": 1,
  "limit": 20,
  "totalPages": 8
}
```

---

#### `GET /movies/:id`
Get full movie detail including categories and all comments.

**Response `200`:**
```json
{
  "id": "uuid",
  "tmdbId": 27205,
  "title": "Inception",
  "synopsis": "...",
  "releaseDate": "2010-07-16T00:00:00.000Z",
  "posterUrl": "https://image.tmdb.org/t/p/w500/...",
  "backdropUrl": "https://image.tmdb.org/t/p/w500/...",
  "runtime": 148,
  "userRating": 7.5,
  "criticRating": 9.0,
  "popularity": 82.5,
  "categories": [
    { "category": { "id": 28, "name": "Action" } }
  ],
  "comments": [
    {
      "id": "uuid",
      "content": "Great movie!",
      "score": 9,
      "userId": "uuid",
      "movieId": "uuid",
      "createdAt": "...",
      "updatedAt": "...",
      "user": { "name": "John Doe", "role": "CRITIC" }
    }
  ]
}
```

**Errors:** `404` movie not found

---

### Comments

All comments endpoints require `Authorization` header.

#### `POST /comments`
Create a comment for a movie. Each user can only comment once per movie.

**Body:**
```json
{
  "content": "Amazing cinematography and story.",
  "score": 9,
  "movieId": "uuid"
}
```

- `content`: max 2000 characters
- `score`: integer between 1 and 10
- `movieId`: UUID of a movie in the local database

**Response `201`:**
```json
{
  "id": "uuid",
  "content": "Amazing cinematography and story.",
  "score": 9,
  "userId": "uuid",
  "movieId": "uuid",
  "createdAt": "...",
  "updatedAt": "...",
  "user": { "name": "John Doe", "role": "USER" }
}
```

After creation, the movie's `userRating` or `criticRating` is automatically recalculated based on the user's role.

**Errors:** `409` you already have a comment for this movie

---

#### `PATCH /comments/:id`
Update your own comment's content and/or score.

**Body (all fields optional):**
```json
{
  "content": "Updated review text.",
  "score": 8
}
```

**Response `200`:** Updated comment object.

**Errors:** `403` trying to update another user's comment · `404` comment not found

---

#### `DELETE /comments/:id`
Delete your own comment. Recalculates movie ratings automatically.

**Response `204`:** No content.

**Errors:** `403` trying to delete another user's comment

---

#### `GET /comments/me`
Get all comments made by the authenticated user. Use this for the profile screen. Includes movie info for each comment.

**Response `200`:**
```json
[
  {
    "id": "uuid",
    "content": "Great movie!",
    "score": 9,
    "userId": "uuid",
    "movieId": "uuid",
    "createdAt": "...",
    "updatedAt": "...",
    "movie": {
      "id": "uuid",
      "title": "Inception",
      "posterUrl": "https://image.tmdb.org/t/p/w500/..."
    }
  }
]
```

---

#### `GET /comments/movie/:movieId`
Get all comments for a specific movie, ordered by newest first.

**Response `200`:** Array of comment objects (same shape as POST response).

---

### Categories

All categories endpoints require `Authorization` header.

#### `GET /categories`
List all movie categories/genres stored locally.

**Response `200`:**
```json
[
  { "id": 28, "name": "Action" },
  { "id": 35, "name": "Comedy" },
  { "id": 18, "name": "Drama" }
]
```

> Category `id` values are TMDB genre IDs (integers), useful for filtering movies via `GET /movies?categories=28`.

---

#### `POST /categories/sync`
Fetch and save all genres from TMDB into the local database. Run once after deploy.

**Response `200`:** Array of synced categories.

---

## Data Models

### User
```ts
{
  id: string         // UUID
  email: string
  name: string
  role: "USER" | "CRITIC"
  createdAt: string  // ISO 8601
  updatedAt: string
}
```

### Movie
```ts
{
  id: string          // UUID (use this for all local references)
  tmdbId: number      // TMDB ID
  title: string
  synopsis: string | null
  releaseDate: string | null  // ISO 8601
  posterUrl: string | null    // Full URL ready to use
  backdropUrl: string | null  // Full URL ready to use
  runtime: number | null      // minutes
  userRating: number          // 0–10, average of USER role scores
  criticRating: number        // 0–10, average of CRITIC role scores
  popularity: number
  categories: { category: { id: number, name: string } }[]
}
```

### Comment
```ts
{
  id: string
  content: string
  score: number      // 1–10
  userId: string
  movieId: string
  createdAt: string
  updatedAt: string
  user: { name: string, role: "USER" | "CRITIC" }
}
```

---

## Rating System

- `userRating` = average score of all comments from users with role `USER`
- `criticRating` = average score of all comments from users with role `CRITIC`
- Both are recalculated automatically on every comment create, update, or delete
- A movie has `0` for a rating if no comments of that role exist yet

---

## Error Response Format

All errors follow this structure:

```json
{
  "statusCode": 400,
  "message": ["Validation error details"],
  "timestamp": "2026-03-13T00:00:00.000Z"
}
```

For single-message errors, `message` may be a string instead of an array.

---

## Recommended Frontend Flow

**Registration:**
1. `POST /auth/register` → show "Check your email" message, navigate to verification screen
2. `POST /auth/verify-email` → store `accessToken` + `refreshToken`, navigate to home
3. If code expired: `POST /auth/resend-verification` → new code sent

**Login:**
1. `POST /auth/login` → store `accessToken` + `refreshToken`, navigate to home
2. If `401` with message `"Please verify your email"` → navigate to verification screen

**Forgot Password:**
1. `POST /auth/forgot-password` → show "Check your email" message, navigate to reset screen
2. `POST /auth/reset-password` → navigate to login with success message

**App flow:**
1. `POST /categories/sync` → run once after first login to populate genres
2. `GET /movies?page=1&limit=20&sortBy=popularity&sortOrder=desc` → home feed
3. `GET /movies/search?q=inception` → search and persist movies
4. `GET /movies/:id` → movie detail page with ratings + comments
5. `POST /comments` → let user leave a review
6. `GET /comments/me` → user's own reviews (profile screen only)
7. When `accessToken` expires (401) → call `POST /auth/refresh` with stored `refreshToken`
