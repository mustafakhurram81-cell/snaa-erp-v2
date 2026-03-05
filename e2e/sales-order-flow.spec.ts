import { test, expect } from "@playwright/test";

/**
 * E2E: Sales Order → Delivery Flow
 *
 * Tests the critical path:
 * 1. Navigate to Sales Orders page
 * 2. Verify the page renders with data table
 * 3. Open a sales order detail drawer
 * 4. Verify drawer content loads correctly
 * 5. Check status badge and action buttons render
 */

test.describe("Sales Order Flow", () => {
    test("Sales Orders page loads with data table", async ({ page }) => {
        await page.goto("/sales-orders");
        await page.waitForLoadState("networkidle");

        // Page should have the title
        const heading = page.locator("h1");
        await expect(heading).toBeVisible();

        // Data table should be present
        const table = page.locator("table, [role='table'], [data-testid='data-table']");
        // If no table (empty state), look for empty state message
        const hasTable = await table.count();
        if (hasTable === 0) {
            // Should show an empty state
            const emptyState = page.getByText(/no.*orders|no.*results|no.*data/i);
            await expect(emptyState).toBeVisible();
        }
    });

    test("Can open sales order detail drawer", async ({ page }) => {
        await page.goto("/sales-orders");
        await page.waitForLoadState("networkidle");

        // Find clickable rows
        const rows = page.locator("tbody tr, [data-row]");
        const rowCount = await rows.count();

        if (rowCount > 0) {
            // Click the first row
            await rows.first().click();

            // Drawer should appear
            const drawer = page.locator("[class*='fixed'][class*='right']");
            await expect(drawer).toBeVisible({ timeout: 5000 });

            // Drawer should contain order details
            const orderNumber = drawer.locator("text=/SO-/");
            await expect(orderNumber).toBeVisible({ timeout: 3000 });

            // Status badge should be present
            const statusBadge = drawer.locator("[class*='rounded-full']").first();
            await expect(statusBadge).toBeVisible();

            // Close drawer via close button or escape
            await page.keyboard.press("Escape");
        }
    });

    test("Sales order page has no console errors", async ({ page }) => {
        const errors: string[] = [];
        page.on("pageerror", (err) => errors.push(err.message));

        await page.goto("/sales-orders");
        await page.waitForLoadState("networkidle");

        // Wait a beat for any async errors
        await page.waitForTimeout(2000);

        expect(errors).toHaveLength(0);
    });
});
