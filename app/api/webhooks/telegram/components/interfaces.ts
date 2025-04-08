// Interface para a tabela codigos
export interface Codigos {
  id_codigo: string; // UUID
  id_produto?: string; // Texto
  codigo?: string; // Texto
  status?: string; // Texto
}

// Interface para a tabela combos
export interface Combos {
  id: string; // UUID
  nome?: string; // Texto
  descricao?: string; // Texto
  valor?: number; // Numérico
  produtos?: object; // JSON
  created_at: string; // Timestamp com fuso horário
  status?: string; // Texto
}

// Interface para a tabela produtos
export interface Produtos {
  id: string; // UUID
  nome?: string; // Texto
  valor?: number; // Numérico
  created_at: string; // Timestamp com fuso horário
  categoria?: string; // Texto
  descricao?: string; // Texto
}

// Interface para a tabela users
export interface Users {
  id: number; // Serial
  user_id?: string; // Texto
  username?: string; // Texto
  saldo?: number; // Numérico
  saldo_indicacao?: number; // Numérico
  created_at?: string; // Timestamp sem fuso horário
  historico_produtos?: object; // JSON
  historico_de_depositos?: object; // JSON
}

// Interface para a tabela vendas
export interface Vendas {
  uuid: string; // UUID
  id_cliente?: string; // Texto
  valor?: number; // Numérico
  status?: string; // Texto
  created_at: string; // Timestamp com fuso horário
  id_produto?: string; // Texto
  tipo_pagamento?: string; // Texto
}

export interface MessageButton {
  name: string;
  type: string;
  command: string;
}
