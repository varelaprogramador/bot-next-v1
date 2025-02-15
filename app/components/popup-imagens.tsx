import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { Eye, Trash2, Upload } from "lucide-react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { set } from "date-fns";

export interface FileObject {
  name: string;
  size: number;
  type: string;
  url: string;
  qtd: number; // Número de itens para pastas
}

interface GaleriaPopupProps {
  defaultValue: string;
  sendData: (url: string) => void; // Função para enviar a URL da imagem selecionada
  onClose: () => void; // Função para fechar o popup
}

const GaleriaPopup: React.FC<GaleriaPopupProps> = ({
  sendData,
  onClose,
  defaultValue,
}) => {
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

  // Configurar o arquivo selecionado baseado no `defaultValue`
  useEffect(() => {
    fetchFiles();
  }, []);

  // Configurar o estado de `selectedFile` no primeiro carregamento de arquivos
  useEffect(() => {
    if (defaultValue && files.length) {
      const file = files.find((file) => file.url === defaultValue);
      if (file) {
        setSelectedFile(file); // Seleciona automaticamente o arquivo com a URL padrão
      }
    }
  }, [files, defaultValue]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin">Carregando...</div>
      </div>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => setOpen(!isOpen)}>
      <DialogTrigger asChild>
        <Button>Selecionar Imagem</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Galeria</DialogTitle>
          <DialogDescription>
            Escolha a logo desejada ou faça upload.
          </DialogDescription>
        </DialogHeader>
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
          <div className="grid gap-4 grid-cols-1 mt-6">
            {files.map((file) => (
              <Card
                key={file.name}
                className={`p-4 max-w-sm truncate ${
                  selectedFile?.name === file.name
                    ? "border border-blue-500"
                    : ""
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
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{file.name}</h3>
                      <p className="text-sm text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <div className="flex gap-2">
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
        <DialogFooter>
          {/* Botão "Prosseguir" */}
          {selectedFile && (
            <div className="mt-6">
              <Button onClick={handleProceed}>Prosseguir</Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GaleriaPopup;
