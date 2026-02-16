# MagicRedButton

Prosta aplikacja React z ciemnym tłem i dużym czerwonym przyciskiem, który po kliknięciu odtwarza dźwięk.

## Uruchomienie lokalnie

1. Zainstaluj zależności:

	```bash
	npm install
	```

2. Uruchom serwer developerski:

	```bash
	npm run dev
	```

3. Otwórz adres pokazany przez Vite (zwykle `http://localhost:5173`).

## Publikacja na GitHub Pages (GitHub Actions)

Repozytorium zawiera workflow: `.github/workflows/deploy-pages.yml`.

Po pushu do gałęzi `main` strona zostanie zbudowana i opublikowana na GitHub Pages.

Po pierwszym pushu upewnij się w ustawieniach repozytorium:

1. `Settings` -> `Pages`
2. `Build and deployment` -> `Source: GitHub Actions`

Workflow buduje aplikację (`npm run build`) i publikuje katalog `dist`.