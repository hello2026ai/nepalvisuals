import { supabase } from '../supabaseClient';

export interface BootstrapResult {
    success: boolean;
    message: string;
    details?: any;
}

export const databaseBootstrapper = {
    /**
     * Verifies existence of critical tables and creates them if missing via RPC.
     * This allows the application to self-heal in new environments.
     */
    async verifyAndCreateTables(): Promise<BootstrapResult> {
        try {
            console.log('🔄 Bootstrapping: Verifying database schema...');
            
            // Call the secure RPC function to check/create tables
            const { data, error } = await supabase.rpc('check_and_create_featured_destinations');

            if (error) {
                // If RPC fails (e.g. function doesn't exist yet), we can't do much automatically
                // This is expected in a fresh environment without the specific RPC migration.
                
                // Check for "undefined function" (42883) or 404 (function not found in REST API)
                // PGRST202 is PostgREST error for "Could not find the function..."
                if (error.code === '42883' || error.code === 'PGRST202' || error.message?.includes('404') || (error as any).status === 404) {
                    console.debug('ℹ️ Self-healing skipped: RPC function "check_and_create_featured_destinations" not found. Manual migration may be required.');
                    return {
                        success: false,
                        message: 'RPC function missing. Database setup required for full features.'
                    };
                }

                return { success: false, message: error.message, details: error };
            }

            return { 
                success: true, 
                message: data?.message || 'Database verified', 
                details: data 
            };

        } catch (err: any) {
            return { 
                success: false, 
                message: err.message || 'Unknown error during bootstrap' 
            };
        }
    }
};
