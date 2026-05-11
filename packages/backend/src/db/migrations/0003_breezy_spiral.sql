CREATE TABLE `monthly_budgets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`month` text NOT NULL,
	`amount` real NOT NULL,
	`currency` text DEFAULT 'USD' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `monthly_budgets_user_id_month_idx` ON `monthly_budgets` (`user_id`,`month`);