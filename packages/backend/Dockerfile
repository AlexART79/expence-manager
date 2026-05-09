FROM node:22-bookworm-slim AS deps

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/backend/package.json packages/backend/package.json
COPY packages/frontend/package.json packages/frontend/package.json

RUN npm ci

FROM deps AS build

COPY tsconfig.base.json ./
COPY packages/backend packages/backend

RUN npm run build --workspace @expense-tracker/backend

FROM node:22-bookworm-slim AS runtime

ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/backend/package.json packages/backend/package.json
COPY packages/frontend/package.json packages/frontend/package.json
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/packages/backend ./packages/backend

EXPOSE 3000

CMD ["sh", "-c", "npm run db:migrate --workspace @expense-tracker/backend && npm run start --workspace @expense-tracker/backend"]
