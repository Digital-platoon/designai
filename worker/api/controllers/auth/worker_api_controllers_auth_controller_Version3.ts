/***** Begin Patch
*** Add File: worker/api/controllers/auth/__tests__/allowed-email.test.ts
+import { describe, it, expect } from 'vitest';
+import { isEmailAllowed } from '../controller';
+
+describe('isEmailAllowed', () => {
+  it('allows when ALLOWED_EMAIL is undefined', () => {
+    expect(isEmailAllowed('user@example.com', undefined)).toBe(true);
+  });
+
+  it('allows when ALLOWED_EMAIL is empty string', () => {
+    expect(isEmailAllowed('user@example.com', '')).toBe(true);
+  });
+
+  it('treats "*" as allow all', () => {
+    expect(isEmailAllowed('anyone@domain.com', '*')).toBe(true);
+  });
+
+  it('treats "any" (case-insensitive) as allow all', () => {
+    expect(isEmailAllowed('someone@domain.com', 'Any')).toBe(true);
+  });
+
+  it('allows exact email match', () => {
+    expect(isEmailAllowed('alice@example.com', 'alice@example.com')).toBe(true);
+    expect(isEmailAllowed('bob@example.com', 'alice@example.com')).toBe(false);
+  });
+
+  it('supports comma separated exact and domain entries', () => {
+    const allowed = 'alice@example.com, @gmail.com';
+    expect(isEmailAllowed('alice@example.com', allowed)).toBe(true);
+    expect(isEmailAllowed('someone@gmail.com', allowed)).toBe(true);
+    expect(isEmailAllowed('nobody@yahoo.com', allowed)).toBe(false);
+  });
+
+  it('supports domain-only entries without @', () => {
+    expect(isEmailAllowed('user@sub.example.com', 'example.com')).toBe(true);
+    expect(isEmailAllowed('user@another.com', 'example.com')).toBe(false);
+  });
+
+  it('supports wildcard entries like "*.example.com"', () => {
+    expect(isEmailAllowed('app@service.example.com', '*.example.com')).toBe(true);
+    expect(isEmailAllowed('user@example.com', '*.example.com')).toBe(true); // domain fallback
+    expect(isEmailAllowed('someone@other.com', '*.example.com')).toBe(false);
+  });
+});
+
*** End PatchalidatedData, request);
            
            const response = AuthController.createSuccessResponse(
                formatAuthResponse(result.user, result.sessionId, result.expiresAt)
            );
            
            setSecureAuthCookies(response, {
                accessToken: result.accessToken,
                accessTokenExpiry: SessionService.config.sessionTTL
            });
            
            // Rotate CSRF token on successful login if configured
            if (CsrfService.defaults.rotateOnAuth) {
                CsrfService.rotateToken(response);
            }
            
            return response;
        } catch (error) {
            if (error instanceof SecurityError) {
                return AuthController.createErrorResponse(error.message, error.statusCode);
            }
            
            return AuthController.handleError(error, 'login user');
        }
    }

    // ... rest of file unchanged ...
}