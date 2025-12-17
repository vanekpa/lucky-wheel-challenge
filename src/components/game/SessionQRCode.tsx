import { QRCodeSVG } from 'qrcode.react';

interface SessionQRCodeProps {
  sessionCode: string;
  size?: number;
}

export const SessionQRCode = ({ sessionCode, size = 200 }: SessionQRCodeProps) => {
  const controllerUrl = `${window.location.origin}/control/${sessionCode}`;

  return (
    <div className="bg-white p-4 rounded-xl shadow-lg">
      <QRCodeSVG
        value={controllerUrl}
        size={size}
        level="H"
        includeMargin={false}
        bgColor="#ffffff"
        fgColor="#000000"
      />
    </div>
  );
};
