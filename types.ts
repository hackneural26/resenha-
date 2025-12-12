export interface SkewerItem {
  id: string;
  name: string;
  stock: number;   // Estoque Cru (Input via Entrada)
  sold: number;    // Vendido (Input via Vendas - Referência de Saída)
  consumed: number; // Consumido por funcionários
}

export type InputContext = 'SALES' | 'ENTRY' | 'CONSUMPTION';

export interface AIProcessResult {
  itemId: string | null;
  quantity: number;
  actionType: 'ADD' | 'SUBTRACT' | 'SET';
}