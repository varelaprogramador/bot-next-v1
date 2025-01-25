"use client";

import { CreateProduto } from "@/components/create-forms/produto";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowRightIcon,
  Binary,
  Calendar,
  CircleDollarSign,
  Edit,
  FilePlus,
  SquareMousePointer,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ProdutosProps } from "../utils/produto";
import { createClient } from "@/lib/supabase/client";
import { EditProduto } from "@/components/edit-form/produto-edit";

export default function Produtos() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ProdutosProps[]>([]);
  const [editingProduto, setEditingProduto] = useState<ProdutosProps | null>(
    null
  );

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.from("produtos").select("*");

        if (error) {
          throw error;
        }

        setData(data || []);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [supabase]);

  useEffect(() => {
    const subscription = supabase.channel(`realtime:public:produtos`).on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "produtos",
      },
      (payload) => {
        setData((prevData) => {
          switch (payload.eventType) {
            case "INSERT":
              return [...prevData, payload.new as ProdutosProps];
            case "UPDATE":
              return prevData.map((item) =>
                item.id === payload.new.id
                  ? (payload.new as ProdutosProps)
                  : item
              );
            case "DELETE":
              return prevData.filter((item) => item.id !== payload.old.id);
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

  const handleConfirmCreate = async ({ data }: { data: ProdutosProps }) => {
    setLoading(true);
    const { error } = await supabase.from("produtos").insert([data]);
    if (error) {
      console.error("Erro ao criar produto:", error);
    } else {
      console.log("Produto criado com sucesso");
    }
    setLoading(false);
  };

  const handleConfirmEdit = async ({ data }: { data: ProdutosProps }) => {
    setLoading(true);
    const { error } = await supabase
      .from("produtos")
      .update(data)
      .eq("id", data.id);
    if (error) {
      console.error("Erro ao atualizar produto:", error);
    } else {
      console.log("Produto atualizado com sucesso");
    }
    setEditingProduto(null); // Reset the editing state
    setLoading(false);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Área de Produtos</h1>
      <div className="grid grid-cols-3 gap-8">
        <CreateProduto onConfirmCreate={handleConfirmCreate} />

        {data.map((produto) => (
          <article
            key={produto.id}
            className="border flex flex-col justify-between pb-4 gap-12 rounded transition-all duration-300 hover:scale-110"
          >
            <header className="flex px-4 pt-4 justify-between">
              <div className="flex flex-col h-[150px] max-h-[90px] w-full overflow-hidden">
                <div className="flex justify-between">
                  <h1 className="text-2xl font-semibold">
                    {produto.nome || "Produto teste"}
                  </h1>
                  <div className="flex items-center gap-2">
                    <div className="p-1 font-medium text-sm border text-blue-500 border-blue-500 rounded">
                      {produto.categoria || "categoria"}
                    </div>
                    <Link
                      href={`/produtos/${produto.id}`}
                      className="hover:bg-gray-300 hover:text-black p-2 rounded"
                    >
                      <SquareMousePointer />
                    </Link>
                  </div>
                </div>
                <p className="text-sm break-words overflow-hidden text-ellipsis">
                  {produto.descricao || "No description provided"}
                </p>
              </div>
            </header>
            <footer className="flex flex-col gap-2 w-full px-4">
              <div className="flex items-center gap-2 justify-start w-full text-[0.7rem]">
                <div className="flex items-center justify-center gap-2 text-gray-800">
                  <CircleDollarSign size={20} /> R$ {produto.valor || "0"}
                </div>
                <div className="flex items-center justify-center gap-2 text-gray-800">
                  <Binary size={20} /> {"0"}
                </div>
                <div className="flex items-center justify-center gap-2 text-gray-800">
                  <Calendar size={20} />{" "}
                  {produto.created_at?.split("T")[0] || "No date"}
                </div>
              </div>
              <div className="flex gap-2 w-full">
                <Button
                  onClick={() =>
                    (window.location.href = `/produtos/${produto.id}`)
                  }
                  className="w-full"
                >
                  Acessar <ArrowRightIcon size={15} />
                </Button>
                <Button
                  onClick={() => setEditingProduto(produto)}
                  className="w-full"
                >
                  <Edit size={15} /> Editar
                </Button>
                <Button variant={"destructive"}>
                  <Trash2 />
                </Button>
              </div>
            </footer>
          </article>
        ))}
      </div>

      {editingProduto && (
        <EditProduto
          produto={editingProduto}
          onConfirmEdit={handleConfirmEdit}
        />
      )}
    </div>
  );
}
