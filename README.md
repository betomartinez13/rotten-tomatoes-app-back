# CineRank API

REST API for **CineRank**, a movie and series review platform with differentiated ratings between regular users and critics.

Built with **NestJS 11 · Prisma 7 · PostgreSQL 16 · TMDB API**

---

## Features

- JWT authentication with access and refresh tokens
- Two user roles: `USER` and `CRITIC` with separate weighted ratings
- Movie search via TMDB with local persistence
- Filterable and paginated movie listing
- Comment system (one per user per movie)
- Automatic recalculation of user and critic ratings on every comment operation
- Genre/category sync from TMDB
- Swagger documentation at `/docs`
- Rate limiting and global validation

---

## Tech Stack

| Technology | Role |
|---|---|
| NestJS 11 | Main framework |
| TypeScript 5 | Language |
| PostgreSQL 16 | Relational database |
| Prisma 7 | ORM + migrations |
| Passport + JWT | Authentication |
| @nestjs/axios | HTTP calls to TMDB |
| class-validator | DTO validation |
| Swagger / OpenAPI | API documentation |
| Docker | Local PostgreSQL |
| Railway | Cloud deployment |

---

## Getting Started

### Prerequisites

- Node.js 20+
- Docker Desktop
- A [TMDB API key](https://www.themoviedb.org/settings/api) (free)

### Installation

```bash
git clone https://github.com/betomartinez13/rotten-tomatoes-app-back.git
cd rotten-tomatoes-app-back
npm install
```

### Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://usuario:password@localhost:5433/cinerank_db?schema=public"
JWT_SECRET="your-secret-key"
PORT=3000
CORS_ORIGIN=*
TMDB_API_KEY="your-tmdb-api-key"
TMDB_BASE_URL="https://api.themoviedb.org/3"
TMDB_IMAGE_BASE_URL="https://image.tmdb.org/t/p/w500"
```

### Running Locally

```bash
# Start PostgreSQL
docker-compose up -d

# Run migrations
npx prisma migrate dev

# Start development server
npm run start:dev
```

API available at `http://localhost:3000`
Swagger docs at `http://localhost:3000/docs`

---

## API Endpoints

### Auth
| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Register new user |
| POST | `/auth/login` | Public | Login |
| POST | `/auth/refresh` | Public | Refresh access token |
| POST | `/auth/logout` | JWT | Logout |

### Users
| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/users/me` | JWT | Get own profile |
| PATCH | `/users/me` | JWT | Update own profile |
| DELETE | `/users/me` | JWT | Delete account |
| PATCH | `/users/:id/role` | JWT | Assign CRITIC role |

### Movies
| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/movies` | JWT | List movies with filters and pagination |
| GET | `/movies/search?q=` | JWT | Search from TMDB (persists locally) |
| GET | `/movies/:id` | JWT | Full detail with cast, ratings and comments |

**Available query params for** `GET /movies`:

| Param | Type | Description |
|---|---|---|
| `search` | string | Filter by title |
| `categories` | number[] | Filter by TMDB genre IDs |
| `releaseDateFrom` | date | Filter by release date range |
| `releaseDateTo` | date | Filter by release date range |
| `minUserRating` | number | Minimum user rating (0-10) |
| `minCriticRating` | number | Minimum critic rating (0-10) |
| `sortBy` | string | `userRating`, `criticRating`, `releaseDate`, `popularity`, `title` |
| `sortOrder` | string | `asc` or `desc` |
| `page` | number | Page number (default: 1) |
| `limit` | number | Results per page (default: 20) |

### Comments
| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/comments` | JWT | Create comment with score (1-10) |
| PATCH | `/comments/:id` | JWT | Edit own comment |
| DELETE | `/comments/:id` | JWT | Delete own comment |
| GET | `/comments/movie/:movieId` | JWT | Get all comments for a movie |

### Categories
| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/categories` | JWT | List all categories |
| POST | `/categories/sync` | JWT | Sync genres from TMDB |

---

## Data Model

```
users ──1:N──> comments <──N:1── movies
                                    │
                               N:M  │
                            categories
```

- `userRating` — average score from comments by users with `role = USER`
- `criticRating` — average score from comments by users with `role = CRITIC`
- Both ratings recalculate automatically on every comment create/update/delete
- One comment per user per movie enforced at the database level (`@@unique([userId, movieId])`)

---

## Project Structure

```
src/
├── auth/               # Register, login, refresh token, logout
├── users/              # User profile management + role assignment
├── movies/             # TMDB integration, search, filters, detail
│   ├── tmdb.service.ts # All TMDB API calls
│   └── dto/            # MovieFilterDto
├── comments/           # CRUD + weighted rating recalculation
├── categories/         # Genre listing and TMDB sync
├── prisma/             # Global PrismaService
└── common/
    ├── decorators/     # @Public(), @CurrentUser(), @Roles()
    ├── filters/        # Global HTTP exception filter
    └── guards/         # JwtAuthGuard, RolesGuard
```

---

## Deployment

Configured for deployment on **Railway** with Docker.

The `start:migrate:prod` script runs migrations automatically before starting:

```bash
npx prisma migrate deploy && node dist/main
```

Required environment variables in Railway:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Auto-injected by Railway PostgreSQL plugin |
| `JWT_SECRET` | Set manually |
| `TMDB_API_KEY` | Your TMDB API key |
| `TMDB_BASE_URL` | `https://api.themoviedb.org/3` |
| `TMDB_IMAGE_BASE_URL` | `https://image.tmdb.org/t/p/w500` |
