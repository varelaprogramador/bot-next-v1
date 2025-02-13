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
import { ProdutosProps } from "@/app/utils/produto";
import { Button } from "@/app/components/ui/button";
import { EditProduto } from "@/app/components/edit-form/produto-edit";
import Image from "next/image";
import Link from "next/link";

export default function VendaDetalhesLoja() {
  const supabase = createClient();
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
    <div className="container mx-auto p-6 space-y-4 ">
      <div className="flex gap-4">
        <div className="min-w-[40%] aspect-square relative rounded-md">
          <Image
            src={produto.url_image || "/placeholder.svg"}
            alt={produto.nome}
            fill
            className="object-contain rounded-md"
          />
        </div>
        <div className=" flex flex-col min-w-[50%] gap-4">
          <h1 className="text-4xl font-semibold">{produto.nome}</h1>
          <span className="min-h-[1px] bg-gray-200"></span>
          <div>
            <Button>{produto.categoria}</Button>
          </div>
          <span className="min-h-[1px] bg-gray-200"></span>
          <div>
            <div className="text-green-600">
              no pix R${(produto.valor || 0).toFixed(2)}
            </div>
            <div className="text-gray-600">
              R${(produto.valor * 1.1 || 0).toFixed(2)} no cartão
            </div>
          </div>
          <span className="min-h-[1px] bg-gray-200"></span>
          <div className="flex flex-col gap-2">
            <p>Selecione o meio de pagamentos:</p>
            <div className="flex gap-4">
              <Link href={"/"}>
                <Button variant={"sucess"}>Pagar via kiwify</Button>
              </Link>
              <Link href={"/"}>
                <Button variant={"sucess"}>Pagar via whatsapp</Button>
              </Link>
              <Link href={"/"}>
                <Button className="bg-blue-500 hover:bg-blue-400">
                  Pagar via telegram
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
