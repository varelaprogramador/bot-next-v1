export interface VendasProps {
  uuid: string;
  id_produto?: string;
  id_cliente: string;
  created_at: string;
  valor: number;
  status: string;
  tipo_pagamento?: string;
}
