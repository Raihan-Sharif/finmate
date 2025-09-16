

CREATE POLICY "Admins can access all subscription payments" ON "public"."subscription_payments" USING ((EXISTS ( SELECT 1
   FROM ("public"."profiles" "p"
     JOIN "public"."roles" "r" ON (("p"."role_id" = "r"."id")))
  WHERE (("p"."user_id" = "auth"."uid"()) AND (("r"."name")::"text" = ANY ((ARRAY['admin'::character varying, 'super_admin'::character varying])::"text"[]))))));



CREATE POLICY "Admins can manage all subscriptions" ON "public"."user_subscriptions" USING ((EXISTS ( SELECT 1
   FROM ("public"."profiles" "p"
     JOIN "public"."roles" "r" ON (("p"."role_id" = "r"."id")))
  WHERE (("p"."user_id" = "auth"."uid"()) AND (("r"."name")::"text" = ANY ((ARRAY['admin'::character varying, 'super_admin'::character varying])::"text"[]))))));



CREATE POLICY "Admins can manage global templates" ON "public"."budget_templates" USING ((("is_global" = true) AND (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."user_id" = "auth"."uid"()) AND ("p"."role_id" IN ( SELECT "roles"."id"
           FROM "public"."roles"
          WHERE (("roles"."name")::"text" = ANY ((ARRAY['admin'::character varying, 'super_admin'::character varying])::"text"[])))))))));



CREATE POLICY "Block access to permissions" ON "public"."permissions" USING (false);



CREATE POLICY "Block access to role permissions" ON "public"."role_permissions" USING (false);



CREATE POLICY "Block access to roles" ON "public"."roles" USING (false);



CREATE POLICY "Block access to user permissions" ON "public"."user_permissions" USING (false);



CREATE POLICY "Block audit logs access" ON "public"."admin_audit_logs" USING (false);



CREATE POLICY "Family members can view family invitations" ON "public"."family_invitations" FOR SELECT USING ((("invited_by" = ( SELECT "profiles"."user_id"
   FROM "public"."profiles"
  WHERE ("profiles"."user_id" = "auth"."uid"()))) OR ("family_group_id" = ( SELECT "profiles"."family_group_id"
   FROM "public"."profiles"
  WHERE ("profiles"."user_id" = "auth"."uid"())))));



CREATE POLICY "Primary users can manage family invitations" ON "public"."family_invitations" USING (("invited_by" = ( SELECT "profiles"."user_id"
   FROM "public"."profiles"
  WHERE ("profiles"."user_id" = "auth"."uid"()))));



CREATE POLICY "Primary users can manage their family group" ON "public"."family_groups" USING (("created_by" = ( SELECT "profiles"."user_id"
   FROM "public"."profiles"
  WHERE ("profiles"."user_id" = "auth"."uid"()))));



CREATE POLICY "Public can view active coupons" ON "public"."coupons" FOR SELECT USING ((("is_active" = true) AND (("scope")::"text" = 'public'::"text")));



CREATE POLICY "System can manage investment price history" ON "public"."investment_price_history" USING (true);



CREATE POLICY "System can manage sessions" ON "public"."user_sessions" USING (true);



CREATE POLICY "Users can access own subscription payments" ON "public"."subscription_payments" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can delete own accounts" ON "public"."accounts" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own accounts" ON "public"."accounts" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage own ai insights" ON "public"."ai_insights" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage own budgets" ON "public"."budgets" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage own emi payments" ON "public"."emi_payments" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage own emi schedules" ON "public"."emi_schedules" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage own emi templates" ON "public"."emi_templates" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage own investment performance" ON "public"."investment_performance_snapshots" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage own investment portfolios" ON "public"."investment_portfolios" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage own investment templates" ON "public"."investment_templates" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage own investment transactions" ON "public"."investment_transactions" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage own investments" ON "public"."investments" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage own lending" ON "public"."lending" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage own lending payments" ON "public"."lending_payments" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage own loans" ON "public"."loans" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage own notifications" ON "public"."notifications" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage own recurring transactions" ON "public"."recurring_transactions" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage own templates" ON "public"."budget_templates" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage own transactions" ON "public"."transactions" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own transactions" ON "public"."transactions" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read all accounts" ON "public"."accounts" FOR SELECT USING ((("user_id" IS NULL) OR ("auth"."uid"() = "user_id")));



CREATE POLICY "Users can read all categories" ON "public"."categories" FOR SELECT USING (true);



CREATE POLICY "Users can read all subcategories" ON "public"."subcategories" FOR SELECT USING (true);



CREATE POLICY "Users can read global investment templates" ON "public"."investment_templates" FOR SELECT USING (("is_global" = true));



CREATE POLICY "Users can read global templates" ON "public"."budget_templates" FOR SELECT USING (("is_global" = true));



CREATE POLICY "Users can read investment price history" ON "public"."investment_price_history" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."investments" "i"
  WHERE (("i"."id" = "investment_price_history"."investment_id") AND ("i"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can read own subscriptions" ON "public"."user_subscriptions" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update own accounts" ON "public"."accounts" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view global templates for all operations" ON "public"."budget_templates" FOR SELECT USING (("is_global" = true));



CREATE POLICY "Users can view own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own sessions" ON "public"."user_sessions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own family group" ON "public"."family_groups" FOR SELECT USING ((("created_by" = ( SELECT "profiles"."user_id"
   FROM "public"."profiles"
  WHERE ("profiles"."user_id" = "auth"."uid"()))) OR ("id" = ( SELECT "profiles"."family_group_id"
   FROM "public"."profiles"
  WHERE ("profiles"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."accounts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."admin_audit_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_insights" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."budget_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."budgets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."coupon_usage" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "coupon_usage_insert_policy" ON "public"."coupon_usage" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "coupon_usage_select_policy" ON "public"."coupon_usage" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."coupons" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "coupons_comprehensive_access" ON "public"."coupons" USING (((EXISTS ( SELECT 1
   FROM ("public"."profiles" "p"
     JOIN "public"."roles" "r" ON (("p"."role_id" = "r"."id")))
  WHERE (("p"."user_id" = "auth"."uid"()) AND (("r"."name")::"text" = ANY ((ARRAY['admin'::character varying, 'super_admin'::character varying])::"text"[]))))) OR (("is_active" = true) AND (("scope")::"text" = 'public'::"text")) OR (("is_active" = true) AND ("auth"."uid"() = ANY ("allowed_users")))));



ALTER TABLE "public"."emi_payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."emi_schedules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."emi_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."family_groups" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."family_invitations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."investment_performance_snapshots" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."investment_portfolios" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."investment_price_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."investment_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."investment_transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."investments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lending" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lending_payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."loans" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payment_methods" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "payment_methods_select_policy" ON "public"."payment_methods" FOR SELECT USING (("is_active" = true));



ALTER TABLE "public"."permissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."recurring_transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."role_permissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subcategories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscription_history" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "subscription_history_select_policy" ON "public"."subscription_history" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."subscription_payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscription_plans" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "subscription_plans_select_policy" ON "public"."subscription_plans" FOR SELECT USING (("is_active" = true));



ALTER TABLE "public"."transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_permissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_subscriptions" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";





