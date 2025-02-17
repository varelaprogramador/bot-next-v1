import Link from "next/link";
import { Input } from "../components/ui/input";
import { Search, User } from "lucide-react";
import { Button } from "../components/ui/button";
import { DropdownMenu } from "../components/ui/dropdown-menu";
import { ListBulletIcon } from "@radix-ui/react-icons";


export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    
      <div className="flex flex-col container mx-auto px-2 w-screen font-poppins py-4 ">
        <header className="bg-white  rounded-md sticky top-2 z-40 shadow-md
         shadow-[#00000057]">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-8">
                <Link href="/" className="text-red-600 font-bold text-2xl">
                  ativabox
                </Link>
                <nav className="hidden xl:flex items-center gap-6 ">
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
              <div className="hidden xl:flex items-center gap-4">
                <div className="relative w-64">
                  <Input placeholder="O que você procura?" className="pl-10" />
                  <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
                <Button variant="destructive">
                  <User></User>Minha Conta
                </Button>
              </div>
                <Button className="max-xl:flex hidden" variant="outline">
                       <ListBulletIcon></ListBulletIcon>
                     </Button>
            </div>
          </div>
          <nav className="bg-gray-900 rounded-b-md hidden xl:flex">
            <div className="container mx-auto px-4">
              <div className="flex items-center h-12 gap-6 text-sm">
                <Link href="#" className="text-white hover:text-gray-300">
                  CARD Mensal
                </Link>
                <Link href="#" className="text-white hover:text-gray-300">
                  CARD Anual
                </Link>
              </div>
            </div>
          </nav>
          <nav className="bg-gray-900 rounded-b-md p-2 max-xl:flex hidden ">
            <div className="container mx-auto px-4 flex items-center justify-center">
            <div className="relative w-full">
                  <Input placeholder="O que você procura?" className="pl-10 bg-white" />
                  <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
            </div>
          </nav>
        </header>
          <main className=" py-8 overflow-x-hidden">
            {children}
          </main>

        </div>
    
  );
}
