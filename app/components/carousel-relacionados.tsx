"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation"; // Correção na importação
import { createClientSupabaseClient } from "@/lib/supabase/client";
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
import Link from "next/link";

interface CarouselRelacionadosProps {
  produtos: ProdutosProps[];
}

const CarouselRelacionados: React.FC<CarouselRelacionadosProps> = ({ produtos }) => {


  const carouselRef = useRef<HTMLDivElement | null>(null);
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


      {/* Related Products */}
      <section className="mt-16 bg-white p-4 rounded-md w-full">
        <h2 className="mb-6 text-2xl font-bold">Produtos Relacionados</h2>
        <div className="relative">

          <div
            ref={carouselRef}
            className="flex overflow-x-hidden gap-8 py-4 px-8"
          >


            {produtos.map((product) => (
              <Card
                key={product.id}
                className="overflow-hidden bg-gray-100 border shadow-none min-w-[250px]"
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

                  </div>
                </CardContent>
                <CardFooter>
                  <Link href={`https://nextgiftcards.com/checkout/info/${product.id}`} className="w-full">
                    <Button className="w-full bg-gray-900 hover:bg-gray-800">
                      Comprar
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}


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




    </>
  );
}
export default CarouselRelacionados;