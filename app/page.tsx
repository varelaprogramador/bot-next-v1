"use client";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Search, User } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/app/components/ui/card";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ProdutosProps } from "./utils/produto";
import { MediaProps } from "./utils/media";

export default function GiftCardStore() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);

  const [data, setData] = useState<ProdutosProps[]>([]);
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.from("produtos").select("*");

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

  const [dataGift, setDataGift] = useState<MediaProps[]>([]);
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.from("media-loja").select("*");

        if (error) {
          throw error;
        }

        setDataGift(data || []);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [supabase]);

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
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <header className="bg-white border-b">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-8">
                <Link href="/" className="text-red-600 font-bold text-2xl">
                  ativabox
                </Link>
                <nav className="hidden md:flex items-center gap-6">
                  <Link href="#" className="text-gray-600 hover:text-gray-900">
                    Inicial
                  </Link>
                  <Link href="#" className="text-gray-600 hover:text-gray-900">
                    Duvidas Frequentes
                  </Link>
                  <Link href="#" className="text-gray-600 hover:text-gray-900">
                    Contato
                  </Link>
                </nav>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative w-64">
                  <Input placeholder="O que você procura?" className="pl-10" />
                  <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
                <Button variant="destructive">
                  <User></User>Minha Conta
                </Button>
              </div>
            </div>
          </div>
          <nav className="bg-gray-900">
            <div className="container mx-auto px-4">
              <div className="flex items-center h-12 gap-6 text-sm">
                <Link href="#" className="text-white hover:text-gray-300">
                  CARD FOOD
                </Link>
                <Link href="#" className="text-white hover:text-gray-300">
                  CARD GAMES
                </Link>
                <Link href="#" className="text-white hover:text-gray-300">
                  CARD ENTRETENIMENTO
                </Link>
                <Link href="#" className="text-white hover:text-gray-300">
                  NOVIDADES
                </Link>
              </div>
            </div>
          </nav>
        </header>
        <section className="w-full min-h-[500px] bg-cover bg-[url('/img-banner.png')] bg-center rounded-md"></section>
        <section className="my-12">
          <h2 className="text-2xl font-bold mb-6">Escolha seu Giftcard</h2>
          <div className="relative">
            <div
              ref={carouselRef}
              className="flex   overflow-x-hidden gap-4 py-4"
            >
              {dataGift.map((card) => (
                <div
                  key={card.id + "-" + "pai"}
                  className=" flex flex-col justify-center items-center gap-2"
                >
                  <div
                    key={card.id}
                    className="flex-shrink-0 w-36 h-36 rounded-full overflow-hidden border-2 border-gray-200 hover:border-blue-500 cursor-pointer flex justify-center items-center"
                  >
                    <Image
                      src={card.url || "/placeholder.svg"}
                      alt={card.nome}
                      width={80}
                      height={80}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <p className="max-w-[120px] truncate ">{card.nome}</p>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              size="icon"
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 rounded-full"
              onClick={() => handleScroll("left")}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 rounded-full"
              onClick={() => handleScroll("right")}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </section>
        <section>
          <h2 className="text-2xl font-bold mb-6">Nossos Produtos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {data.map((product) => (
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
      </main>
    </div>
  );
}
