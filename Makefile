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
	@echo "Starting Prism API mock..."
	cd frontend && npm run prism &
	@sleep 2
	@echo "Starting Vite dev server..."
	cd frontend && npm run dev
