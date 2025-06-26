"use client";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Ghost, Home } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/app/components/ui/card";

export default function NotFoundPage() {
    const router = useRouter();
    return (
        <div className="min-h-screen w-full flex flex-col justify-center items-center bg-gradient-to-br ">
            <Card className="max-w-md w-full shadow-2xl border-0 bg-white">
                <CardHeader className="text-center pb-2">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 100 }}
                        className="flex justify-center mb-4"
                    >
                        <div className="rounded-full bg-slate-100 p-5 shadow-lg">
                            <Ghost className="h-14 w-14 text-slate-400" />
                        </div>
                    </motion.div>
                    <CardTitle className="text-3xl font-bold text-slate-700">Página não encontrada</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4 pb-2">
                    <p className="text-muted-foreground text-lg">
                        O recurso que você procura não existe ou foi removido.<br />
                        Verifique o endereço ou volte para a página inicial.
                    </p>
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row gap-2 justify-center mt-2">
                    <Button className="w-full sm:w-auto flex items-center gap-2 text-base font-semibold" onClick={() => router.push("/")}>
                        <Home className="h-5 w-5" />
                        Ir para página inicial
                    </Button>
                </CardFooter>
            </Card>
            <span className="mt-8 text-xs text-muted-foreground">© {new Date().getFullYear()} LERJ. Todos os direitos reservados.</span>
        </div>
    );
} 