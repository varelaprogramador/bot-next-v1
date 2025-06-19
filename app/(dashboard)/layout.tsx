import { AppSidebar } from "@/app/components/menus/master-sidebar";
import { Separator } from "@/app/components/ui/separator";
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/app/components/ui/sidebar";

import { Metadata } from "next";
import { ThemeProvider } from "next-themes";


export const metadata: Metadata = {
    title: "LERJ RECARGAS",
    applicationName: "LERJ RECARGAS",
    metadataBase: new URL("https://lerjrecargas.com/"),
    icons: {
        icon: "/ico.jpg",
    },
};

// Componente wrapper para evitar problemas de hidratação
function ThemeWrapper({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
        >
            {children}
        </ThemeProvider>
    );
}

export default async function Layout({
    children,
}: {
    children: React.ReactNode;
}) {

    return (
        <>

            <ThemeWrapper>
                <SidebarProvider>
                    <div className="flex w-screen font-poppins">
                        <AppSidebar />
                        <SidebarInset className="flex-1 h-full">
                            <header className="flex w-full border-b-[1px] h-20 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
                                <div className="flex items-center gap-2 px-4">
                                    <SidebarTrigger className="-ml-1" />
                                    <Separator orientation="vertical" className="mr-2 h-4" />
                                </div>
                            </header>
                            <main className="flex flex-1 flex-col gap-4 p-4 pt-0 h-full overflow-x-hidden">
                                {children}
                            </main>
                        </SidebarInset>
                    </div>
                </SidebarProvider>
            </ThemeWrapper>
        </>

    );
}