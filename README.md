# 📚 Bibliothèque Numérique — DIT

Projet DevOps — Master 1 Intelligence Artificielle — Dakar Institute of Technology (DIT)

Plateforme web de gestion de bibliothèque académique basée sur une **architecture
microservices**, conteneurisée avec **Docker**, orchestrée avec **Docker Compose** et
déployée automatiquement via un pipeline **CI/CD Jenkins**.

---

## 1. Architecture du système

```
                        ┌──────────────────────┐
                        │      Frontend        │
                        │   (Nginx : HTML/JS)  │
                        │      port 8080       │
                        └──────────┬───────────┘
                                   │ reverse-proxy /api/*
        ┌──────────────────────────┼──────────────────────────┐
        ▼                          ▼                          ▼
┌────────────────┐          ┌────────────────┐          ┌─────────────────┐
│ books-service  │          │ users-service  │          │ loans-service   │
│  (Node/Express)│◄────────►│ (Node/Express) │◄────────►│ (Node/Express)  │
│   port 3001    │   REST   │   port 3002    │  REST    │   port 3003     │
└───────┬────────┘          └───────┬────────┘          └────────┬────────┘
        │                           │                            │
        └───────────────┬───────────┴────────────────────────────┘
                        ▼
                 ┌────────────────┐
                 │     MySQL      │
                 │ books_db       │
                 │ users_db       │
                 │ loans_db       │
                 └────────────────┘
```

Le service `loans-service` appelle `books-service` (vérifier/mettre à jour la
disponibilité d'un livre) et `users-service` (vérifier l'existence d'un utilisateur) via
des appels REST internes au réseau Docker `bibliotheque-net`.

## 2. Description des microservices

### 2.1 books-service (port 3001)
Gestion du catalogue de livres.
- `GET /api/books` — liste des livres (paramètre `?search=` pour rechercher par titre,
  auteur ou ISBN)
- `GET /api/books/:id` — détail d'un livre
- `POST /api/books` — ajouter un livre
- `PUT /api/books/:id` — modifier un livre
- `DELETE /api/books/:id` — supprimer un livre
- `PATCH /api/books/:id/availability` — route interne utilisée par `loans-service`

### 2.2 users-service (port 3002)
Gestion des utilisateurs (étudiants, professeurs, personnel administratif).
- `GET /api/users` — liste des utilisateurs (paramètre `?type=`)
- `GET /api/users/:id` — profil d'un utilisateur
- `POST /api/users` — créer un utilisateur
- `PUT /api/users/:id` — modifier un utilisateur
- `DELETE /api/users/:id` — supprimer un utilisateur

### 2.3 loans-service (port 3003)
Gestion des emprunts.
- `GET /api/loans` — historique des emprunts (`?status=`, `?user_id=`)
- `GET /api/loans/overdue` — détection des retards
- `POST /api/loans` — emprunter un livre (vérifie l'utilisateur et la disponibilité)
- `PUT /api/loans/:id/return` — retourner un livre

### 2.4 frontend
Application statique (HTML / CSS / JavaScript vanilla) servie par Nginx, qui fait
également office de reverse-proxy vers les 3 microservices backend afin d'éviter les
problèmes de CORS et de centraliser le point d'entrée de l'application.

## 3. Installation du projet

### Prérequis
- Docker ≥ 24
- Docker Compose ≥ 2
- Git

### Cloner le dépôt
```bash
git clone https://github.com/9Niang9/Projet_Devops.git
cd bibliotheque-numerique
```

## 4. Lancement avec Docker Compose

```bash
docker-compose up -d --build
```

Cette commande va :
1. Démarrer un conteneur MySQL et initialiser automatiquement les 3 bases de données
   (`books_db`, `users_db`, `loans_db`) via `init-db/init.sql`.
2. Construire et démarrer les 3 microservices backend.
3. Construire et démarrer le frontend (Nginx).

### Accès à l'application
| Composant        | URL                              |
|-------------------|-----------------------------------|
| Frontend           | http://localhost:8080            |
| API Livres         | http://localhost:3001/api/books  |
| API Utilisateurs   | http://localhost:3002/api/users  |
| API Emprunts       | http://localhost:3003/api/loans  |

### Arrêter l'application
```bash
docker-compose down
```

### Arrêter et supprimer les données (volume MySQL)
```bash
docker-compose down -v
```

## 5. Fonctionnement du pipeline Jenkins

Le fichier `Jenkinsfile` définit un pipeline déclaratif en 7 étapes :

1. **Checkout** — récupération du code source depuis GitHub.
2. **Installation des dépendances** — `npm install` en parallèle pour les 3 microservices.
3. **Lint / vérification de syntaxe** — `node --check` sur chaque service.
4. **Build des images Docker** — `docker-compose build` construit toutes les images.
5. **Tests** — étape réservée aux tests automatisés (à compléter selon les besoins).
6. **Déploiement** — `docker-compose down` puis `docker-compose up -d` pour redéployer
   la stack complète.
7. **Vérification post-déploiement** — appel des routes `/health` de chaque service et
   du frontend pour confirmer que le déploiement a réussi.

Le pipeline se déclenche automatiquement à chaque `push` sur le dépôt GitHub
(configuration du webhook / polling à faire côté Jenkins).

## 6. Structure du projet

```
bibliotheque-numerique/
├── backend/
│   ├── books-service/
│   │   ├── routes/books.js
│   │   ├── db.js
│   │   ├── server.js
│   │   ├── package.json
│   │   └── Dockerfile
│   ├── users-service/
│   │   ├── routes/users.js
│   │   ├── db.js
│   │   ├── server.js
│   │   ├── package.json
│   │   └── Dockerfile
│   └── loans-service/
│       ├── routes/loans.js
│       ├── db.js
│       ├── server.js
│       ├── package.json
│       └── Dockerfile
├── frontend/
│   ├── css/style.css
│   ├── js/{api.js, books.js, users.js, loans.js}
│   ├── index.html, books.html, users.html, loans.html
│   ├── nginx.conf
│   └── Dockerfile
├── init-db/
│   └── init.sql
├── docker-compose.yml
├── Jenkinsfile
└── README.md
```

## 7. Technologies utilisées

- **Backend** : Node.js / Express, MySQL2, Axios (communication inter-services)
- **Frontend** : HTML / CSS / JavaScript (vanilla), servi par Nginx
- **Base de données** : MySQL 8.0
- **Conteneurisation** : Docker, Docker Compose
- **CI/CD** : Jenkins (pipeline déclaratif)
- **Gestion de version** : Git / GitHub

## 8. Auteurs

Équipe DevOps — Master 1 Intelligence Artificielle — Dakar Institute of Technology (DIT)
#  Projet_Devops