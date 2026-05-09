CREATE TABLE `budget_alert_states` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`month` text NOT NULL,
	`threshold` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `budget_alert_states_user_month_idx` ON `budget_alert_states` (`user_id`,`month`);--> statement-breakpoint
CREATE UNIQUE INDEX `budget_alert_states_user_month_threshold_idx` ON `budget_alert_states` (`user_id`,`month`,`threshold`);
