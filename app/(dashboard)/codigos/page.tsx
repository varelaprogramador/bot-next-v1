"use client"

import { DataTableCodigos } from "@/app/components/tabela-codigos"
import { createClientSupabaseClient } from "@/lib/supabase/client";
import { useEffect, useState, useMemo } from "react"
import type { CodigosProps } from "../../utils/codigos"
import type { ProdutosProps } from "../../utils/produto"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Skeleton } from "@/app/components/ui/skeleton"
import { Badge } from "@/app/components/ui/badge"
import { Binary, CheckCircle, CircleDollarSign, Code, RefreshCw, Package, TrendingUp, AlertTriangle, Filter, X, ChevronDown, ChevronUp, Eye, ChevronRight, ExternalLink, Copy, Search } from 'lucide-react'
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { Checkbox } from "@/app/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/app/components/ui/dialog"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface ProdutoEstoque {
  id: string
  nome: string
  categoria: string
  valor: number
  totalCodigos: number
  codigosResgatados: number
  codigosPendentes: number
  percentualResgatado: number
  percentualPendente: number
}

interface FiltrosAvancados {
  produto: string
  categoria: string
  status: string
  valorMin: string
  valorMax: string
  percentualMin: string
  percentualMax: string
  apenasComEstoque: boolean
  apenasSemEstoque: boolean
  apenasEstoqueBaixo: boolean
}

interface CodigoDetalhado extends CodigosProps {
  produto_nome?: string
  produto_categoria?: string
  produto_valor?: number
}

