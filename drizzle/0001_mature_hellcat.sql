CREATE TABLE `stores` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `name` text NOT NULL,
  `is_active` integer DEFAULT true NOT NULL,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL
);
