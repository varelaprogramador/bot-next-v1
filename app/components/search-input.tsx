"use client";
import { Search, X } from "lucide-react";
import { Input } from "./ui/input";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import router from "next/router";
import { ProdutosProps } from "../utils/produto";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import Link from "next/link";

const InputSearch = () => {
  const supabase = createClient();
  const [filter, setFilter] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [produtos, setProdutos] = useState<ProdutosProps[]>([]);
  const [filteredProdutos, setFilteredProdutos] = useState<ProdutosProps[]>([]);

  console.log(filter)

  useEffect(() => {
    const fetchProduto = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("produtos")
          .select("*");

        if (error) {
          console.error("Erro ao carregar produto:", error);
          return;
        }

        setProdutos(data as ProdutosProps[]);
      } catch (error) {
        console.error("Erro na requisição:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduto();
  }, [supabase]);

  useEffect(() => {
    // Filter products based on the search input
    if (filter) {
      const filtered = produtos.filter((produto) =>
        produto.nome.toLowerCase().includes(filter.toLowerCase())
      );
      setFilteredProdutos(filtered);
    } else {
      setFilteredProdutos(produtos); // Reset to all products if filter is empty
    }
  }, [filter, produtos]);

  return (
    <>
      <div className="relative w-64">
        <Input
          placeholder="O que você procura?"
          className="pl-10 bg-white"
          onClick={() => setOpen(!open)}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
      </div>

      {open && (
        <div className="fixed top-0 left-0 bg-gray-900 bg-opacity-65 min-w-[100vw] min-h-screen flex flex-col justify-center items-center" >
          <div className="absolute top-0 left-0 min-w-[100vw] min-h-screen bg-transparent" onClick={() => setOpen(false)}></div>
          <Button
            className="absolute top-20 right-20 "
            onClick={() => setOpen(false)}
          >
            <X />
          </Button>

          <div className="bg-white rounded-md overflow-y-auto max-h-[300px] min-w-[350px] w-[35vw]  max-w-[800px] relative">

            <div className="sticky top-0 w-full"> <div className="relative w-full ">
              <Input
                value={filter}
                placeholder="O que você procura?"
                className="pl-10 bg-white py-6 rounded-none"
                onChange={(e) => setFilter(e.target.value)}
              />
              <Search className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
            </div></div>

            {loading ? (
              <p className=" p-4">Carregando produtos...</p>
            ) : filteredProdutos.length === 0 ? (
              <p className=" p-4">Nenhum produto encontrado.</p>
            ) : (
              <div className="mt-4">
                {filteredProdutos.map((produto) => (
                  <Link key={produto.id + "- link"} href={`/checkout/info/${produto.id}`} onClick={() => setOpen(!open)}>
                    <div key={produto.id} className="border-b p-2 flex hover:bg-gray-100">
                      <Image
                        src={produto.url_image || "/placeholder.svg"}
                        alt={produto.nome}
                        width={80}
                        height={80}
                        className="w-16 h-16 object-cover rounded-md"
                      />
                      <div className="ml-3 inline-block">
                        <p className="font-semibold">{produto.nome} - {produto.categoria}</p>
                        <p>{produto.descricao}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default InputSearch;
