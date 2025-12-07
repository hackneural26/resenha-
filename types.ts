export interface SkewerItem {
  id: string;
  name: string;
  stock: number;   // Estoque Cru (Input via Entrada)
  sold: number;    // Vendido (Input via Vendas - Referência de Saída)
  leftover: number;// Sobras (Input via Produção - Assado que não vendeu)
}

export type InputContext = 'SALES' | 'ENTRY' | 'PRODUCTION';

export interface AIProcessResult {
  itemId: string | null;
  quantity: number;
  actionType: 'ADD' | 'SUBTRACT' | 'SET';
  subType?: 'LEFTOVER'; // Only for Production context
}