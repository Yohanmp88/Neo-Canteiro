'use client'

import { EmptyState } from '@/components/ui/EmptyState'

export function UnderConstructionView({ title }) {
  return (
    <div className="py-10">
      <EmptyState 
        icon="🚧"
        title={`${title} em construção`}
        description="Esta tela está sendo conectada aos dados reais do Supabase na Fase 1 da refatoração Premium SaaS. Estará disponível em breve."
      />
    </div>
  )
}
