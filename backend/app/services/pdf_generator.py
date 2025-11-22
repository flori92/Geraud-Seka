"""PDF Generation Service for Quotes and Invoices."""
from datetime import date
from decimal import Decimal
from typing import Optional
from pathlib import Path
import tempfile
import uuid

try:
    from weasyprint import HTML, CSS
    WEASYPRINT_AVAILABLE = True
except ImportError:
    WEASYPRINT_AVAILABLE = False


class PDFGenerator:
    """Service for generating PDF documents from HTML templates."""

    def __init__(self, storage_service=None):
        """Initialize PDF generator with optional storage service."""
        self.storage_service = storage_service

        if not WEASYPRINT_AVAILABLE:
            raise ImportError(
                "WeasyPrint is not installed. "
                "Install it with: pip install weasyprint"
            )

    def generate_quote_pdf(self, quote, tenant) -> str:
        """
        Generate PDF for a quote.

        Args:
            quote: Quote model instance with items
            tenant: Tenant model instance

        Returns:
            str: Path to generated PDF file or URL if uploaded to storage
        """
        html_content = self._render_quote_template(quote, tenant)
        return self._generate_pdf_from_html(
            html_content,
            f"quote_{quote.quote_number}.pdf"
        )

    def generate_invoice_pdf(self, invoice, tenant) -> str:
        """
        Generate PDF for a sales invoice.

        Args:
            invoice: SalesInvoice model instance with items
            tenant: Tenant model instance

        Returns:
            str: Path to generated PDF file or URL if uploaded to storage
        """
        html_content = self._render_invoice_template(invoice, tenant)
        return self._generate_pdf_from_html(
            html_content,
            f"invoice_{invoice.invoice_number}.pdf"
        )

    def _generate_pdf_from_html(self, html_content: str, filename: str) -> str:
        """
        Generate PDF from HTML content.

        Args:
            html_content: HTML string
            filename: Output filename

        Returns:
            str: Path to generated PDF or storage URL
        """
        # Create temporary file for PDF
        temp_dir = Path(tempfile.gettempdir())
        pdf_path = temp_dir / filename

        # Generate PDF
        HTML(string=html_content).write_pdf(pdf_path, stylesheets=[CSS(string=self._get_base_css())])

        # Upload to storage if service available
        if self.storage_service:
            try:
                with open(pdf_path, 'rb') as f:
                    url = self.storage_service.upload_file(
                        f,
                        f"documents/{filename}",
                        content_type='application/pdf'
                    )
                # Clean up temp file
                pdf_path.unlink()
                return url
            except Exception as e:
                print(f"Failed to upload PDF to storage: {e}")
                return str(pdf_path)

        return str(pdf_path)

    def _render_quote_template(self, quote, tenant) -> str:
        """Render HTML template for quote."""
        items_html = ""
        for idx, item in enumerate(quote.items, 1):
            items_html += f"""
            <tr>
                <td class="text-center">{idx}</td>
                <td>{item.description}</td>
                <td class="text-center">{self._format_number(item.quantity)}</td>
                <td class="text-right">{self._format_currency(item.unit_price)}</td>
                <td class="text-center">{self._format_number(item.discount_percentage)}%</td>
                <td class="text-center">{self._format_number(item.vat_rate)}%</td>
                <td class="text-right">{self._format_currency(item.total_ttc)}</td>
            </tr>
            """

        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Devis {quote.quote_number}</title>
        </head>
        <body>
            <div class="document">
                <!-- Header -->
                <div class="header">
                    <div class="company-info">
                        <h1>{tenant.name}</h1>
                        <p>Pays: {tenant.country or 'Côte d\'Ivoire'}</p>
                    </div>
                    <div class="document-info">
                        <h2>DEVIS</h2>
                        <p><strong>N°:</strong> {quote.quote_number}</p>
                        <p><strong>Date:</strong> {self._format_date(quote.quote_date)}</p>
                        {f'<p><strong>Valable jusqu\'au:</strong> {self._format_date(quote.valid_until)}</p>' if quote.valid_until else ''}
                    </div>
                </div>

                <!-- Client Info -->
                <div class="client-info">
                    <h3>Client</h3>
                    <p><strong>{quote.client.name}</strong></p>
                    {f'<p>{quote.client.address}</p>' if hasattr(quote.client, 'address') and quote.client.address else ''}
                </div>

                <!-- Title & Description -->
                <div class="document-title">
                    <h3>{quote.title}</h3>
                    {f'<p>{quote.description}</p>' if quote.description else ''}
                </div>

                <!-- Items Table -->
                <table class="items-table">
                    <thead>
                        <tr>
                            <th class="text-center" width="5%">#</th>
                            <th width="40%">Description</th>
                            <th class="text-center" width="10%">Qté</th>
                            <th class="text-right" width="12%">P.U. HT</th>
                            <th class="text-center" width="8%">Remise</th>
                            <th class="text-center" width="8%">TVA</th>
                            <th class="text-right" width="15%">Total TTC</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items_html}
                    </tbody>
                </table>

                <!-- Totals -->
                <div class="totals">
                    <table class="totals-table">
                        <tr>
                            <td>Sous-total HT:</td>
                            <td class="text-right">{self._format_currency(quote.subtotal_ht)}</td>
                        </tr>
                        {f'''<tr>
                            <td>Remise ({self._format_number(quote.discount_percentage)}%):</td>
                            <td class="text-right">-{self._format_currency(quote.discount_amount)}</td>
                        </tr>''' if quote.discount_amount > 0 else ''}
                        <tr>
                            <td>Total HT:</td>
                            <td class="text-right">{self._format_currency(quote.total_ht)}</td>
                        </tr>
                        <tr>
                            <td>TVA:</td>
                            <td class="text-right">{self._format_currency(quote.total_vat)}</td>
                        </tr>
                        <tr class="total-row">
                            <td><strong>TOTAL TTC:</strong></td>
                            <td class="text-right"><strong>{self._format_currency(quote.total_ttc)} {quote.currency}</strong></td>
                        </tr>
                    </table>
                </div>

                <!-- Terms & Notes -->
                {f'''<div class="terms">
                    <h4>Conditions de paiement</h4>
                    <p>{quote.payment_terms}</p>
                </div>''' if quote.payment_terms else ''}

                {f'''<div class="terms">
                    <h4>Conditions de livraison</h4>
                    <p>{quote.delivery_terms}</p>
                </div>''' if quote.delivery_terms else ''}

                {f'''<div class="notes">
                    <h4>Notes</h4>
                    <p>{quote.notes}</p>
                </div>''' if quote.notes else ''}

                <!-- Footer -->
                <div class="footer">
                    <p class="text-center">Merci pour votre confiance !</p>
                </div>
            </div>
        </body>
        </html>
        """

    def _render_invoice_template(self, invoice, tenant) -> str:
        """Render HTML template for invoice."""
        items_html = ""
        for idx, item in enumerate(invoice.items, 1):
            items_html += f"""
            <tr>
                <td class="text-center">{idx}</td>
                <td>{item.description}</td>
                <td class="text-center">{self._format_number(item.quantity)}</td>
                <td class="text-right">{self._format_currency(item.unit_price)}</td>
                <td class="text-center">{self._format_number(item.discount_percentage)}%</td>
                <td class="text-center">{self._format_number(item.vat_rate)}%</td>
                <td class="text-right">{self._format_currency(item.total_ttc)}</td>
            </tr>
            """

        # Payment history
        payments_html = ""
        if invoice.payments:
            for payment in invoice.payments:
                payments_html += f"""
                <tr>
                    <td>{self._format_date(payment.payment_date)}</td>
                    <td>{payment.payment_method}</td>
                    <td>{payment.reference or '-'}</td>
                    <td class="text-right">{self._format_currency(payment.amount)}</td>
                </tr>
                """

        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Facture {invoice.invoice_number}</title>
        </head>
        <body>
            <div class="document">
                <!-- Header -->
                <div class="header">
                    <div class="company-info">
                        <h1>{tenant.name}</h1>
                        <p>Pays: {tenant.country or 'Côte d\'Ivoire'}</p>
                    </div>
                    <div class="document-info">
                        <h2>FACTURE</h2>
                        <p><strong>N°:</strong> {invoice.invoice_number}</p>
                        <p><strong>Date:</strong> {self._format_date(invoice.invoice_date)}</p>
                        {f'<p><strong>Date d\'échéance:</strong> {self._format_date(invoice.due_date)}</p>' if invoice.due_date else ''}
                        <p><strong>Statut:</strong> <span class="status status-{invoice.payment_status}">{self._format_status(invoice.payment_status)}</span></p>
                    </div>
                </div>

                <!-- Client Info -->
                <div class="client-info">
                    <h3>Client</h3>
                    <p><strong>{invoice.client.name}</strong></p>
                    {f'<p>{invoice.client.address}</p>' if hasattr(invoice.client, 'address') and invoice.client.address else ''}
                </div>

                <!-- Title & Description -->
                <div class="document-title">
                    <h3>{invoice.title}</h3>
                    {f'<p>{invoice.description}</p>' if invoice.description else ''}
                </div>

                <!-- Items Table -->
                <table class="items-table">
                    <thead>
                        <tr>
                            <th class="text-center" width="5%">#</th>
                            <th width="40%">Description</th>
                            <th class="text-center" width="10%">Qté</th>
                            <th class="text-right" width="12%">P.U. HT</th>
                            <th class="text-center" width="8%">Remise</th>
                            <th class="text-center" width="8%">TVA</th>
                            <th class="text-right" width="15%">Total TTC</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items_html}
                    </tbody>
                </table>

                <!-- Totals -->
                <div class="totals">
                    <table class="totals-table">
                        <tr>
                            <td>Sous-total HT:</td>
                            <td class="text-right">{self._format_currency(invoice.subtotal_ht)}</td>
                        </tr>
                        {f'''<tr>
                            <td>Remise ({self._format_number(invoice.discount_percentage)}%):</td>
                            <td class="text-right">-{self._format_currency(invoice.discount_amount)}</td>
                        </tr>''' if invoice.discount_amount > 0 else ''}
                        <tr>
                            <td>Total HT:</td>
                            <td class="text-right">{self._format_currency(invoice.total_ht)}</td>
                        </tr>
                        <tr>
                            <td>TVA:</td>
                            <td class="text-right">{self._format_currency(invoice.total_vat)}</td>
                        </tr>
                        <tr class="total-row">
                            <td><strong>TOTAL TTC:</strong></td>
                            <td class="text-right"><strong>{self._format_currency(invoice.total_ttc)} {invoice.currency}</strong></td>
                        </tr>
                        {f'''<tr class="payment-row">
                            <td>Montant payé:</td>
                            <td class="text-right text-success">{self._format_currency(invoice.amount_paid)}</td>
                        </tr>
                        <tr class="payment-row">
                            <td><strong>Reste à payer:</strong></td>
                            <td class="text-right text-danger"><strong>{self._format_currency(invoice.amount_due)}</strong></td>
                        </tr>''' if invoice.amount_paid > 0 else ''}
                    </table>
                </div>

                <!-- Payment History -->
                {f'''<div class="payment-history">
                    <h4>Historique des paiements</h4>
                    <table class="payments-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Méthode</th>
                                <th>Référence</th>
                                <th class="text-right">Montant</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments_html}
                        </tbody>
                    </table>
                </div>''' if payments_html else ''}

                <!-- Terms & Notes -->
                {f'''<div class="terms">
                    <h4>Conditions de paiement</h4>
                    <p>{invoice.payment_terms}</p>
                </div>''' if invoice.payment_terms else ''}

                {f'''<div class="notes">
                    <h4>Notes</h4>
                    <p>{invoice.notes}</p>
                </div>''' if invoice.notes else ''}

                <!-- Footer -->
                <div class="footer">
                    <p class="text-center">Merci pour votre confiance !</p>
                    <p class="text-center text-small">Document généré le {self._format_date(date.today())}</p>
                </div>
            </div>
        </body>
        </html>
        """

    def _get_base_css(self) -> str:
        """Get base CSS styles for PDF documents."""
        return """
        @page {
            size: A4;
            margin: 2cm;
        }

        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 10pt;
            color: #333;
            line-height: 1.5;
        }

        .document {
            width: 100%;
        }

        /* Header */
        .header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #2c3e50;
        }

        .company-info h1 {
            margin: 0 0 10px 0;
            font-size: 20pt;
            color: #2c3e50;
        }

        .company-info p {
            margin: 3px 0;
            font-size: 9pt;
            color: #666;
        }

        .document-info {
            text-align: right;
        }

        .document-info h2 {
            margin: 0 0 15px 0;
            font-size: 24pt;
            color: #e74c3c;
            font-weight: bold;
        }

        .document-info p {
            margin: 5px 0;
            font-size: 9pt;
        }

        /* Client Info */
        .client-info {
            margin: 20px 0;
            padding: 15px;
            background-color: #f8f9fa;
            border-left: 4px solid #3498db;
        }

        .client-info h3 {
            margin: 0 0 10px 0;
            font-size: 11pt;
            color: #2c3e50;
        }

        .client-info p {
            margin: 3px 0;
            font-size: 9pt;
        }

        /* Document Title */
        .document-title {
            margin: 20px 0;
        }

        .document-title h3 {
            margin: 0 0 10px 0;
            font-size: 13pt;
            color: #2c3e50;
        }

        .document-title p {
            margin: 0;
            font-size: 9pt;
            color: #666;
        }

        /* Tables */
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }

        .items-table thead {
            background-color: #34495e;
            color: white;
        }

        .items-table th,
        .items-table td {
            padding: 10px;
            border: 1px solid #ddd;
            font-size: 9pt;
        }

        .items-table th {
            font-weight: bold;
            text-transform: uppercase;
            font-size: 8pt;
        }

        .items-table tbody tr:nth-child(even) {
            background-color: #f8f9fa;
        }

        .items-table tbody tr:hover {
            background-color: #e8f4f8;
        }

        /* Totals */
        .totals {
            margin: 30px 0;
            float: right;
            width: 300px;
        }

        .totals-table {
            width: 100%;
            border-collapse: collapse;
        }

        .totals-table td {
            padding: 8px 12px;
            font-size: 10pt;
            border-bottom: 1px solid #eee;
        }

        .totals-table .total-row td {
            padding: 12px;
            font-size: 12pt;
            background-color: #2c3e50;
            color: white;
            border: none;
        }

        .totals-table .payment-row td {
            padding: 8px 12px;
            font-size: 9pt;
            background-color: #f8f9fa;
        }

        /* Payment History */
        .payment-history {
            clear: both;
            margin: 40px 0 20px 0;
            page-break-inside: avoid;
        }

        .payment-history h4 {
            margin: 0 0 10px 0;
            font-size: 11pt;
            color: #2c3e50;
        }

        .payments-table {
            width: 100%;
            border-collapse: collapse;
        }

        .payments-table th,
        .payments-table td {
            padding: 8px;
            border: 1px solid #ddd;
            font-size: 9pt;
        }

        .payments-table thead {
            background-color: #ecf0f1;
        }

        /* Terms & Notes */
        .terms,
        .notes {
            clear: both;
            margin: 20px 0;
            padding: 15px;
            background-color: #fffbea;
            border-left: 4px solid #f39c12;
            page-break-inside: avoid;
        }

        .terms h4,
        .notes h4 {
            margin: 0 0 10px 0;
            font-size: 10pt;
            color: #2c3e50;
        }

        .terms p,
        .notes p {
            margin: 0;
            font-size: 9pt;
            color: #666;
        }

        /* Footer */
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #ecf0f1;
            text-align: center;
        }

        .footer p {
            margin: 5px 0;
            font-size: 9pt;
            color: #95a5a6;
        }

        /* Utility Classes */
        .text-center {
            text-align: center;
        }

        .text-right {
            text-align: right;
        }

        .text-success {
            color: #27ae60;
        }

        .text-danger {
            color: #e74c3c;
        }

        .text-small {
            font-size: 8pt;
        }

        /* Status badges */
        .status {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 3px;
            font-size: 8pt;
            font-weight: bold;
            text-transform: uppercase;
        }

        .status-unpaid {
            background-color: #e74c3c;
            color: white;
        }

        .status-partial {
            background-color: #f39c12;
            color: white;
        }

        .status-paid {
            background-color: #27ae60;
            color: white;
        }

        .status-overdue {
            background-color: #c0392b;
            color: white;
        }
        """

    @staticmethod
    def _format_currency(amount: Decimal) -> str:
        """Format currency amount."""
        return f"{amount:,.2f}".replace(",", " ")

    @staticmethod
    def _format_number(number: Decimal) -> str:
        """Format number."""
        return f"{number:,.2f}".replace(",", " ").rstrip('0').rstrip('.')

    @staticmethod
    def _format_date(date_value) -> str:
        """Format date."""
        if isinstance(date_value, str):
            return date_value
        return date_value.strftime("%d/%m/%Y")

    @staticmethod
    def _format_status(status: str) -> str:
        """Format payment status for display."""
        status_map = {
            'unpaid': 'Impayée',
            'partial': 'Partiellement payée',
            'paid': 'Payée',
            'overdue': 'En retard',
        }
        return status_map.get(status, status)
