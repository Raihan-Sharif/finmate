
            ELSE 0
            ELSE NULL::character varying
            WHEN ("l"."category_id" IS NOT NULL) THEN "c"."color"
            WHEN ("l"."category_id" IS NOT NULL) THEN "c"."icon"
            WHEN ("l"."category_id" IS NOT NULL) THEN "c"."name"
            WHEN ("l"."subcategory_id" IS NOT NULL) THEN "pc"."name"
            WHEN ("l"."subcategory_id" IS NOT NULL) THEN "s"."color"
            WHEN ("l"."subcategory_id" IS NOT NULL) THEN "s"."icon"
            WHEN ("l"."subcategory_id" IS NOT NULL) THEN "s"."name"
            WHEN ("metadata" ? 'errors_count'::"text") THEN (("metadata" ->> 'errors_count'::"text"))::integer
            WHEN ("metadata" ? 'payments_processed'::"text") THEN (("metadata" ->> 'payments_processed'::"text"))::integer
            WHEN ("metadata" ? 'reminders_created'::"text") THEN (("metadata" ->> 'reminders_created'::"text"))::integer
            WHEN (("status")::"text" = 'completed'::"text") THEN 1
            WHEN (("status")::"text" = 'failed'::"text") THEN 1
        CASE
        END AS "category_color",
        END AS "category_icon",
        END AS "category_name",
        END AS "errors_count"
        END AS "parent_category_name",
        END AS "payments_processed",
        END AS "reminders_created",
        END) AS "failed_runs",
        END) AS "successful_runs",
        END) AS "total_payments_processed",
        END) AS "total_reminders_created"
     LEFT JOIN "public"."accounts" "a" ON (("t"."account_id" = "a"."id")))
     LEFT JOIN "public"."categories" "c" ON (("l"."category_id" = "c"."id")))
     LEFT JOIN "public"."categories" "c" ON (("t"."category_id" = "c"."id")))
     LEFT JOIN "public"."categories" "pc" ON (("s"."category_id" = "pc"."id")));
     LEFT JOIN "public"."coupons" "c" ON (("sp"."coupon_id" = "c"."id")));
     LEFT JOIN "public"."investment_transactions" "it" ON (("t"."investment_transaction_id" = "it"."id")))
     LEFT JOIN "public"."investments" "i" ON (("t"."investment_id" = "i"."id")))
     LEFT JOIN "public"."payment_methods" "pm" ON (("sp"."payment_method_id" = "pm"."id")))
     LEFT JOIN "public"."profiles" "p" ON (("sp"."user_id" = "p"."user_id")))
     LEFT JOIN "public"."profiles" "p" ON (("us"."user_id" = "p"."user_id")))
     LEFT JOIN "public"."subcategories" "s" ON (("l"."subcategory_id" = "s"."id")))
     LEFT JOIN "public"."subscription_payments" "sp" ON (("us"."payment_id" = "sp"."id")));
     LEFT JOIN "public"."subscription_plans" "spl" ON (("sp"."plan_id" = "spl"."id")))
     LEFT JOIN "public"."subscription_plans" "spl" ON (("us"."plan_id" = "spl"."id")))
    "a"."name" AS "account_name",
    "a"."type" AS "account_type",
    "account_id",
    "array_agg"("coupons"."code" ORDER BY "coupons"."created_at") AS "sample_data"
    "array_agg"("payment_methods"."method_name" ORDER BY "payment_methods"."sort_order") AS "sample_data"
    "array_agg"("subscription_plans"."plan_name" ORDER BY "subscription_plans"."sort_order") AS "sample_data"
    "auto_debit",
    "avg"("duration_seconds") AS "avg_duration_seconds",
    "c"."code" AS "coupon_code",
    "c"."icon" AS "category_icon",
    "c"."name" AS "category_name",
    "c"."type" AS "coupon_type",
    "c"."value" AS "coupon_value"
    "category_id",
    "completed_at",
    "count"(*) AS "total_runs",
    "created_at",
    "currency",
    "duration_seconds",
    "emi_amount",
    "i"."name" AS "investment_name",
    "i"."symbol" AS "investment_symbol",
    "i"."type" AS "investment_type",
    "interest_rate",
    "it"."brokerage_fee",
    "it"."other_charges",
    "it"."price_per_unit",
    "it"."tax_amount",
    "it"."units" AS "investment_units",
    "l"."account_id",
    "l"."amount",
    "l"."auto_debit",
    "l"."category_id",
    "l"."contact_info",
    "l"."created_at",
    "l"."currency",
    "l"."date",
    "l"."description",
    "l"."due_date",
    "l"."emi_amount",
    "l"."interest_rate",
    "l"."last_payment_date",
    "l"."lender",
    "l"."metadata",
    "l"."next_due_date",
    "l"."notes",
    "l"."outstanding_amount",
    "l"."paid_amount",
    "l"."payment_day",
    "l"."payment_history",
    "l"."pending_amount",
    "l"."person_contact",
    "l"."person_name",
    "l"."prepayment_amount",
    "l"."principal_amount",
    "l"."reminder_days",
    "l"."start_date",
    "l"."status",
    "l"."subcategory_id",
    "l"."tenure_months",
    "l"."type",
    "l"."updated_at",
    "l"."user_id",
    "last_payment_date",
    "lender",
    "max"("started_at") AS "last_run",
    "message",
    "metadata",
    "next_due_date",
    "notes",
    "outstanding_amount",
    "p"."email" AS "user_email",
    "p"."full_name" AS "user_full_name",
    "p"."phone_number" AS "user_phone",
    "payment_day",
    "pm"."display_name" AS "payment_method_display_name",
    "pm"."method_name" AS "payment_method_name",
    "prepayment_amount",
    "principal_amount",
    "public"."get_effective_category"("l"."category_id", "l"."subcategory_id") AS "effective_category_id"
    "reminder_days",
    "sp"."admin_notes",
    "sp"."approved_at",
    "sp"."base_amount",
    "sp"."billing_cycle",
    "sp"."coupon_id",
    "sp"."created_at",
    "sp"."currency",
    "sp"."discount_amount",
    "sp"."final_amount" AS "payment_amount",
    "sp"."final_amount",
    "sp"."payment_method_id",
    "sp"."plan_id",
    "sp"."rejected_at",
    "sp"."rejection_reason",
    "sp"."sender_number",
    "sp"."status" AS "payment_status"
    "sp"."status",
    "sp"."submitted_at",
    "sp"."transaction_id" AS "payment_transaction_id",
    "sp"."transaction_id",
    "sp"."updated_at",
    "sp"."user_id",
    "sp"."verified_at",
    "sp"."verified_by",
    "spl"."display_name" AS "plan_display_name",
    "spl"."features" AS "plan_features",
    "spl"."plan_name",
    "spl"."price_monthly" AS "plan_price_monthly",
    "spl"."price_yearly" AS "plan_price_yearly",
    "start_date",
    "started_at",
    "status",
    "sum"(
    "t"."account_id",
    "t"."amount",
    "t"."category_id",
    "t"."created_at",
    "t"."currency",
    "t"."date",
    "t"."description",
    "t"."investment_action",
    "t"."investment_id",
    "t"."investment_transaction_id",
    "t"."is_investment_related",
    "t"."location",
    "t"."notes",
    "t"."receipt_url",
    "t"."subcategory_id",
    "t"."tags",
    "t"."type",
    "t"."updated_at"
    "t"."user_id",
    "t"."vendor",
    "tenure_months",
    "type",
    "updated_at",
    "us"."billing_cycle",
    "us"."created_at",
    "us"."end_date",
    "us"."payment_id",
    "us"."plan_id",
    "us"."status",
    "us"."updated_at",
    "us"."user_id",
    "user_id",
    ("count"(*))::"text" AS "record_count",
    ("metadata" ->> 'item_condition'::"text") AS "item_condition_text",
    ("metadata" ->> 'item_name'::"text") AS "item_name",
    ("metadata" ->> 'purchase_category'::"text") AS "purchase_category_text",
    ("metadata" ->> 'vendor_name'::"text") AS "vendor_name",
    (("metadata" ->> 'down_payment'::"text"))::numeric(15,2) AS "down_payment"
    (("metadata" ->> 'purchase_date'::"text"))::"date" AS "purchase_date",
    (("metadata" ->> 'warranty_period'::"text"))::integer AS "warranty_period_months",
   FROM "public"."coupons"
   FROM "public"."cron_job_logs"
   FROM "public"."loans" "l"
   FROM "public"."payment_methods"
   FROM "public"."subscription_plans"
   FROM ((("public"."lending" "l"
   FROM ((("public"."loans" "l"
   FROM ((("public"."user_subscriptions" "us"
   FROM (((("public"."subscription_payments" "sp"
   FROM (((("public"."transactions" "t"
  GROUP BY "job_name"
  ORDER BY "job_name";
  ORDER BY "started_at" DESC;
  ORDER BY "t"."date" DESC, "t"."created_at" DESC;
  WHERE ("payment_methods"."is_active" = true)
  WHERE ("started_at" >= ("now"() - '30 days'::interval))
  WHERE ("started_at" >= ("now"() - '7 days'::interval))
  WHERE ("subscription_plans"."is_active" = true)
  WHERE ("type" = 'purchase_emi'::"public"."loan_type");
  WHERE (("coupons"."is_active" = true) AND (("coupons"."expires_at" IS NULL) OR ("coupons"."expires_at" > "now"())));
 SELECT "id",
 SELECT "job_name",
 SELECT "l"."id",
 SELECT "sp"."id",
 SELECT "t"."id",
 SELECT "us"."id",
 SELECT 'Active Coupons'::"text" AS "table_name",
 SELECT 'Payment Methods'::"text" AS "table_name",
 SELECT 'Subscription Plans'::"text" AS "table_name",
CREATE OR REPLACE VIEW "public"."cron_job_stats" AS
CREATE OR REPLACE VIEW "public"."lending_with_categories" AS
CREATE OR REPLACE VIEW "public"."loans_with_categories" AS
CREATE OR REPLACE VIEW "public"."purchase_emis" AS
CREATE OR REPLACE VIEW "public"."recent_cron_jobs" AS
CREATE OR REPLACE VIEW "public"."subscription_payments_with_users" AS
CREATE OR REPLACE VIEW "public"."subscription_seed_data_summary" AS
CREATE OR REPLACE VIEW "public"."unified_transactions" AS
CREATE OR REPLACE VIEW "public"."user_subscriptions_with_details" AS
UNION ALL
