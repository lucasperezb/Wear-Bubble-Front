FROM node:22-bookworm-slim AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM dependencies AS build
ARG BACKEND_API_URL=http://api.internal:4007/api
ARG NEXT_PUBLIC_API_BASE=/api
ARG NEXT_PUBLIC_FREE_SHIPPING_MINIMUM=199
ENV BACKEND_API_URL=$BACKEND_API_URL \
    NEXT_PUBLIC_API_BASE=$NEXT_PUBLIC_API_BASE \
    NEXT_PUBLIC_FREE_SHIPPING_MINIMUM=$NEXT_PUBLIC_FREE_SHIPPING_MINIMUM
COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production \
    PORT=4000 \
    HOSTNAME=0.0.0.0
WORKDIR /app
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
USER node
EXPOSE 4000
CMD ["node", "server.js"]
