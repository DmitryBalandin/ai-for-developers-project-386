.PHONY: dev prism build install backend dev-all

dev:
	cd frontend && npm run dev

prism:
	cd frontend && npm run prism

backend:
	cd backend && npm run dev

build:
	cd frontend && npm run build

install:
	cd frontend && npm install

install-backend:
	cd backend && npm install

dev-all:
	@echo "Starting backend on port 3000..."
	cd backend && npm run dev &
	@echo "Waiting for backend..."
	@for i in $$(seq 1 10); do curl -s http://localhost:3000/api/event-types > /dev/null 2>&1 && break; sleep 1; done
	@echo "Starting Vite dev server..."
	cd frontend && npm run dev
