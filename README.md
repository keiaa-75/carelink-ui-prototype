# CareLink UI Prototype

<p align="left">
    <img alt = "Figma" src="https://img.shields.io/badge/figma-%23F24E1E.svg?style=for-the-badge&logo=figma&logoColor=white"/>
	<img alt = "Claude" src="https://img.shields.io/badge/Claude-D97757?style=for-the-badge&logo=claude&logoColor=white"/>
	<img alt = "Kiro" src="https://img.shields.io/badge/Kiro-9046FF?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwMCIgaGVpZ2h0PSIxMjAwIiB2aWV3Qm94PSIyNTAgMTIwIDcyNSA5NTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI%2BPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGZpbGw9IndoaXRlIiBkPSJNMzk4LjU1NCA4MTguOTE0QzMxNi4zMTUgMTAwMS4wMyA0OTEuNDc3IDEwNDYuNzQgNjIwLjY3MiA5NDAuMTU2QzY1OC42ODcgMTA1OS42NiA4MDEuMDUyIDk3MC40NzMgODUyLjIzNCA4NzcuNzk1Qzk2NC43ODcgNjczLjU2NyA5MTkuMzE4IDQ2NS4zNTcgOTA3LjY0IDQyMi4zNzRDODI3LjYzNyAxMjkuNDQzIDQyNy42MjMgMTI4Ljk0NiAzNTguOCA0MjMuODY1QzM0Mi42NTEgNDc1LjU0NCAzNDIuNDAyIDUzNC4xOCAzMzMuNDU4IDU5NS4wNTFDMzI4Ljk4NiA2MjUuODYgMzI1LjUwNyA2NDUuNDg4IDMxMy44MyA2NzcuNzg1QzMwNi44NzMgNjk2LjQyNCAyOTcuNjggNzEyLjgxOSAyODIuNzczIDc0MC42NDVDMjU5LjkxNSA3ODMuODgxIDI2OS42MDQgODY3LjExMyAzODcuODcgODIzLjg4M0wzOTkuMDUxIDgxOC45MTRIMzk4LjU1NFogTTYzNi4xMjMgNTQ5LjM1M0M2MDMuMzI4IDU0OS4zNTMgNTk4LjM1OSA1MTAuMDk3IDU5OC4zNTkgNDg2Ljc0MkM1OTguMzU5IDQ2NS42MjMgNjAyLjA4NiA0NDguOTc3IDYwOS4yOTMgNDM4LjI5M0M2MTUuNTA0IDQyOC44NTIgNjI0LjY5NyA0MjQuMTMxIDYzNi4xMjMgNDI0LjEzMUM2NDcuNTU1IDQyNC4xMzEgNjU3LjQ5MiA0MjguODUyIDY2NC40NDcgNDM4LjU0MUM2NzIuMzk4IDQ0OS40NzQgNjc2LjYyMyA0NjYuMTIgNjc2LjYyMyA0ODYuNzQyQzY3Ni42MjMgNTI1Ljk5OCA2NjEuNDcxIDU0OS4zNTMgNjM2LjM3NSA1NDkuMzUzSDYzNi4xMjNaIE03NzEuMjQgNTQ5LjM1M0M3MzguNDQ1IDU0OS4zNTMgNzMzLjQ3NyA1MTAuMDk3IDczMy40NzcgNDg2Ljc0MkM3MzMuNDc3IDQ2NS42MjMgNzM3LjIwMyA0NDguOTc3IDc0NC40MSA0MzguMjkzQzc1MC42MjEgNDI4Ljg1MiA3NTkuODE0IDQyNC4xMzEgNzcxLjI0IDQyNC4xMzFDNzgyLjY3MiA0MjQuMTMxIDc5Mi42MDkgNDI4Ljg1MiA3OTkuNTY0IDQzOC41NDFDODA3LjUxNiA0NDkuNDc0IDgxMS43NCA0NjYuMTIgODExLjc0IDQ4Ni43NDJDODExLjc0IDUyNS45OTggNzk2LjU4OCA1NDkuMzUzIDc3MS40OTIgNTQ5LjM1M0g3NzEuMjRaIi8%2BPC9zdmc%2B"/>
    <img alt = "TypeScript" src="https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white"/>
    <img alt = "React" src="https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB"/>
    <img alt = "Tailwind" src="https://img.shields.io/badge/tailwind-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white">
    <img alt = "Vite" src="https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white"/>
</p>

Simple UI prototype of a barangay healthcare platform for screening, referrals, and shared patient records.

This is frontend-only. All data is fictional mock data for click-through and layout exploration. There is no backend, auth, or database wired up yet.

## What it shows

Landing page plus role-based dashboards:

| Role | What the prototype demonstrates |
| --- | --- |
| `citizen` | Home, health card, medical record, e-prescriptions, doctor notes, access history |
| `barangay_staff` | Dashboard, patient masterlist, households, add resident, health screening, referrals, QR / patient ID, reports |
| `physician` | Dashboard, patient lookup, consultations, records, notes, e-prescriptions, referrals |
| `admin` | Overview, physician applications, staff management, system reports, audit logs |

See `tech.md` for the planned full-stack target. It is not implemented here.

## Getting started

Prerequisites: `mise` for the pinned toolchain (Node 22 in `.mise.toml`).

```sh
mise install
npm install
npm run dev
```

Dev server runs on `$PORT` (default `8443`).

Other scripts:

```sh
npm run build    # production build
npm run preview  # preview the build
npm run format   # oxfmt
```