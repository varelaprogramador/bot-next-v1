'use client'
import { DataTableVendas } from '@/components/tabela-vendas';
import { useState } from 'react';

export default function Vendas() {
  // Exemplo de dados de vendas
  const vendas = [
    {
      id: "12345",
      produto: "Produto A",
      valor: 100.0,
      status: "Concluída",
    },
    {
      id: "12346",
      produto: "Produto B",
      valor: 50.0,
      status: "Pendente",
    },
    {
      id: "12347",
      produto: "Produto C",
      valor: 200.0,
      status: "Cancelada",
    },
  ];

  // KPIs (exemplos)
  const totalVendas = vendas.reduce((acc, venda) => acc + venda.valor, 0);
  const vendasConcluidas = vendas.filter(venda => venda.status === "Concluída").length;

  // Paginação e estado da tabela
  const [page, setPage] = useState(1);
  const rowsPerPage = 5;
  const totalRows = vendas.length;

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const startIndex = (page - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, totalRows);
  const currentPageData = vendas.slice(startIndex, endIndex);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Acompanhe suas Vendas</h1>

      {/* Exibindo KPIs */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="p-4 border rounded ">
          <h2 className="text-xl font-semibold">Total de Vendas</h2>
          <p className="text-2xl font-bold">{totalVendas.toFixed(2)} R$</p>
        </div>
        <div className="p-4 border rounded ">
          <h2 className="text-xl font-semibold">Vendas Concluídas</h2>
          <p className="text-2xl font-bold">{vendasConcluidas}</p>
        </div>
        <div className="p-4 border rounded ">
          <h2 className="text-xl font-semibold">Total de Produtos Vendidos</h2>
          <p className="text-2xl font-bold">{vendas.length}</p>
        </div>
      </div>

      {/* DataTable de vendas */}
      <DataTableVendas>
       
      </DataTableVendas>
    </div>
  );
}
