"use client";

import { QRCodeSVG } from "qrcode.react";

interface BookingQRCodeProps {
  bookingReference: string;
  size?: number;
}

export function BookingQRCode({ bookingReference, size = 128 }: BookingQRCodeProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="rounded-lg border bg-white p-3">
        <QRCodeSVG
          value={bookingReference}
          size={size}
          level="M"
          marginSize={0}
        />
      </div>
      <p className="text-xs text-muted-foreground font-mono">
        {bookingReference}
      </p>
    </div>
  );
}
