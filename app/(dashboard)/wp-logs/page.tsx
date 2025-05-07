"use client"

import { useEffect, useState } from "react"

import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { Input } from "@/app/components/ui/input"
import { Badge } from "@/app/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { ScrollArea } from "@/app/components/ui/scroll-area"
import { createClientSupabaseClient } from "@/lib/supabase/client"
import { CheckCircle, XCircle, MessageSquare, BarChart3, Clock, Search, Filter } from "lucide-react"

type Log = {
    id: string
    phone: string
    message: string
    status: string
    error_message: string | null
    created_at: string
    metadata: any
}

export default function LogsPage() {
    const supabase = createClientSupabaseClient()
    const [logs, setLogs] = useState<Log[]>([])
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [searchTerm, setSearchTerm] = useState("")

    useEffect(() => {
        fetchLogs()
        const channel = supabase
            .channel("whatsapp_logs_changes")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "whatsapp_logs",
                },
                () => {
                    fetchLogs()
                },
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    const fetchLogs = async () => {
        try {
            let query = supabase.from("whatsapp_logs").select("*").order("created_at", { ascending: false }).limit(100)

            if (statusFilter !== "all") {
                query = query.eq("status", statusFilter)
            }

            if (searchTerm) {
                query = query.or(`phone.ilike.%${searchTerm}%,message.ilike.%${searchTerm}%`)
            }

            const { data, error } = await query

            if (error) throw error
            setLogs(data || [])
        } catch (error) {
            console.error("Erro ao buscar logs:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchLogs()
    }, [statusFilter, searchTerm])

    // Calculate dashboard metrics
    const totalMessages = logs.length
    const successMessages = logs.filter((log) => log.status === "success").length
    const errorMessages = logs.filter((log) => log.status === "error").length
    const successRate = totalMessages > 0 ? Math.round((successMessages / totalMessages) * 100) : 0

    // Get the most recent message time
    const mostRecentTime =
        logs.length > 0 ? format(new Date(logs[0].created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR }) : "Nenhum registro"

    return (
        <div className="container mx-auto py-8 space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold">Dashboard WhatsApp</h1>
                <p className="text-muted-foreground">Monitoramento e análise de mensagens enviadas</p>
            </div>

            {/* Dashboard Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-card shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total de Mensagens</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="text-3xl font-bold">{totalMessages}</div>
                            <MessageSquare className="h-8 w-8 text-primary opacity-80" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Taxa de Sucesso</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="text-3xl font-bold">{successRate}%</div>
                            <BarChart3 className="h-8 w-8 text-primary opacity-80" />
                        </div>
                        <div className="mt-2 h-2 w-full bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${successRate}%` }} />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Mensagens com Sucesso</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="text-3xl font-bold">{successMessages}</div>
                            <CheckCircle className="h-8 w-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Mensagens com Erro</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="text-3xl font-bold">{errorMessages}</div>
                            <XCircle className="h-8 w-8 text-destructive" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity Card */}
            <Card className="bg-card shadow-sm">
                <CardHeader>
                    <CardTitle className="text-xl">Atividade Recente</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Última mensagem:</span>
                        </div>
                        <span className="font-medium">{mostRecentTime}</span>
                    </div>
                </CardContent>
            </Card>

            {/* Filters */}
            <Card className="bg-card shadow-sm">
                <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Filtros:</span>
                        </div>

                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filtrar por status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                <SelectItem value="success">Sucesso</SelectItem>
                                <SelectItem value="error">Erro</SelectItem>
                            </SelectContent>
                        </Select>

                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por telefone ou mensagem..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Logs Table */}
            <Card className="bg-card shadow-sm">
                <CardHeader>
                    <CardTitle className="text-xl">Logs de Mensagens</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <ScrollArea className="h-[500px]">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Data/Hora</TableHead>
                                    <TableHead>Telefone</TableHead>
                                    <TableHead>Mensagem</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Detalhes</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8">
                                            Carregando logs...
                                        </TableCell>
                                    </TableRow>
                                ) : logs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8">
                                            Nenhum log encontrado
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    logs.map((log) => (
                                        <TableRow key={log.id}>
                                            <TableCell>
                                                {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", {
                                                    locale: ptBR,
                                                })}
                                            </TableCell>
                                            <TableCell>{log.phone}</TableCell>
                                            <TableCell className="max-w-md truncate">{log.message}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={log.status === "success" ? "default" : "destructive"}
                                                    className="flex items-center gap-1"
                                                >
                                                    {log.status === "success" ? (
                                                        <>
                                                            <CheckCircle className="h-3 w-3" /> Sucesso
                                                        </>
                                                    ) : (
                                                        <>
                                                            <XCircle className="h-3 w-3" /> Erro
                                                        </>
                                                    )}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {log.error_message && <div className="text-destructive text-sm">{log.error_message}</div>}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    )
}
