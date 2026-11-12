import './globals.css';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Service | Taller Automotriz', description: 'Gestión integral de taller' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="es"><body>{children}</body></html>; }
