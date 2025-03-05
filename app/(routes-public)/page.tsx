"use client";
import Image from "next/image";

import { ChevronLeft, ChevronRight, Search, User } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { EmblaOptionsType } from 'embla-carousel'
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
import EmblaCarousel from "../components/carousel-emblar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Skeleton } from "../components/ui/skeleton";
import EmblaCarouselCircle from "../components/carousel-emblar-circle";

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



  const OPTIONS: EmblaOptionsType = { loop: true }
  const SLIDE_COUNT = 5

  const [dataBannerDesk, setDataBannerDesk] = useState<MediaBannerProps[]>([]);
  const [dataBannerNote, setDataBannerNote] = useState<MediaBannerProps[]>([]);
  const [dataBanner, setDataBanner] = useState<MediaBannerProps[]>([]);


  const mobile = useIsMobile();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.from("media-loja").select("*");
        if (error) throw error;

        setDataBannerDesk(data.filter((item) => item.type === "desktop"));
        setDataBannerNote(data.filter((item) => item.type === "mobile"));
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      }
      finally {
        setLoading(false)
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    setDataBanner(mobile ? dataBannerNote : dataBannerDesk);
  }, [dataBannerDesk, dataBannerNote, mobile]);
  const SLIDES = dataBanner.map((card) => (
    <Link key={card.id} href={`/card/${card.id}`} className="w-full flex-shrink-0 h-[400px] rounded-md">
      <Image
        src={card.url || "/placeholder.svg"}
        unoptimized
        alt={card.nome}
        width={1800}
        height={300}
        className="w-full h-[400px] rounded-md object-cover bg-center"
      />
    </Link>

  ))
  const SLIDES2 = dataGift.map((card) => (
    <Link key={card.id} href={`/card/${card.id}`}>
      <div
        key={card.id + "-" + "pai"}
        className=" flex flex-col justify-center items-center gap-2"
      >
        <div
          key={card.id}
          className="flex-shrink-0 w-[90px] rounded-full overflow-hidden border-2 border-gray-200 hover:border-blue-500 cursor-pointer flex justify-center items-center"
        >
          <Image
            src={card.url || "/placeholder.svg"}
            alt={card.nome}
            width={90}
            height={90}
            className="object-cover w-full h-full"
          />

        </div>


      </div>
    </Link>

  ))

  return (
    <div className="min-h-screen ">

      {loading ? <Skeleton className="min-h-[400px] w-full bg-gray-200 animate-pulse" /> : <EmblaCarousel slides={SLIDES} options={OPTIONS}></EmblaCarousel>}







      <section className="my-12 bg-white border p-4 rounded-md max-md:p-2">
        <h2 className="text-2xl font-bold mb-6">Escolha seu Giftcard</h2>
        <div className="relative bg-gray-100 p-4 rounded-md max-md:p-0">
          {loading ? <Skeleton className="min-h-[400px] w-full bg-gray-200 animate-pulse" /> : <EmblaCarouselCircle slides={SLIDES2} options={OPTIONS} />}
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
