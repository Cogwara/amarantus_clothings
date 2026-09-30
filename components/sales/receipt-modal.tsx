'use client';

import * as React from 'react';
import { Modal } from '../ui/modal';
import { Button } from '../ui/button';
import { Printer, Share2, CheckCircle2 } from 'lucide-react';
import { formatNaira } from '@/lib/calculations';

export interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  saleId: string | null;
}

export function ReceiptModal({ isOpen, onClose, saleId }: ReceiptModalProps) {
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (isOpen && saleId) {
      setLoading(true);
      fetch(`/api/sales/${saleId}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((resData) => {
          if (resData) setData(resData);
        })
        .finally(() => setLoading(false));
    } else {
      setData(null);
    }
  }, [isOpen, saleId]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyWhatsAppText = () => {
    if (!data) return;
    const { sale, items, shop } = data;

    let text = `🧾 *RECEIPT: ${shop.name.toUpperCase()}*\n`;
    text += `📍 ${shop.address}\n`;
    text += `📞 ${shop.phone}\n`;
    text += `--------------------------------\n`;
    text += `*Sale #:* ${sale.saleNumber}\n`;
    text += `*Date:* ${new Date(sale.saleDate).toLocaleString('en-NG')}\n`;
    if (sale.customerName) text += `*Customer:* ${sale.customerName}\n`;
    text += `*Payment:* ${sale.paymentMethod}\n`;
    text += `--------------------------------\n`;
    items.forEach((it: any) => {
      text += `• ${it.productName} (${it.size}) x${it.quantity} - ${formatNaira(it.totalAmount)}\n`;
    });
    text += `--------------------------------\n`;
    text += `*Subtotal:* ${formatNaira(sale.subtotal)}\n`;
    if (sale.discount > 0) text += `*Discount:* -${formatNaira(sale.discount)}\n`;
    text += `*TOTAL PAID:* ${formatNaira(sale.totalAmount)}\n`;
    text += `--------------------------------\n`;
    text += `*Thank you for patronizing us!* 🙏✨\n`;
    text += `No refund after payment. Exchange allowed within 48hrs with tag intact.`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Sales Receipt"
      description="Print or send receipt to customer"
      maxWidth="md"
    >
      {loading || !data ? (
        <div className="py-12 text-center text-sm text-[#66736B]">
          Loading receipt details...
        </div>
      ) : (
        <div className="space-y-6">
          {/* Printable Receipt Container */}
          <div
            id="printable-receipt"
            className="p-6 bg-white border border-[#DDE5DF] rounded-[12px] shadow-sm font-mono text-xs text-[#17211B]"
          >
            {/* Header */}
            <div className="text-center pb-4 border-b border-dashed border-[#DDE5DF]">
              <h2 className="font-bold text-base font-sans text-[#16803C]">
                {data.shop.name}
              </h2>
              <p className="text-[11px] text-[#66736B] mt-0.5 font-sans">
                {data.shop.address}
              </p>
              <p className="text-[11px] text-[#66736B] font-sans">
                Tel: {data.shop.phone}
              </p>
            </div>

            {/* Sale Meta */}
            <div className="py-3 border-b border-dashed border-[#DDE5DF] space-y-1">
              <div className="flex justify-between">
                <span className="text-[#66736B]">Receipt No:</span>
                <span className="font-bold">{data.sale.saleNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#66736B]">Date:</span>
                <span>
                  {new Date(data.sale.saleDate).toLocaleString('en-NG', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#66736B]">Attendant:</span>
                <span>{data.sale.soldByName}</span>
              </div>
              {data.sale.customerName && (
                <div className="flex justify-between">
                  <span className="text-[#66736B]">Customer:</span>
                  <span className="font-bold">{data.sale.customerName}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[#66736B]">Payment:</span>
                <span className="font-bold text-[#16803C]">
                  {data.sale.paymentMethod}
                </span>
              </div>
            </div>

            {/* Items Table */}
            <div className="py-3 border-b border-dashed border-[#DDE5DF]">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[#66736B] border-b border-[#F0F4F1]">
                    <th className="pb-1.5 font-medium">Item</th>
                    <th className="pb-1.5 text-center font-medium">Qty</th>
                    <th className="pb-1.5 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0F4F1]">
                  {data.items.map((item: any) => (
                    <tr key={item.id} className="align-top">
                      <td className="py-2 pr-2">
                        <p className="font-semibold font-sans text-xs">
                          {item.productName}
                        </p>
                        <p className="text-[10px] text-[#66736B]">
                          Size: {item.size} • SKU: {item.productSku}
                        </p>
                      </td>
                      <td className="py-2 text-center">{item.quantity}</td>
                      <td className="py-2 text-right font-medium">
                        {formatNaira(item.totalAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="py-3 border-b border-dashed border-[#DDE5DF] space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-[#66736B]">Subtotal:</span>
                <span>{formatNaira(data.sale.subtotal)}</span>
              </div>
              {data.sale.discount > 0 && (
                <div className="flex justify-between text-xs text-[#D96F0B]">
                  <span>Discount:</span>
                  <span>-{formatNaira(data.sale.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold pt-1 border-t border-[#F0F4F1]">
                <span>TOTAL:</span>
                <span className="text-[#16803C]">
                  {formatNaira(data.sale.totalAmount)}
                </span>
              </div>
            </div>

            {/* Footer Message */}
            <div className="text-center pt-4 text-[10px] text-[#66736B] space-y-1 font-sans">
              <p className="font-bold text-[#17211B]">
                Thank you for your patronage! 🙏
              </p>
              <p>Exchange permitted within 48 hours with receipt and intact tags.</p>
              <p>Follow us on Instagram: @elegancethrifthaven</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Button
              variant="primary"
              className="w-full flex items-center justify-center gap-2"
              onClick={handlePrint}
            >
              <Printer className="w-4 h-4" />
              <span>Print Receipt</span>
            </Button>

            <Button
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
              onClick={handleCopyWhatsAppText}
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#16803C]" />
                  <span>Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 text-[#16803C]" />
                  <span>Copy WhatsApp Receipt</span>
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
