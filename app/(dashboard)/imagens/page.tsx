"use client";

import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";

import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@clerk/nextjs";
import { Dialog, DialogTrigger } from "@radix-ui/react-dialog";
import { Download, Folder, Loader2, Trash2, Upload, Eye } from "lucide-react";
import Image from "next/image";
import { ChangeEvent, useEffect, useState } from "react";

export interface FileObject {
  name: string;
  size: number;
  type: string;
  url: string;
  qtd: number; // Número de itens para pastas
}

export default function GaleriaPage() {
  const [files, setFiles] = useState<FileObject[]>([]); // Estado para os arquivos
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isOpen, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileObject | null>(null); // Apenas 1 arquivo selecionado
  const [nomeFile, setNomeFile] = useState<string | null>("");

  const supabase = createClient();

  // Função para verificar se o tipo do arquivo é imagem
  const isImageFile = (type: string) => type === "image";

  // Função para carregar os arquivos
  const fetchFiles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.storage.from("galeria").list("");

      if (error) {
        console.error("Erro ao listar arquivos:", error);
      } else {
        console.log("Dados dos arquivos:", data);
      }

      if (data) {
        const filesWithUrls = await Promise.all(
          data.map(async (file) => {
            const {
              data: { publicUrl },
            } = supabase.storage.from("galeria").getPublicUrl(`/${file.name}`);

            return {
              name: file.name,
              size: file.metadata?.size || 0,
              type: file.metadata?.mimetype || "unknown",
              url: publicUrl,
              qtd: 0,
            };
          })
        );
        setFiles(filesWithUrls);
      }
    } catch (error) {
      console.error("Error fetching files:", error);
    } finally {
      setLoading(false);
    }
  };

  // Função de upload de arquivos
  const uploadFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;

    try {
      setUploading(true);
      const file = event.target.files[0];
      const { error } = await supabase.storage
        .from("galeria")
        .upload(`/${file.name}`, file);
      if (error) throw error;

      // Recarregar os arquivos após o upload
      await fetchFiles();
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setUploading(false);
    }
  };

  const deleteFile = async (fileName: string) => {
    try {
      const { error } = await supabase.storage
        .from("galeria")
        .remove([`/${fileName}`]);

      if (error) throw error;

      await fetchFiles();
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  };

  // Função para selecionar apenas 1 imagem
  const handleSelectImage = (file: FileObject) => {
    setSelectedFile(file); // Seleciona a imagem
  };

  // Função para continuar após selecionar uma imagem
  const handleProceed = () => {
    setOpen(false);
    sendData(selectedFile?.url as string);
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-h-[500px] overflow-y-auto">
      {/* Formulário de Upload */}
      <Card className="p-4 mb-6">
        <div className="flex gap-4 mt-2">
          <Input
            id="file-upload"
            type="file"
            onChange={uploadFile}
            accept=".pdf,.png,.jpg,.jpeg"
            disabled={uploading}
          />
          <Button
            onClick={() => uploadFile(nomeFile as any)}
            className={`${
              uploading ? "opacity-50 cursor-not-allowed animate-pulse" : ""
            }`}
            disabled={uploading}
          >
            {uploading ? (
              <Upload className="h-4 w-4 animate-pulse" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
          </Button>
        </div>
      </Card>

      {/* Exibindo Arquivos */}
      <div className="grid gap-4  grid-cols-2 t-6">
        {files.map((file) => (
          <Card
            key={file.name}
            className={`p-4 max-w-sm truncate ${
              selectedFile?.name === file.name ? "border border-blue-500" : ""
            }`}
            onClick={() => handleSelectImage(file)} // Seleciona o arquivo
          >
            <div className="flex flex-col gap-2">
              {isImageFile(file.type) && (
                <div className="relative w-full h-48">
                  <Image
                    src={file.url}
                    alt={file.name}
                    fill
                    className="object-contain rounded-lg"
                  />
                </div>
              )}
              <div className="flex justify-between items-start relative">
                <div>
                  <h3 className="font-medium ">{file.name}</h3>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <div className="flex gap-2 absolute right-0">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => window.open(file.url, "_blank")}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => deleteFile(file.name)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
