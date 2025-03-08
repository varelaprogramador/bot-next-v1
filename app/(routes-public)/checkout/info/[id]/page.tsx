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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/app/components/ui/drawer";

const ContactMethodDialog = ({ isOpen, setIsOpen, produto, setIsDialogPayament }: { isOpen: boolean, produto: ProdutosProps, setIsOpen: (open: boolean) => void, setIsDialogPayament: (open: boolean) => void }) => {

  const handleMethodSelect = (method: string) => {
    // Here you would handle the actual contact method selection
    console.log(`Selected ${method} as contact method`);
    setIsOpen(false);
  };
  const mobile = useIsMobile();

  return (
    mobile ? (
      <Drawer
        open={isOpen} onOpenChange={setIsOpen}
      >


        <DrawerContent className="p-4">
          <DrawerHeader>
            <DrawerTitle>Selecione por onde deseja continuar sua compra:</DrawerTitle>
            <DrawerDescription>
              Escolha o método abaixo.
            </DrawerDescription>
          </DrawerHeader>

          <div className="grid grid-cols-3 gap-4 py-4">
            {/* Telegram Button */}
            <Link about="_blank" href={process.env.NEXT_PUBLIC_TELEGRAM_CHECKOUT || ""}

              onClick={() => handleMethodSelect("telegram")}
              className="flex flex-col items-center gap-2 p-4 border rounded-lg hover:bg-accent transition-colors"
            >
              <div className="w-12 h-12 flex items-center justify-center bg-blue-100 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                  <path d="m22 2-7 20-4-9-9-4Z" />
                  <path d="M22 2 11 13" />
                </svg>
              </div>
              <span className="font-medium">Telegram</span>
            </Link>

            {/* WhatsApp Button */}
            <Link about="_blank" href={process.env.NEXT_PUBLIC_WHATSAPP_CHECKOUT || ""}
              onClick={() => handleMethodSelect("whatsapp")}
              className="flex flex-col items-center gap-2 p-4 border rounded-lg hover:bg-accent transition-colors"
            >
              <div className="w-12 h-12 flex items-center justify-center bg-green-100 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
                  <path d="M3 21 8 16 3 11 8 6 3 1" />
                  <path d="M8 11h13v-1c0-1.6-1.4-3-3-3H8" />
                  <path d="M10 6V5c0-1.7 1.3-3 3-3h8c1.7 0 3 1.3 3 3v11c0 1.7-1.3 3-3 3h-8c-1.7 0-3-1.3-3-3v-1" />
                </svg>
              </div>
              <span className="font-medium">WhatsApp</span>
            </Link>

            {/* Site Button */}
            <button
              onClick={() => { handleMethodSelect("store"); setIsDialogPayament(true) }}
              className="flex flex-col items-center gap-2 p-4 border rounded-lg hover:bg-accent transition-colors"
            >
              <div className="w-12 h-12 flex items-center justify-center bg-amber-100 rounded-full">
                <ShoppingBag className="text-amber-500" />
              </div>
              <span className="font-medium">Site</span>
            </button>
          </div>

        </DrawerContent>
      </Drawer>
    ) : (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Selecione por onde deseja continuar sua compra:</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-4 py-4">
            {/* Telegram Button */}
            <Link href={process.env.NEXT_PUBLIC_TELEGRAM_CHECKOUT || ""}

              onClick={() => handleMethodSelect("telegram")}
              className="flex flex-col items-center gap-2 p-4 border rounded-lg hover:bg-accent transition-colors"
            >
              <div className="w-12 h-12 flex items-center justify-center bg-blue-100 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                  <path d="m22 2-7 20-4-9-9-4Z" />
                  <path d="M22 2 11 13" />
                </svg>
              </div>
              <span className="font-medium">Telegram</span>
            </Link>

            {/* WhatsApp Button */}
            <Link href={process.env.NEXT_PUBLIC_WHATSAPP_CHECKOUT || ""}
              onClick={() => handleMethodSelect("whatsapp")}
              className="flex flex-col items-center gap-2 p-4 border rounded-lg hover:bg-accent transition-colors"
            >
              <div className="w-12 h-12 flex items-center justify-center bg-green-100 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
                  <path d="M3 21 8 16 3 11 8 6 3 1" />
                  <path d="M8 11h13v-1c0-1.6-1.4-3-3-3H8" />
                  <path d="M10 6V5c0-1.7 1.3-3 3-3h8c1.7 0 3 1.3 3 3v11c0 1.7-1.3 3-3 3h-8c-1.7 0-3-1.3-3-3v-1" />
                </svg>
              </div>
              <span className="font-medium">WhatsApp</span>
            </Link>

            {/* Site Button */}
            <button
              onClick={() => { handleMethodSelect("store"); setIsDialogPayament(true) }}
              className="flex flex-col items-center gap-2 p-4 border rounded-lg hover:bg-accent transition-colors"
            >
              <div className="w-12 h-12 flex items-center justify-center bg-amber-100 rounded-full">
                <ShoppingBag className="text-amber-500" />
              </div>
              <span className="font-medium">Site</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    )
  );

};


