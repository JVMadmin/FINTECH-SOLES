import { useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Printer, Download, CheckCircle } from "lucide-react";

// Format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(amount || 0);
};

// Format date
const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function PaymentTicket({
  isOpen,
  onClose,
  paymentData,
}) {
  const ticketRef = useRef(null);

  if (!paymentData) return null;

  const {
    cliente_nombre,
    monto,
    fecha_pago,
    metodo_pago,
    numero_pago,
    total_pagos,
    credito_id,
    saldo_restante,
    registrado_por_nombre,
    folio,
  } = paymentData;

  const handlePrint = () => {
    const printContent = ticketRef.current;
    const printWindow = window.open("", "_blank");
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Ticket de Pago - SOLES CORPORATIVO</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              width: 80mm;
              padding: 10px;
            }
            .ticket {
              width: 100%;
            }
            .header {
              text-align: center;
              border-bottom: 1px dashed #000;
              padding-bottom: 10px;
              margin-bottom: 10px;
            }
            .company-name {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .subtitle {
              font-size: 10px;
              color: #666;
            }
            .section {
              margin-bottom: 10px;
            }
            .row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 3px;
            }
            .label {
              color: #666;
            }
            .value {
              font-weight: bold;
            }
            .amount-section {
              text-align: center;
              border: 2px solid #000;
              padding: 10px;
              margin: 10px 0;
            }
            .amount-label {
              font-size: 10px;
              color: #666;
            }
            .amount {
              font-size: 24px;
              font-weight: bold;
            }
            .footer {
              text-align: center;
              border-top: 1px dashed #000;
              padding-top: 10px;
              margin-top: 10px;
              font-size: 10px;
              color: #666;
            }
            .checkmark {
              text-align: center;
              font-size: 30px;
              color: #22c55e;
              margin: 5px 0;
            }
            @media print {
              body { print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="w-5 h-5" />
            Ticket de Pago
          </DialogTitle>
        </DialogHeader>

        {/* Ticket Preview */}
        <div 
          ref={ticketRef}
          className="bg-white p-4 border rounded-lg font-mono text-sm"
          style={{ fontFamily: "'Courier New', monospace" }}
        >
          <div className="ticket">
            {/* Header */}
            <div className="text-center border-b border-dashed border-gray-400 pb-3 mb-3">
              <div className="text-lg font-bold">SOLES CORPORATIVO</div>
              <div className="text-xs text-gray-500">Sistema de Créditos</div>
              <div className="text-xs text-gray-500">RFC: XXX-XXXXXX-XXX</div>
            </div>

            {/* Success Icon */}
            <div className="text-center text-3xl text-green-500 my-2">✓</div>
            <div className="text-center font-bold text-green-600 mb-3">PAGO REGISTRADO</div>

            {/* Amount */}
            <div className="text-center border-2 border-gray-800 p-3 my-3">
              <div className="text-xs text-gray-500">MONTO PAGADO</div>
              <div className="text-2xl font-bold">{formatCurrency(monto)}</div>
            </div>

            {/* Details */}
            <div className="space-y-1 mb-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Folio:</span>
                <span className="font-bold">{folio || credito_id?.slice(-8).toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Fecha:</span>
                <span>{formatDate(fecha_pago)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Hora:</span>
                <span>{new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
            </div>

            {/* Client */}
            <div className="border-t border-dashed border-gray-400 pt-2 mb-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Cliente:</span>
              </div>
              <div className="font-bold text-sm">{cliente_nombre}</div>
            </div>

            {/* Payment Info */}
            <div className="space-y-1 mb-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Pago No:</span>
                <span>{numero_pago} de {total_pagos}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Método:</span>
                <span>{metodo_pago || "Efectivo"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Saldo restante:</span>
                <span className="font-bold">{formatCurrency(saldo_restante)}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center border-t border-dashed border-gray-400 pt-3 mt-3">
              <div className="text-xs text-gray-500">Atendió: {registrado_por_nombre || "Sistema"}</div>
              <div className="text-xs text-gray-500 mt-2">¡Gracias por su pago!</div>
              <div className="text-xs text-gray-400 mt-1">Conserve este comprobante</div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700">
            <Printer className="w-4 h-4 mr-2" />
            Imprimir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
