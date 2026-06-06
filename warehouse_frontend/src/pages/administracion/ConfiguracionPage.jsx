import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, X, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import PageHeader from '@/components/layout/PageHeader'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { getConfiguracion, updateConfiguracion } from '@/api/administracion'
import { apiErrorMessage } from '@/lib/formUtils'

export default function ConfiguracionPage() {
  const queryClient = useQueryClient()
  const [editingClave, setEditingClave] = useState(null)
  const [editValue, setEditValue] = useState('')

  const { data: configs = [], isLoading } = useQuery({
    queryKey: ['configuracion'],
    queryFn: async () => {
      const res = await getConfiguracion()
      return res.data.data ?? []
    },
  })

  const saveMutation = useMutation({
    mutationFn: ({ clave, valor }) => updateConfiguracion(clave, valor),
    onSuccess: (res) => {
      toast.success(res.data.message ?? 'Configuración actualizada')
      queryClient.invalidateQueries({ queryKey: ['configuracion'] })
      setEditingClave(null)
      setEditValue('')
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  })

  function startEdit(row) {
    setEditingClave(row.clave)
    setEditValue(row.valor ?? '')
  }

  function cancelEdit() {
    setEditingClave(null)
    setEditValue('')
  }

  function saveEdit(clave) {
    saveMutation.mutate({ clave, valor: editValue })
  }

  if (isLoading) return <LoadingSpinner className="min-h-[300px]" />

  return (
    <div>
      <PageHeader
        title="Configuración"
        description="Parámetros del sistema Warehouse IQ"
      />

      <div className="overflow-x-auto rounded-xl border border-zinc-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Clave</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Valor</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Descripción</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500 w-36">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {configs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-zinc-500">
                  No hay configuraciones registradas.
                </td>
              </tr>
            ) : (
              configs.map((row) => {
                const isEditing = editingClave === row.clave
                return (
                  <tr key={row.clave} className="hover:bg-zinc-50">
                    <td className="px-4 py-3 font-mono text-xs font-medium text-zinc-800">{row.clave}</td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="max-w-xs"
                        />
                      ) : (
                        <span className="text-zinc-700">{row.valor ?? '—'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-500">{row.descripcion || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {isEditing ? (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => saveEdit(row.clave)}
                              loading={saveMutation.isPending}
                              title="Guardar"
                            >
                              <Check size={15} className="text-green-600" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={cancelEdit} title="Cancelar">
                              <X size={15} className="text-red-600" />
                            </Button>
                          </>
                        ) : (
                          <Button variant="ghost" size="icon" onClick={() => startEdit(row)} title="Editar">
                            <Pencil size={15} />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
