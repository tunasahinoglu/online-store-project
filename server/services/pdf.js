import PDFDocument from "pdfkit";


const createPDFAttachment = (orderDocument, productDocuments) => {
    const pdf = new PDFDocument({ margin: 50, size: "A4" });

    //header
    let currentY = pdf.y;
    pdf.fontSize(18).text("INVOICE", { align: "center", underline: true });
    currentY += 20;
    pdf.fontSize(10).text(`Order ID: ${orderDocument.id}`, 50, currentY, { align: "left" });
    currentY += 15
    pdf.text(`Date: ${orderDocument.data().date}`, 50, currentY, { align: "left" });
    currentY += 30;

    //table header
    pdf.fontSize(12).text("Items Ordered", 50, currentY, { underline: true, align: "left" });
    currentY += 15;

    //table columns
    const tableHeaders = ["No.", "Product Name", "Total Price", "Discounted Price"];
    pdf.font("Helvetica-Bold")
        .text(tableHeaders[0], 50, currentY, { width: 40, align: "left" })
        .text(tableHeaders[1], 90, currentY, { width: 230, align: "left" })
        .text(tableHeaders[2], 340, currentY, { width: 90, align: "right" })
        .text(tableHeaders[3], 450, currentY, { width: 100, align: "right" });
    currentY += 15;

    //separator
    pdf.moveTo(50, currentY).lineTo(550, currentY).stroke();
    currentY += 5

    //table content
    pdf.font("Helvetica");
    let rowHeight = 15;
    for (let i = 0; i < productDocuments.length; i++) {
        const productDocument = productDocuments[i];
        const productData = productDocument.data();
        const originalPrice = productData.count * productData.price;
        const discountedPrice = (originalPrice * (100 - productData.discount)) / 100;
        pdf.text(`${productData.count}`, 50, currentY, { width: 40, align: "left" })
            .text(productData.name, 90, currentY, { width: 230, align: "left" })
            .text(`$${originalPrice.toFixed(2)}`, 340, currentY, { width: 90, align: "right", strike: true })
            .text(`$${discountedPrice.toFixed(2)}`, 450, currentY, { width: 100, align: "right" });
        currentY += rowHeight;
    }

    //separator
    currentY += 5
    pdf.moveTo(50, currentY).lineTo(550, currentY).stroke();
    currentY += 10;

    //footer
    pdf.font("Helvetica-Bold")
        .fontSize(12)
        .text(`Delivery Cost: $${orderDocument.data().deliverycost.toFixed(2)}`, 380, currentY, { align: "right" });
    currentY += 15;
    pdf.text(`Total: $${orderDocument.data().totaldiscountedcost.toFixed(2)}`, 430, currentY, { align: "right" });
    
    pdf.end();
    return { filename: "invoice.pdf", content: pdf, contentType: "application/pdf" };
};


export default createPDFAttachment;