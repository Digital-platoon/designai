*** Begin Patch
*** Update File: worker/api/controllers/auth/controller.ts
@@
 import { createLogger } from '../../../logger';
 /**
  * Authentication Controller
  */
 
- export class AuthController extends BaseController {
+// Helper: determine whether a given email is allowed by ALLOWED_EMAIL env
+export function isEmailAllowed(email: string, allowedEnv?: string | null): boolean {
+    if (!allowedEnv) return true;                    // no whitelist => allow all
+    const allowed = allowedEnv.trim();
+    if (!allowed) return true;                       // empty => allow all
+    if (allowed === '*' || allowed.toLowerCase() === 'any') return true; // explicit wildcard
+
+    // allow comma-separated values
+    const entries = allowed.split(',').map(e => e.trim()).filter(Boolean);
+    if (entries.length === 0) return true;
+
+    const lowerEmail = email.toLowerCase();
+    for (const entry of entries) {
+        const e = entry.toLowerCase();
+        // exact email match (contains @)
+        if (e.includes('@') && lowerEmail === e) return true;
+
+        // domain match: allow "example.com" or "@example.com" or "*.example.com"
+        let domain = e;
+        if (domain.startsWith('@')) domain = domain.substring(1);
+        if (domain.startsWith('*.')) domain = domain.substring(2);
+
+        if (lowerEmail.endsWith(`@${domain}`)) return true;
+    }
+    return false;
+}
+
+export class AuthController extends BaseController {
     static logger = createLogger('AuthController');
     /**
      * Check if OAuth providers are configured
      */
     static hasOAuthProviders(env: Env): boolean {
         return (!!env.GOOGLE_CLIENT_ID && !!env.GOOGLE_CLIENT_SECRET) || 
                (!!env.GITHUB_CLIENT_ID && !!env.GITHUB_CLIENT_SECRET);
     }
@@
-            if (env.ALLOWED_EMAIL && validatedData.email !== env.ALLOWED_EMAIL) {
-                return AuthController.createErrorResponse(
-                    'Email Whitelisting is enabled. Please use the allowed email to register.',
-                    403
-                );
-            }
+            // Use helper to check whitelist rules
+            if (!isEmailAllowed(validatedData.email, env.ALLOWED_EMAIL)) {
+                return AuthController.createErrorResponse(
+                    'Email Whitelisting is enabled. Please use the allowed email to register.',
+                    403
+                );
+            }
@@
-            if (env.ALLOWED_EMAIL && validatedData.email !== env.ALLOWED_EMAIL) {
-                return AuthController.createErrorResponse(
-                    'Email Whitelisting is enabled. Please use the allowed email to login.',
-                    403
-                );
-            }
+            // Use helper to check whitelist rules
+            if (!isEmailAllowed(validatedData.email, env.ALLOWED_EMAIL)) {
+                return AuthController.createErrorResponse(
+                    'Email Whitelisting is enabled. Please use the allowed email to login.',
+                    403
+                );
+            }
*** End Patch