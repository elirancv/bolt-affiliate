-- Add admin access policy for user_metadata
CREATE POLICY "Admins can access all user metadata"
    ON public.user_metadata
    FOR ALL
    USING (
        EXISTS (
            SELECT 1
            FROM auth.users
            WHERE auth.uid() = auth.users.id
            AND auth.users.email = current_setting('app.admin_email', true)
        )
    );
