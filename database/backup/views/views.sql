CREATE OR REPLACE VIEW "public"."cron_job_stats" AS
 SELECT "job_name",
    "count"(*) AS "total_runs",
    "sum"(
        CASE
            WHEN (("status")::"text" = 'completed'::"text") THEN 1
            ELSE 0
        END) AS "successful_runs",
    "sum"(
        CASE
            WHEN (("status")::"text" = 'failed'::"text") THEN 1
            ELSE 0
        END) AS "failed_runs",
    "avg"("duration_seconds") AS "avg_duration_seconds",
    "max"("started_at") AS "last_run",
    "sum"(
        CASE
            WHEN ("metadata" ? 'payments_processed'::"text") THEN (("metadata" ->> 'payments_processed'::"text"))::integer
            ELSE 0
        END) AS "total_payments_processed",
    "sum"(
--
CREATE OR REPLACE VIEW "public"."lending_with_categories" AS
 SELECT "l"."id",
    "l"."user_id",
    "l"."person_name",
    "l"."person_contact",
    "l"."amount",
    "l"."currency",
    "l"."type",
    "l"."date",
    "l"."due_date",
    "l"."interest_rate",
    "l"."status",
    "l"."description",
    "l"."paid_amount",
    "l"."created_at",
    "l"."updated_at",
    "l"."account_id",
    "l"."category_id",
    "l"."reminder_days",
    "l"."contact_info",
    "l"."payment_history",
--
CREATE OR REPLACE VIEW "public"."loans_with_categories" AS
 SELECT "l"."id",
    "l"."user_id",
    "l"."lender",
    "l"."principal_amount",
    "l"."outstanding_amount",
    "l"."interest_rate",
    "l"."emi_amount",
    "l"."tenure_months",
    "l"."start_date",
    "l"."next_due_date",
    "l"."currency",
    "l"."type",
    "l"."status",
    "l"."metadata",
    "l"."created_at",
    "l"."updated_at",
    "l"."account_id",
    "l"."category_id",
    "l"."auto_debit",
    "l"."reminder_days",
--
CREATE OR REPLACE VIEW "public"."purchase_emis" AS
 SELECT "id",
    "user_id",
    "lender",
    "principal_amount",
    "outstanding_amount",
    "interest_rate",
    "emi_amount",
    "tenure_months",
    "start_date",
    "next_due_date",
    "currency",
    "type",
    "status",
    "metadata",
    "created_at",
    "updated_at",
    "account_id",
    "category_id",
    "auto_debit",
    "reminder_days",
--
CREATE OR REPLACE VIEW "public"."recent_cron_jobs" AS
 SELECT "job_name",
    "status",
    "message",
    "started_at",
    "completed_at",
    "duration_seconds",
        CASE
            WHEN ("metadata" ? 'payments_processed'::"text") THEN (("metadata" ->> 'payments_processed'::"text"))::integer
            ELSE 0
        END AS "payments_processed",
        CASE
            WHEN ("metadata" ? 'reminders_created'::"text") THEN (("metadata" ->> 'reminders_created'::"text"))::integer
            ELSE 0
        END AS "reminders_created",
        CASE
            WHEN ("metadata" ? 'errors_count'::"text") THEN (("metadata" ->> 'errors_count'::"text"))::integer
            ELSE 0
        END AS "errors_count"
   FROM "public"."cron_job_logs"
  WHERE ("started_at" >= ("now"() - '7 days'::interval))
--
CREATE OR REPLACE VIEW "public"."unified_transactions" AS
 SELECT "t"."id",
    "t"."user_id",
    "t"."type",
    "t"."amount",
    "t"."currency",
    "t"."description",
    "t"."notes",
    "t"."category_id",
    "t"."subcategory_id",
    "t"."account_id",
    "t"."date",
    "t"."tags",
    "t"."receipt_url",
    "t"."location",
    "t"."vendor",
    "t"."is_investment_related",
    "t"."investment_action",
    "t"."investment_id",
    "t"."investment_transaction_id",
    "i"."name" AS "investment_name",
