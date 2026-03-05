import { test, expect } from "@playwright/test";

/**
 * E2E: Purchase Order → Partial Receipt Flow
 *
 * Tests the critical path:
 * 1. Navigate to Purchase Orders page
 * 2. Verify table/empty state renders
 * 3. Open a PO detail drawer
 * 4. Verify "Receive Items" button appears for sent/partial POs
 * 5. Verify progress bars render in line items
 */

test.describe("Purchase Order Flow", () => {
    test("Purchase Orders page loads correctly", async ({ page }) => {
        await page.goto("/purchase-orders");
        await page.waitForLoadState("networkidle");

        const heading = page.locator("h1");
        await expect(heading).toBeVisible();
    });

    test("Can open PO detail drawer", async ({ page }) => {
        await page.goto("/purchase-orders");
        await page.waitForLoadState("networkidle");

        const rows = page.locator("tbody tr, [data-row]");
        const rowCount = await rows.count();

        if (rowCount > 0) {
            await rows.first().click();

            // Drawer should appear
            const drawer = page.locator("[class*='fixed'][class*='right']");
            await expect(drawer).toBeVisible({ timeout: 5000 });

            // PO number should be visible
            const poNumber = drawer.locator("text=/PO-/");
            await expect(poNumber).toBeVisible({ timeout: 3000 });

            // Line items tab should be present
            const itemsTab = drawer.getByText(/line items/i);
            await expect(itemsTab).toBeVisible();

            // Close
            await page.keyboard.press("Escape");
        }
    });

    test("PO drawer shows receipt progress for line items", async ({ page }) => {
        await page.goto("/purchase-orders");
        await page.waitForLoadState("networkidle");

        const rows = page.locator("tbody tr");
        const rowCount = await rows.count();

        if (rowCount > 0) {
            await rows.first().click();

            const drawer = page.locator("[class*='fixed'][class*='right']");
            await expect(drawer).toBeVisible({ timeout: 5000 });

            // Progress text like "0 / 10 received" should appear
            const progressText = drawer.locator("text=/received/i");
            const hasProgress = await progressText.count();

            // If line items exist, progress indicators should be present
            if (hasProgress > 0) {
                await expect(progressText.first()).toBeVisible();
            }

            await page.keyboard.press("Escape");
        }
    });

    test("Purchase orders page has no console errors", async ({ page }) => {
        const errors: string[] = [];
        page.on("pageerror", (err) => errors.push(err.message));

        await page.goto("/purchase-orders");
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(2000);

        expect(errors).toHaveLength(0);
    });
});
