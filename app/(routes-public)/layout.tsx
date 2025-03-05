import Link from "next/link";
import { Input } from "../components/ui/input";
import { Search, User } from "lucide-react";
import { Button } from "../components/ui/button";
import { DropdownMenu } from "../components/ui/dropdown-menu";
import { ListBulletIcon } from "@radix-ui/react-icons";
import InputSearch from "../components/search-input";
import { Menu } from "./_components/header";


export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (

    <div className="flex flex-col container mx-auto w-full font-poppins  ">
      <Menu></Menu>
      <main className=" py-8 overflow-x-hidden">
        {children}
      </main>

    </div>

  );
}
