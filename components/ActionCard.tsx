import React, { useState } from 'react';
import { Plus, Minus, Box } from 'lucide-react';
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
  const [selectedItem, setSelectedItem] = useState<string>(items.length > 0 ? items[0].id : '');
  
  const handleManualSubmit = (delta: number) => {
    if (!selectedItem) {
      alert("Por favor, adicione um item primeiro antes de fazer alterações.");
      return;
    }
    
    let field: keyof SkewerItem;
    
    if (context === 'SALES') field = 'sold';
    else if (context === 'ENTRY') field = 'stock';
    else field = 'leftover';

    onUpdate(selectedItem, field, delta);
  };

  // Cores dinâmicas para os botões baseadas no contexto
  const getButtonColor = (isPlus: boolean, isLarge: boolean = false) => {
      const baseColors = {
        'PRODUCTION': { plus: 'bg-red-600 hover:bg-red-700', minus: 'bg-red-100 text-red-700 hover:bg-red-200' },
        'ENTRY':      { plus: 'bg-green-600 hover:bg-green-700', minus: 'bg-green-100 text-green-700 hover:bg-green-200' },
        'SALES':      { plus: 'bg-blue-600 hover:bg-blue-700', minus: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
      };

      const style = baseColors[context];
      const color = isPlus ? style.plus : style.minus;

      // Botões grandes (+10) sempre com cor sólida
      if (isLarge && isPlus) return style.plus;
      if (isLarge && !isPlus) return context === 'SALES' ? 'bg-blue-200 text-blue-800 hover:bg-blue-300' : 
                                  context === 'PRODUCTION' ? 'bg-red-200 text-red-800 hover:bg-red-300' :
                                  'bg-green-200 text-green-800 hover:bg-green-300';
      
      return color;
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
        {/* Manual Controls */}
        <div className="mt-auto pt-4">
          <label className="block text-sm font-medium text-gray-600 mb-2">Selecione o Item:</label>
          <select 
            className="w-full p-2 mb-4 border border-gray-300 rounded-md bg-white text-lg font-medium"
            value={selectedItem}
            onChange={(e) => setSelectedItem(e.target.value)}
            disabled={items.length === 0}
          >
            {items.length > 0 ? (
              items.map(i => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))
            ) : (
              <option>Nenhum item adicionado</option>
            )}
          </select>

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

            {/* Botões de Venda/Sobra (+10 / -10) */}
            {(context === 'SALES' || context === 'PRODUCTION') && (
              <div className="grid grid-cols-2 gap-3">
                 <button 
                  onClick={() => handleManualSubmit(-10)}
                  className={`py-4 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 ${getButtonColor(false, true)}`}
                >
                  <Minus className="w-5 h-5" />
                  -10
                </button>
                <button 
                  onClick={() => handleManualSubmit(10)}
                  className={`py-4 rounded-xl font-bold text-white transition-colors shadow-sm flex items-center justify-center gap-2 ${getButtonColor(true, true)}`}
                >
                  <Plus className="w-5 h-5" />
                  +10
                </button>
              </div>
            )}
            
            {/* Botões padrão (+1 / -1) */}
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => handleManualSubmit(-1)}
                className={`py-4 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 ${getButtonColor(false)}`}
              >
                <Minus className="w-5 h-5" />
                -1
              </button>
              <button 
                onClick={() => handleManualSubmit(1)}
                className={`py-4 rounded-xl font-bold text-white transition-colors shadow-sm flex items-center justify-center gap-2 ${getButtonColor(true)}`}
              >
                <Plus className="w-5 h-5" />
                +1
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};