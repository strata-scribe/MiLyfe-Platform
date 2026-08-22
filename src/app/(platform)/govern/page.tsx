'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/store/app-store'
import { cn } from '@/lib/utils/cn'
import { toast } from 'sonner'

type Tab = 'proposals' | 'vote' | 'delegates' | 'history' | 'create'

interface Proposal {
  id: string
  title: string
  category: 'budget' | 'policy' | 'community' | 'infrastructure'
  description: string
  deadline: string
  votesFor: number
  votesAgainst: number
  votesAbstain: number
  discussionCount: number
  status: 'active' | 'passed' | 'rejected' | 'pending'
  author: string
  budgetImpact?: string
}

interface Delegate {
  id: string
  name: string
  trustScore: number
  delegatedVotes: number
  categories: string[]
  votingRecord: number
}

interface VoteRecord {
  id: string
  proposalTitle: string
  result: 'passed' | 'rejected'
  participationRate: number
  yourVote?: 'for' | 'against' | 'abstain'
  date: string
}

export default function GovernPage() {
  const [activeTab, setActiveTab] = useState<Tab>('proposals')
  const [loading, setLoading] = useState(true)
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [delegates, setDelegates] = useState<Delegate[]>([])
  const [history, setHistory] = useState<VoteRecord[]>([])
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null)
  const [createForm, setCreateForm] = useState({ title: '', category: 'community', description: '', budgetImpact: '', timeline: '' })
  const supabase = createClient()
  const { user } = useAppStore()

  const tabs: { key: Tab; label: string }[] = [
    { key: 'proposals', label: 'Proposals' },
    { key: 'vote', label: 'Vote' },
    { key: 'delegates', label: 'Delegates' },
    { key: 'history', label: 'History' },
    { key: 'create', label: 'Create' },
  ]

  useEffect(() => {
    loadGovernanceData()
  }, [])

  async function loadGovernanceData() {
    setLoading(true)
    try {
      setProposals([
        { id: '1', title: 'Expand Community Garden to Eastside', category: 'community', description: 'Proposal to allocate 500 $MLY for establishing a new community garden on the vacant lot at Eastside Park.', deadline: '2024-02-01', votesFor: 142, votesAgainst: 23, votesAbstain: 15, discussionCount: 47, status: 'active', author: 'Maria Santos', budgetImpact: '500 $MLY' },
        { id: '2', title: 'New Street Lighting on MLK Blvd', category: 'infrastructure', description: 'Install solar-powered street lights along MLK Boulevard to improve pedestrian safety during nighttime hours.', deadline: '2024-01-28', votesFor: 198, votesAgainst: 12, votesAbstain: 8, discussionCount: 31, status: 'active', author: 'Council Rep. Davis', budgetImpact: '2,400 $MLY' },
        { id: '3', title: 'Youth Mentorship Program Funding', category: 'budget', description: 'Allocate monthly budget of 300 $MLY for youth mentorship pairing and activity funding.', deadline: '2024-02-15', votesFor: 89, votesAgainst: 34, votesAbstain: 22, discussionCount: 63, status: 'active', author: 'DeShawn Moore', budgetImpact: '300 $MLY/month' },
        { id: '4', title: 'Noise Ordinance Update for Events', category: 'policy', description: 'Update community noise guidelines: events must end by 10 PM on weekdays, 11 PM on weekends.', deadline: '2024-01-20', votesFor: 67, votesAgainst: 88, votesAbstain: 45, discussionCount: 112, status: 'active', author: 'Noise Committee' },
      ])
      setDelegates([
        { id: '1', name: 'Councilwoman Maria Santos', trustScore: 94, delegatedVotes: 56, categories: ['community', 'budget'], votingRecord: 98 },
        { id: '2', name: 'DeShawn Moore', trustScore: 89, delegatedVotes: 34, categories: ['policy', 'community'], votingRecord: 92 },
        { id: '3', name: 'Dr. Patricia Chen', trustScore: 91, delegatedVotes: 28, categories: ['infrastructure', 'budget'], votingRecord: 95 },
      ])
      setHistory([
        { id: '1', proposalTitle: 'Free WiFi in Public Parks', result: 'passed', participationRate: 72, yourVote: 'for', date: '2024-01-10' },
        { id: '2', proposalTitle: 'Reduce Speed Limit on School St', result: 'passed', participationRate: 68, yourVote: 'for', date: '2024-01-05' },
        { id: '3', proposalTitle: 'Remove Bench from Elm Square', result: 'rejected', participationRate: 81, yourVote: 'against', date: '2023-12-28' },
      ])
    } finally {
      setLoading(false)
    }
  }

  function handleVote(proposalId: string, vote: 'for' | 'against' | 'abstain') {
    setProposals(prev => prev.map(p => {
      if (p.id === proposalId) {
        return { ...p, votesFor: p.votesFor + (vote === 'for' ? 1 : 0), votesAgainst: p.votesAgainst + (vote === 'against' ? 1 : 0), votesAbstain: p.votesAbstain + (vote === 'abstain' ? 1 : 0) }
      }
      return p
    }))
    toast.success(`Vote recorded: ${vote}`)
  }

  function handleCreateProposal() {
    if (!createForm.title || !createForm.description) {
      toast.error('Please fill in title and description')
      return
    }
    toast.success('Proposal submitted for community review!')
    setCreateForm({ title: '', category: 'community', description: '', budgetImpact: '', timeline: '' })
  }

  const categoryColor = (cat: string) => {
    switch (cat) {
      case 'budget': return 'bg-mly-100 text-mly-700'
      case 'policy': return 'bg-purple-100 text-purple-700'
      case 'community': return 'bg-teal-100 text-teal-700'
      case 'infrastructure': return 'bg-harbor-100 text-harbor-700'
      default: return 'bg-harbor-100 text-harbor-600'
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="skeleton h-10 w-64 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-48 rounded-xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-harbor-900">Governance & Voting</h1>
          <p className="text-harbor-500 mt-1">Shape community decisions with your voice</p>
        </div>
        <Link href="/dashboard" className="btn-teal px-4 py-2 rounded-lg text-sm">Back to Dashboard</Link>
      </div>

      <nav className="flex gap-1 bg-harbor-100 p-1 rounded-xl overflow-x-auto">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={cn('px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all', activeTab === tab.key ? 'bg-teal-600 text-white shadow-sm' : 'text-harbor-600 hover:bg-harbor-200')}>
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === 'proposals' && (
        <div className="space-y-4">
          {proposals.map(proposal => (
            <div key={proposal.id} className="card p-5 rounded-xl cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setSelectedProposal(proposal); setActiveTab('vote') }}>
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-harbor-800">{proposal.title}</h3>
                <span className={cn('px-2 py-0.5 rounded text-xs font-medium', categoryColor(proposal.category))}>{proposal.category}</span>
              </div>
              <p className="text-sm text-harbor-500 mb-3 line-clamp-2">{proposal.description}</p>
              <div className="flex items-center gap-4 text-xs text-harbor-500">
                <span>Deadline: {proposal.deadline}</span>
                <span>{proposal.discussionCount} discussions</span>
                <span className="text-teal-600 font-medium">{proposal.votesFor} for</span>
                <span className="text-red-500">{proposal.votesAgainst} against</span>
              </div>
              {proposal.budgetImpact && <p className="text-xs text-mly-600 mt-2 font-medium">Budget Impact: {proposal.budgetImpact}</p>}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'vote' && (
        <div className="space-y-4">
          {selectedProposal ? (
            <div className="card p-6 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <span className={cn('px-2 py-0.5 rounded text-xs font-medium', categoryColor(selectedProposal.category))}>{selectedProposal.category}</span>
                <span className="text-xs text-harbor-400">by {selectedProposal.author}</span>
              </div>
              <h2 className="text-xl font-bold text-harbor-900 mb-3">{selectedProposal.title}</h2>
              <p className="text-harbor-600 mb-4">{selectedProposal.description}</p>
              <div className="bg-harbor-50 p-4 rounded-lg mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-teal-600 font-medium">For: {selectedProposal.votesFor}</span>
                  <span className="text-red-500 font-medium">Against: {selectedProposal.votesAgainst}</span>
                  <span className="text-harbor-500">Abstain: {selectedProposal.votesAbstain}</span>
                </div>
                <div className="w-full h-3 bg-harbor-200 rounded-full overflow-hidden flex">
                  <div className="bg-teal-500 h-full" style={{ width: `${(selectedProposal.votesFor / (selectedProposal.votesFor + selectedProposal.votesAgainst + selectedProposal.votesAbstain)) * 100}%` }} />
                  <div className="bg-red-400 h-full" style={{ width: `${(selectedProposal.votesAgainst / (selectedProposal.votesFor + selectedProposal.votesAgainst + selectedProposal.votesAbstain)) * 100}%` }} />
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => handleVote(selectedProposal.id, 'for')} className="btn-teal px-4 py-2 rounded-lg text-sm flex-1">Vote For</button>
                <button onClick={() => handleVote(selectedProposal.id, 'against')} className="px-4 py-2 rounded-lg text-sm flex-1 bg-red-100 text-red-700 hover:bg-red-200 transition-colors">Vote Against</button>
                <button onClick={() => handleVote(selectedProposal.id, 'abstain')} className="px-4 py-2 rounded-lg text-sm flex-1 bg-harbor-100 text-harbor-600 hover:bg-harbor-200 transition-colors">Abstain</button>
              </div>
            </div>
          ) : (
            <div className="card p-8 rounded-xl text-center">
              <p className="text-harbor-500">Select a proposal from the Proposals tab to vote</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'delegates' && (
        <div className="space-y-4">
          <div className="card p-5 rounded-xl bg-teal-50 border border-teal-100">
            <h3 className="font-semibold text-teal-800 mb-1">Delegation Dashboard</h3>
            <p className="text-sm text-teal-600">Delegate your vote to trusted community members when you can&apos;t participate directly.</p>
          </div>
          {delegates.map(delegate => (
            <div key={delegate.id} className="card p-5 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold">{delegate.name[0]}</div>
                  <div>
                    <p className="font-semibold text-harbor-800">{delegate.name}</p>
                    <p className="text-xs text-harbor-500">Trust Score: {delegate.trustScore}% | Voting Record: {delegate.votingRecord}%</p>
                  </div>
                </div>
                <button className="btn-teal px-3 py-1.5 rounded-lg text-xs">Delegate</button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-harbor-500">{delegate.delegatedVotes} votes delegated</span>
                <span className="text-harbor-300">|</span>
                {delegate.categories.map(cat => (
                  <span key={cat} className={cn('px-2 py-0.5 rounded text-xs', categoryColor(cat))}>{cat}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-harbor-800">Voting History</h2>
          {history.map(record => (
            <div key={record.id} className="card p-4 rounded-xl flex items-center justify-between">
              <div>
                <p className="font-medium text-harbor-800">{record.proposalTitle}</p>
                <p className="text-sm text-harbor-500">{record.date} | Participation: {record.participationRate}%</p>
              </div>
              <div className="flex items-center gap-2">
                {record.yourVote && <span className={cn('px-2 py-0.5 rounded text-xs font-medium', record.yourVote === 'for' ? 'bg-teal-100 text-teal-700' : record.yourVote === 'against' ? 'bg-red-100 text-red-700' : 'bg-harbor-100 text-harbor-600')}>You: {record.yourVote}</span>}
                <span className={cn('px-2 py-0.5 rounded text-xs font-medium', record.result === 'passed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}>{record.result}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'create' && (
        <div className="card p-6 rounded-xl space-y-4">
          <h2 className="text-lg font-semibold text-harbor-800">Create New Proposal</h2>
          <input className="input-field w-full px-4 py-2.5 rounded-lg" placeholder="Proposal title..." value={createForm.title} onChange={e => setCreateForm(p => ({ ...p, title: e.target.value }))} />
          <select className="input-field w-full px-4 py-2.5 rounded-lg" value={createForm.category} onChange={e => setCreateForm(p => ({ ...p, category: e.target.value }))}>
            <option value="community">Community</option>
            <option value="budget">Budget</option>
            <option value="policy">Policy</option>
            <option value="infrastructure">Infrastructure</option>
          </select>
          <textarea className="input-field w-full px-4 py-2.5 rounded-lg min-h-[120px]" placeholder="Describe your proposal in detail..." value={createForm.description} onChange={e => setCreateForm(p => ({ ...p, description: e.target.value }))} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input className="input-field px-4 py-2.5 rounded-lg" placeholder="Budget impact (e.g. 500 $MLY)" value={createForm.budgetImpact} onChange={e => setCreateForm(p => ({ ...p, budgetImpact: e.target.value }))} />
            <input className="input-field px-4 py-2.5 rounded-lg" placeholder="Timeline (e.g. 3 months)" value={createForm.timeline} onChange={e => setCreateForm(p => ({ ...p, timeline: e.target.value }))} />
          </div>
          <button onClick={handleCreateProposal} className="btn-teal w-full py-3 rounded-lg font-medium">Submit Proposal</button>
        </div>
      )}
    </div>
  )
}
