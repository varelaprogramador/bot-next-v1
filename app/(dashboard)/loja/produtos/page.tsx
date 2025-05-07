"use client";

import { DataTableMediaCarousel } from "@/app/components/tabela-loja";
import { Button } from "@/app/components/ui/button";
import { MediaBannerProps, MediaProps } from "@/app/utils/media";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import {
  ArrowLeftCircle,
  ChevronLeft,
  ChevronRight,
  GalleryHorizontal,
  ImageIcon,
  Info,
  ShoppingBasketIcon,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Separator } from "@/app/components/ui/separator";

import { useIsMobile } from "@/hooks/use-mobile";

import { EmblaOptionsType } from "embla-carousel";

import { DataTableMediaBanner } from "@/app/components/tabela-loja-banner";

import { Card, CardContent } from "@/app/components/ui/card";
import { ProdutosLojaProps } from "@/app/utils/produto";
import { toast } from "sonner";
import { Client } from "./client";

export default function ProdutosLayoutLoja() {
  const supabase = createClientSupabaseClient();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ProdutosLojaProps[]>([]);
  useEffect(() => {
    console.log("teste", data);
  }, [data]);
  const handleUpdatePositions = async () => {
    if (loading) return;
    setLoading(true);
    await Promise.all(
      data.map((item) =>
        supabase
          .from("produtos")
          .update({
            position: item.position,
          })
          .eq("id", item.id)
      )
    )
      .then(() => {
        toast.success("Dados salvos com sucesso!");
      })
      .catch((error) => {
        toast.error("Erro ao salvar dados!");
        console.error("Erro ao salvar dados:", error);
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="p-4 min-h-[85vh] flex flex-col gap-4 relative">
      <div className=" flex flex-col gap-4 items-center ">
        <div className=" flex justify-between bg-background rounded-md p-2 fixed z-10  w-[85%] shadow-md">
          <div className="flex gap-4 items-center ">
            <Button
              onClick={() => (window.location.href = "/loja")}
              className=" bg-primary hover:bg-primary/80"
            >
              <ArrowLeftCircle></ArrowLeftCircle>
            </Button>{" "}
            <p className="border-l pl-1 font-semibold"> Layout grid</p>
          </div>
          <Button
            onClick={() => {
              handleUpdatePositions();
            }}
            disabled={loading}
            className=" bg-primary hover:bg-primary/80"
          >
            {" "}
            Salvar posicoes
          </Button>
        </div>
      </div>
      <Separator className=" my-4"></Separator>

      <div className="p-2 bg-primary/10 border rounded-md border-primary flex gap-4 items-center">
        <Info size={30} className="flex-shrink-0 text-primary"></Info>
        <div>
          {" "}
          <h1>
            <b>Layout da grade de produtos</b>
          </h1>
          Caso deseje alterar a posicão dos produtos basta arrastar e soltar.
        </div>
      </div>
      <div>
        <Client handleUpdatePositions={setData}></Client>
      </div>
    </div>
  );
}
