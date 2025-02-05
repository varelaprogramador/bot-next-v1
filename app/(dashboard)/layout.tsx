/* eslint-disable @typescript-eslint/no-explicit-any */
import { AppSidebar } from "@/app/components/menus/master-sidebar";
import { Separator } from "@/app/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/app/components/ui/sidebar";

import { currentUser } from "@clerk/nextjs/server";
import { Metadata } from "next";

import { redirect } from "next/navigation";

export const metadata: Metadata = {
  robots: "noindex, nofollow",
};

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();

  const metadata: {
    [key: string]: any;
  } = user?.privateMetadata as any;

  if (metadata?.subscription?.status !== "active") {
    redirect("/not-allowed");
  }

  return (
    <SidebarProvider>
      <div className="flex  w-screen font-poppins">
        <AppSidebar />
        <SidebarInset className="flex-1 h-full">
          <header className="flex w-full border-b-[1px] h-20 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
            </div>
            {/* <Link href={"/dashboard"}>
              <Image
                alt="Logo"
                src="/Logo-light.svg"
                width={200}
                height={500}
                draggable="false"
                loading="lazy"
                decoding="async"
              />
            </Link> */}
          </header>
          <main className="flex flex-1 flex-col gap-4 p-4 pt-0 h-full overflow-x-hidden">
            {children}
          </main>
         
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
