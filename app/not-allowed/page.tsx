"use client"

import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { AlertCircle, Home } from 'lucide-react'

import { Button } from "@/app/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/app/components/ui/card"

export default function NotAllowedPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center bg-gradient-to-br from-red-50 via-white to-red-100">
      <Card className="max-w-md w-full shadow-2xl border-0 bg-white/90">
        <CardHeader className="text-center pb-2">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 100 }}
            className="flex justify-center mb-4"
          >
            <div className="rounded-full bg-red-100 p-5 shadow-lg">
              <AlertCircle className="h-14 w-14 text-red-500" />
            </div>
          </motion.div>
          <CardTitle className="text-3xl font-bold text-red-700">Acesso Restrito</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4 pb-2">
          <p className="text-muted-foreground text-lg">
            Você não possui permissão para acessar esta página.<br />
            Entre em contato com o administrador do sistema para solicitar acesso.
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
  )
}
