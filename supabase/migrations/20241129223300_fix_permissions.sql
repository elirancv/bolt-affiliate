-- Grant execute permission for get_user_feature_limits_v2
GRANT EXECUTE ON FUNCTION public.get_user_feature_limits_v2() TO authenticated;

-- Fix store policies
DROP POLICY IF EXISTS "Store access policy" ON public.stores;

CREATE POLICY "Store access policy"
    ON public.stores
    AS PERMISSIVE
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Fix product policies
DROP POLICY IF EXISTS "Product access policy" ON public.products;

CREATE POLICY "Product access policy"
    ON public.products
    AS PERMISSIVE
    FOR ALL
    TO authenticated
    USING (
        store_id IN (
            SELECT id FROM public.stores 
            WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        store_id IN (
            SELECT id FROM public.stores 
            WHERE user_id = auth.uid()
        )
    );
