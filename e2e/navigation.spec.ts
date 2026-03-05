import { test, expect } from "@playwright/test";

/**
 * E2E: Core Navigation
 * Verifies all major ERP pages load without errors.
 */

const pages = [
    { path: "/", title: "Dashboard" },
    { path: "/sales-orders", title: "Sales Orders" },
    { path: "/purchase-orders", title: "Purchase Orders" },
    { path: "/products", title: "Products" },
    { path: "/inventory", title: "Inventory" },
    { path: "/invoices", title: "Invoices" },
    { path: "/quotations", title: "Quotations" },
    { path: "/customers", title: "Customers" },
    { path: "/vendors", title: "Vendors" },
    { path: "/production", title: "Production" },
    { path: "/hr", title: "HR" },
    { path: "/accounting", title: "Accounting" },
    { path: "/reports", title: "Reports" },
    { path: "/settings", title: "Settings" },
    { path: "/audit-log", title: "Audit Log" },
];

test.describe("Navigation", () => {
    for (const page of pages) {
        test(`${page.title} page loads at ${page.path}`, async ({ page: p }) => {
            const response = await p.goto(page.path);
            expect(response?.status()).toBeLessThan(400);

            // No uncaught JS errors
            const errors: string[] = [];
            p.on("pageerror", (err) => errors.push(err.message));

            // Wait for hydration
            await p.waitForLoadState("networkidle");

            expect(errors).toHaveLength(0);
        });
    }
});
