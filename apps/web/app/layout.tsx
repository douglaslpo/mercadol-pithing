import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MercadoL Pithing - Descoberta de Produtos',
  description: 'Descubra e analise os melhores produtos em múltiplos marketplaces',
  keywords: ['produtos', 'marketplace', 'análise', 'ranking', 'busca'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          <header className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center">
                  <h1 className="text-2xl font-bold text-gray-900">
                    MercadoL Pithing
                  </h1>
                  <span className="ml-2 text-sm text-gray-500">
                    Descoberta de Produtos
                  </span>
                </div>
                <nav className="flex space-x-8">
                  <a href="/" className="text-gray-700 hover:text-blue-600">
                    Busca
                  </a>
                  <a href="/rankings" className="text-gray-700 hover:text-blue-600">
                    Rankings
                  </a>
                  <a href="/lists" className="text-gray-700 hover:text-blue-600">
                    Minhas Listas
                  </a>
                </nav>
              </div>
            </div>
          </header>
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
