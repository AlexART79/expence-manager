CREATE TABLE `monthly_budgets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`month` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`currency` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `monthly_budgets_user_idx` ON `monthly_budgets` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `monthly_budgets_user_month_idx` ON `monthly_budgets` (`user_id`,`month`);
