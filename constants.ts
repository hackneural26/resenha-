import { SkewerItem } from './types';

export const INITIAL_ITEMS: SkewerItem[] = [
  { id: 'contra_file', name: 'Contra Filé', stock: 0, sold: 0, consumed: 0 },
  { id: 'misto', name: 'Misto', stock: 0, sold: 0, consumed: 0 },
  { id: 'frango_bacon', name: 'Frango c/ Bacon', stock: 0, sold: 0, consumed: 0 },
  { id: 'frango', name: 'Frango', stock: 0, sold: 0, consumed: 0 },
  { id: 'cupim', name: 'Cupim', stock: 0, sold: 0, consumed: 0 },
  { id: 'queijo', name: 'Queijo', stock: 0, sold: 0, consumed: 0 },
  { id: 'queijo_mel', name: 'Queijo c/ Mel', stock: 0, sold: 0, consumed: 0 },
  { id: 'carne_bacon', name: 'Carne c/ Bacon', stock: 0, sold: 0, consumed: 0 },
  { id: 'lingua', name: 'Língua', stock: 0, sold: 0, consumed: 0 },
  { id: 'coracao', name: 'Coração', stock: 0, sold: 0, consumed: 0 },
];

export const PACK_SIZE = 10; // Standard package size for quick entry