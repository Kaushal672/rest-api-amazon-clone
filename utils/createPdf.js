/* eslint-disable no-plusplus */
/* eslint-disable no-underscore-dangle */
const fs = require('fs');
const moment = require('moment');

function generateHr(doc, y) {
    doc.strokeColor('#aaaaaa')
        .lineWidth(1)
        .moveTo(50, y)
        .lineTo(550, y)
        .stroke();
}

exports.generateHeader = (doc, origin) => {
    doc.image('public/images/logo.png', 50, 45, {
        width: 100,
    })
        .text('Tax Invoice/Bill of Supply/Cash Memo', 100, 45, {
            align: 'center',
        })
        .font('Helvetica')
        .fontSize(10)
        .text('Go to:', 450, 45)
        .fillColor('blue')
        .text('Amazon', 478, 45, {
            link: origin,
        })
        .moveDown();
};

exports.generateFooter = (doc) => {
    doc.fontSize(10).text('Thank you for your business.', 50, 750, {
        align: 'center',
        width: 500,
    });
};

function getFormatedDate() {
    return moment().format('MMMM DD, YYYY');
}

exports.generateCustomerInformation = (doc, id, address, total) => {
    doc.fillColor('#444444').fontSize(20).text('Invoice', 50, 160);
    generateHr(doc, 185);

    const line1 = `${address.addressline}, ${address.city}`;
    const line2 = `${address.state}, ${address.country}, ${address.pincode}`;

    doc.font('Arial')
        .fontSize(10)
        .text('Invoice Id: ', 50, 200)
        .text(id, 150, 200)
        .text('Invoice Date: ', 50, 215)
        .text(getFormatedDate(), 150, 215)
        .text('Balance Due: ', 50, 230)
        .text(`₹${total.toFixed(2)}`, 150, 230)
        .text(address.fullName, 300, 200)
        .text(line1, 300, 215)
        .text(line2, 300, 230)
        .moveDown();

    generateHr(doc, 252);
};

function generateTableRow(
    doc,
    y,
    item,
    description,
    unitCost,
    quantity,
    lineTotal
) {
    doc.fontSize(10)
        .text(item, 50, y)
        .text(description, 150, y, {
            width: 150,
            height: 20,
            ellipsis: true,
        })
        .text(unitCost, 280, y, { width: 90, align: 'right' })
        .text(quantity, 370, y, { width: 90, align: 'right' })
        .text(lineTotal, 0, y, { align: 'right' });
}

exports.generatePriceTable = (doc, order, total) => {
    const invoiceTableTop = 330;
    generateTableRow(
        doc,
        invoiceTableTop,
        'SI.No',
        'Description',
        'Unit Cost',
        'Quantity',
        'Net Total'
    );
    generateHr(doc, invoiceTableTop + 20);
    const { products } = order;

    let i;

    // eslint-disable-next-line no-plusplus
    for (i = 0; i < products.length; i++) {
        const prod = products[i];
        const pos = invoiceTableTop + (i + 1) * 30;
        generateTableRow(
            doc,
            pos,
            i + 1,
            prod.productId.title,
            prod.price.toFixed(2),
            prod.quantity,
            `₹${(prod.price * prod.quantity).toFixed(2)}`
        );

        generateHr(doc, pos + 20);
    }

    const subTotalPos = invoiceTableTop + (i + 1) * 30;
    generateTableRow(
        doc,
        subTotalPos,
        '',
        '',
        'Subtotal',
        '',
        `₹${total.toFixed(2)}`
    );
};

exports.savePdfToFile = (pdfDoc, filepath) => {
    return new Promise((resolve, reject) => {
        let pendingSteps = 2;
        const stepFinished = () => {
            if (--pendingSteps === 0) {
                resolve();
            }
        };
        const wStream = fs.createWriteStream(filepath);
        wStream.on('close', stepFinished);
        wStream.on('error', (e) => {
            reject(e);
        });
        pdfDoc.pipe(wStream);
        pdfDoc.end();
        stepFinished();
    });
};
