import { ProdutosProps } from "./produto";

export interface MediaProps{
    id?:string,
      nome:string,
      url:string,
      status:boolean,
      produtos:ProdutosProps[],
      created_at?:string
    }