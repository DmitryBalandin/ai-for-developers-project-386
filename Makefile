.PHONY: dev prism build install

dev:
	cd frontend && npm run dev

prism:
	cd frontend && npm run prism

build:
	cd frontend && npm run build

install:
	cd frontend && npm install

dev-all:
	@echo "Starting Prism API mock on port 3000..."
	cd frontend && npm run prism &
	@echo "Waiting for Prism..."
	@for i in $$(seq 1 10); do curl -s http://localhost:3000/api/public/event-types > /dev/null 2>&1 && break; sleep 1; done
	@echo "Starting Vite dev server..."
	cd frontend && npm run dev