export default function Codigos() {
  const router = useRouter()
  const supabase = createClientSupabaseClient()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [data, setData] = useState<CodigosProps[]>([])
  const [produtos, setProdutos] = useState<ProdutosProps[]>([])
  const [produtosEstoque, setProdutosEstoque] = useState<ProdutoEstoque[]>([])
  const [filtrosVisiveis, setFiltrosVisiveis] = useState(false)
  const [produtosExpandidos, setProdutosExpandidos] = useState(false)
  const [modalAberto, setModalAberto] = useState(false)
  const [produtoSelecionado, setProdutoSelecionado] = useState<ProdutoEstoque | null>(null)
  const [codigosProduto, setCodigosProduto] = useState<CodigoDetalhado[]>([])
  const [carregandoCodigos, setCarregandoCodigos] = useState(false)
  const [buscaCodigo, setBuscaCodigo] = useState("")
  const [filtroStatusCodigo, setFiltroStatusCodigo] = useState("")
  const [filtros, setFiltros] = useState<FiltrosAvancados>({
    produto: "",
    categoria: "",
    status: "",
    valorMin: "",
    valorMax: "",
    percentualMin: "",
    percentualMax: "",
    apenasComEstoque: false,
    apenasSemEstoque: false,
    apenasEstoqueBaixo: false
  })

  const loadData = async () => {
    setRefreshing(true)
    try {
      // Carregar códigos
      let allData: CodigosProps[] = []
      let start = 0
      const batchSize = 1000

      while (start < 7000) {
        const { data: batch, error } = await supabase
          .from("codigos")
          .select("*")
          .range(start, start + batchSize - 1)

        if (error) throw error

        if (batch.length === 0) break

        allData = [...allData, ...batch]
        start += batchSize
      }

      // Carregar produtos
      const { data: produtosData, error: produtosError } = await supabase
        .from("produtos")
        .select("*")

      if (produtosError) throw produtosError

      setData(allData)
      setProdutos(produtosData || [])

      // Calcular estoque por produto
      const estoqueCalculado = calcularEstoquePorProduto(allData, produtosData || [])
      setProdutosEstoque(estoqueCalculado)

      toast.success(`${allData.length} códigos e ${produtosData?.length || 0} produtos carregados com sucesso.`)
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      toast.error("Não foi possível carregar os dados. Tente novamente.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const calcularEstoquePorProduto = (codigos: CodigosProps[], produtos: ProdutosProps[]): ProdutoEstoque[] => {
    const estoqueMap = new Map<string, ProdutoEstoque>()

    // Inicializar estoque para cada produto
    produtos.forEach(produto => {
      estoqueMap.set(produto.id!, {
        id: produto.id!,
        nome: produto.nome,
        categoria: produto.categoria,
        valor: produto.valor,
        totalCodigos: 0,
        codigosResgatados: 0,
        codigosPendentes: 0,
        percentualResgatado: 0,
        percentualPendente: 0
      })
    })

    // Calcular códigos por produto
    codigos.forEach(codigo => {
      const produto = estoqueMap.get(codigo.id_produto)
      if (produto) {
        produto.totalCodigos++
        if (codigo.status.toLowerCase() === "resgatado") {
          produto.codigosResgatados++
        } else {
          produto.codigosPendentes++
        }
      }
    })

    // Calcular percentuais
    estoqueMap.forEach(produto => {
      if (produto.totalCodigos > 0) {
        produto.percentualResgatado = (produto.codigosResgatados / produto.totalCodigos) * 100
        produto.percentualPendente = (produto.codigosPendentes / produto.totalCodigos) * 100
      }
    })

    return Array.from(estoqueMap.values()).sort((a, b) => b.totalCodigos - a.totalCodigos)
  }

  // Aplicar filtros
  const produtosFiltrados = useMemo(() => {
    let filtrados = [...produtosEstoque] // Criar uma cópia para não modificar o original

    // Debug: log dos filtros ativos
    console.log("Filtros ativos:", filtros)
    console.log("Produtos antes dos filtros:", filtrados.length)

    // Filtro por produto
    if (filtros.produto && filtros.produto.trim() !== "") {
      filtrados = filtrados.filter(p =>
        p.nome.toLowerCase().includes(filtros.produto.toLowerCase().trim())
      )
      console.log("Após filtro produto:", filtrados.length)
    }

    // Filtro por categoria
    if (filtros.categoria && filtros.categoria.trim() !== "") {
      filtrados = filtrados.filter(p => p.categoria === filtros.categoria)
      console.log("Após filtro categoria:", filtrados.length)
    }

    // Filtro por status
    if (filtros.status && filtros.status.trim() !== "") {
      switch (filtros.status) {
        case "resgatado":
          filtrados = filtrados.filter(p => p.codigosResgatados > 0)
          break
        case "ativo":
          filtrados = filtrados.filter(p => p.codigosPendentes > 0)
          break
        case "sem_estoque":
          filtrados = filtrados.filter(p => p.totalCodigos === 0)
          break
      }
      console.log("Após filtro status:", filtrados.length)
    }

    // Filtro por valor mínimo
    if (filtros.valorMin && filtros.valorMin.trim() !== "") {
      const valorMin = parseFloat(filtros.valorMin)
      if (!isNaN(valorMin)) {
        filtrados = filtrados.filter(p => p.valor >= valorMin)
        console.log("Após filtro valor min:", filtrados.length)
      }
    }

    // Filtro por valor máximo
    if (filtros.valorMax && filtros.valorMax.trim() !== "") {
      const valorMax = parseFloat(filtros.valorMax)
      if (!isNaN(valorMax)) {
        filtrados = filtrados.filter(p => p.valor <= valorMax)
        console.log("Após filtro valor max:", filtrados.length)
      }
    }

    // Filtro por percentual mínimo
    if (filtros.percentualMin && filtros.percentualMin.trim() !== "") {
      const percentualMin = parseFloat(filtros.percentualMin)
      if (!isNaN(percentualMin)) {
        filtrados = filtrados.filter(p => p.percentualResgatado >= percentualMin)
        console.log("Após filtro percentual min:", filtrados.length)
      }
    }

    // Filtro por percentual máximo
    if (filtros.percentualMax && filtros.percentualMax.trim() !== "") {
      const percentualMax = parseFloat(filtros.percentualMax)
      if (!isNaN(percentualMax)) {
        filtrados = filtrados.filter(p => p.percentualResgatado <= percentualMax)
        console.log("Após filtro percentual max:", filtrados.length)
      }
    }

    // Filtros booleanos - apenas um pode estar ativo por vez
    if (filtros.apenasComEstoque) {
      filtrados = filtrados.filter(p => p.totalCodigos > 0)
      console.log("Após filtro apenas com estoque:", filtrados.length)
    } else if (filtros.apenasSemEstoque) {
      filtrados = filtrados.filter(p => p.totalCodigos === 0)
      console.log("Após filtro apenas sem estoque:", filtrados.length)
    } else if (filtros.apenasEstoqueBaixo) {
      filtrados = filtrados.filter(p => p.codigosPendentes < 10 && p.codigosPendentes > 0)
      console.log("Após filtro estoque baixo:", filtrados.length)
    }

    console.log("Produtos após todos os filtros:", filtrados.length)
    return filtrados
  }, [produtosEstoque, filtros])

  const limparFiltros = () => {
    setFiltros({
      produto: "",
      categoria: "",
      status: "",
      valorMin: "",
      valorMax: "",
      percentualMin: "",
      percentualMax: "",
      apenasComEstoque: false,
      apenasSemEstoque: false,
      apenasEstoqueBaixo: false
    })
  }

  const filtrosAtivos = useMemo(() => {
    return Object.values(filtros).some(valor =>
      (typeof valor === 'string' && valor.trim() !== '') ||
      (typeof valor === 'boolean' && valor === true)
    )
  }, [filtros])

  // Categorias únicas
  const categorias = useMemo(() => {
    const cats = [...new Set(produtos.map(p => p.categoria).filter(Boolean))]
    return cats.sort()
  }, [produtos])

  // KPIs por Produto
  const produtosComEstoque = produtosFiltrados.filter(p => p.totalCodigos > 0)
  const produtosSemEstoque = produtosFiltrados.filter(p => p.totalCodigos === 0)
  const produtoComMaisEstoque = produtosComEstoque[0]
  const produtoComMenosEstoque = produtosComEstoque[produtosComEstoque.length - 1]

  const verEstoqueProduto = (produtoId: string) => {
    // Navegar para a página de códigos com filtro por produto
    router.push(`/codigos?produto=${produtoId}`)
  }

  const abrirModalDetalhes = async (produto: ProdutoEstoque) => {
    setProdutoSelecionado(produto)
    setModalAberto(true)
    setCarregandoCodigos(true)
    setBuscaCodigo("")
    setFiltroStatusCodigo("")

    try {
      // Buscar códigos do produto específico
      const { data: codigosData, error } = await supabase
        .from("codigos")
        .select("*")
        .eq("id_produto", produto.id)

      if (error) throw error

      // Enriquecer os códigos com informações do produto
      const codigosEnriquecidos: CodigoDetalhado[] = codigosData.map(codigo => ({
        ...codigo,
        produto_nome: produto.nome,
        produto_categoria: produto.categoria,
        produto_valor: produto.valor
      }))

      setCodigosProduto(codigosEnriquecidos)
    } catch (error) {
      console.error("Erro ao carregar códigos do produto:", error)
      toast.error("Erro ao carregar códigos do produto")
    } finally {
      setCarregandoCodigos(false)
    }
  }

  const copiarCodigo = (codigo: string) => {
    navigator.clipboard.writeText(codigo)
    toast.success("Código copiado para a área de transferência!")
  }

  const codigosFiltrados = useMemo(() => {
    let filtrados = codigosProduto

    if (buscaCodigo.trim()) {
      filtrados = filtrados.filter(c =>
        c.codigo.toLowerCase().includes(buscaCodigo.toLowerCase().trim())
      )
    }

    if (filtroStatusCodigo) {
      filtrados = filtrados.filter(c =>
        c.status.toLowerCase() === filtroStatusCodigo.toLowerCase()
      )
    }

    return filtrados
  }, [codigosProduto, buscaCodigo, filtroStatusCodigo])

  const produtosParaMostrar = produtosExpandidos ? produtosComEstoque : produtosComEstoque.slice(0, 6)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    const subscription = supabase.channel("realtime:public:codigos").on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "codigos",
      },
      (payload) => {
        setData((prevData) => {
          let newData: CodigosProps[]
          switch (payload.eventType) {
            case "INSERT":
              newData = [...prevData, payload.new as CodigosProps]
              break
            case "UPDATE":
              newData = prevData.map((item) =>
                item.id_codigo === payload.new.id_codigo ? (payload.new as CodigosProps) : item
              )
              break
            case "DELETE":
              newData = prevData.filter((item) => item.id_codigo !== payload.old.id_codigo)
              break
            default:
              newData = prevData
          }

          // Recalcular estoque
          const estoqueRecalculado = calcularEstoquePorProduto(newData, produtos)
          setProdutosEstoque(estoqueRecalculado)

          return newData
        })
      }
    )

    subscription.subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, produtos])

  // KPIs Gerais
  const totalCodigos = data.length
  const codigosResgatados = data.filter((codigo) => codigo.status.toLowerCase() === "resgatado").length
  const codigosPendentes = totalCodigos - codigosResgatados
  const percentageResgatados = totalCodigos > 0 ? (codigosResgatados / totalCodigos) * 100 : 0

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
  }

  return (
    <motion.div
      className="container mx-auto p-6 space-y-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div variants={itemVariants}>
          <h1 className="text-3xl font-bold">Códigos</h1>
          <p className="text-muted-foreground">Gerencie e monitore todos os seus códigos de acesso</p>
        </motion.div>
        <motion.div variants={itemVariants} className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setFiltrosVisiveis(!filtrosVisiveis)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filtros
            {filtrosAtivos && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs">
                {Object.values(filtros).filter(v => v !== "" && v !== false).length}
              </Badge>
            )}
            {filtrosVisiveis ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          <Button
            onClick={loadData}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Atualizando..." : "Atualizar dados"}
          </Button>
        </motion.div>
      </div>

      {/* Painel de Filtros Avançados */}
      <AnimatePresence>
        {filtrosVisiveis && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <Card className="border-border bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Filtros Avançados
                  </CardTitle>
                  <div className="flex gap-2">
                    {filtrosAtivos && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={limparFiltros}
                        className="flex items-center gap-2"
                      >
                        <X className="h-4 w-4" />
                        Limpar
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {/* Filtro por Produto */}
                  <div className="space-y-2">
                    <Label htmlFor="filtro-produto">Produto</Label>
                    <Input
                      id="filtro-produto"
                      placeholder="Buscar por nome..."
                      value={filtros.produto}
                      onChange={(e) => setFiltros(prev => ({ ...prev, produto: e.target.value }))}
                    />
                  </div>

                  {/* Filtro por Categoria */}
                  <div className="space-y-2">
                    <Label htmlFor="filtro-categoria">Categoria</Label>
                    <div className="flex gap-2">
                      <Select
                        value={filtros.categoria}
                        onValueChange={(value) => {
                          console.log("Categoria selecionada:", value)
                          setFiltros(prev => ({ ...prev, categoria: value }))
                        }}
                      >
                        <SelectTrigger id="filtro-categoria" className="flex-1">
                          <SelectValue placeholder="Todas as categorias" />
                        </SelectTrigger>
                        <SelectContent>
                          {categorias.map(categoria => (
                            <SelectItem key={categoria} value={categoria}>
                              {categoria}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {filtros.categoria && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setFiltros(prev => ({ ...prev, categoria: "" }))}
                          className="px-2"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Filtro por Status */}
                  <div className="space-y-2">
                    <Label htmlFor="filtro-status">Status</Label>
                    <div className="flex gap-2">
                      <Select
                        value={filtros.status}
                        onValueChange={(value) => {
                          console.log("Status selecionado:", value)
                          setFiltros(prev => ({ ...prev, status: value }))
                        }}
                      >
                        <SelectTrigger id="filtro-status" className="flex-1">
                          <SelectValue placeholder="Todos os status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem key="resgatado" value="resgatado">Com códigos resgatados</SelectItem>
                          <SelectItem key="ativo" value="ativo">Com códigos ativos</SelectItem>
                          <SelectItem key="sem_estoque" value="sem_estoque">Sem estoque</SelectItem>
                        </SelectContent>
                      </Select>
                      {filtros.status && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setFiltros(prev => ({ ...prev, status: "" }))}
                          className="px-2"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Filtro por Valor Mínimo */}
                  <div className="space-y-2">
                    <Label htmlFor="filtro-valor-min">Valor Mínimo (R$)</Label>
                    <Input
                      id="filtro-valor-min"
                      type="number"
                      placeholder="0.00"
                      value={filtros.valorMin}
                      onChange={(e) => setFiltros(prev => ({ ...prev, valorMin: e.target.value }))}
                    />
                  </div>

                  {/* Filtro por Valor Máximo */}
                  <div className="space-y-2">
                    <Label htmlFor="filtro-valor-max">Valor Máximo (R$)</Label>
                    <Input
                      id="filtro-valor-max"
                      type="number"
                      placeholder="999.99"
                      value={filtros.valorMax}
                      onChange={(e) => setFiltros(prev => ({ ...prev, valorMax: e.target.value }))}
                    />
                  </div>

                  {/* Filtro por Percentual Mínimo */}
                  <div className="space-y-2">
                    <Label htmlFor="filtro-percentual-min">Taxa de Uso Mínima (%)</Label>
                    <Input
                      id="filtro-percentual-min"
                      type="number"
                      placeholder="0"
                      min="0"
                      max="100"
                      value={filtros.percentualMin}
                      onChange={(e) => setFiltros(prev => ({ ...prev, percentualMin: e.target.value }))}
                    />
                  </div>

                  {/* Filtro por Percentual Máximo */}
                  <div className="space-y-2">
                    <Label htmlFor="filtro-percentual-max">Taxa de Uso Máxima (%)</Label>
                    <Input
                      id="filtro-percentual-max"
                      type="number"
                      placeholder="100"
                      min="0"
                      max="100"
                      value={filtros.percentualMax}
                      onChange={(e) => setFiltros(prev => ({ ...prev, percentualMax: e.target.value }))}
                    />
                  </div>

                  {/* Filtros Booleanos */}
                  <div className="space-y-3">
                    <Label>Filtros Específicos</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="apenas-com-estoque"
                          checked={filtros.apenasComEstoque}
                          onCheckedChange={(checked) => {
                            console.log("Apenas com estoque:", checked)
                            setFiltros(prev => ({
                              ...prev,
                              apenasComEstoque: checked as boolean,
                              apenasSemEstoque: false,
                              apenasEstoqueBaixo: false
                            }))
                          }}
                        />
                        <Label htmlFor="apenas-com-estoque" className="text-sm">Apenas com estoque</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="apenas-sem-estoque"
                          checked={filtros.apenasSemEstoque}
                          onCheckedChange={(checked) => {
                            console.log("Apenas sem estoque:", checked)
                            setFiltros(prev => ({
                              ...prev,
                              apenasSemEstoque: checked as boolean,
                              apenasComEstoque: false,
                              apenasEstoqueBaixo: false
                            }))
                          }}
                        />
                        <Label htmlFor="apenas-sem-estoque" className="text-sm">Apenas sem estoque</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="apenas-estoque-baixo"
                          checked={filtros.apenasEstoqueBaixo}
                          onCheckedChange={(checked) => {
                            console.log("Estoque baixo:", checked)
                            setFiltros(prev => ({
                              ...prev,
                              apenasEstoqueBaixo: checked as boolean,
                              apenasComEstoque: false,
                              apenasSemEstoque: false
                            }))
                          }}
                        />
                        <Label htmlFor="apenas-estoque-baixo" className="text-sm">Estoque baixo (&lt; 10 ativos)</Label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Resumo dos Filtros */}
                {filtrosAtivos && (
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">
                      Resultados filtrados: <span className="font-medium text-foreground">{produtosFiltrados.length}</span> produtos
                      {produtosEstoque.length !== produtosFiltrados.length && (
                        <span className="text-xs text-blue-600 ml-2">
                          (de {produtosEstoque.length} total)
                        </span>
                      )}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {filtros.produto && (
                        <Badge variant="secondary" className="text-xs">
                          Produto: {filtros.produto}
                        </Badge>
                      )}
                      {filtros.categoria && (
                        <Badge variant="secondary" className="text-xs">
                          Categoria: {filtros.categoria}
                        </Badge>
                      )}
                      {filtros.status && (
                        <Badge variant="secondary" className="text-xs">
                          Status: {filtros.status === "resgatado" ? "Com códigos resgatados" :
                            filtros.status === "ativo" ? "Com códigos ativos" :
                              "Sem estoque"}
                        </Badge>
                      )}
                      {(filtros.valorMin || filtros.valorMax) && (
                        <Badge variant="secondary" className="text-xs">
                          Valor: R$ {filtros.valorMin || "0"} - R$ {filtros.valorMax || "∞"}
                        </Badge>
                      )}
                      {(filtros.percentualMin || filtros.percentualMax) && (
                        <Badge variant="secondary" className="text-xs">
                          Taxa: {filtros.percentualMin || "0"}% - {filtros.percentualMax || "100"}%
                        </Badge>
                      )}
                      {filtros.apenasComEstoque && (
                        <Badge variant="secondary" className="text-xs">
                          Apenas com estoque
                        </Badge>
                      )}
                      {filtros.apenasSemEstoque && (
                        <Badge variant="secondary" className="text-xs">
                          Apenas sem estoque
                        </Badge>
                      )}
                      {filtros.apenasEstoqueBaixo && (
                        <Badge variant="secondary" className="text-xs">
                          Estoque baixo
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* KPI Cards Gerais */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
        variants={containerVariants}
      >
        {loading ? (
          <>
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </>
        ) : (
          <>
            <motion.div variants={itemVariants}>
              <Card className="overflow-hidden border-border bg-card/50 backdrop-blur-sm transition-all hover:bg-card/80">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">TOTAL DE CÓDIGOS</CardTitle>
                    <Code className="h-4 w-4 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline justify-between">
                    <div className="text-2xl font-bold">{totalCodigos}</div>
                    <Badge variant="outline" className="text-xs">
                      Todos os códigos
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Códigos disponíveis no sistema
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="overflow-hidden border-border bg-card/50 backdrop-blur-sm transition-all hover:bg-card/80">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">CÓDIGOS RESGATADOS</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline justify-between">
                    <div className="text-2xl font-bold">{codigosResgatados}</div>
                    <Badge variant="outline" className="text-xs text-green-500 bg-green-500/10">
                      {percentageResgatados.toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="mt-2 h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${percentageResgatados}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="overflow-hidden border-border bg-card/50 backdrop-blur-sm transition-all hover:bg-card/80">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">CÓDIGOS ATIVOS</CardTitle>
                    <Binary className="h-4 w-4 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline justify-between">
                    <div className="text-2xl font-bold">{codigosPendentes}</div>
                    <Badge variant="outline" className="text-xs">
                      {totalCodigos > 0 ? (100 - percentageResgatados).toFixed(1) : "0"}%
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Códigos disponíveis para uso
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="overflow-hidden border-border bg-card/50 backdrop-blur-sm transition-all hover:bg-card/80">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">PRODUTOS ATIVOS</CardTitle>
                    <Package className="h-4 w-4 text-blue-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline justify-between">
                    <div className="text-2xl font-bold">{produtosComEstoque.length}</div>
                    <Badge variant="outline" className="text-xs text-blue-500 bg-blue-500/10">
                      Com estoque
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Produtos com códigos disponíveis
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </motion.div>

      {/* KPIs Detalhados por Produto */}
      {!loading && produtosComEstoque.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden border-border bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Estoque Detalhado por Produto
                {filtrosAtivos && (
                  <Badge variant="secondary" className="ml-2">
                    {produtosComEstoque.length} resultados
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {produtosParaMostrar.map((produto) => (
                  <motion.div
                    key={produto.id}
                    variants={itemVariants}
                    className="p-4 rounded-lg border bg-background/50 hover:bg-background/80 transition-all group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm truncate" title={produto.nome}>
                          {produto.nome}
                        </h4>
                        <p className="text-xs text-muted-foreground">{produto.categoria}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <Badge variant="outline" className="text-xs">
                          R$ {produto.valor.toFixed(2)}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => abrirModalDetalhes(produto)}
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Ver estoque detalhado"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span>Total:</span>
                        <span className="font-medium">{produto.totalCodigos}</span>
                      </div>

                      <div className="flex justify-between text-xs">
                        <span className="text-green-600">Resgatados:</span>
                        <span className="font-medium text-green-600">{produto.codigosResgatados}</span>
                      </div>

                      <div className="flex justify-between text-xs">
                        <span className="text-orange-600">Ativos:</span>
                        <span className="font-medium text-orange-600">{produto.codigosPendentes}</span>
                      </div>

                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Taxa de uso:</span>
                          <span className="font-medium">{produto.percentualResgatado.toFixed(1)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full"
                            style={{ width: `${produto.percentualResgatado}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Botão Ver Estoque Detalhado */}
                    <div className="mt-3 pt-2 border-t border-border/50">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => abrirModalDetalhes(produto)}
                        className="w-full text-xs h-7"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Ver Estoque Detalhado
                        <ChevronRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Botão Expandir/Recolher */}
              {produtosComEstoque.length > 6 && (
                <div className="mt-6 text-center">
                  <Button
                    variant="outline"
                    onClick={() => setProdutosExpandidos(!produtosExpandidos)}
                    className="flex items-center gap-2"
                  >
                    {produtosExpandidos ? (
                      <>
                        <ChevronUp className="h-4 w-4" />
                        Mostrar Menos
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4" />
                        Ver Mais Produtos ({produtosComEstoque.length - 6})
                      </>
                    )}
                  </Button>
                  <p className="text-sm text-muted-foreground mt-2">
                    {produtosExpandidos
                      ? `Mostrando todos os ${produtosComEstoque.length} produtos`
                      : `Mostrando 6 de ${produtosComEstoque.length} produtos com estoque`
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Alertas de Estoque */}
      {!loading && (
        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden border-border bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Alertas de Estoque
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {produtoComMaisEstoque && (
                  <div className="p-4 rounded-lg border bg-green-50/50 border-green-200">
                    <h4 className="font-semibold text-sm text-green-800 mb-2">Maior Estoque</h4>
                    <p className="text-sm text-green-700">{produtoComMaisEstoque.nome}</p>
                    <p className="text-xs text-green-600 mt-1">
                      {produtoComMaisEstoque.totalCodigos} códigos disponíveis
                    </p>
                  </div>
                )}

                {produtoComMenosEstoque && produtoComMenosEstoque.codigosPendentes < 10 && (
                  <div className="p-4 rounded-lg border bg-orange-50/50 border-orange-200">
                    <h4 className="font-semibold text-sm text-orange-800 mb-2">Estoque Baixo</h4>
                    <p className="text-sm text-orange-700">{produtoComMenosEstoque.nome}</p>
                    <p className="text-xs text-orange-600 mt-1">
                      Apenas {produtoComMenosEstoque.codigosPendentes} códigos ativos
                    </p>
                  </div>
                )}

                {produtosSemEstoque.length > 0 && (
                  <div className="p-4 rounded-lg border bg-red-50/50 border-red-200">
                    <h4 className="font-semibold text-sm text-red-800 mb-2">Produtos Sem Estoque</h4>
                    <p className="text-sm text-red-700">{produtosSemEstoque.length} produtos</p>
                    <p className="text-xs text-red-600 mt-1">
                      Necessitam de códigos
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* DataTable */}
      <motion.div variants={itemVariants} className="rounded-lg border border-border bg-card/50 backdrop-blur-sm overflow-hidden">
        {loading ? (
          <div className="p-8 flex flex-col items-center justify-center">
            <Skeleton className="h-8 w-8 rounded-full mb-4" />
            <Skeleton className="h-4 w-48 mb-2" />
            <Skeleton className="h-3 w-32" />
          </div>
        ) : (
          <DataTableCodigos data={data} />
        )}
      </motion.div>

      {/* Modal de Detalhes do Produto */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Detalhes do Estoque - {produtoSelecionado?.nome}
            </DialogTitle>
          </DialogHeader>

          {produtoSelecionado && (
            <div className="space-y-4">
              {/* Informações do Produto */}
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Categoria</p>
                      <p className="font-medium">{produtoSelecionado.categoria}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Valor</p>
                      <p className="font-medium">R$ {produtoSelecionado.valor.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total de Códigos</p>
                      <p className="font-medium">{produtoSelecionado.totalCodigos}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Taxa de Uso</p>
                      <p className="font-medium">{produtoSelecionado.percentualResgatado.toFixed(1)}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Filtros do Modal */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Label htmlFor="busca-codigo" className="text-sm">Buscar Código</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="busca-codigo"
                      placeholder="Digite o código..."
                      value={buscaCodigo}
                      onChange={(e) => setBuscaCodigo(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="sm:w-48">
                  <Label htmlFor="filtro-status-codigo" className="text-sm">Status</Label>
                  <div className="flex gap-2">
                    <Select value={filtroStatusCodigo} onValueChange={setFiltroStatusCodigo}>
                      <SelectTrigger id="filtro-status-codigo" className="flex-1">
                        <SelectValue placeholder="Todos os status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="resgatado">Resgatado</SelectItem>
                        <SelectItem value="ativo">Ativo</SelectItem>
                      </SelectContent>
                    </Select>
                    {filtroStatusCodigo && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setFiltroStatusCodigo("")}
                        className="px-2"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Lista de Códigos */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted/50 p-3 border-b">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      Códigos ({codigosFiltrados.length} de {codigosProduto.length})
                    </p>
                    <div className="flex gap-2 text-xs">
                      <Badge variant="outline" className="text-green-600 bg-green-50">
                        {codigosProduto.filter(c => c.status.toLowerCase() === "resgatado").length} Resgatados
                      </Badge>
                      <Badge variant="outline" className="text-orange-600 bg-orange-50">
                        {codigosProduto.filter(c => c.status.toLowerCase() === "ativo").length} Ativos
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {carregandoCodigos ? (
                    <div className="p-8 flex flex-col items-center justify-center">
                      <Skeleton className="h-8 w-8 rounded-full mb-4" />
                      <Skeleton className="h-4 w-48 mb-2" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  ) : codigosFiltrados.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <Code className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum código encontrado</p>
                      {buscaCodigo || filtroStatusCodigo ? (
                        <p className="text-sm">Tente ajustar os filtros</p>
                      ) : (
                        <p className="text-sm">Este produto não possui códigos ativos</p>
                      )}
                    </div>
                  ) : (
                    <div className="divide-y">
                      {codigosFiltrados.map((codigo) => (
                        <div
                          key={codigo.id_codigo}
                          className="p-4 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                                  {codigo.codigo}
                                </code>
                                <Badge
                                  variant={codigo.status.toLowerCase() === "resgatado" ? "default" : "secondary"}
                                  className={`text-xs ${codigo.status.toLowerCase() === "resgatado"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-orange-100 text-orange-800"
                                    }`}
                                >
                                  {codigo.status.toLowerCase() === "resgatado" ? "Resgatado" : "Ativo"}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                ID: {codigo.id_codigo}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copiarCodigo(codigo.codigo)}
                                className="h-8 w-8 p-0"
                                title="Copiar código"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Ações */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setModalAberto(false)}
                >
                  Fechar
                </Button>
                <Button
                  onClick={() => {
                    // Exportar códigos pendentes
                    const codigosPendentes = codigosProduto
                      .filter(c => c.status.toLowerCase() === "ativo")
                      .map(c => c.codigo)
                      .join("\n")

                    if (codigosPendentes) {
                      navigator.clipboard.writeText(codigosPendentes)
                      toast.success(`${codigosProduto.filter(c => c.status.toLowerCase() === "ativo").length} códigos ativos copiados!`)
                    } else {
                      toast.info("Não há códigos ativos para copiar")
                    }
                  }}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar Códigos Ativos
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
