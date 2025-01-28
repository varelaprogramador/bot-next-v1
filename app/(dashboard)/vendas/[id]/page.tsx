"use client";
import { DataTableVendas } from "@/app/components/tabela-vendas";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { VendasProps } from "@/app/utils/vendas";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/app/components/ui/button";

export default function Vendas() {
  const supabase = createClient();
  const { id } = useParams(); // Captura o `id` da venda na URL
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<VendasProps[]>([]);
  const [productName, setProductName] = useState<string | null>(null);

  // Função para buscar o nome do produto
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchProductName = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from("produtos")
        .select("nome")
        .eq("id", id)
        .single(); // Retorna apenas um único resultado

      if (error) {
        throw error; // Se houver um erro, ele é lançado
      }

      return data ? data.nome : null; // Retorna o nome ou null se não encontrar
    } catch (error) {
      console.error("Erro ao buscar produto:", error);
      return null;
    }
  };

  // Carrega os dados da venda
  useEffect(() => {
    if (!id) return; // Não carrega até que o `id` esteja disponível

    const loadData = async () => {
      setLoading(true);
      try {
        const { data: vendas, error } = await supabase
          .from("vendas")
          .select("*")
          .eq("id_produto", id); // Filtra pelo `id` da venda

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
  }, [id, supabase]); // Recarrega sempre que o `id` mudar

  // Carrega o nome do produto
  useEffect(() => {
    if (id) {
      const loadProductName = async () => {
        const name = await fetchProductName(id as string);
        setProductName(name);
      };
      loadProductName();
    }
  }, [fetchProductName, id]);

  useEffect(() => {
    if (!id) return; // Não configura o canal sem um `id`

    const subscription = supabase
      .channel(`realtime:public:vendas:${id}`) // Canal específico para o `id`
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "vendas",
          filter: `id_produto=eq.${id}`, // Filtra eventos relacionados ao `id`
        },
        (payload) => {
          setData((prevData) => {
            switch (payload.eventType) {
              case "INSERT":
                return [...prevData, payload.new as VendasProps];
              case "UPDATE":
                return prevData.map((item) =>
                  item.id_produto === payload.new.id_produto
                    ? (payload.new as VendasProps)
                    : item
                );
              case "DELETE":
                return prevData.filter(
                  (item) => item.id_produto !== payload.old.id_produto
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
  }, [id, supabase]);

  // KPIs
  const totalVendas = data.reduce(
    (acc, venda) => acc + venda.valor,
    0
  );
  const vendasConcluidas = data.filter(
    (venda) => venda.status === "concluido"
  ).length;

  if (loading) {
    return <p>Carregando...</p>;
  }

  return (
    <div className="container mx-auto p-6 space-y-2">
      <Button
        onClick={() => (window.location.href = `/produtos/${id}`)}
        className="rounded-full bg-blue-500 hover:bg-blue-400"
      >
        <ArrowLeft></ArrowLeft>{" "}
      </Button>
      <h1 className="text-3xl font-bold mb-6">
        Detalhes das Vendas: {productName || "Carregando nome do produto..."}
      </h1>

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
      <DataTableVendas data={data} />
    </div>
  );
}
