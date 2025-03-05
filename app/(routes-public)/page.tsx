"use client";
import Image from "next/image";

import { ChevronLeft, ChevronRight, Search, User } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,

} from "@/app/components/ui/card";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ProdutosProps } from "../utils/produto";
import { MediaBannerProps, MediaProps } from "../utils/media";
import Link from "next/link";

export default function GiftCardStore() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);

  const [data, setData] = useState<ProdutosProps[]>([]);
  const [dataBanner, setDataBanner] = useState<MediaBannerProps[]>([]);
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
        const { data, error } = await supabase.from("marca").select("*");

        if (error) {
          throw error;
        }

        setDataGift(data.filter((item) => item.status === true) || []);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [supabase]);
  useEffect(() => {
    const loadData2 = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.from("media-loja").select("*");

        if (error) {
          throw error;
        }

        setDataBanner(data);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData2();
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
  const carouselRef2 = useRef<HTMLDivElement | null>(null);
  const handleScroll2 = (direction: "left" | "right") => {
    const container = carouselRef2.current;
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
    <div className="min-h-screen ">

      <section className=" bg-white border  rounded-md p-0">

        <div className="relative   ">
          <div
            ref={carouselRef2}
            className="flex overflow-hidden rounded-md "
          >
            {dataBanner.map((card) => (
              <Link key={card.id} href={`/card/${card.id}`} className="min-w-full">
                <Image
                  src={card.url || "/placeholder.svg"}
                  unoptimized
                  alt={card.nome}
                  width={800}
                  height={400}
                  className="w-full rounded-md object-fit bg-center  "
                />
              </Link>
            ))}
          </div>

          <Button
            variant="outline"
            size="icon"
            className="absolute left-5 top-1/2 -translate-y-1/2 -translate-x-4 rounded-full"
            onClick={() => handleScroll2("left")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="absolute right-5  top-1/2 -translate-y-1/2 translate-x-4 rounded-full"
            onClick={() => handleScroll2("right")}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </section>





      <section className="my-12 bg-white border p-4 rounded-md">
        <h2 className="text-2xl font-bold mb-6">Escolha seu Giftcard</h2>
        <div className="relative bg-gray-100 p-4 rounded-md">
          <div
            ref={carouselRef}
            className="flex   overflow-x-hidden gap-4 py-4 px-8"
          >
            {dataGift.map((card) => (

              <Link key={card.id} href={`/card/${card.id}`}>
                <div
                  key={card.id + "-" + "pai"}
                  className=" flex flex-col justify-center items-center gap-2"
                >
                  <div
                    key={card.id}
                    className="flex-shrink-0 w-[100px] rounded-full overflow-hidden border-2 border-gray-200 hover:border-blue-500 cursor-pointer flex justify-center items-center"
                  >
                    <Image
                      src={card.url || "/placeholder.svg"}
                      alt={card.nome}
                      width={100}
                      height={100}
                      className="object-cover w-full h-full"
                    />

                  </div>


                </div>
              </Link>
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
      <section className="bg-white rounded-md p-4">
        <h2 className="text-2xl font-bold mb-6">Nossos Produtos</h2>
        <div className="grid max-lg:grid-cols-1 grid-cols-4 gap-6">
          {data.map((product) => (
            <Card
              key={product.id}
              className="overflow-hidden bg-gray-100 border shadow-none "
            >
              <CardContent className="p-4 max-md:flex gap-4 max-md:p-0">
                <div className="bg-blue-600 hover:bg-blue-500 py-2 rounded-md flex-shrink-0 min-w-[150px] ">
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
                <div className="flex flex-col justify-center">
                  <h3 className="font-semibold text-lg mb-2">{product.nome}</h3>
                  <div className="text-green-600">
                    no pix R${(product.valor || 0).toFixed(2)}
                  </div>
                  <div className="text-gray-600">
                    R${(product.valor * 1.1 || 0).toFixed(2)} no cartão
                  </div>
                  <Link href={`/checkout/info/${product.id}`} className="w-full hidden max-md:flex">
                    <Button className="w-full bg-gray-900 hover:bg-gray-800">
                      Comprar
                    </Button>
                  </Link></div>

              </CardContent>
              <CardFooter>
                <Link href={`/checkout/info/${product.id}`} className="w-full max-md:hidden">
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
