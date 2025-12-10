import React, { useState, useEffect } from 'react';
import { ShoppingCart, Package, Flame, Save, Trash2, FileSpreadsheet, MessageCircle, Eraser, Settings, Phone, X, Plus, Coffee } from 'lucide-react';
import { SkewerItem } from './types';
import { INITIAL_ITEMS, PACK_SIZE } from './constants';
import { ActionCard } from './components/ActionCard';
import { InventoryTable } from './components/InventoryTable';

const App: React.FC = () => {
  // Initialize state from local storage or constants
  const [items, setItems] = useState<SkewerItem[]>(() => {
    const saved = localStorage.getItem('grelha-stock-v5');
    if (saved) {
        return JSON.parse(saved);
    }
    return INITIAL_ITEMS;
  });

  // Phone number state
  const [bossPhone, setBossPhone] = useState(() => localStorage.getItem('grelha-boss-phone') || '');
  
  // Settings Modal State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tempPhone, setTempPhone] = useState('');

  // Add Item Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newStock, setNewStock] = useState<number | ''>('');

  // Persist items whenever they change
  useEffect(() => {
    localStorage.setItem('grelha-stock-v5', JSON.stringify(items));
  }, [items]);

  const handleUpdate = (itemId: string, field: keyof SkewerItem, delta: number) => {
    setItems(prevItems => prevItems.map(item => {
      if (item.id !== itemId) return item;
      
      const currentValue = item[field] as number;
      const newValue = currentValue + delta;

      // Bloqueia se tentar diminuir abaixo de zero (ex: tirar venda que não existe)
      if (newValue < 0) return item;

      let newStock = item.stock;

      // LÓGICA EM TEMPO REAL
      if (field === 'sold' || field === 'consumed') {
        // Se Vendeu (+delta), o estoque Diminui (-delta)
        // Se cancelou venda (-delta), o estoque Aumenta (--delta = +delta)
        newStock = item.stock - delta;
      } else if (field === 'leftover') {
        // Se Sobrou/Voltou (+delta), o estoque Aumenta (+delta) (volta pro freezer)
        // Se cancelou sobra (-delta), o estoque Diminui (-delta)
        newStock = item.stock + delta;
      } else if (field === 'stock') {
        // Se for Entrada direta (campo 2), atualiza o estoque diretamente
        newStock = newValue;
      }

      return {
        ...item,
        [field]: newValue,
        stock: Math.max(0, newStock) // Garante que estoque não fique negativo visualmente
      };
    }));
  };

  const openSettings = () => {
    setTempPhone(bossPhone);
    setIsSettingsOpen(true);
  };

  const openAddModal = () => {
    setNewName('');
    setNewStock('');
    setIsAddOpen(true);
  };

  const slugifyId = (name: string) => {
    return name.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  };

  const handleAddItem = () => {
    const name = newName.trim();
    if (!name) {
      alert('Informe o nome do espeto.');
      return;
    }

    const stockValue = typeof newStock === 'number' ? newStock : 0;

    let baseId = slugifyId(name);
    let id = baseId;
    let counter = 1;
    while (items.find(i => i.id === id)) {
      id = `${baseId}_${counter}`;
      counter++;
    }

    const newItem = {
      id,
      name,
      stock: Math.max(0, stockValue),
      sold: 0,
      leftover: 0,
      consumed: 0
    };

    setItems(prev => [...prev, newItem]);
    setIsAddOpen(false);
  };

  const saveSettings = () => {
    let clean = tempPhone.replace(/\D/g, ''); // Remove tudo que não for número
      
    // Remove zero à esquerda se houver (ex: 011 -> 11)
    if (clean.startsWith('0')) {
      clean = clean.substring(1);
    }

    setBossPhone(clean);
    localStorage.setItem('grelha-boss-phone', clean);
    setIsSettingsOpen(false);
  };

  const handleDownloadCSV = () => {
    const headers = ["Data;Produto;Vendas(Unid);Sobras(Unid);Consumo(Func.);Estoque Final(Cru)"];
    const today = new Date().toLocaleDateString('pt-BR');
    
    const rows = items.map(item => {
      return `${today};${item.name};${item.sold};${item.leftover};${item.consumed};${item.stock}`;
    });

    const csvContent = [headers, ...rows].join("\n");
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // Método simulando clique em link (funciona bem para downloads)
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Controle_Espetos_${today.replace(/\//g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDayClosure = () => {
    const confirmClose = window.confirm(
      "ENVIAR RELATÓRIO E ZERAR DIA?\n\n" +
      "1. Vai abrir o WhatsApp do Patrão.\n" +
      "2. Vai ZERAR Vendas e Sobras da tela.\n" +
      "3. O ESTOQUE CRU continua valendo para amanhã.\n\n" +
      "Confirmar fechamento?"
    );
    if (!confirmClose) return;

    // Generate WhatsApp Report
    let reportText = `*RELATÓRIO DE FECHAMENTO - ${new Date().toLocaleDateString()}*\n`;
    reportText += `----------------------------\n`;
    reportText += `*PRODUTO* | *VENDA* | *SOBRA* | *CONSUMO* | *ESTOQUE*\n`;
    
    items.forEach(item => {
      if (item.sold > 0 || item.leftover > 0 || item.stock > 0 || item.consumed > 0) {
        reportText += `${item.name}: ${item.sold} | ${item.leftover} | ${item.consumed} | *${item.stock}*\n`;
      }
    });
    reportText += `----------------------------\n`;
    reportText += `_Mestre da Grelha_`;

    const encodedText = encodeURIComponent(reportText);
    
    // Constrói a URL usando api.whatsapp.com (mais robusto que wa.me para web apps)
    let waUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
    if (bossPhone) {
        waUrl += `&phone=55${bossPhone}`;
    }

    // Open WhatsApp immediately using Link Click simulation (bypasses some popup blockers)
    const link = document.createElement('a');
    link.href = waUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Reset daily counters
    const newItems = items.map(item => ({
      ...item,
      leftover: 0,
      sold: 0,
      consumed: 0
    }));

    setItems(newItems);
  };

  const handleClearDailyMetricsOnly = () => {
    if(window.confirm("LIMPAR APENAS VENDAS E SOBRAS?\n\n- Vendas vão para ZERO.\n- Sobras vão para ZERO.\n- ESTOQUE: MANTÉM O VALOR ATUAL.\n\nUse isso para limpar a tela sem perder a contagem do freezer.")) {
       const newItems = items.map(item => ({
           ...item,
           sold: 0,
           leftover: 0,
           consumed: 0
           // Stock is explicitly preserved
       }));
       setItems(newItems);
    }
  };

  const resetData = () => {
      if(window.confirm("PERIGO: APAGAR TUDO (INCLUSIVE ESTOQUE)?\n\nIsso coloca ZERO em TUDO.\nUse isso apenas se for contar o freezer do zero agora.")){
          const zeroedItems = INITIAL_ITEMS.map(item => ({
              ...item,
              stock: 0,
              sold: 0,
              leftover: 0,
              consumed: 0
          }));
          setItems(zeroedItems);
          alert("Sistema zerado! Lance a contagem inicial na Entrada.");
      }
  }

  return (
    <div className="min-h-screen pb-32 md:pb-12 bg-gray-100 relative">
      
      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="bg-gray-900 text-white p-4 flex justify-between items-center">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Settings className="w-5 h-5" /> Configurar Zap
              </h3>
              <button onClick={() => setIsSettingsOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-gray-600 mb-4 text-sm">
                Digite o número do celular do patrão. O sistema enviará o relatório direto para ele.
              </p>
              
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Número com DDD</label>
              <input 
                type="tel"
                value={tempPhone}
                onChange={(e) => setTempPhone(e.target.value)}
                placeholder="Ex: 11999998888"
                className="w-full text-xl p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                autoFocus
              />
              <p className="text-xs text-gray-400 mt-2">Apenas números, sem o zero inicial no DDD.</p>

              <div className="flex gap-3 mt-6">
                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button 
                  onClick={saveSettings}
                  className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-md"
                >
                  SALVAR
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="bg-gray-900 text-white p-4 flex justify-between items-center">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Plus className="w-5 h-5" /> Adicionar Espeto
              </h3>
              <button onClick={() => setIsAddOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <p className="text-gray-600 mb-4 text-sm">Informe o nome do espeto e o estoque inicial (opcional).</p>

              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome do Espeto</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex: Espeto de Alho"
                className="w-full text-lg p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                autoFocus
              />

              <label className="block text-xs font-bold text-gray-500 uppercase mb-1 mt-4">Estoque inicial (opcional)</label>
              <input
                type="number"
                value={newStock === '' ? '' : String(newStock)}
                onChange={(e) => setNewStock(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0"
                className="w-full text-lg p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setIsAddOpen(false)}
                  className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddItem}
                  className="flex-1 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 shadow-md"
                >
                  ADICIONAR
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-gray-900 text-white p-4 shadow-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Flame className="text-orange-500 w-6 h-6" />
            <div className="flex flex-col">
              <h1 className="text-lg md:text-xl font-bold tracking-tight leading-none">Mestre da Grelha</h1>
              <span className="text-[10px] text-gray-400 font-mono">
                {bossPhone ? `Zap: ...${bossPhone.slice(-4)}` : 'Sem Zap Configurado'}
              </span>
            </div>
          </div>
          
          <div className="flex gap-2">
             <button 
              onClick={openAddModal}
              className="bg-green-700 hover:bg-green-600 text-white transition-colors flex items-center justify-center p-2 rounded shadow-sm border border-green-600"
              title="Adicionar novo espeto"
            >
              <Plus className="w-5 h-5" />
            </button>

            <button 
              onClick={openSettings}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 transition-colors flex items-center justify-center p-2 rounded shadow-sm border border-gray-300"
              title="Configurar Número do Patrão"
            >
              <Settings className="w-5 h-5" />
            </button>

            <button 
              onClick={handleClearDailyMetricsOnly}
              className="bg-yellow-200 hover:bg-yellow-300 text-yellow-800 transition-colors flex items-center gap-1 text-[10px] md:text-xs uppercase font-bold border border-yellow-300 px-2 py-2 rounded shadow-sm"
              title="Limpar apenas Vendas e Sobras, manter Estoque"
            >
              <Eraser className="w-4 h-4" />
              <span className="hidden md:inline">LIMPAR DIA</span>
              <span className="md:hidden">DIA</span>
            </button>
            <button 
              onClick={resetData}
              className="bg-red-200 hover:bg-red-300 text-red-800 transition-colors flex items-center gap-1 text-[10px] md:text-xs uppercase font-bold border border-red-300 px-2 py-2 rounded shadow-sm"
              title="Apagar tudo e começar do zero"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden md:inline">ZERAR GERAL</span>
              <span className="md:hidden">GERAL</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 space-y-6">
        
        {/* Intro Text */}
        <div className="bg-white border-l-4 border-blue-600 rounded-r-lg p-4 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-sm">
          <div>
            <h3 className="font-bold text-gray-800 text-lg mb-1">Painel do Churrasqueiro</h3>
            <p className="text-gray-600">
               {!bossPhone ? 
                 <span className="text-red-600 font-bold flex items-center gap-1">⚠ Clique na engrenagem acima para configurar o Zap do Patrão!</span> : 
                 "Sistema pronto. Vendas baixam estoque, Sobras devolvem ao estoque."
               }
            </p>
          </div>
          <div className="flex gap-4 text-xs md:text-sm">
             <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                <span>Venda (Baixa Estoque)</span>
             </div>
             <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                <span>Sobra (Volta Estoque)</span>
             </div>
          </div>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          {/* Section 1: Sales */}
          <ActionCard 
            title="1. Vendas" 
            context="SALES"
            colorClass="border-blue-500"
            icon={<ShoppingCart className="w-5 h-5 text-blue-600" />}
            description="Ao marcar, TIRA do estoque."
            items={items}
            onUpdate={handleUpdate}
          />

          {/* Section 2: Entry */}
          <ActionCard 
            title="2. Entrada (Compras)" 
            context="ENTRY"
            colorClass="border-green-500"
            icon={<Package className="w-5 h-5 text-green-600" />}
            description="Lançar o Estoque Real."
            items={items}
            onUpdate={handleUpdate}
          />

          {/* Section 3: Production (Leftovers Only) */}
          <ActionCard 
            title="3. Sobras (Volta Frio)" 
            context="PRODUCTION"
            colorClass="border-red-500"
            icon={<Flame className="w-5 h-5 text-red-600" />}
            description="Ao marcar, DEVOLVE ao estoque."
            items={items}
            onUpdate={handleUpdate}
          />

          {/* Section 4: Employee Consumption */}
          <ActionCard 
            title="4. Consumo Funcionário" 
            context="CONSUMPTION"
            colorClass="border-yellow-500"
            icon={<Coffee className="w-5 h-5 text-yellow-600" />}
            description="Consumo da equipe (TIRA do estoque)."
            items={items}
            onUpdate={handleUpdate}
          />
        </div>

        {/* Main Table */}
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <div className="w-1 h-6 bg-gray-800 rounded-full"></div>
            Balanço Atual (Ao Vivo)
          </h2>
          <InventoryTable items={items} />
        </div>

        {/* Closing Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-[0_-4px_10px_rgba(0,0,0,0.1)] md:relative md:bg-transparent md:border-none md:shadow-none md:p-0 md:mt-8 z-40">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-3 md:justify-end">
            
            <button
              onClick={handleDownloadCSV}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-sm transition-transform active:scale-95"
            >
              <FileSpreadsheet className="w-5 h-5" />
              BAIXAR PLANILHA
            </button>

            <button
              onClick={handleDayClosure}
              className="flex-[2] md:flex-none flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg transition-transform active:scale-95"
            >
              <MessageCircle className="w-5 h-5" />
              ENVIAR WHATSAPP E FECHAR
            </button>
            
          </div>
          <p className="text-center text-[10px] uppercase tracking-wider text-gray-400 mt-3 md:text-right">
            O fechamento zera Vendas/Sobras mas preserva o Estoque.
          </p>
        </div>

      </main>
    </div>
  );
};

export default App;