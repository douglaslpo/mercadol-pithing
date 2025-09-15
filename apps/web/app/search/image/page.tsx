'use client';

import { useState, useCallback } from 'react';
import { Upload, Search, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

interface ImageCandidate {
  product_id: string;
  title: string;
  image_url: string;
  score: number;
  listings: Array<{
    id: string;
    marketplace: string;
    price_amount: number;
    price_currency: string;
    seller_reputation: string;
    url: string;
  }>;
  explanation: {
    gtin_match?: boolean;
    brand_match?: boolean;
    title_similarity?: number;
    image_similarity?: number;
  };
}

export default function ImageSearchPage() {
  const [file, setFile] = useState<File | null>(null);
  const [candidates, setCandidates] = useState<ImageCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setFile(file);
      setError(null);
      
      // Criar preview
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  const handleSearch = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/search/image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Erro na busca por imagem');
      }

      const data = await response.json();
      setCandidates(data.candidates || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'score-excellent';
    if (score >= 0.6) return 'score-good';
    if (score >= 0.4) return 'score-fair';
    return 'score-poor';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 0.8) return 'Excelente';
    if (score >= 0.6) return 'Bom';
    if (score >= 0.4) return 'Razoável';
    return 'Baixo';
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Busca por Imagem
        </h1>
        <p className="text-gray-600">
          Faça upload de uma imagem para encontrar produtos similares
        </p>
      </div>

      {/* Upload Area */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="space-y-6">
          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            {isDragActive ? (
              <p className="text-blue-600">Solte a imagem aqui...</p>
            ) : (
              <div>
                <p className="text-gray-600 mb-2">
                  Arraste uma imagem aqui ou clique para selecionar
                </p>
                <p className="text-sm text-gray-500">
                  Formatos suportados: JPEG, PNG, WebP (máx. 10MB)
                </p>
              </div>
            )}
          </div>

          {/* Preview */}
          {preview && (
            <div className="text-center">
              <img
                src={preview}
                alt="Preview"
                className="max-w-xs mx-auto rounded-lg shadow-md"
              />
              <p className="text-sm text-gray-500 mt-2">
                {file?.name} ({(file?.size! / 1024 / 1024).toFixed(2)} MB)
              </p>
            </div>
          )}

          {/* Search Button */}
          {file && (
            <div className="text-center">
              <button
                onClick={handleSearch}
                disabled={loading}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center mx-auto"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Buscando...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5 mr-2" />
                    Buscar Produtos Similares
                  </>
                )}
              </button>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <XCircle className="w-5 h-5 text-red-600 mr-2" />
                <p className="text-red-800">{error}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      {candidates.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Produtos Encontrados ({candidates.length})
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {candidates.map((candidate, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden card-hover">
                {/* Product Image */}
                <div className="aspect-square bg-gray-100">
                  <img
                    src={candidate.image_url}
                    alt={candidate.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Product Info */}
                <div className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    {candidate.title}
                  </h3>

                  {/* Score */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-500">Similaridade:</span>
                    <span className={`score-badge ${getScoreColor(candidate.score)}`}>
                      {getScoreLabel(candidate.score)} ({candidate.score.toFixed(2)})
                    </span>
                  </div>

                  {/* Explanation */}
                  <div className="space-y-2 mb-4">
                    {candidate.explanation.gtin_match && (
                      <div className="flex items-center text-sm">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                        <span className="text-green-800">GTIN/EAN coincide</span>
                      </div>
                    )}
                    {candidate.explanation.brand_match && (
                      <div className="flex items-center text-sm">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                        <span className="text-green-800">Marca/Modelo compatível</span>
                      </div>
                    )}
                    {candidate.explanation.title_similarity && (
                      <div className="flex items-center text-sm">
                        <AlertCircle className="w-4 h-4 text-blue-600 mr-2" />
                        <span className="text-blue-800">
                          Título similar: {(candidate.explanation.title_similarity * 100).toFixed(0)}%
                        </span>
                      </div>
                    )}
                    {candidate.explanation.image_similarity && (
                      <div className="flex items-center text-sm">
                        <AlertCircle className="w-4 h-4 text-blue-600 mr-2" />
                        <span className="text-blue-800">
                          Imagem similar: {(candidate.explanation.image_similarity * 100).toFixed(0)}%
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Listings */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">Ofertas encontradas:</h4>
                    {candidate.listings.slice(0, 3).map((listing, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{listing.marketplace}</span>
                        <span className="font-medium">
                          {listing.price_currency} {listing.price_amount.toFixed(2)}
                        </span>
                      </div>
                    ))}
                    {candidate.listings.length > 3 && (
                      <p className="text-xs text-gray-500">
                        +{candidate.listings.length - 3} mais ofertas
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-4 space-x-2">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                      Validar
                    </button>
                    <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">
                      Ver Detalhes
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
