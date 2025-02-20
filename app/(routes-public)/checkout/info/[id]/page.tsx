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
import CarouselRelacionados from "@/app/components/carousel-relacionados";
import { InfoCheckout } from "../../_components/popup-dados";
import Link from "next/link";



export default function VendaDetalhesLoja() {
  const supabase = createClient();
  const [produto, setProduto] = useState<ProdutosProps | null>(null);
  const [produtoRel, setProdutoRel] = useState<ProdutosProps[]>([]);
  const [loadingProduto, setLoadingProduto] = useState<boolean>(true);
  const [loadingRel, setLoadingRel] = useState<boolean>(true);
  const { id: productId } = useParams();
  const router = useRouter();
  const carouselRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fetchProduto = async () => {
      if (!productId) return;

      setLoadingProduto(true);

      try {
        const { data, error } = await supabase
          .from("produtos")
          .select("*")
          .eq("id", productId)
          .single();

        if (error) {
          console.error("Erro ao carregar produto:", error);
          router.push("/"); // Redirecionar em caso de erro
          return;
        }

        setProduto(data);
      } catch (error) {
        console.error("Erro na requisição:", error);
      } finally {
        setLoadingProduto(false);
      }
    };

    fetchProduto();
  }, [productId, router, supabase]);

  useEffect(() => {
    const fetchProdutoRela = async () => {
      if (produto?.categoria) {
        setLoadingRel(true);
        try {
          const { data, error } = await supabase
            .from("produtos")
            .select("*")
            .eq("categoria", produto.categoria)
            .neq("id", productId);

          if (error) {
            console.error("Erro ao carregar produtos relacionados:", error);
            return;
          }

          setProdutoRel(data as ProdutosProps[]);
        } catch (error) {
          console.error("Erro na requisição:", error);
        } finally {
          setLoadingRel(false);
        }
      }
    };

    if (produto) {
      fetchProdutoRela();
    }
  }, [produto, productId, supabase]);

  if (loadingProduto) {
    return <div className="text-center mt-10">Carregando detalhes do produto...</div>;
  }

  if (!produto) {
    return <div className="text-center mt-10">Produto não encontrado.</div>;
  }
  const redirectToPayament = () => {

  }

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
              <InfoCheckout onConfirmCreate={() => { }}
              ></InfoCheckout>
              <div className="flex gap-4">
                <Link href={"https://t.me/nextrecargas_bot"}>
                  <Button variant="sucess" className="flex-1">
                    <MessagesSquare className="mr-2 h-4 w-4" />
                    Comprar via WhatsApp
                  </Button>
                </Link>
                <Link href={"https://t.me/nextrecargas_bot"}>
                  <Button className="flex-1 bg-blue-500 hover:bg-blue-400">
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    Comprar via Telegram
                  </Button></Link>
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

        <CarouselRelacionados produtos={produtoRel}></CarouselRelacionados>
      </div>



    </>
  );
}
