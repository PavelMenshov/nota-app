# Release checklist

Use this before making the repo public or creating a GitHub release.

## Before opening the repo (first-time public)

- [ ] **Secrets** — No `.env` or real API keys in the repo or in git history. (Gitleaks runs in CI.)
- [ ] **Clone URL** — If the repo will live under a different org/user, update `git clone` URLs in README and docs (e.g. `GETTING-STARTED.md`, `API.md`) from `PavelMenshov/nota-platform` to your repo URL.
- [ ] **LICENSE** — `LICENSE` is present (MIT). Update the copyright holder in `LICENSE` if needed.
- [ ] **Contacts** — Docs reference `support@nota.app` and `security@nota.app`; create or replace with real addresses if desired.
- [ ] **Git history** — If any secret was ever committed, rotate that credential and consider rewriting history (e.g. `git filter-repo`, BFG) before going public.

## Before creating a release (tag)

- [ ] **Version** — Root `package.json` has a version (e.g. `0.1.0`). Bump if you want the release to reflect a new version.
- [ ] **Changelog** — Optionally add or update `CHANGELOG.md` with what’s in this release.
- [ ] **Tag** — Create an annotated tag, e.g. `git tag -a v0.1.0 -m "Initial public release"`.
- [ ] **Push tag** — `git push origin v0.1.0`.
- [ ] **GitHub release** — On GitHub: Releases → Draft a new release, choose the tag, add release notes (you can paste from CHANGELOG).

## After the repo is public

- [ ] Enable **GitHub secret scanning** and **Dependabot alerts** in repo settings if desired.
- [ ] Optionally add **CONTRIBUTING.md** with contribution guidelines and link it from the README.
