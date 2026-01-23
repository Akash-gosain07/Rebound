import PDFDocument from 'pdfkit';

export function generateCertificatePdf(match) {
  const doc = new PDFDocument();

  const date = new Date(match.createdAt).toLocaleString();

  doc.fontSize(20).text('Rebound Recovery Certificate', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Match ID: ${match._id}`);
  doc.text(`Date: ${date}`);
  doc.moveDown();

  doc.text(`Owner: ${match.owner.name} (${match.owner.userId})`);
  doc.text(`Finder: ${match.finder.name} (${match.finder.userId})`);
  doc.moveDown();

  doc.text(`Item: ${match.lostItem.title} (${match.lostItem.category})`);
  doc.text(`Status: CONFIRMED`);
  doc.text(`Match score: ${match.matchScore}%`);

  doc.end();

  return doc;
}
