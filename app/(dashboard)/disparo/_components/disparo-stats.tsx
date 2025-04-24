"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs"
import { Progress } from "@/app/components/ui/progress"
import { BarChart, Calendar, Clock, MessageCircle, Users } from "lucide-react"
import { ChartContainer } from "@/app/components/ui/chart"
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"


export function DisparoStats() {
  // Dados de exemplo para os gráficos
  const dailyData = [
    { name: "Seg", enviados: 65, falhas: 5 },
    { name: "Ter", enviados: 59, falhas: 3 },
    { name: "Qua", enviados: 80, falhas: 2 },
    { name: "Qui", enviados: 81, falhas: 4 },
    { name: "Sex", enviados: 56, falhas: 1 },
    { name: "Sáb", enviados: 55, falhas: 0 },
    { name: "Dom", enviados: 40, falhas: 1 },
  ]

  const monthlyData = [
    { name: "Jan", enviados: 400, falhas: 20 },
    { name: "Fev", enviados: 300, falhas: 15 },
    { name: "Mar", enviados: 500, falhas: 25 },
    { name: "Abr", enviados: 280, falhas: 14 },
    { name: "Mai", enviados: 590, falhas: 30 },
    { name: "Jun", enviados: 350, falhas: 18 },
  ]

  // Estatísticas gerais
  const stats = [
    {
      title: "Total de Disparos",
      value: "1,248",
      icon: <MessageCircle className="h-4 w-4" />,
      description: "Últimos 30 dias",
    },
    {
      title: "Usuários Alcançados",
      value: "5,432",
      icon: <Users className="h-4 w-4" />,
      description: "Destinatários únicos",
    },
    {
      title: "Taxa de Sucesso",
      value: "98.5%",
      icon: <BarChart className="h-4 w-4" />,
      description: "Mensagens entregues",
    },
    {
      title: "Tempo Médio",
      value: "1.2s",
      icon: <Clock className="h-4 w-4" />,
      description: "Por mensagem",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className="rounded-full bg-primary/10 p-1 text-primary">{stat.icon}</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Desempenho de Disparos</CardTitle>
          <CardDescription>Visualize o desempenho dos seus disparos ao longo do tempo</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="daily" className="w-full">
            <TabsList className="grid w-full max-w-[400px] grid-cols-2">
              <TabsTrigger value="daily" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Diário</span>
              </TabsTrigger>
              <TabsTrigger value="monthly" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Mensal</span>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="daily" className="pt-4">
              <div className="h-[300px] w-full">
                <ChartContainer config={{ enviados: { color: "#0ea5e9" }, falhas: { color: "#f43f5e" } }}>
                  <RechartsBarChart
                    data={dailyData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis width={40} />
                    <Tooltip formatter={(value) => `${value} mensagens`} />
                    <Legend />
                    <Bar dataKey="enviados" fill="#0ea5e9" />
                    <Bar dataKey="falhas" fill="#f43f5e" />
                  </RechartsBarChart>
                </ChartContainer>
              </div>
            </TabsContent>
            <TabsContent value="monthly" className="pt-4">
              <div className="h-[300px] w-full">
                <ChartContainer config={{ enviados: { color: "#0ea5e9" }, falhas: { color: "#f43f5e" } }}>
                  <RechartsBarChart
                    data={monthlyData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis width={40} />
                    <Tooltip formatter={(value) => `${value} mensagens`} />
                    <Legend />
                    <Bar dataKey="enviados" fill="#0ea5e9" />
                    <Bar dataKey="falhas" fill="#f43f5e" />
                  </RechartsBarChart>
                </ChartContainer>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Distribuição por Tipo</CardTitle>
          <CardDescription>Distribuição de mensagens por tipo de destinatário</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Usuários</span>
              </div>
              <span className="text-sm">68% (850)</span>
            </div>
            <Progress value={68} className="h-2 bg-primary/20" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-secondary" />
                <span className="text-sm font-medium">Telegram</span>
              </div>
              <span className="text-sm">32% (398)</span>
            </div>
            <Progress value={32} className="h-2 bg-secondary/20" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
