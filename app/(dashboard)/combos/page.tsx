"use client";

import { CreateProduto } from "@/app/components/create-forms/produto";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
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

import { createClient } from "@/lib/supabase/client";
import { EditProduto } from "@/app/components/edit-form/produto-edit";
import { Input } from "@/app/components/ui/input";
import { set } from "date-fns";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { CreateOrUpdateCombo } from "@/app/components/edit-form/combos";
import { CombosProps } from "@/app/utils/combos";


export default function Combos() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<CombosProps[]>([]);
  const [filterText, setfilterText] = useState('');
  const [filterData, setFilterData] = useState<CombosProps[]>([]);

  const [filterCategoria, setFilterCategoria] = useState(""); // default to empty string


  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.from("combos").select("*");

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
    const subscription = supabase.channel(`realtime:public:combos`).on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "combos",
      },
      (payload) => {
        setData((prevData) => {
          switch (payload.eventType) {
            case "INSERT":
              return [...prevData, payload.new as CombosProps];
            case "UPDATE":
              return prevData.map((item) =>
                item.id === payload.new.id
                  ? (payload.new as CombosProps)
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
  useEffect(() => {
if (filterText && data) {

      setFilterData(data.filter(item => 
        item.nome.toLowerCase().includes(filterText.toLowerCase())
      ));
    } else {
     
      setFilterData(data);
    }
  }, [filterText, filterCategoria, data]);
  


  const handleConfirmCreate = async ({ data }: { data: CombosProps }) => {
    setLoading(true);
    const { error } = await supabase.from("combos").insert([data]);
    if (error) {
      console.error("Erro ao criar produto:", error);
    } else {
      console.log("Produto criado com sucesso");
    }
    setLoading(false);
  };

  const handleConfirmEdit = async ({ data }: { data: CombosProps }) => {
    const { error } = await supabase
      .from("combos")
      .update(data)
      .eq("id", data.id);
    if (error) {
      console.error("Erro ao atualizar produto:", error);
    } else {
      console.log("Produto atualizado com sucesso");
    }
  };
  const handleDeleteProduto = async (id: string) => {
    const { error } = await supabase.from("combos").delete().eq("id", id);

    if (error) {
      console.error("Erro ao deletar produto:", error);
    } else {
      console.log("Produto deletado com sucesso");
      // Opcional: Atualize o estado para remover o produto da lista
      setData((prevData) => prevData.filter((produto) => produto.id !== id));
    }
  };
  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 gap">
      <h1 className="text-3xl font-bold mb-6">Área de Produtos</h1>
      <div className="flex gap-2 justify-center items-center">
        <Input type="text" placeholder="Filtre seus produtos por aqui ..." className="my-4" onChange={(e) => setfilterText(e.target.value)} value={filterText}></Input>
        </div>
      <div className="grid grid-cols-3 gap-8 max-md:grid-cols-1 max-lg:grid-cols-2">
        <CreateOrUpdateCombo onConfirm={handleConfirmCreate}></CreateOrUpdateCombo>

        {filterData.map((combo) => (
          <article
            key={combo.id}
            className="border flex flex-col justify-between pb-4 gap-12 rounded transition-all duration-300 hover:scale-110"
          >
            <header className="flex px-4 pt-4 justify-between">
              <div className="flex flex-col h-[150px] max-h-[90px] w-full overflow-hidden">
                <div className="flex justify-between">
                  <h1 className="text-2xl font-semibold">
                    {combo.nome || "Produto teste"}
                  </h1>
                  <div className="flex items-center gap-2">
                  
                    <Link
                      href={`/combos/${combo.id}`}
                      className="hover:bg-gray-300 hover:text-black p-2 rounded"
                    >
                      <SquareMousePointer />
                    </Link>
                  </div>
                </div>
                <p className="text-sm break-words overflow-hidden text-ellipsis">
                  {combo.descricao || "No description provided"}
                </p>
              </div>
            </header>
            <footer className="flex flex-col gap-2 w-full px-4">
              <div className="flex items-center gap-2 justify-start w-full text-[0.7rem]">
                <div className="flex items-center justify-center gap-2 text-gray-800">
                  <CircleDollarSign size={20} /> R$ {combo.valor || "0"}
                </div>
                <div className="flex items-center justify-center gap-2 text-gray-800">
                  <Binary size={20} /> {"0"}
                </div>
                <div className="flex items-center justify-center gap-2 text-gray-800">
                  <Calendar size={20} />{" "}
                  {combo.created_at?.split("T")[0] || "No date"}
                </div>
              </div>
              <div className="flex gap-2 w-full">
                <Button
                  onClick={() =>
                    (window.location.href = `/combos/${combo.id}`)
                  }
                  className="w-full"
                >
                  Acessar <ArrowRightIcon size={15} />
                </Button>
                
                <Button
                  onClick={() => {}}
                  variant={"destructive"}
                >
                  <Trash2 />
                </Button>
              </div>
            </footer>
          </article>
        ))}
      </div>
    </div>
  );
}
