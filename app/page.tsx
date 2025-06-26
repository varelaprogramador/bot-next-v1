"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./components/ui/button";
import { Progress } from "./components/ui/progress";

export default function Page() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let current = 0;
    const interval = setInterval(() => {
      current += 1;
      setProgress((current / 50) * 100);
      if (current >= 50) {
        clearInterval(interval);
        router.push("/dashboard");
      }
    }, 100);
    return () => clearInterval(interval);
  }, [router]);

  const handleClick = () => router.push("/dashboard");

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center bg-gradient-to-br">
      <div className=" bg-white shadow-xl rounded-xl p-8 flex flex-col items-center gap-6 max-w-md w-full">
        <h1 className="text-3xl font-bold text-blue-900 mb-2 text-center">Bem-vindo ao sistema da LERJ</h1>
        <p className="text-lg text-muted-foreground text-center">
          Você será redirecionado para o dashboard em instantes.
        </p>
        <Progress value={progress} className="w-full h-3 rounded-full bg-blue-200" />
        <Button onClick={handleClick} className="w-full mt-2" size="lg">
          Ir para Dashboard agora
        </Button>
        <span className="text-xs text-muted-foreground mt-2">Redirecionamento automático em {Math.ceil((100 - progress) / 20)}s...</span>
      </div>
    </div>
  );
}
