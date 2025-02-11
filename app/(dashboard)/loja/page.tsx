'use client';

import { Separator } from "@/app/components/ui/separator";


export default function Shop() {
  
  return (
   <div className="p-4">
    <h1 className="text-2xl font-semibold">Configure sua loja</h1>
   <h2>Layout da Loja</h2>
   <div>
    <h3 className="font-semibold">Lista do carousel de escolha do giftcard:</h3>
    <table >
  <thead>
    <tr className="bg-gray-100">
      <th className="border p-4 hover:bg-gray-200">Nome do produto</th>
      <th className="border p-4 hover:bg-gray-200">Url da Foto</th>
      <th className="border p-4 hover:bg-gray-200">Status da visi.</th>
      <th className="border p-4 hover:bg-gray-200">Rota </th>
    </tr>
  </thead>
  <tbody>
    
    <tr>
      <td>Produto Exemplo</td>
      <td>https://exemplo.com/foto.jpg</td>
      <td className="flex flex-col justify-center items-center">Visível</td>
      <td>/rota-de-redirecionamento</td>
    </tr>
  </tbody>
</table>

   </div>
    
   </div>
  );
}
