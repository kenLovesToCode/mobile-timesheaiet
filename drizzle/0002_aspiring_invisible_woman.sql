CREATE TABLE `products` (
	`barcode` text PRIMARY KEY NOT NULL,
	`name` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `products_name_idx` ON `products` (`name`);
--> statement-breakpoint
CREATE TABLE `prices` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`store_id` integer NOT NULL,
	`product_barcode` text NOT NULL,
	`price_cents` integer NOT NULL,
	`captured_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_barcode`) REFERENCES `products`(`barcode`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `prices_store_id_product_barcode_unique` ON `prices` (`store_id`,`product_barcode`);
--> statement-breakpoint
CREATE INDEX `prices_product_barcode_idx` ON `prices` (`product_barcode`);
--> statement-breakpoint
CREATE INDEX `prices_store_id_idx` ON `prices` (`store_id`);
