"use client";

import { formatCurrency, formatDate } from "@/lib/utils";

interface PDFData {
    companyName?: string;
    companyAddress?: string;
    companyPhone?: string;
    companyEmail?: string;
    documentType: string;
    documentNumber: string;
    date: string;
    dueDate?: string;
    recipientName: string;
    recipientAddress?: string;
    recipientEmail?: string;
    recipientPhone?: string;
    lineItems: { description: string; qty: number; unitPrice: number; total: number }[];
    subtotal: number;
    tax?: number;
    total: number;
    notes?: string;
    terms?: string;
    status?: string;
}

export function generatePDF(data: PDFData) {
    const {
        companyName = "Smith Instruments",
        companyAddress = "Sialkot, Punjab, Pakistan",
        companyPhone = "+92-52-123-4567",
        companyEmail = "info@smithinstruments.com",
        documentType,
        documentNumber,
        date,
        dueDate,
        recipientName,
        recipientAddress,
        recipientEmail,
        recipientPhone,
        lineItems,
        subtotal,
        tax = 0,
        total,
        notes,
        terms,
        status,
    } = data;

    const html = `
<!DOCTYPE html>
<html>
<head>
<title>${documentType} - ${documentNumber}</title>
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', -apple-system, sans-serif; color: #1a1a2e; background: white; padding: 40px; max-width: 800px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #2563eb; }
    .company-name { font-size: 24px; font-weight: 700; color: #2563eb; letter-spacing: -0.5px; }
    .company-details { font-size: 11px; color: #64748b; margin-top: 4px; line-height: 1.6; }
    .doc-type { font-size: 28px; font-weight: 800; text-transform: uppercase; color: #1e293b; text-align: right; letter-spacing: 1px; }
    .doc-number { font-size: 13px; color: #64748b; text-align: right; margin-top: 4px; }
    .doc-status { display: inline-block; padding: 3px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; text-transform: uppercase; margin-top: 6px; background: #dbeafe; color: #2563eb; }
    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
    .meta-section h4 { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #94a3b8; margin-bottom: 8px; }
    .meta-section p { font-size: 13px; line-height: 1.6; color: #334155; }
    .meta-section strong { font-weight: 600; color: #1e293b; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    thead th { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #64748b; padding: 10px 12px; text-align: left; border-bottom: 2px solid #e2e8f0; }
    thead th:last-child, thead th:nth-child(2), thead th:nth-child(3) { text-align: right; }
    tbody td { font-size: 13px; padding: 12px; border-bottom: 1px solid #f1f5f9; color: #334155; }
    tbody td:last-child, tbody td:nth-child(2), tbody td:nth-child(3) { text-align: right; font-variant-numeric: tabular-nums; }
    .totals { display: flex; justify-content: flex-end; margin-bottom: 30px; }
    .totals-box { min-width: 240px; }
    .totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; color: #475569; }
    .totals-row.total { font-size: 16px; font-weight: 700; color: #1e293b; border-top: 2px solid #e2e8f0; padding-top: 10px; margin-top: 4px; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
    .footer h4 { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin-bottom: 6px; }
    .footer p { font-size: 12px; color: #64748b; line-height: 1.6; }
    @media print {
        body { padding: 20px; }
        @page { margin: 20mm; }
    }
</style>
</head>
<body>
    <div class="header">
        <div>
            <div class="company-name">${companyName}</div>
            <div class="company-details">
                ${companyAddress}<br/>
                ${companyPhone} · ${companyEmail}
            </div>
        </div>
        <div>
            <div class="doc-type">${documentType}</div>
            <div class="doc-number">${documentNumber}</div>
            ${status ? `<div style="text-align:right"><span class="doc-status">${status}</span></div>` : ""}
        </div>
    </div>

    <div class="meta">
        <div class="meta-section">
            <h4>${documentType === "Purchase Order" ? "Vendor" : "Bill To"}</h4>
            <p>
                <strong>${recipientName}</strong><br/>
                ${recipientAddress ? recipientAddress + "<br/>" : ""}
                ${recipientEmail ? recipientEmail + "<br/>" : ""}
                ${recipientPhone || ""}
            </p>
        </div>
        <div class="meta-section" style="text-align: right;">
            <h4>Details</h4>
            <p>
                <strong>Date:</strong> ${date}<br/>
                ${dueDate ? `<strong>${documentType === "Quotation" ? "Valid Until" : documentType === "Purchase Order" ? "Expected" : "Due Date"}:</strong> ${dueDate}<br/>` : ""}
            </p>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Description</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Amount</th>
            </tr>
        </thead>
        <tbody>
            ${lineItems.map((item) => `
                <tr>
                    <td>${item.description}</td>
                    <td style="text-align:right">${item.qty}</td>
                    <td style="text-align:right">$${item.unitPrice.toFixed(2)}</td>
                    <td style="text-align:right">$${item.total.toFixed(2)}</td>
                </tr>
            `).join("")}
        </tbody>
    </table>

    <div class="totals">
        <div class="totals-box">
            <div class="totals-row"><span>Subtotal</span><span>$${subtotal.toFixed(2)}</span></div>
            ${tax > 0 ? `<div class="totals-row"><span>Tax</span><span>$${tax.toFixed(2)}</span></div>` : ""}
            <div class="totals-row total"><span>Total</span><span>$${total.toFixed(2)}</span></div>
        </div>
    </div>

    ${notes || terms ? `
    <div class="footer">
        ${notes ? `<h4>Notes</h4><p>${notes}</p>` : ""}
        ${terms ? `<div style="margin-top: 16px"><h4>Terms & Conditions</h4><p>${terms}</p></div>` : ""}
    </div>
    ` : ""}
</body>
</html>`;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 300);
    }
}