export default function VendaDetalhesLoja() {
  const supabase = createClient();
  const [produto, setProduto] = useState<ProdutosProps | null>(null);
  const [produtoRel, setProdutoRel] = useState<ProdutosProps[]>([]);
  const [loadingProduto, setLoadingProduto] = useState<boolean>(true);
  const [loadingRel, setLoadingRel] = useState<boolean>(true);
  const { id: productId } = useParams();
  const router = useRouter();
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const [isDialogContact, setDialogContact] = useState(false);
  const [isDialogPayament, setDialogPayament] = useState(false);


  useEffect(() => {
    console.log(isDialogPayament)
  }, [isDialogPayament])
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

      <div className="px-4 py-8">
        <div className="grid gap-8 grid-cols-1 lg:grid-cols-2 justify-center items-center bg-white p-4 max-lg:p-0 rounded-md">
          <div className="flex justify-center items-center"><div className="relative w-[400px]  sm:w-[350px] md:w-full md:h-[500px]  lg:h-[600px] xl:h-[700px] rounded-2xl overflow-hidden bg-muted/40 flex justify-center items-center bg-white">
            <Image
              src={produto.url_image || "/placeholder.svg"}
              alt={produto.nome}
              className="object-cover rounded-md"
              layout="intrinsic"
              width={600} // Tamanho de referência para o layout
              height={600} // Tamanho de referência para o layout
              sizes="(max-width: 768px) 300px, (max-width: 1024px) 50vw, 33vw "
              priority
            />
          </div>
          </div>

          {/* Product Info */}
          <div className="flex flex-col gap-8   p-4 ">
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
              <div className="flex flex-col">
                <div className="flex items-baseline justify-between max-lg:flex-col">
                  <span className="text-2xl font-bold text-green-600 max-md:order-2">R${produto.valor.toFixed(2)} no pix</span>
                  <Badge variant="secondary" className="text-lg max-md:order-1">
                    {produto.categoria}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">ou R${(produto.valor * 1.1 || 0).toFixed(2)} no cartão</p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <Button onClick={() => { setDialogContact(true) }}>
                <ShoppingBag></ShoppingBag>Comprar agora
              </Button>

              {/* <div className="flex gap-4">
                <Link about="_blank" href={process.env.NEXT_PUBLIC_WHATSAPP_CHECKOUT || ""}>
                  <Button variant="sucess" className="flex-1">
                    <MessagesSquare className="mr-2 h-4 w-4" />
                    Comprar via WhatsApp
                  </Button>
                </Link>
                <Link about="_blank" href={process.env.NEXT_PUBLIC_TELEGRAM_CHECKOUT || ""}>
                  <Button className="flex-1 bg-blue-500 hover:bg-blue-400">
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    Comprar via Telegram
                  </Button>
                </Link>
              </div> */}
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
        <ContactMethodDialog
          produto={produto}
          isOpen={isDialogContact}
          setIsOpen={setDialogContact}
          setIsDialogPayament={setDialogPayament}

        />
        <InfoCheckout isOpen={isDialogPayament}
          setIsOpen={setDialogPayament}
          produto={produto}></InfoCheckout>
        <CarouselRelacionados produtos={produtoRel}></CarouselRelacionados>
      </div>




    </>
  );
}
