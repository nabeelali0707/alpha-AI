FROM node:18-alpine

WORKDIR /app

COPY frontend/package*.json ./
RUN npm ci --silent

COPY frontend/ /app

ENV NEXT_PUBLIC_ALPHAAI_API_BASE_URL=http://backend:8001/api/v1

EXPOSE 3000

CMD ["npm", "run", "dev"]
