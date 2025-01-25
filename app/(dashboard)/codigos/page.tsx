"use client";
import { DataTableCodigos } from "@/app/components/tabela-codigos";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { CodigosProps } from "../../utils/codigos";

export default function Codigos() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<CodigosProps[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const { data: codigos, error } = await supabase
          .from("codigos")
          .select("*");

        if (error) {
          throw error;
        }

        setData(codigos || []);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [supabase]); // Supabase não precisa estar na dependência

  useEffect(() => {
    const subscription = supabase.channel("realtime:public:codigos").on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "codigos",
      },
      (payload) => {
        setData((prevData) => {
          switch (payload.eventType) {
            case "INSERT":
              return [...prevData, payload.new as CodigosProps];
            case "UPDATE":
              return prevData.map((item) =>
                item.id_codigo === payload.new.id_codigo
                  ? (payload.new as CodigosProps)
                  : item
              );
            case "DELETE":
              return prevData.filter(
                (item) => item.id_codigo !== payload.old.id_codigo
              );
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
  const totalcodigos = data.length;
  const codigosConcluidas = data.filter(
    (venda) => venda.status === "resgatado"
  ).length;
  const currentPageData = data;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Acompanhe seus Códigos</h1>

      {/* Exibindo KPIs */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="p-4 border rounded">
          <h2 className="text-xl font-semibold">Total de códigos</h2>
          <p className="text-2xl font-bold">{totalcodigos} </p>
        </div>
        <div className="p-4 border rounded">
          <h2 className="text-xl font-semibold">
            Total de códigos de resgatados
          </h2>
          <p className="text-2xl font-bold">{codigosConcluidas}</p>
        </div>
        <div className="p-4 border rounded">
          <h2 className="text-xl font-semibold">Total de Códigos</h2>
          <p className="text-2xl font-bold">{data.length}</p>
        </div>
      </div>

      {/* DataTable de codigos */}
      <DataTableCodigos data={currentPageData} />
    </div>
  );
}
