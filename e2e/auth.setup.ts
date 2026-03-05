import { test as setup, expect } from "@playwright/test";

/**
 * Auth setup — logs in and saves session state.
 * Other tests can reuse the authenticated state.
 *
 * Set env vars PLAYWRIGHT_USER_EMAIL and PLAYWRIGHT_USER_PASSWORD
 * before running tests that require authentication.
 */

const authFile = "e2e/.auth/user.json";

setup("authenticate", async ({ page }) => {
    const email = process.env.PLAYWRIGHT_USER_EMAIL;
    const password = process.env.PLAYWRIGHT_USER_PASSWORD;

    if (!email || !password) {
        console.warn("⚠️  PLAYWRIGHT_USER_EMAIL and PLAYWRIGHT_USER_PASSWORD not set. Skipping auth setup.");
        return;
    }

    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    // Fill login form
    await page.getByPlaceholder(/email/i).fill(email);
    await page.getByPlaceholder(/password/i).fill(password);

    // Submit
    await page.getByRole("button", { name: /sign in|log in|login/i }).click();

    // Wait for redirect to dashboard
    await page.waitForURL("/", { timeout: 15000 });
    await expect(page).toHaveURL("/");

    // Save session
    await page.context().storageState({ path: authFile });
});
