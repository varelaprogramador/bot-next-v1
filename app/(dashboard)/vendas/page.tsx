"use client";
import { DataTableVendas } from "@/app/components/tabela-vendas";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { VendasProps } from "../../utils/vendas";

export default function Vendas() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<VendasProps[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const { data: vendas, error } = await supabase
          .from("vendas")
          .select("*");

        if (error) {
          throw error;
        }

        setData(vendas || []);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [supabase]); // Supabase não precisa estar na dependência

  useEffect(() => {
    const subscription = supabase.channel("realtime:public:vendas").on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "vendas",
      },
      (payload) => {
        setData((prevData) => {
          switch (payload.eventType) {
            case "INSERT":
              return [...prevData, payload.new as VendasProps];
            case "UPDATE":
              return prevData.map((item) =>
                item.uuid === payload.new.uuid
                  ? (payload.new as VendasProps)
                  : item
              );
            case "DELETE":
              return prevData.filter((item) => item.uuid !== payload.old.uuid);
            default:
              return prevData;
          }
        });
      }
    );

    subscription.subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  // KPIs
  const totalVendas = data.reduce(
    (acc, venda) => acc + venda.valor,
    0
  );
  const vendasConcluidas = data.filter(
    (venda) => venda.status === "concluida"
  ).length;
  const currentPageData = data;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Acompanhe suas Vendas</h1>

      {/* Exibindo KPIs */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="p-4 border rounded">
          <h2 className="text-xl font-semibold">Total de Vendas</h2>
          <p className="text-2xl font-bold">{totalVendas.toFixed(2)} R$</p>
        </div>
        <div className="p-4 border rounded">
          <h2 className="text-xl font-semibold">Vendas Concluídas</h2>
          <p className="text-2xl font-bold">{vendasConcluidas}</p>
        </div>
        <div className="p-4 border rounded">
          <h2 className="text-xl font-semibold">Total de Vendas</h2>
          <p className="text-2xl font-bold">{data.length}</p>
        </div>
      </div>

      {/* DataTable de vendas */}
      <DataTableVendas data={currentPageData} />
    </div>
  );
}
