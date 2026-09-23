import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'PCC Integration Demo | Healthcare Integration Console',
  description: 'Sanitized technical demonstration of a PointClickCare healthcare integration workflow for DME orders using synthetic data and modular integration patterns.',
  openGraph: {
    title: 'PCC Integration Demo | Healthcare Integration Console',
    description: 'Sanitized technical demonstration of a PointClickCare healthcare integration workflow for DME orders using synthetic data and modular integration patterns.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PCC Integration Demo | Healthcare Integration Console',
    description: 'Sanitized technical demonstration of a PointClickCare healthcare integration workflow for DME orders using synthetic data and modular integration patterns.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
