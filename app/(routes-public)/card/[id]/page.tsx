"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation"; // Correção na importação
import { createClient } from "@/lib/supabase/client";
import {

  ShoppingBag,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import Image from "next/image"
import { Star, Info, Box, Zap, MessagesSquare, Share2, ChevronRight, ChevronLeft } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { MediaProps } from "@/app/utils/media";
import Link from "next/link";



export default function VendaDetalhesLoja() {
  const supabase = createClient();
  const [getMarca, setMarca] = useState<MediaProps | null>(null);
 
  const [loading, setLoading] = useState<boolean>(true);
  const { id: marcaId } = useParams(); // Uso correto do useParams
  const router = useRouter();
  const carouselRef = useRef<HTMLDivElement | null>(null);
  
  console.log(marcaId);
  
  useEffect(() => {
    const fetchMarca = async () => {
      if (!marcaId) return;

      setLoading(true);

      try {
        const { data, error } = await supabase
          .from("marca")
          .select("*")
          .eq("id", marcaId)
          .single();

        if (error) {
          console.error("Erro ao carregar marca:", error);
          router.push("/"); // Redirecionar em caso de erro
          return;
        }

        setMarca(data);
      } catch (error) {
        console.error("Erro na requisição:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMarca();
  }, [marcaId, router, supabase]);

  if (loading) {
    return (
      <div className="text-center mt-10">Carregando detalhes do marca...</div>
    );
  }

  if (!getMarca) {
    return <div className="text-center mt-10">marca não encontrado.</div>;
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



    <div className="container  py-8">
      <section className="bg-white rounded-md p-4">
          <h2 className="text-2xl font-bold mb-6">Nossos Produtos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {getMarca.produtos.map((product) => (
              <Card
                key={product.id}
                className="overflow-hidden bg-gray-100 border shadow-none"
              >
                <CardContent className="p-4">
                  <div className="bg-blue-600 hover:bg-blue-500 py-2 rounded-md">
                    <p className="text-center text-white">
                      {product.categoria}
                    </p>
                    <div className="aspect-square relative ">
                      <Image
                        src={product.url_image || "/placeholder.svg"}
                        alt={product.nome}
                        fill
                        className="object-contain"
                      />
                    </div>
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{product.nome}</h3>
                  <div className="text-green-600">
                    no pix R${(product.valor || 0).toFixed(2)}
                  </div>
                  <div className="text-gray-600">
                    R${(product.valor * 1.1 || 0).toFixed(2)} no cartão
                  </div>
                </CardContent>
                <CardFooter>
                  <Link href={`/checkout/${product.id}`} className="w-full">
                    <Button className="w-full bg-gray-900 hover:bg-gray-800">
                      Comprar
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>
    </div>
  


  );
}
