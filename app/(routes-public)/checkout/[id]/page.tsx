"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation"; // Correção na importação
import { createClient } from "@/lib/supabase/client";
import {

  ShoppingBag,
} from "lucide-react";
import { ProdutosProps } from "@/app/utils/produto";
import { Button } from "@/app/components/ui/button";
import Image from "next/image"
import { Star, Info, Box, Zap, MessagesSquare, Share2, ChevronRight, ChevronLeft } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";



export default function VendaDetalhesLoja() {
  const supabase = createClient();
  const [produto, setProduto] = useState<ProdutosProps | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { id: productId } = useParams(); // Uso correto do useParams
  const router = useRouter();
  const carouselRef = useRef<HTMLDivElement | null>(null);
  
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
  }, [productId, router, supabase]);

  if (loading) {
    return (
      <div className="text-center mt-10">Carregando detalhes do produto...</div>
    );
  }

  if (!produto) {
    return <div className="text-center mt-10">Produto não encontrado.</div>;
  }
  
  
  const handleScroll = (direction: "left" | "right") => {
    const container = carouselRef.current;
    if (!container) return; // Verificar se o container existe

    if (direction === "left") {
      container.scrollBy({
        left: -container.offsetWidth,
        behavior: "smooth",
      });
    } else {
      container.scrollBy({
        left: container.offsetWidth,
        behavior: "smooth",
      });
    }
  };
  return (

<>

    <div className="container  py-8">
      <div className="grid gap-8 lg:grid-cols-2 bg-white p-4 rounded-md">
        {/* Product Image */}
        <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
          <Image
           src={produto.url_image || "/placeholder.svg"}
           alt={produto.nome}
            className="object-cover"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">{produto.nome}</h1>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">(128 avaliações)</span>
            </div>
          </div>

          <div className="rounded-lg bg-muted p-4">
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-green-600">R${produto.valor.toFixed(2)} no pix</span>
                <Badge variant="secondary" className="text-lg">
                 {produto.categoria}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">ou R${(produto.valor * 1.1 || 0).toFixed(2)} no cartão</p>
            </div>
          </div>

          <div className="space-y-4">
            <Button className="w-full text-lg" size="lg">
              Comprar Agora
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
            <div className="flex gap-4">
              <Button variant="sucess" className="flex-1">
                <MessagesSquare className="mr-2 h-4 w-4" />
                Comprar via WhatsApp
              </Button>
              <Button  className="flex-1 bg-blue-500 hover:bg-blue-400">
                <ShoppingBag className="mr-2 h-4 w-4" />
                Comprar via Telegram
              </Button>
            </div>
          </div>

          <Tabs defaultValue="description" className="space-y-4">
            <TabsList>
              <TabsTrigger value="description">Descrição</TabsTrigger>
              <TabsTrigger value="reviews">Avaliações</TabsTrigger>
            </TabsList>
            <TabsContent value="description" className="space-y-4">
              <p>{produto.descricao}</p>
             
            </TabsContent>
         
            <TabsContent value="reviews">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <span className="text-sm font-medium">4.8 de 5 estrelas</span>
                </div>
                <p className="text-sm text-muted-foreground">Baseado em 128 avaliações de clientes</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Related Products */}
      <section className="mt-16 bg-white p-4 rounded-md">
        <h2 className="mb-6 text-2xl font-bold">Produtos Relacionados</h2>
        <div className="relative">

           <div
                        ref={carouselRef}
                        className="flex   overflow-x-hidden gap-4 py-4 px-8"
                      >
                        
                          <Card  className="w-64 flex-shrink-0">
                          <CardHeader className="p-0">
                            <div className="aspect-[4/3] relative">
                              <Image
                                src="/placeholder.svg?height=300&width=400"
                                alt={`Produto Relacionado `}
                                fill
                                className="rounded-t-lg object-cover"
                              />
                            </div>
                          </CardHeader>
                          <CardContent className="p-4">
                            <CardTitle className="line-clamp-1 text-base">Produto Relacionado </CardTitle>
                            <CardDescription className="line-clamp-2 mt-1">
                              Descrição breve do produto relacionado com algumas características principais.
                            </CardDescription>
                            <p className="mt-2 font-bold text-green-600">R$ 29,90</p>
                          </CardContent>
                          <CardFooter className="p-4 pt-0">
                            <Button variant="outline" className="w-full">
                              Ver Detalhes
                            </Button>
                          </CardFooter>
                        </Card>
                          
                       
                      </div>
    
          <Button
              variant="outline"
              size="icon"
              className="absolute left-5 top-1/2 -translate-y-1/2 -translate-x-4 rounded-full"
              onClick={() => handleScroll("left")}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="absolute right-5  top-1/2 -translate-y-1/2 translate-x-4 rounded-full"
              onClick={() => handleScroll("right")}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
      </section>
    </div>
  


    </>
  );
}
