# Contributing to revAIve

Thank you for your interest in contributing to **revAIve**!

## Code of Conduct
We are committed to providing a welcoming and inclusive community. Please maintain a professional and respectful tone in all communications and code reviews.

## Development Workflow

### 1. Fork & Clone
```bash
git clone https://github.com/revaive/revaive.git
cd revaive
```

### 2. Environment Setup
Copy `.env.example` to `.env` and set local variables.
```bash
cp .env.example .env
```

### 3. Running Backend Tests
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
USE_SQLITE_TEST=true PYTHONPATH=. pytest tests/
```

### 4. Running Frontend Checks
```bash
cd apps/web
npm install
npx tsc --noEmit
npm run build
```

## Pull Request Guidelines
- Branch naming: `feature/short-description`, `fix/short-description`, `chore/short-description`.
- Follow Conventional Commits format (`feat: ...`, `fix: ...`, `test: ...`, `docs: ...`).
- Include test coverage for new functionality or bug fixes.
- Ensure all CI quality checks pass.
