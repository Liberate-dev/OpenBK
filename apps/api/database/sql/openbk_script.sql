-- Open BK operational script (data cleanup)
-- Purpose: empty all app data while preserving table `admins`
-- Safe to re-run

USE `openbk`;
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE `activity_logs`;
TRUNCATE TABLE `replies`;
TRUNCATE TABLE `messages`;
TRUNCATE TABLE `risk_dictionaries`;
TRUNCATE TABLE `allowed_nis`;
TRUNCATE TABLE `students`;
TRUNCATE TABLE `personal_access_tokens`;
TRUNCATE TABLE `failed_jobs`;
TRUNCATE TABLE `job_batches`;
TRUNCATE TABLE `jobs`;
TRUNCATE TABLE `cache_locks`;
TRUNCATE TABLE `cache`;
TRUNCATE TABLE `sessions`;
TRUNCATE TABLE `password_reset_tokens`;
TRUNCATE TABLE `users`;

-- Keep admins, only clear transient OTP values
UPDATE `admins`
SET `otp_code` = NULL,
    `otp_expires_at` = NULL;

SET FOREIGN_KEY_CHECKS = 1;
