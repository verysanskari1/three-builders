import { notFound } from 'next/navigation'
import { getState } from '@/lib/kv'
import ContestantDashboard from '@/components/contestant/ContestantDashboard'
import { ContestantId } from '@/lib/types'
import { getSeedState } from '@/lib/seed'

export const dynamic = 'force-dynamic'

const VALID_IDS: ContestantId[] = ['vibe', 'junior', 'senior']

interface Props {
  params: { id: string }
}

export default async function ContestantPage({ params }: Props) {
  if (!VALID_IDS.includes(params.id as ContestantId)) {
    notFound()
  }
  let state
  try {
    state = await getState()
  } catch {
    state = getSeedState()
  }
  return <ContestantDashboard id={params.id as ContestantId} initialState={state} />
}
