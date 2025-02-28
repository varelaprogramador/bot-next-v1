import { ProdutosProps } from "./produto";

export interface MediaProps {
  id?: string;
  nome: string;
  url: string;
  status: boolean;
  created_at?: string;
  rota: string;
}
