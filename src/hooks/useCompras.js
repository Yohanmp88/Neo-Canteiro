'use client'

import { useEffect, useState } from 'react'
import { compraService } from '@/services/compraService'

export function useCompras(obraId) {
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let ativo = true

    const carregar = async () => {
      if (!obraId || String(obraId).startsWith('demo')) {
        setPedidos([])
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const data = await compraService.listarPorObra(obraId)
        if (ativo) setPedidos(data || [])
      } catch (err) {
        if (ativo) {
          setPedidos([])
          setError(err?.message || 'Não foi possível carregar os pedidos de compra.')
        }
      } finally {
        if (ativo) setLoading(false)
      }
    }

    carregar()

    return () => {
      ativo = false
    }
  }, [obraId])

  return { pedidos, loading, error }
}
