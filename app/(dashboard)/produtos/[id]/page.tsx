"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation"; // Correção na importação
import { createClient } from "@/lib/supabase/client";
import {
  CircleDollarSign,
  Binary,
  Calendar,
  Trash2Icon,
  ArrowRight,
  ArrowLeft,
  BarChart3,
  Edit,
  Trash2,
} from "lucide-react";
import { ProdutosProps } from "../../../utils/produto";
import { Button } from "@/app/components/ui/button";
import { EditProduto } from "@/app/components/edit-form/produto-edit";

const supabase = createClient();

export default function VendaDetalhes() {
  const [produto, setProduto] = useState<ProdutosProps | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { id: productId } = useParams(); // Uso correto do useParams
  const router = useRouter();
  console.log(productId);
  const handleConfirmEdit = async ({ data }: { data: ProdutosProps }) => {
    const { error } = await supabase
      .from("produtos")
      .update(data)
      .eq("id", data.id);
    if (error) {
      console.error("Erro ao atualizar produto:", error);
    } else {
      console.log("Produto atualizado com sucesso");
    }
  };
  const handleDeleteProduto = async (id: string) => {
    const { error } = await supabase.from("produtos").delete().eq("id", id);

    if (error) {
      console.error("Erro ao deletar produto:", error);
    } else {
      console.log("Produto deletado com sucesso");
      // Opcional: Atualize o estado para remover o produto da lista
    }
  };
  useEffect(() => {
    const fetchProduto = async () => {
      if (!productId) return;

      setLoading(true);

      try {
        const { data, error } = await supabase
          .from("produtos")
          .select("*")
          .eq("id", productId)
          .single();

        if (error) {
          console.error("Erro ao carregar produto:", error);
          router.push("/produtos"); // Redirecionar em caso de erro
          return;
        }

        setProduto(data);
      } catch (error) {
        console.error("Erro na requisição:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduto();
  }, [productId, router]);

  if (loading) {
    return (
      <div className="text-center mt-10">Carregando detalhes do produto...</div>
    );
  }

  if (!produto) {
    return <div className="text-center mt-10">Produto não encontrado.</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-4">
      <Button
        onClick={() => (window.location.href = "/produtos")}
        className="rounded-full bg-blue-500 hover:bg-blue-400"
      >
        <ArrowLeft></ArrowLeft>{" "}
      </Button>
      <article key={produto.id} className="border p-4 rounded ">
        <div className="flex justify-between">
          <h1 className="text-2xl font-bold mb-4">{produto.nome}</h1>{" "}
          <div className="flex gap-2">
            {" "}
            <EditProduto produto={produto} onConfirmEdit={handleConfirmEdit} />
            <Button
              onClick={() => handleDeleteProduto(produto.id || "")}
              variant={"destructive"}
            >
              <Trash2 />
            </Button>
          </div>
        </div>
        <p className="mb-6 text-gray-700">{produto.descricao}</p>
        <div className="flex items-center gap-4 justify-start text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <CircleDollarSign size={20} className="text-green-500" />
            <span>R$ {produto.valor?.toFixed(2) || "0.00"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Binary size={20} className="text-blue-500" />
            <span>Código: {produto.id}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={20} className="text-purple-500" />
            <span>
              Criado em:{" "}
              {produto.created_at
                ? produto.created_at.split("T")[0]
                : "Sem data"}
            </span>
          </div>
        </div>
      </article>
      <div className="grid grid-cols-2 gap-8">
        <div
          onClick={() => {
            window.location.href = `/vendas/${productId}`;
          }}
          className="border p-4 rounded  flex flex-col justify-center items-center gap-2 min-h-[300px] hover:scale-105 transition-all duration-300 hover:border-blue-500 hover:text-blue-500"
        >
          <BarChart3 size={60}></BarChart3>
          <h2 className="text-2xl">Vendas</h2>
        </div>
        <div
          onClick={() => {
            window.location.href = `/codigos/${productId}`;
          }}
          className="border p-4 rounded  flex flex-col justify-center items-center gap-2 min-h-[300px] hover:scale-105 transition-all duration-300  hover:border-blue-500 hover:text-blue-500"
        >
          <Binary size={60}></Binary>
          <h2 className="text-2xl">Códigos</h2>
        </div>
      </div>
    </div>
  );
}
