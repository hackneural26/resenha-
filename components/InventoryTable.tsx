import React from 'react';
import { SkewerItem } from '../types';

interface InventoryTableProps {
  items: SkewerItem[];
}

export const InventoryTable: React.FC<InventoryTableProps> = ({ items }) => {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-800 text-white uppercase text-xs">
            <tr>
              <th className="px-4 py-3 font-semibold">Produto</th>
              <th className="px-4 py-3 bg-green-700 text-center" title="Entrada Seção 2">Estoque (Cru)</th>
              <th className="px-4 py-3 bg-yellow-700 text-center" title="Entrada Seção 4">Consumo (Func.)</th>
              <th className="px-4 py-3 bg-blue-700 text-center" title="Entrada Seção 1">Vendido (Cx)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((item, idx) => {
              return (
                <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                  <td className="px-4 py-3 text-center font-bold text-green-700 bg-green-50 text-lg">{item.stock}</td>
                  <td className="px-4 py-3 text-center font-bold text-yellow-700 bg-yellow-50 text-lg">{item.consumed}</td>
                  <td className="px-4 py-3 text-center text-blue-600 font-bold text-lg">{item.sold}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};