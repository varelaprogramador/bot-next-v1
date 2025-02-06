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

import { Button } from "@/app/components/ui/button";

import { CombosProps } from "@/app/utils/combos";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/app/components/ui/accordion";
import { CreateOrUpdateCombo } from "@/app/components/edit-form/combos";

const supabase = createClient();

export default function ComnbosDetalhes() {
  const [combos, setCombos] = useState<CombosProps | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { id: productId } = useParams(); // Uso correto do useParams
  const router = useRouter();
  console.log(productId);
  const handleConfirmEdit = async ({ data }: { data: CombosProps }) => {
    const { error } = await supabase
      .from("combos")
      .update(data)
      .eq("id", data.id);
    if (error) {
      console.error("Erro ao atualizar combos:", error);
    } else {
      console.log("Produto atualizado com sucesso");
    }
  };

  useEffect(() => {
    const fetchProduto = async () => {
      if (!productId) return;

      setLoading(true);

      try {
        const { data, error } = await supabase
          .from("combos")
          .select("*")
          .eq("id", productId)
          .single();

        if (error) {
          console.error("Erro ao carregar combos:", error);
          router.push("/combos"); // Redirecionar em caso de erro
          return;
        }

        setCombos(data);
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
      <div className="text-center mt-10">Carregando detalhes do combos...</div>
    );
  }

  if (!combos) {
    return <div className="text-center mt-10">Produto não encontrado.</div>;
  }
  const handleDeleteProduto = async (produtoId: string) => {
    if (!combos) return;

    // Filtra os produtos para remover o produto com o ID fornecido
    const updatedProdutos = combos.produtos.filter(
      (produto) => produto.id !== produtoId
    );

    // Atualiza o combo no Supabase
    const { error } = await supabase
      .from("combos")
      .update({ produtos: updatedProdutos })
      .eq("id", combos.id);

    if (error) {
      console.error("Erro ao deletar produto:", error);
    } else {
      console.log("Produto deletado com sucesso");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setCombos((prevCombos: any) => ({
        ...prevCombos,
        produtos: updatedProdutos,
      }));
    }
  };
  const handleDeleteCombo = async (comboId: string) => {
    if (!combos) return;

    // Atualiza o combo no Supabase
    const { error } = await supabase
      .from("combos")
      .delete()
      .eq("id", combos.id);

    if (error) {
      console.error("Erro ao deletar produto:", error);
    } else {
      console.log("Produto deletado com sucesso");
      window.alert("Combo excluido com sucesso");
      window.location.href = "/combos";
    }
  };
  const productIds = combos.produtos.map(produto => produto.id).join(",");
  return (
    <div className="container mx-auto p-6 space-y-4">
      <Button
        onClick={() => (window.location.href = "/combos")}
        className="rounded-full bg-blue-500 hover:bg-blue-400"
      >
        <ArrowLeft></ArrowLeft>{" "}
      </Button>
      <article key={combos.id} className="border p-4 rounded ">
        <div className="flex justify-between">
          <h1 className="text-2xl font-bold mb-4">{combos.nome}</h1>{" "}
          <div className="flex gap-2">
            <Button>
              <CreateOrUpdateCombo
                combo={combos}
                onConfirm={handleConfirmEdit}
              ></CreateOrUpdateCombo>
            </Button>
            <Button
              onClick={() => handleDeleteCombo(combos.id || "")}
              variant={"destructive"}
            >
              <Trash2 />
            </Button>
          </div>
        </div>
        <p className="mb-6 text-gray-700">{combos.descricao}</p>
        <div className="flex items-center gap-4 justify-start text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <CircleDollarSign size={20} className="text-green-500" />
            <span>R$ {combos.valor?.toFixed(2) || "0.00"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Binary size={20} className="text-blue-500" />
            <span>Código: {combos.id}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={20} className="text-purple-500" />
            <span>
              Criado em:{" "}
              {combos.created_at ? combos.created_at.split("T")[0] : "Sem data"}
            </span>
          </div>
        </div>
      </article>

      <div className="bg-gray-100 border rounded-md p-4">
        <h1 className="text-xl font-semibold border-b pb-4">
          Produtos do combo
        </h1>
        <Accordion type="single" collapsible className="w-full">
          {combos.produtos.map((item, index) => (
            <AccordionItem key={item.id + "|" + index} value={"item" + index}>
              <AccordionTrigger>
                <div className="flex justify-between items-center p-4 ">
                  <h3 className="text-lg font-semibold">{item.nome}</h3>
                  <span className="text-gray-500">
                    R$ {item.valor.toFixed(2)}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="border-t">
                <div className="p-4">
                  <p>
                    <strong>Descrição:</strong> {item.descricao}
                  </p>
                  <p>
                    <strong>Categoria:</strong> {item.categoria}
                  </p>
                  <p>
                    <strong>Criado em:</strong> {item.created_at}
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      <div className="grid grid-cols-1 gap-8">
    
        <div
          onClick={() => {
            window.location.href = `/codigos-combo/${productIds}`;
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
