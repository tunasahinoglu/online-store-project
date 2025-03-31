import PDFDocument from "pdfkit";


const createPDFAttachment = (orderDocument, productDocuments) => {
    const pdf = new PDFDocument();
    //header
    pdf.fontSize(20).text("INVOICE", { align: "center", underline: true });
    pdf.moveDown();
    pdf.fontSize(12).text(`Order ID: ${orderDocument.id}`);
    pdf.text(`Date: ${orderDocument.data().date}`);
    pdf.moveDown();
    //table header
    pdf.fontSize(14).text("Items", { underline: true });
    pdf.moveDown(0.5);
    pdf.font("Helvetica-Bold")
        .text("No.", 50, pdf.y, { width: 50, align: "left" })
        .text("Product Name", 100, pdf.y, { width: 200, align: "left" })
        .text("Original Price", 310, pdf.y, { width: 100, align: "right" })
        .text("Discounted Price", 420, pdf.y, { width: 120, align: "right" });
    pdf.moveDown(0.5);
    pdf.font("Helvetica");
    //table content
    for (let i = 0; i < productDocuments.length; i++) {
        const productDocument = productDocuments[i];
        const productData = productDocument.data();
        const originalPrice = productData.price;
        const discountedPrice = (originalPrice * (100 - productData.discount)) / 100;
        pdf.text(`${i + 1}`, 50, pdf.y, { width: 50, align: "left" })
        .text(productData.name, 100, pdf.y, { width: 200, align: "left" })
        .text(`$${originalPrice.toFixed(2)}`, 310, pdf.y, { width: 100, align: "right", strike: true })
        .text(`$${discountedPrice.toFixed(2)}`, 420, pdf.y, { width: 120, align: "right" });
        pdf.moveDown(0.5);
    }
    pdf.moveDown(1);
    //footer
    pdf
    .font("Helvetica-Bold")
    .fontSize(14)
    .text(`Total: $${orderDocument.data().totaldiscountedcost.toFixed(2)}`, { align: "right" });
    pdf.end();
    return {filename: "invoice.pdf", content:pdf, contentType:"application/pdf"};
}

export default createPDFAttachment;