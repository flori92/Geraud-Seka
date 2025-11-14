# Structures de données – Authentification et Multi-tenance

Ce document décrit les tables et relations implémentées dans la base PostgreSQL pour l’authentification de base et la gestion multi-clients.

## Tables principales

### `tenants`
- `id` (UUID, PK)
- `name` (string, unique)
- `slug` (string, unique)
- `country` (string)
- `created_at`, `updated_at`
- Relations
  - `users`: utilisateurs rattachés au cabinet
  - `clients`: dossiers clients gérés par le cabinet

### `users`
- `id` (UUID, PK)
- `email` (string, unique, index)
- `hashed_password` (string)
- `full_name` (string)
- `role` (string: admin, cabinet, collaborateur, client, etc.)
- `is_active` (bool)
- `is_superuser` (bool)
- `tenant_id` (UUID → `tenants.id`)
- `created_at`, `updated_at`
- Relations
  - `tenant`: cabinet auquel appartient l’utilisateur

### `clients`
- `id` (UUID, PK)
- `name` (string)
- `slug` (string)
- `sector` (string)
- `tenant_id` (UUID → `tenants.id`)
- `created_at`, `updated_at`
- Relations
  - `tenant`: cabinet propriétaire du dossier client

## Extensions futures
- Table `roles` + `user_roles` (RBAC fine-grained)
- Table `sessions` (revocation tokens + refresh tokens)
- Table `audit_logs` (traçabilité complète)

Ce socle sera enrichi avec les tables métiers (documents, règles, écritures...) lors des prochaines itérations.
