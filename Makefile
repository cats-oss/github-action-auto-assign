NPM_MOD_DIR := $(CURDIR)/node_modules
NPM_BIN := $(NPM_MOD_DIR)/.bin

all: help

help:
	@echo "Specify the task"
	@grep -E '^[0-9a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'
	@exit 1

# Test
test: lint ## Run tests & lints for all.

lint: eslint

.PHONY: eslint
eslint:
	$(NPM_BIN)/eslint --ext=js,jsx,mjs $(CURDIR)