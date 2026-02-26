CREATE TABLE IF NOT EXISTS `recent_scans` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `barcode` text NOT NULL,
  `scanned_at` integer NOT NULL,
  `source` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `recent_scans_scanned_at_idx` ON `recent_scans` (`scanned_at`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `recent_scans_barcode_idx` ON `recent_scans` (`barcode`);
