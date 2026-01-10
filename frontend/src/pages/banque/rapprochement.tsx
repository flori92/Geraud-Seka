import { useState } from "react";
import Head from "next/head";
import { Upload, CheckCircle, Link as LinkIcon } from "lucide-react";

interface BankLine {
  id: string;
  date: string;
  label: string;
  amount: number;
  matched: boolean;
}

interface Invoice {
  id: string;
  reference_number: string;
  supplier_name: string;
  amount_ttc: number;
  document_date: string;
}

export default function BankReconciliationPage() {
  const [file, setFile] = useState<File | null>(null);
  const [bankLines, setBankLines] = useState<BankLine[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedBankLine, setSelectedBankLine] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    
    const selectedFile = e.target.files[0];
    setFile(selectedFile);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const token = localStorage.getItem("seka_access_token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/bank/reconciliation/upload`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );

      if (response.ok) {
        const data = await response.json();
        setBankLines(data.bank_lines || []);
        setInvoices(data.invoices || []);
      }
    } catch (error) {
      console.error("Erreur upload:", error);
    }
  };

  const handleMatch = async () => {
    if (!selectedBankLine || !selectedInvoice) return;

    const token = localStorage.getItem("seka_access_token");
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/bank/reconciliation/match`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            bank_line_id: selectedBankLine,
            invoice_id: selectedInvoice,
          }),
        }
      );

      setBankLines(prev => prev.map(line => 
        line.id === selectedBankLine ? { ...line, matched: true } : line
      ));
      setInvoices(prev => prev.filter(inv => inv.id !== selectedInvoice));
      setSelectedBankLine(null);
      setSelectedInvoice(null);
    } catch (error) {
      console.error("Erreur matching:", error);
    }
  };

  return (
    <>
      <Head>
        <title>Rapprochement Bancaire - SEKA</title>
      </Head>
      <div className="min-h-screen bg-gray-50">
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold">Rapprochement Bancaire</h1>
              <p className="text-sm text-gray-500 mt-1">
                Importez votre relevé bancaire PDF et rapprochez avec vos factures
              </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
              <label className="block">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary-500 transition-colors">
                  <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-sm text-gray-600 mb-2">
                    {file ? file.name : "Cliquez pour sélectionner un relevé bancaire PDF"}
                  </p>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </label>
            </div>

            {bankLines.length > 0 && (
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold mb-4">Lignes du relevé bancaire</h2>
                  <div className="space-y-2">
                    {bankLines.map((line) => (
                      <div
                        key={line.id}
                        onClick={() => setSelectedBankLine(line.id)}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedBankLine === line.id
                            ? 'border-primary-500 bg-primary-50'
                            : line.matched
                            ? 'border-green-200 bg-green-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="text-sm font-medium">{line.label}</div>
                            <div className="text-xs text-gray-500">{line.date}</div>
                          </div>
                          <div className="text-right">
                            <div className={`font-semibold ${line.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {line.amount.toLocaleString()} FCFA
                            </div>
                            {line.matched && (
                              <CheckCircle className="h-4 w-4 text-green-600 ml-auto mt-1" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold mb-4">Factures à rapprocher</h2>
                  <div className="space-y-2">
                    {invoices.map((invoice) => (
                      <div
                        key={invoice.id}
                        onClick={() => setSelectedInvoice(invoice.id)}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedInvoice === invoice.id
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="text-sm font-medium">{invoice.supplier_name}</div>
                            <div className="text-xs text-gray-500">{invoice.reference_number}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">
                              {invoice.amount_ttc.toLocaleString()} FCFA
                            </div>
                            <div className="text-xs text-gray-500">{invoice.document_date}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {selectedBankLine && selectedInvoice && (
              <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg border border-gray-200 p-4">
                <button
                  onClick={handleMatch}
                  className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  <LinkIcon className="h-4 w-4" />
                  Rapprocher la sélection
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
