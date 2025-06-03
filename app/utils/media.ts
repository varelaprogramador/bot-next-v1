import { ProdutosLojaProps } from "./produto";

export interface MediaProps {
  id?: string;
  nome: string;
  url: string;
  status: boolean;
  created_at?: string;
  rota?: string;
  produtos: ProdutosLojaProps[];
}

export interface MediaBannerProps {
  id?: string;
  nome: string;
  url: string;
  status: boolean;
  created_at?: string;
  rota: string;
}
