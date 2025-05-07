"use client"

import { Search, X, Loader2 } from "lucide-react"
import { Input } from "./ui/input"
import { useEffect, useState, useRef } from "react"
import { Button } from "./ui/button"
import { createClientSupabaseClient } from "@/lib/supabase/client"
import Image from "next/image"
import Link from "next/link"
import type { ProdutosProps } from "../utils/produto"
import { motion, AnimatePresence } from "framer-motion"
import { useOnClickOutside } from "@/hooks/use-click-outside"

const InputSearch = () => {
  const supabase = createClientSupabaseClient()
  const [filter, setFilter] = useState<string>("")
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState<boolean>(true)
  const [produtos, setProdutos] = useState<ProdutosProps[]>([])
  const [filteredProdutos, setFilteredProdutos] = useState<ProdutosProps[]>([])
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Close search when clicking outside
  useOnClickOutside(searchRef, () => {
    if (open) setOpen(false)
  })

  // Handle escape key press
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        setOpen(false)
      }
    }

    window.addEventListener("keydown", handleEscKey)
    return () => window.removeEventListener("keydown", handleEscKey)
  }, [open])

  // Focus input when modal opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [open])

  useEffect(() => {
    const fetchProduto = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase.from("produtos").select("*")

        if (error) {
          console.error("Erro ao carregar produto:", error)
          return
        }

        setProdutos(data as ProdutosProps[])
      } catch (error) {
        console.error("Erro na requisição:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProduto()
  }, [supabase])

  useEffect(() => {
    // Filter products based on the search input
    if (filter) {
      const filtered = produtos.filter((produto) => produto.nome.toLowerCase().includes(filter.toLowerCase()))
      setFilteredProdutos(filtered)
    } else {
      setFilteredProdutos([]) // Show empty state when filter is empty
    }
  }, [filter, produtos])

  const handleOpenSearch = () => {
    setOpen(true)
  }

  const handleCloseSearch = () => {
    setOpen(false)
  }

  return (
    <>
      <div className="relative w-full max-w-xs">
        <div className="relative group">
          <Input
            placeholder="O que você procura?"
            className="pl-10 bg-white transition-all duration-200 border-gray-300 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:ring-primary"
            onClick={handleOpenSearch}
            readOnly
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-16 sm:pt-24 px-4"
          >
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden"
              ref={searchRef}
            >
              <div className="sticky top-0 z-10 bg-white border-b">
                <div className="relative">
                  <Input
                    ref={inputRef}
                    value={filter}
                    placeholder="O que você procura?"
                    className="pl-10 pr-10 py-6 text-lg border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    onChange={(e) => setFilter(e.target.value)}
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  {filter && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                      onClick={() => setFilter("")}
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Limpar busca</span>
                    </Button>
                  )}
                </div>
              </div>

              <div className="max-h-[60vh] overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2 text-gray-600">Carregando produtos...</span>
                  </div>
                ) : filter === "" ? (
                  <div className="p-8 text-center">
                    <Search className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">Digite algo para buscar produtos</p>
                  </div>
                ) : filteredProdutos.length === 0 ? (
                  <div className="p-8 text-center">
                    <X className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">Nenhum produto encontrado para &quot;{filter}&quot;</p>
                    <p className="text-sm text-gray-400 mt-1">Tente buscar com outras palavras</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredProdutos.map((produto) => (
                      <Link
                        key={produto.id + "- link"}
                        href={`/checkout/info/${produto.id}`}
                        onClick={handleCloseSearch}
                        className="block transition-colors hover:bg-gray-50"
                      >
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.2 }}
                          key={produto.id}
                          className="p-4 flex items-center"
                        >
                          <div className="relative w-20 h-20 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                            <Image
                              src={produto.url_image || "/placeholder.svg?height=80&width=80&query=product"}
                              alt={produto.nome}
                              fill
                              sizes="80px"
                              className="object-cover"
                            />
                          </div>
                          <div className="ml-4 flex-1 min-w-0">
                            <div className="flex items-baseline">
                              <h3 className="font-medium text-gray-900 truncate">{produto.nome}</h3>
                              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                                {produto.categoria}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-gray-500 line-clamp-2">{produto.descricao}</p>
                          </div>
                        </motion.div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div className="sticky bottom-0 bg-white border-t p-3 flex justify-end">
                <Button variant="outline" size="sm" onClick={handleCloseSearch} className="text-sm">
                  Fechar
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default InputSearch
