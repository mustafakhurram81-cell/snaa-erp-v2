import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface CompanyInfo {
    company_name: string;
    company_email?: string;
    company_phone?: string;
    company_address?: string;
    tax_id?: string;
    currency?: string;
}

interface LineItem {
    product_name?: string;
    quantity: number;
    unit_price: number;
}

interface InvoiceData {
    invoice_number: string;
    customer_name: string;
    issue_date: string;
    due_date: string;
    total_amount: number;
    status: string;
    notes?: string;
}

interface QuotationData {
    quote_number: string;
    customer_name: string;
    quote_date: string;
    valid_until: string;
    total_amount: number;
    status: string;
    notes?: string;
}

function formatCurrency(amount: number, currency = "USD"): string {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
    }).format(amount);
}

function addHeader(doc: jsPDF, company: CompanyInfo, title: string, docNumber: string) {
    // Company name
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(37, 99, 235); // Blue
    doc.text(company.company_name || "Smith Instruments", 20, 25);

    // Company details
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    let y = 33;
    if (company.company_address) { doc.text(company.company_address, 20, y); y += 5; }
    if (company.company_email) { doc.text(`Email: ${company.company_email}`, 20, y); y += 5; }
    if (company.company_phone) { doc.text(`Phone: ${company.company_phone}`, 20, y); y += 5; }
    if (company.tax_id) { doc.text(`Tax ID: ${company.tax_id}`, 20, y); y += 5; }

    // Document title (right side)
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    doc.text(title.toUpperCase(), 190, 25, { align: "right" });

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(37, 99, 235);
    doc.text(docNumber, 190, 33, { align: "right" });

    // Separator line
    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(0.5);
    doc.line(20, y + 2, 190, y + 2);

    return y + 8;
}

function addFooter(doc: jsPDF) {
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(150, 150, 150);
    doc.text("Thank you for your business!", 105, pageHeight - 20, { align: "center" });
    doc.text(`Generated on ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, 105, pageHeight - 15, { align: "center" });
}

export function generateInvoicePDF(invoice: InvoiceData, lineItems: LineItem[], company: CompanyInfo) {
    const doc = new jsPDF();
    const currency = company.currency || "USD";

    let y = addHeader(doc, company, "Invoice", invoice.invoice_number);

    // Invoice details
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(60, 60, 60);
    doc.text("Bill To:", 20, y);
    doc.setFont("helvetica", "normal");
    doc.text(invoice.customer_name, 20, y + 6);

    doc.setFont("helvetica", "bold");
    doc.text("Invoice Details:", 120, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Issue Date: ${invoice.issue_date}`, 120, y + 6);
    doc.text(`Due Date: ${invoice.due_date}`, 120, y + 12);
    doc.text(`Status: ${invoice.status}`, 120, y + 18);

    y += 28;

    // Line items table
    autoTable(doc, {
        startY: y,
        head: [["#", "Product", "Qty", "Unit Price", "Amount"]],
        body: lineItems.map((item, i) => [
            i + 1,
            item.product_name || "Item",
            item.quantity,
            formatCurrency(item.unit_price, currency),
            formatCurrency(item.quantity * item.unit_price, currency),
        ]),
        styles: { fontSize: 9, cellPadding: 4 },
        headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        columnStyles: {
            0: { cellWidth: 15, halign: "center" },
            2: { cellWidth: 20, halign: "center" },
            3: { cellWidth: 35, halign: "right" },
            4: { cellWidth: 35, halign: "right" },
        },
    });

    // Total
    const finalY = (doc as any).lastAutoTable?.finalY || y + 40;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    doc.text("Total:", 140, finalY + 10);
    doc.setTextColor(37, 99, 235);
    doc.text(formatCurrency(invoice.total_amount, currency), 190, finalY + 10, { align: "right" });

    // Notes
    if (invoice.notes) {
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);
        doc.text("Notes:", 20, finalY + 25);
        doc.text(invoice.notes, 20, finalY + 31);
    }

    addFooter(doc);
    doc.save(`${invoice.invoice_number}.pdf`);
}

export function generateQuotationPDF(quotation: QuotationData, lineItems: LineItem[], company: CompanyInfo) {
    const doc = new jsPDF();
    const currency = company.currency || "USD";

    let y = addHeader(doc, company, "Quotation", quotation.quote_number);

    // Quotation details
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(60, 60, 60);
    doc.text("Prepared For:", 20, y);
    doc.setFont("helvetica", "normal");
    doc.text(quotation.customer_name, 20, y + 6);

    doc.setFont("helvetica", "bold");
    doc.text("Quotation Details:", 120, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Date: ${quotation.quote_date}`, 120, y + 6);
    doc.text(`Valid Until: ${quotation.valid_until}`, 120, y + 12);
    doc.text(`Status: ${quotation.status}`, 120, y + 18);

    y += 28;

    // Line items table
    autoTable(doc, {
        startY: y,
        head: [["#", "Product", "Qty", "Unit Price", "Amount"]],
        body: lineItems.map((item, i) => [
            i + 1,
            item.product_name || "Item",
            item.quantity,
            formatCurrency(item.unit_price, currency),
            formatCurrency(item.quantity * item.unit_price, currency),
        ]),
        styles: { fontSize: 9, cellPadding: 4 },
        headStyles: { fillColor: [109, 40, 217], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [245, 243, 255] },
        columnStyles: {
            0: { cellWidth: 15, halign: "center" },
            2: { cellWidth: 20, halign: "center" },
            3: { cellWidth: 35, halign: "right" },
            4: { cellWidth: 35, halign: "right" },
        },
    });

    // Total
    const finalY = (doc as any).lastAutoTable?.finalY || y + 40;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    doc.text("Total:", 140, finalY + 10);
    doc.setTextColor(109, 40, 217);
    doc.text(formatCurrency(quotation.total_amount, currency), 190, finalY + 10, { align: "right" });

    // Notes
    if (quotation.notes) {
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);
        doc.text("Notes:", 20, finalY + 25);
        doc.text(quotation.notes, 20, finalY + 31);
    }

    // Terms
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(130, 130, 130);
    const termsY = (invoice: boolean) => finalY + (quotation.notes ? 45 : 25);
    doc.text("Terms: This quotation is valid until the date specified above.", 20, termsY(false));
    doc.text("Prices are subject to change after the validity period.", 20, termsY(false) + 5);

    addFooter(doc);
    doc.save(`${quotation.quote_number}.pdf`);
}
