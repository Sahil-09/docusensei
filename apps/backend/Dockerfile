FROM node:24-alpine AS base
LABEL authors="sahil"

WORKDIR /

#ENABLE PNPM
ENV PNPM_HOME='/pnpm'
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

RUN pwd

COPY dist/apps/backend/pnpm-lock.yaml dist/apps/backend/package.json ./

RUN pnpm install --prod --frozen-lockfile;  \
    pnpm approve-builds --all && \
    pnpm install --frozen-lockfile

COPY /apps/backend/prisma ./prisma
RUN npx prisma generate

COPY dist/apps/backend ./

ENV PORT=3000
ENV NODE_ENV=production
EXPOSE 3000

CMD ["node","main.js"]
