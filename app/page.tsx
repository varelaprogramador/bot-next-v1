import { AlertTriangle } from "lucide-react"

import { MainNav } from "@/components/main-nav"
import { RevenueChart } from "@/components/revenue-chart"
import { SummaryCard } from "@/components/summary-card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DashboardPage() {
  return (

        <div className="flex min-h-[90vh] flex-col px-4 space-y-4">
        
            <div className="flex items-center justify-between space-y-2">
              <h2 className="text-3xl font-bold tracking-tight">Boas-vindas, Ryan</h2>
            </div>
            <div>
              <h3 className="text-lg font-medium">RESUMO</h3>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <SummaryCard title="Vendas hoje" value="R$ 0,00" previousValue="R$ 0,00" previousLabel="De ontem" />
                <SummaryCard title="Vendas feitas" value="R$ 0,00" previousValue="30 dias"  previousLabel="Dos últimos" />
                <SummaryCard title="Pendente" value="R$ 0,00" previousValue="24 horas"  previousLabel="Das últimas" />
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold">
                    NÍVEL 1
                  </div>
                  <span className="text-sm text-muted-foreground">R$ 0,00 em vendas</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  <span>0</span>
                  <span className="mx-1">/</span>
                  <span>10k</span>
                </div>
              </div>
              <Progress value={0} className="h-2" />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">GRÁFICO DE FATURAMENTO</h3>
                <Tabs defaultValue="30" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="7">7 dias</TabsTrigger>
                    <TabsTrigger value="15">15 dias</TabsTrigger>
                    <TabsTrigger value="30">30 dias</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <RevenueChart />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">CONVERSÃO DE PAGAMENTO</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Cartão</span>
                    <span>0%</span>
                  </div>
                  <Progress value={0} className="h-2" />
                  <div className="flex items-center justify-between text-sm">
                    <span>PIX</span>
                    <span>0%</span>
                  </div>
                  <Progress value={0} className="h-2" />
                  <div className="flex items-center justify-between text-sm">
                    <span>Boleto</span>
                    <span>0%</span>
                  </div>
                  <Progress value={0} className="h-2" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">STATUS DA CONTA</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Em breve você terá acesso a um informe</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">CONVERSÃO DE CHECKOUT</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Em breve você terá acesso a um funil otimizado</p>
                </CardContent>
              </Card>
            </div>
         
        </div>
      
  
  )
}

