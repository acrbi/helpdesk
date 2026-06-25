.PHONY: help up down seed logs test build

help:
	@echo "HelpDesk Pro — Comandos disponibles:"
	@echo "  make up      Levantar todos los servicios con Docker"
	@echo "  make down    Detener todos los servicios"
	@echo "  make seed    Poblar base de datos con datos demo"
	@echo "  make logs    Ver logs del backend"
	@echo "  make test    Ejecutar tests del backend"
	@echo "  make build   Build de imágenes Docker"

up:
	docker compose up -d
	@echo "✅ Servicios levantados — Frontend: http://localhost:3000"

down:
	docker compose down

seed:
	docker compose exec backend node scripts/seed.js

logs:
	docker compose logs -f backend

test:
	cd backend && npm test

build:
	docker compose build --no-cache
