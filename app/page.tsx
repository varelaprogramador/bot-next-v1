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
import { Carousel } from "@/app/components/ui/carousel";

export default function GiftCardStore() {
  const giftCards = [
    {
      id: 1,
      name: "Ativa Play",
      logo: "https://sjc.microlink.io/UwYz3uZkQ9R5vxqshu_DcDLb8gNybV2-_7L0ASndBmMoPpjCXKnKJRllvieA8Py95kpXfxAxGUKHCrKsV03ceA.jpeg#ativa",
    },
    {
      id: 9,
      name: "Ativa Play",
      logo: "https://sjc.microlink.io/UwYz3uZkQ9R5vxqshu_DcDLb8gNybV2-_7L0ASndBmMoPpjCXKnKJRllvieA8Py95kpXfxAxGUKHCrKsV03ceA.jpeg#ativa",
    },
    {
      id: 10,
      name: "Ativa Play",
      logo: "https://sjc.microlink.io/UwYz3uZkQ9R5vxqshu_DcDLb8gNybV2-_7L0ASndBmMoPpjCXKnKJRllvieA8Py95kpXfxAxGUKHCrKsV03ceA.jpeg#ativa",
    },
    {
      id: 11,
      name: "Ativa Play",
      logo: "https://sjc.microlink.io/UwYz3uZkQ9R5vxqshu_DcDLb8gNybV2-_7L0ASndBmMoPpjCXKnKJRllvieA8Py95kpXfxAxGUKHCrKsV03ceA.jpeg#ativa",
    },
    {
      id: 12,
      name: "Ativa Play",
      logo: "https://sjc.microlink.io/UwYz3uZkQ9R5vxqshu_DcDLb8gNybV2-_7L0ASndBmMoPpjCXKnKJRllvieA8Py95kpXfxAxGUKHCrKsV03ceA.jpeg#ativa",
    },
    {
      id: 13,
      name: "Ativa Play",
      logo: "https://sjc.microlink.io/UwYz3uZkQ9R5vxqshu_DcDLb8gNybV2-_7L0ASndBmMoPpjCXKnKJRllvieA8Py95kpXfxAxGUKHCrKsV03ceA.jpeg#ativa",
    },
    {
      id: 2,
      name: "TV Express",
      logo: "https://sjc.microlink.io/UwYz3uZkQ9R5vxqshu_DcDLb8gNybV2-_7L0ASndBmMoPpjCXKnKJRllvieA8Py95kpXfxAxGUKHCrKsV03ceA.jpeg#tvexpress",
    },
    {
      id: 3,
      name: "You Cine",
      logo: "https://sjc.microlink.io/UwYz3uZkQ9R5vxqshu_DcDLb8gNybV2-_7L0ASndBmMoPpjCXKnKJRllvieA8Py95kpXfxAxGUKHCrKsV03ceA.jpeg#youcine",
    },
    {
      id: 4,
      name: "BTV",
      logo: "https://sjc.microlink.io/UwYz3uZkQ9R5vxqshu_DcDLb8gNybV2-_7L0ASndBmMoPpjCXKnKJRllvieA8Py95kpXfxAxGUKHCrKsV03ceA.jpeg#btv",
    },
    {
      id: 5,
      name: "UniTV",
      logo: "https://sjc.microlink.io/UwYz3uZkQ9R5vxqshu_DcDLb8gNybV2-_7L0ASndBmMoPpjCXKnKJRllvieA8Py95kpXfxAxGUKHCrKsV03ceA.jpeg#unitv",
    },
    {
      id: 6,
      name: "RedPlay",
      logo: "https://sjc.microlink.io/UwYz3uZkQ9R5vxqshu_DcDLb8gNybV2-_7L0ASndBmMoPpjCXKnKJRllvieA8Py95kpXfxAxGUKHCrKsV03ceA.jpeg#redplay",
    },
  ];

  const products = [
    {
      id: 1,
      name: "Xbox Game Pass (ultimate)",
      price: "R$ 110,00",
      pixPrice: "NO PIX 100,00",
      image: "/placeholder.svg",
      period: "Mensal",
    },
    {
      id: 2,
      name: "TVExpress",
      price: "R$ 28,90",
      pixPrice: "NO PIX 23,90",
      image: "/placeholder.svg",
      period: "Mensal",
    },
    {
      id: 3,
      name: "Xbox Game Pass",
      price: "R$ 110,00",
      pixPrice: "NO PIX 100,00",
      image: "/placeholder.svg",
      period: "Mensal",
    },
    {
      id: 4,
      name: "Ativa Play [New]",
      price: "R$ 29,90",
      pixPrice: "NO PIX, R$ 24,90",
      image: "/placeholder.svg",
      period: "Mensal",
    },
  ];
  const handleScroll = (direction) => {
    const scrollAmount = 100; // Adjust scroll distance as needed
    const container = document.querySelector(".overflow-x-auto");
    if (direction === "left") {
      container.scrollLeft -= scrollAmount;
    } else {
      container.scrollLeft += scrollAmount;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
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

      <main className="container mx-auto px-4 py-8">
        <section className="w-full min-h-[500px] bg-cover bg-[url('/img-banner.png')] rounded-md"></section>
        <section className="my-12">
          <h2 className="text-2xl font-bold mb-6">Escolha seu Giftcard</h2>

          <div className="relative">
            {/* Carrossel utilizando o componente Carousel do ShadCN */}
            <Carousel className="overflow-hidden">
              {giftCards.map((card) => (
                <div
                  key={card.id}
                  className="flex-shrink-0 w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200 hover:border-red-500 cursor-pointer"
                >
                  <Image
                    src="/placeholder.svg"
                    alt={card.name}
                    width={80}
                    height={80}
                    className="object-cover"
                  />
                </div>
              ))}
            </Carousel>

            {/* Botões de navegação */}
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
                  <div className="bg-blue-600 py-2 rounded-md">
                    <p className="text-center text-white">{product.period}</p>
                    <div className="aspect-square relative ">
                      <Image
                        src={product.url_image || "/placeholder.svg"}
                        alt={product.nome}
                        fill
                        className="object-contain"
                      />
                    </div>
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                  <div className="text-green-600">{product.pixPrice}</div>
                  <div className="text-gray-600">{product.price} no cartão</div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full bg-gray-900 hover:bg-gray-800">
                    Comprar
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
