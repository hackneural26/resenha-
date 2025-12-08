import React, { useState } from 'react';
import { Loader2, Mic, Send, Plus, Minus, Box } from 'lucide-react';
import { parseVoiceInput } from '../services/geminiService';
import { InputContext, SkewerItem } from '../types';

interface ActionCardProps {
  title: string;
  context: InputContext;
  colorClass: string;
  icon: React.ReactNode;
  description: string;
  items: SkewerItem[];
  onUpdate: (itemId: string, field: keyof SkewerItem, delta: number) => void;
}

export const ActionCard: React.FC<ActionCardProps> = ({
  title,
  context,
  colorClass,
  icon,
  description,
  items,
  onUpdate
}) => {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string>(items[0].id);
  const [bulkByName, setBulkByName] = useState('');
  
  const handleManualSubmit = (delta: number) => {
    let field: keyof SkewerItem;
    
    if (context === 'SALES') field = 'sold';
    else if (context === 'ENTRY') field = 'stock';
    else field = 'leftover';

    onUpdate(selectedItem, field, delta);
  };

  const handleBulkByName = () => {
    const text = bulkByName.trim();
    if (!text) return;

    const numberWords: Record<string, number> = {
      'zero': 0, 'um': 1, 'uma': 1, 'dois': 2, 'duas': 2, 'três': 3, 'tres': 3,
      'quatro': 4, 'cinco': 5, 'seis': 6, 'sete': 7, 'oito': 8, 'nove': 9,
      'dez': 10, 'onze': 11, 'doze': 12, 'treze': 13, 'catorze': 14, 'quatorze': 14,
      'quinze': 15, 'dezesseis': 16, 'dezessete': 17, 'dezoito': 18, 'dezenove': 19,
      'vinte': 20
    };

    const parts = text.split(/[.,;]+/).map(p => p.trim()).filter(Boolean);
    const errors: string[] = [];

    const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[^a-z0-9\s]/g, '').trim();

    parts.forEach(part => {
      let qty: number | null = null;
      let namePart: string | null = null;

      // Try patterns like: "2 espeto de nome" or "dois espeto de nome"
      let m = part.match(/^(\d+|[a-zA-ZÀ-ÿ]+)\s+(?:espeto?s?|unidades?|unid)?(?:\s+de\s+)?(.+)$/i);
      if (m) {
        const numStr = m[1];
        const maybeName = m[2];
        if (/^\d+$/.test(numStr)) qty = Number(numStr);
        else {
          const n = numStr.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
          qty = numberWords[n] ?? null;
        }
        namePart = maybeName;
      } else {
        // Try patterns like: "nome 2" or "nome dois"
        m = part.match(/^(.+?)\s+(\d+|[a-zA-ZÀ-ÿ]+)$/i);
        if (m) {
          const maybeName = m[1];
          const numStr = m[2];
          if (/^\d+$/.test(numStr)) qty = Number(numStr);
          else {
            const n = numStr.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
            qty = numberWords[n] ?? null;
          }
          namePart = maybeName;
        }
      }

      if (qty === null || !namePart) {
        errors.push(part);
        return;
      }

      const cleaned = normalize(namePart);
      const found = items.find(i => normalize(i.name).includes(cleaned) || i.id.toLowerCase() === cleaned.replace(/\s+/g, '_'));
      if (!found) {
        errors.push(part);
        return;
      }

      // Map context to field
      let field: keyof SkewerItem;
      if (context === 'SALES') field = 'sold';
      else if (context === 'ENTRY') field = 'stock';
      else field = 'leftover';

      onUpdate(found.id, field, qty);
    });

    if (errors.length) alert('Não foi possível entender: ' + errors.join(' / '));
    setBulkByName('');
  };

  const handleAISubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setLoading(true);
    const result = await parseVoiceInput(inputText, context);
    setLoading(false);

    if (result && result.itemId) {
      let field: keyof SkewerItem;
      
      if (context === 'SALES') field = 'sold';
      else if (context === 'ENTRY') field = 'stock';
      else field = 'leftover';

      onUpdate(result.itemId, field, result.quantity);
      setInputText('');
    } else {
      alert("Não entendi o item ou a quantidade. Tente: '10 de carne' ou '5 pacotes de queijo'.");
    }
  };

  // Cores dinâmicas para os botões baseadas no contexto
  const getButtonColor = (isPlus: boolean) => {
      if (context === 'PRODUCTION') return isPlus ? 'bg-red-600 hover:bg-red-700' : 'bg-red-100 text-red-700 hover:bg-red-200';
      if (context === 'ENTRY') return isPlus ? 'bg-green-600 hover:bg-green-700' : 'bg-green-100 text-green-700 hover:bg-green-200';
      return isPlus ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-100 text-blue-700 hover:bg-blue-200';
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg border-l-4 ${colorClass} overflow-hidden flex flex-col h-full`}>
      <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="font-bold text-lg text-gray-800">{title}</h2>
        </div>
        <span className="text-xs text-gray-500 max-w-[150px] text-right leading-tight">{description}</span>
      </div>

      <div className="p-4 flex-1 flex flex-col gap-4">
        {/* AI Input Area */}
        <form onSubmit={handleAISubmit} className="relative">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={context === 'ENTRY' ? "Ex: Chegou 5 cx frango..." : context === 'PRODUCTION' ? "Ex: Sobrou 5 queijo..." : "Ex: Vendi 10 carne..."}
            className="w-full pl-4 pr-12 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          />
          <button 
            type="submit"
            disabled={loading}
            className="absolute right-2 top-2 p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </form>

        {/* Manual Controls */}
        <div className="mt-auto pt-4 border-t border-gray-100">
          <label className="block text-sm font-medium text-gray-600 mb-2">Selecione o Item:</label>
          <select 
            className="w-full p-2 mb-4 border border-gray-300 rounded-md bg-white text-lg font-medium"
            value={selectedItem}
            onChange={(e) => setSelectedItem(e.target.value)}
          >
            {items.map(i => (
              <option key={i.id} value={i.id}>{i.name}</option>
            ))}
          </select>

          {/* Bulk by name input */}
          <label className="block text-sm font-medium text-gray-600 mt-2">Inserir por nomes (ex: "Contra Filé 5, Queijo 2")</label>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={bulkByName}
              onChange={(e) => setBulkByName(e.target.value)}
              placeholder={context === 'ENTRY' ? "Ex: Queijo 5, Frango 2" : "Ex: Carne 3, Queijo 1"}
              className="flex-1 p-2 border border-gray-300 rounded-md"
            />
            <button
              onClick={handleBulkByName}
              className="py-2 px-3 bg-blue-600 text-white rounded-md font-bold"
            >
              Aplicar
            </button>
          </div>
          {/* Botões de Ação */}
          <div className="flex flex-col gap-3">
            
            {/* Botão Especial de Entrada (Pacote) */}
            {context === 'ENTRY' && (
               <button 
               onClick={() => handleManualSubmit(10)}
               className="w-full py-3 rounded-xl font-bold text-white transition-colors shadow-sm flex items-center justify-center gap-2 bg-green-700 hover:bg-green-800"
             >
               <Box className="w-5 h-5" />
               +1 EMBALAGEM (10 UNID)
             </button>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => handleManualSubmit(-1)}
                className={`py-4 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 ${getButtonColor(false)}`}
              >
                <Minus className="w-5 h-5" />
                RETIRAR (-1)
              </button>
              <button 
                onClick={() => handleManualSubmit(1)}
                className={`py-4 rounded-xl font-bold text-white transition-colors shadow-sm flex items-center justify-center gap-2 ${getButtonColor(true)}`}
              >
                <Plus className="w-5 h-5" />
                POR (+1)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};