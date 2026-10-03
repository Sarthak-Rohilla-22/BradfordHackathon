# Pixel Perfect Replica

Implement exactly the screenshot and nothing else

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/a97d7b34-060f-46bb-9fee-c1c6e36f4eac).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Photo recognition

Photo recognition uses the Google Gemini API from the backend. Copy the root
`.env.example` to `.env` and set `GEMINI_API_KEY` to your Google AI Studio key.
The root `.env` is git-ignored; never put the key in a `VITE_*` variable or
frontend file. Start the API and frontend in separate terminals:

```sh
# Project root; install backend requirements once if needed:
./venv/bin/pip install -r requirements.txt
./venv/bin/python -m uvicorn app.main:app --reload
```

```sh
# frontend/
npm run dev
```

The backend defaults to the `gemini-2.5-flash` vision model. Set `GEMINI_MODEL`
on the backend to use another compatible Gemini model.
