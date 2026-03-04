"use client";

import { formatCurrency, formatDate } from "@/lib/utils";

interface PDFData {
    companyName?: string;
    companyAddress?: string;
    companyPhone?: string;
    companyEmail?: string;
    companyLogo?: string; // URL or base64
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
    discount?: number;
    total: number;
    amountPaid?: number;
    notes?: string;
    terms?: string;
    status?: string;
    currencySymbol?: string;
    bankDetails?: string;
}

function fmtMoney(amount: number, symbol: string = "$") {
    return `${symbol}${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function generatePDF(data: PDFData) {
    const {
        companyName = "Snaa Instruments",
        companyAddress = "Sialkot, Punjab, Pakistan",
        companyPhone = "+92-52-123-4567",
        companyEmail = "info@snaainstruments.com",
        companyLogo,
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
        discount = 0,
        total,
        amountPaid = 0,
        notes,
        terms,
        status,
        currencySymbol = "$",
        bankDetails,
    } = data;

    const balance = total - amountPaid;

    const statusColors: Record<string, { bg: string; color: string }> = {
        paid: { bg: "#dcfce7", color: "#16a34a" },
        completed: { bg: "#dcfce7", color: "#16a34a" },
        pending: { bg: "#fef3c7", color: "#d97706" },
        draft: { bg: "#f1f5f9", color: "#64748b" },
        overdue: { bg: "#fee2e2", color: "#dc2626" },
        sent: { bg: "#dbeafe", color: "#2563eb" },
        shipped: { bg: "#e0e7ff", color: "#4f46e5" },
        received: { bg: "#dcfce7", color: "#16a34a" },
        in_progress: { bg: "#fef3c7", color: "#d97706" },
        closed: { bg: "#f1f5f9", color: "#64748b" },
        accepted: { bg: "#dcfce7", color: "#16a34a" },
    };
    const statusStyle = statusColors[status?.toLowerCase() || ""] || { bg: "#dbeafe", color: "#2563eb" };

    const html = `
<!DOCTYPE html>
<html>
<head>
<title>${documentType} - ${documentNumber}</title>
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', 'Segoe UI', -apple-system, sans-serif; color: #1a1a2e; background: white; padding: 48px; max-width: 800px; margin: 0 auto; font-size: 13px; line-height: 1.5; }
    
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 36px; padding-bottom: 24px; border-bottom: 3px solid #2563eb; }
    .company-logo { width: 48px; height: 48px; background: linear-gradient(135deg, #2563eb, #3b82f6); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 18px; margin-bottom: 8px; }
    .company-name { font-size: 22px; font-weight: 800; color: #1e293b; letter-spacing: -0.5px; }
    .company-details { font-size: 11px; color: #64748b; margin-top: 4px; line-height: 1.7; }
    
    .doc-badge { text-align: right; }
    .doc-type { font-size: 32px; font-weight: 900; text-transform: uppercase; color: #1e293b; letter-spacing: 2px; }
    .doc-number { font-size: 14px; color: #2563eb; font-weight: 600; margin-top: 2px; }
    .doc-status { display: inline-block; padding: 4px 14px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 8px; background: ${statusStyle.bg}; color: ${statusStyle.color}; }
    
    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 32px; }
    .meta-section h4 { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: #94a3b8; margin-bottom: 10px; }
    .meta-section p { font-size: 13px; line-height: 1.7; color: #475569; }
    .meta-section strong { font-weight: 600; color: #1e293b; }
    
    table { width: 100%; border-collapse: collapse; margin-bottom: 28px; }
    thead th { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #94a3b8; padding: 12px 14px; text-align: left; border-bottom: 2px solid #e2e8f0; background: #f8fafc; }
    thead th:last-child, thead th:nth-child(2), thead th:nth-child(3) { text-align: right; }
    tbody td { font-size: 13px; padding: 14px; border-bottom: 1px solid #f1f5f9; color: #334155; }
    tbody td:first-child { font-weight: 500; }
    tbody td:last-child, tbody td:nth-child(2), tbody td:nth-child(3) { text-align: right; font-variant-numeric: tabular-nums; }
    tbody tr:last-child td { border-bottom: 2px solid #e2e8f0; }
    
    .totals { display: flex; justify-content: flex-end; margin-bottom: 32px; }
    .totals-box { min-width: 260px; background: #f8fafc; border-radius: 12px; padding: 16px 20px; }
    .totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; color: #64748b; }
    .totals-row span:last-child { font-weight: 600; color: #334155; }
    .totals-row.total { font-size: 18px; font-weight: 800; color: #1e293b; border-top: 2px solid #e2e8f0; padding-top: 12px; margin-top: 8px; }
    .totals-row.balance { font-size: 14px; font-weight: 700; color: #2563eb; }
    
    .footer { margin-top: 40px; padding-top: 24px; border-top: 1px solid #e2e8f0; }
    .footer-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    .footer h4 { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: #94a3b8; margin-bottom: 8px; }
    .footer p { font-size: 11px; color: #64748b; line-height: 1.7; }
    
    .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 100px; font-weight: 900; color: rgba(0,0,0,0.03); text-transform: uppercase; pointer-events: none; z-index: 0; }
    
    @media print {
        body { padding: 20px; }
        @page { margin: 15mm; size: A4; }
        .watermark { display: none; }
    }
</style>
</head>
<body>
    ${status ? `<div class="watermark">${status}</div>` : ""}
    
    <div class="header">
        <div>
            ${companyLogo ? `<img src="${companyLogo}" style="width:48px;height:48px;border-radius:12px;margin-bottom:8px;" />` : `<div class="company-logo">${companyName.charAt(0)}</div>`}
            <div class="company-name">${companyName}</div>
            <div class="company-details">
                ${companyAddress}<br/>
                ${companyPhone} · ${companyEmail}
            </div>
        </div>
        <div class="doc-badge">
            <div class="doc-type">${documentType}</div>
            <div class="doc-number">${documentNumber}</div>
            ${status ? `<div><span class="doc-status">${status}</span></div>` : ""}
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
            <h4>Document Details</h4>
            <p>
                <strong>Date:</strong> ${date}<br/>
                ${dueDate ? `<strong>${documentType === "Quotation" ? "Valid Until" : documentType === "Purchase Order" ? "Expected" : "Due Date"}:</strong> ${dueDate}<br/>` : ""}
                <strong>${documentType} #:</strong> ${documentNumber}
            </p>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th style="width:50%">Description</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Amount</th>
            </tr>
        </thead>
        <tbody>
            ${lineItems.map((item, i) => `
                <tr>
                    <td>${item.description}</td>
                    <td style="text-align:right">${item.qty}</td>
                    <td style="text-align:right">${fmtMoney(item.unitPrice, currencySymbol)}</td>
                    <td style="text-align:right">${fmtMoney(item.total, currencySymbol)}</td>
                </tr>
            `).join("")}
        </tbody>
    </table>

    <div class="totals">
        <div class="totals-box">
            <div class="totals-row"><span>Subtotal</span><span>${fmtMoney(subtotal, currencySymbol)}</span></div>
            ${discount > 0 ? `<div class="totals-row"><span>Discount</span><span style="color:#dc2626">-${fmtMoney(discount, currencySymbol)}</span></div>` : ""}
            ${tax > 0 ? `<div class="totals-row"><span>Tax</span><span>${fmtMoney(tax, currencySymbol)}</span></div>` : ""}
            <div class="totals-row total"><span>Total</span><span>${fmtMoney(total, currencySymbol)}</span></div>
            ${amountPaid > 0 ? `<div class="totals-row"><span>Amount Paid</span><span style="color:#16a34a">-${fmtMoney(amountPaid, currencySymbol)}</span></div>` : ""}
            ${amountPaid > 0 ? `<div class="totals-row balance"><span>Balance Due</span><span>${fmtMoney(balance, currencySymbol)}</span></div>` : ""}
        </div>
    </div>

    ${notes || terms || bankDetails ? `
    <div class="footer">
        <div class="footer-grid">
            <div>
                ${notes ? `<h4>Notes</h4><p>${notes}</p>` : ""}
                ${terms ? `<div style="margin-top:${notes ? '16' : '0'}px"><h4>Terms & Conditions</h4><p>${terms}</p></div>` : ""}
            </div>
            <div style="text-align:right">
                ${bankDetails ? `<h4>Bank Details</h4><p>${bankDetails}</p>` : ""}
            </div>
        </div>
    </div>
    ` : ""}
    
    <div style="text-align:center; margin-top:48px; font-size:10px; color:#94a3b8;">
        Thank you for your business · Generated on ${new Date().toLocaleDateString()}
    </div>
</body>
</html>`;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 300);
    }
}
