const fs = require('fs');

const invoiceContent = fs.readFileSync('src/components/InvoiceGenerator.tsx', 'utf-8');

// Extract printInvoice function
const printMatch = invoiceContent.match(/const printInvoice = async \(\) => \{([\s\S]*?)printWindow\.document\.write\(`([\s\S]*?)`\);/);

if (printMatch) {
  const htmlTemplate = printMatch[2];
  
  let templateContent = `export const generateInvoiceHtml = ({
  sale,
  allSales,
  allItems,
  item,
  customer,
  companySettings,
  outwardEntry,
  getDisplayName,
  convertNumberToWords,
  baseAmount,
  gstAmount,
  totalAmount,
  totalQuantity,
  allGstZero,
  qrCodeDataUrl,
  ewbQrCodeDataUrl,
  ewbDetails,
  windowOrigin = window?.location?.origin || ''
}: any) => {
  const currentSale = sale; // Map sale to currentSale for the template
  
  const companyHtml = companySettings ? \`
    <div class="company-name">\${companySettings.company_name}</div>
    <div class="company-address">
      \${companySettings.address_line1}<br>
      \${companySettings.address_line2 || ''}\${companySettings.address_line2 ? ', ' : ''}\${companySettings.locality} - \${companySettings.pin_code}<br>
      Phone: \${companySettings.phone}<br>
      GSTIN/UIN: \${companySettings.gstin} &nbsp;&nbsp;&nbsp; State Name: Tamil Nadu, Code: \${companySettings.state_code}
    </div>
  \` : \`
    <div style="color: red; font-weight: bold;">
      Company settings not configured for \${sale?.loading_place || ''}.<br>
      Please add this location in Company Settings.
    </div>
  \`;

  const signHtml = companySettings ? \`for \${companySettings.company_name}\` : \`for [Company Name]\`;

  return \`${htmlTemplate.replace(/`/g, '\\`').replace(/\$\{window\.location\.origin\}/g, '${windowOrigin}')}\`;
};
`;

  fs.writeFileSync('src/utils/invoiceTemplate.ts', templateContent);
  console.log('Template extracted to src/utils/invoiceTemplate.ts');
} else {
  console.log('Failed to extract template');
}
