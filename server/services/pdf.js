import PDFDocument from "pdfkit";


const createPDFAttachment = (orderDocument, productDocuments) => {
    const pdf = new PDFDocument({ margin: 50, size: "A4" });

    //header
    let currentY = 45;
    pdf.image("server/assets/teknosuLogo.jpg", 50, currentY, { width: 150 });
    currentY += 5;
    pdf.fillColor("#444444").fontSize(10);
    pdf.text("TeknoSU", 200, currentY, { align: "right" });
    currentY += 15;
    pdf.text("Orta, Tuzla", 200, currentY, { align: "right" });
    currentY += 15;
    pdf.text("Istanbul, Turkey", 200, currentY, { align: "right" });
    currentY += 80;

    //customer details start
    pdf.fillColor("#444444").fontSize(20);
    pdf.text("Invoice", 50, currentY);
    currentY += 25;
    pdf.strokeColor("#aaaaaa").lineWidth(1).moveTo(50, currentY).lineTo(550, currentY).stroke();
    currentY += 15;
    
    //general info
    pdf.fontSize(10);
    pdf.text("User Number:", 50, currentY);
    pdf.font("Helvetica-Bold")
    pdf.text(orderDocument.data().user, 150, currentY);
    currentY += 15;
    pdf.font("Helvetica")
    pdf.text("Order Number:", 50, currentY);
    pdf.font("Helvetica-Bold")
    pdf.text(orderDocument.id, 150, currentY);
    currentY += 15;
    pdf.font("Helvetica");
    pdf.text("Billing Date:", 50, currentY);
    pdf.text(orderDocument.data().date, 150, currentY);
    currentY += 15;
    pdf.text("Total Due:", 50, currentY);
    pdf.text(`$${orderDocument.data().totaldiscountedcost}`, 150, currentY);
    currentY += 30;
    pdf.text("Company Number:", 50, currentY);
    pdf.font("Helvetica-Bold")
    pdf.text(orderDocument.data().delivery.company, 150, currentY);
    currentY += 15;
    pdf.font("Helvetica")
    pdf.text("Company Name:", 50, currentY);
    pdf.text(orderDocument.data().delivery.name, 150, currentY);
    currentY += 15;
    pdf.text("Delivery Type:", 50, currentY);
    pdf.text(orderDocument.data().delivery.type, 150, currentY);
    currentY += 15;
    pdf.text("Delivery Cost:", 50, currentY);
    pdf.text(`$${orderDocument.data().deliverycost}`, 150, currentY);
    currentY += 30;
    pdf.text("Notes:", 50, currentY);
    pdf.text(orderDocument.data().notes ? orderDocument.data().notes : "-", 150, currentY);
    currentY += 15;

    //delivery address
    currentY = 200;
    pdf.font("Helvetica");
    pdf.text("Delivery Address", 200, currentY, { align: "right", underline: true });
    currentY += 15
    pdf.font("Helvetica-Bold");
    pdf.text(`${orderDocument.data().firstname} ${orderDocument.data().lastname}`, 200, currentY, { align: "right" });
    currentY += 15
    pdf.font("Helvetica");
    pdf.text(orderDocument.data().address.address, 200, currentY, { align: "right" });
    currentY += 15
    pdf.text(`${orderDocument.data().address.city}, ${orderDocument.data().address.country}`, 200, currentY, { align: "right" });
    currentY += 30;

    //billing address
    pdf.font("Helvetica");
    pdf.text("Billing Address", 200, currentY, { align: "right", underline: true });
    currentY += 15
    pdf.font("Helvetica-Bold");
    pdf.text(`${orderDocument.data().firstname} ${orderDocument.data().lastname}`, 200, currentY, { align: "right" });
    currentY += 15
    pdf.font("Helvetica");
    pdf.text(orderDocument.data().billingaddress.address, 200, currentY, { align: "right" });
    currentY += 15
    pdf.text(`${orderDocument.data().billingaddress.city}, ${orderDocument.data().billingaddress.country}`, 200, currentY, { align: "right" });
    currentY += 52

    //customer details end
    pdf.strokeColor("#aaaaaa").lineWidth(1).moveTo(50, currentY).lineTo(550, currentY).stroke();
    currentY += 15;

    //table header
    currentY = 435;
    const tableHeaders = ["ID", "Name", "Quantity", "Discount", "Line Total"];
    pdf.font("Helvetica-Bold").fontSize(10);
    pdf.text(tableHeaders[0], 50, currentY);
    pdf.text(tableHeaders[1], 200, currentY);
    pdf.text(tableHeaders[2], 280, currentY, { width: 90, align: "right" });
    pdf.text(tableHeaders[3], 370, currentY, { width: 90, align: "right" });
    pdf.text(tableHeaders[4], 0, currentY, { align: "right" });
    currentY += 20;
    pdf.strokeColor("#aaaaaa").lineWidth(1).moveTo(50, currentY).lineTo(550, currentY).stroke();
    currentY += 10;

    //table content
    pdf.font("Helvetica").fontSize(10);
    for (let i = 0; i < productDocuments.length; i++) {
        if (currentY >= 765) {
            pdf.addPage();
            currentY = 50;
            pdf.font("Helvetica-Bold").fillColor("#444444").fontSize(10);
            pdf.text(tableHeaders[0], 50, currentY);
            pdf.text(tableHeaders[1], 200, currentY);
            pdf.text(tableHeaders[2], 280, currentY, { width: 90, align: "right" });
            pdf.text(tableHeaders[3], 370, currentY, { width: 90, align: "right" });
            pdf.text(tableHeaders[4], 0, currentY, { align: "right" });
            pdf.font("Helvetica").fontSize(10);
            currentY += 20;
            pdf.strokeColor("#aaaaaa").lineWidth(1).moveTo(50, currentY).lineTo(550, currentY).stroke();
            currentY += 10;
        }
        
        const productDocument = productDocuments[i];
        const productData = productDocument.data();
        const originalPrice = productData.count * productData.price;
        const discountedPrice = (originalPrice * (100 - productData.discount)) / 100;
        pdf.font("Helvetica-Bold");
        pdf.text(productDocument.id, 50, currentY);
        pdf.font("Helvetica");
        pdf.text(productData.name, 200, currentY);
        pdf.text(productData.count, 280, currentY, { width: 90, align: "right" });
        pdf.text(`${productData.discount > 0 ? `${productData.discount}%` : "-"}`, 370, currentY, { width: 90, align: "right" });
        pdf.text(`$${discountedPrice.toFixed(2)}`, 0, currentY, { align: "right" });
        currentY += 20;
        pdf.strokeColor("#aaaaaa").lineWidth(1).moveTo(50, currentY).lineTo(550, currentY).stroke();
        currentY += 10;
    }
    //table details end

    //total details
    pdf.font("Helvetica").fontSize(10);
    pdf.text("Subtotal", 280, currentY, { width: 90, align: "right" });
    pdf.text(`$${(orderDocument.data().totaldiscountedcost-orderDocument.data().deliverycost).toFixed(2)}`, 0, currentY, { align: "right" });
    currentY += 20;
    if (currentY >= 765) {
        pdf.addPage();
        pdf.fillColor("#444444");
        currentY = 50;
    }
    pdf.text("Delivery Cost", 280, currentY, { width: 90, align: "right" });
    pdf.text(`$${orderDocument.data().deliverycost.toFixed(2)}`, 0, currentY, { align: "right" });
    currentY += 25;
    if (currentY >= 765) {
        pdf.addPage();
        pdf.fillColor("#444444");
        currentY = 50;
    }
    pdf.font("Helvetica-Bold");
    pdf.text("Total Due", 280, currentY, { width: 90, align: "right" });
    pdf.text(`$${orderDocument.data().totaldiscountedcost.toFixed(2)}`, 0, currentY, { align: "right" });
    currentY += 30;
    if (currentY >= 765) {
        pdf.addPage();
        pdf.fillColor("#444444");
        currentY = 50;
    }

    //footer
    currentY = 765;
    pdf.font("Helvetica").fontSize(10);
    pdf.text("You may cancel your order while it is still being processed. Refunds are available within 30 days of delivery. Thank you for choosing TeknoSU.", 50, currentY, { align: "center", width: 500 });
    
    pdf.end();
    return { filename: "invoice.pdf", content: pdf, contentType: "application/pdf" };
};


export default createPDFAttachment;