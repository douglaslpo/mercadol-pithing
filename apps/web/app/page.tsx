'use client';

import { useState } from 'react';
import { Search, Upload, Filter, Star, ShoppingCart, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNiche, setSelectedNiche] = useState('');

  const niches = [
    'Acessórios para celular',
    'Eletroportáteis',
    'Moda feminina',
    'Casa e jardim',
    'Esportes e fitness',
    'Beleza e saúde',
    'Livros e mídia',
    'Brinquedos e hobbies'
  ];

  const handleSearch = () => {
    if (searchQuery.trim()) {
      window.location.href = `/search/text?q=${encodeURIComponent(searchQuery)}&niche=${selectedNiche}`;
    }
  };

  const handleImageUpload = () => {
    window.location.href = '/search/image';
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-gray-900">
          Descubra os Melhores Produtos
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Analise e ranqueie produtos de múltiplos marketplaces. 
          Busque por texto ou imagem e encontre as melhores oportunidades.
        </p>
      </div>

      {/* Search Interface */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="space-y-6">
          {/* Text Search */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Search className="w-5 h-5 mr-2" />
              Busca por Texto
            </h2>
            <div className="flex gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Digite o nome do produto..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <div className="w-64">
                <select
                  value={selectedNiche}
                  onChange={(e) => setSelectedNiche(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todos os nichos</option>
                  {niches.map((niche) => (
                    <option key={niche} value={niche}>
                      {niche}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleSearch}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <Search className="w-5 h-5 mr-2" />
                Buscar
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">ou</span>
            </div>
          </div>

          {/* Image Search */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Upload className="w-5 h-5 mr-2" />
              Busca por Imagem
            </h2>
            <div className="text-center">
              <button
                onClick={handleImageUpload}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all flex items-center mx-auto"
              >
                <Upload className="w-5 h-5 mr-2" />
                Fazer Upload de Imagem
              </button>
              <p className="text-sm text-gray-500 mt-2">
                Encontre produtos similares usando uma foto
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 card-hover">
          <div className="flex items-center mb-4">
            <TrendingUp className="w-8 h-8 text-green-600 mr-3" />
            <h3 className="text-lg font-semibold">Ranking Inteligente</h3>
          </div>
          <p className="text-gray-600">
            Algoritmo avançado que considera demanda, qualidade, preço, logística e reputação do vendedor.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 card-hover">
          <div className="flex items-center mb-4">
            <Star className="w-8 h-8 text-yellow-600 mr-3" />
            <h3 className="text-lg font-semibold">Validação Manual</h3>
          </div>
          <p className="text-gray-600">
            Sistema de checklist para confirmar se produtos são realmente os mesmos, com explicações detalhadas.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 card-hover">
          <div className="flex items-center mb-4">
            <ShoppingCart className="w-8 h-8 text-blue-600 mr-3" />
            <h3 className="text-lg font-semibold">Multi-Marketplace</h3>
          </div>
          <p className="text-gray-600">
            Integração com Mercado Livre, Shopee e Wish para análise consolidada de produtos e vendedores.
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/rankings/acessorios-celular"
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <h3 className="font-medium text-gray-900">Acessórios Celular</h3>
            <p className="text-sm text-gray-500">Top produtos</p>
          </Link>
          <Link
            href="/rankings/eletroportateis"
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <h3 className="font-medium text-gray-900">Eletroportáteis</h3>
            <p className="text-sm text-gray-500">Top produtos</p>
          </Link>
          <Link
            href="/lists"
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <h3 className="font-medium text-gray-900">Minhas Listas</h3>
            <p className="text-sm text-gray-500">Produtos salvos</p>
          </Link>
          <Link
            href="/validate"
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <h3 className="font-medium text-gray-900">Validar Produtos</h3>
            <p className="text-sm text-gray-500">Checklist manual</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
