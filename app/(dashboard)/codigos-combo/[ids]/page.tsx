"use client";
import { DataTableCodigos } from "@/app/components/tabela-codigos";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { CodigosProps } from "../../../utils/codigos";
import { useParams } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function CodigosCombos() {
  const supabase = createClient();
  const { ids } = useParams(); // Captura o `ids` da URL
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<CodigosProps[]>([]);
  const [productName, setProductName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null); // State for error handling

  console.log("Bem vindo " + ids);

  // Função para buscar o nome do produto
  const fetchProductName = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from("produtos")
        .select("nome")
        .eq("id", id)
        .single();

      if (error) {
        throw error;
      }

      return data ? data.nome : null;
    } catch (error) {
      console.error("Erro ao buscar produto:", error);
      return null;
    }
  };

  // Carregar dados inicialmente
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null); // Reset error state
      try {
        if (!ids) {
          throw new Error("IDs não fornecidos: " + ids);
        }

        // Converte a string de IDs em um array
        const productIds = (ids as string).split("%").map(id => id.trim()).filter(id => id); // Remove espaços e IDs vazios
        console.log(productIds)
        if (productIds.length === 0) {
          throw new Error("Nenhum ID válido fornecido.");
        }

        const { data: codigos, error } = await supabase
          .from("codigos")
          .select("*")
          .in("id_produto", productIds); // Usa .in() para filtrar por múltiplos IDs

        if (error) {
          throw error;
        }

        setData(codigos || []);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        setError("Erro ao carregar os códigos. Tente novamente mais tarde."); // Set error message
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [ids, supabase]);

  // Assinatura em tempo real para atualizar dados conforme alterações no banco
  useEffect(() => {
    if (!ids) return; // Prevent subscription if ids is undefined

    const productIds = (ids as string).split("%").map(id => id.trim()).filter(id => id); // Remove espaços e IDs vazios

    const subscription = supabase.channel(`realtime:public:codigos:${ids}`).on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "codigos",
        filter: `id_produto=in.(${productIds.join("%")})`, // Usa o filtro para múltiplos IDs
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

    // Cleanup: desassinar quando o componente for desmontado
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [ids, supabase]);

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div>
      <h1>Códigos dos Produtos</h1>
      <Button onClick={() => window.history.back()} className="mb-4">
        <ArrowLeft /> Voltar
      </Button>
      <DataTableCodigos data={data} />
    </div>
  );
}