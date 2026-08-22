'use client';

import { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';
import { ReadAloudButton } from '@/components/ui/read-aloud-button';

type RightsTab = 'amendments' | 'search' | 'tools';

const amendments = [
  { num: 1, title: 'Freedom of Speech, Religion, Press, Assembly, Petition', text: 'Congress shall make no law respecting an establishment of religion, or prohibiting the free exercise thereof; or abridging the freedom of speech, or of the press; or the right of the people peaceably to assemble, and to petition the Government for a redress of grievances.', plain: 'The government cannot stop you from speaking, publishing, worshipping (or not), gathering peacefully, or demanding they fix something. This protects your posts on MiMedia, your community organizing, your protest rights, and your governance participation.' },
  { num: 2, title: 'Right to Bear Arms', text: 'A well regulated Militia, being necessary to the security of a free State, the right of the people to keep and bear Arms, shall not be infringed.', plain: 'You have the right to own firearms. The exact scope is debated, but the core right is individual.' },
  { num: 3, title: 'Quartering of Soldiers', text: 'No Soldier shall, in time of peace be quartered in any house, without the consent of the Owner, nor in time of war, but in a manner to be prescribed by law.', plain: 'The government cannot force you to house soldiers. This established that your home is yours.' },
  { num: 4, title: 'Search and Seizure', text: 'The right of the people to be secure in their persons, houses, papers, and effects, against unreasonable searches and seizures, shall not be violated, and no Warrants shall issue, but upon probable cause, supported by Oath or affirmation, and particularly describing the place to be searched, and the persons or things to be seized.', plain: 'Police CANNOT search you, your home, your car, your phone, or your belongings without a warrant (signed by a judge, describing exactly what they\'re looking for) OR your voluntary consent. You can say NO to a search. "I do not consent to a search." Those six words are your shield.' },
  { num: 5, title: 'Due Process, Self-Incrimination, Double Jeopardy', text: 'No person shall be held to answer for a capital, or otherwise infamous crime, unless on a presentment or indictment of a Grand Jury; nor shall any person be subject for the same offence to be twice put in jeopardy of life or limb; nor shall be compelled in any criminal case to be a witness against himself, nor be deprived of life, liberty, or property, without due process of law; nor shall private property be taken for public use, without just compensation.', plain: 'You cannot be forced to testify against yourself ("I invoke my 5th Amendment right"). You can\'t be tried twice for the same crime. The government can\'t take your property or freedom without following proper legal process. ALWAYS invoke this during police questioning: "I wish to remain silent. I want a lawyer."' },
  { num: 6, title: 'Right to Speedy Trial, Counsel', text: 'In all criminal prosecutions, the accused shall enjoy the right to a speedy and public trial, by an impartial jury of the State and district wherein the crime shall have been committed, which district shall have been previously ascertained by law, and to be informed of the nature and cause of the accusation; to be confronted with the witnesses against him; to have compulsory process for obtaining witnesses in his favor, and to have the Assistance of Counsel for his defence.', plain: 'If arrested: you get a lawyer (free if you can\'t afford one), a fast trial, a jury, and the right to know what you\'re charged with. Say: "I want a lawyer" and then stop talking completely.' },
  { num: 7, title: 'Right to Jury Trial (Civil)', text: 'In Suits at common law, where the value in controversy shall exceed twenty dollars, the right of trial by jury shall be preserved.', plain: 'You can demand a jury trial in civil disputes over $20 (effectively all of them).' },
  { num: 8, title: 'Cruel and Unusual Punishment, Excessive Bail', text: 'Excessive bail shall not be required, nor excessive fines imposed, nor cruel and unusual punishments inflicted.', plain: 'Bail can\'t be set impossibly high to keep you locked up. Punishments must be proportional to the crime.' },
  { num: 9, title: 'Rights Retained by the People', text: 'The enumeration in the Constitution, of certain rights, shall not be construed to deny or disparage others retained by the people.', plain: 'Just because a right isn\'t listed here doesn\'t mean you don\'t have it. Your rights are NOT limited to what\'s written. Privacy, bodily autonomy, freedom of movement — all protected even though not named.' },
  { num: 10, title: 'Powers Reserved to States and People', text: 'The powers not delegated to the United States by the Constitution, nor prohibited by it to the States, are reserved to the States respectively, or to the people.', plain: 'If the Constitution doesn\'t give the federal government a specific power, that power belongs to the states or directly to the people. Community self-governance — like what MiLyfe enables — is rooted here.' },
  { num: 13, title: 'Abolition of Slavery', text: 'Neither slavery nor involuntary servitude, except as a punishment for crime whereof the party shall have been duly convicted, shall exist within the United States.', plain: 'Slavery is illegal. Note the exception: "except as punishment for crime" — this is why mass incarceration and prison labor are civil rights issues today.' },
  { num: 14, title: 'Equal Protection, Due Process (States)', text: 'No State shall make or enforce any law which shall abridge the privileges or immunities of citizens of the United States; nor shall any State deprive any person of life, liberty, or property, without due process of law; nor deny to any person within its jurisdiction the equal protection of the laws.', plain: 'States must treat everyone equally under the law. This is the basis for challenging discrimination, police misconduct, and unequal treatment. If the city treats your neighborhood differently, this is your legal basis.' },
  { num: 15, title: 'Right to Vote (Race)', text: 'The right of citizens of the United States to vote shall not be denied or abridged by the United States or by any State on account of race, color, or previous condition of servitude.', plain: 'Your right to vote cannot be denied because of your race. Period.' },
  { num: 19, title: 'Right to Vote (Sex)', text: 'The right of citizens of the United States to vote shall not be denied or abridged by the United States or by any State on account of sex.', plain: 'Your right to vote cannot be denied because of your gender.' },
];

const situations = [
  { q: 'Can police search my car?', a: '4th Amendment. Only with a warrant, your consent, or "probable cause" (they see/smell something illegal in plain view). You can say: "I do not consent to a search." They may search anyway — do not resist physically, but clearly state your refusal on camera.' },
  { q: 'Do I have to show ID?', a: 'Florida is a "stop and identify" state. If police have reasonable suspicion you committed a crime, you must provide your name. You do NOT have to show a physical ID card if you\'re not driving. If driving, you must show license, registration, and insurance.' },
  { q: 'Can I record the police?', a: '1st Amendment. YES. You can record police performing duties in public spaces. In Florida, you can record in public. Do not interfere with their work, but you have every right to observe and record.' },
  { q: 'Can police take my phone?', a: '4th Amendment. They need a warrant to search your phone (Riley v. California, 2014). They can take it as evidence during arrest but cannot unlock or browse it without a warrant.' },
  { q: 'What do I say if arrested?', a: '5th & 6th Amendments. "I am invoking my right to remain silent. I want a lawyer." Then STOP TALKING. Do not explain, do not apologize, do not answer questions. Everything you say can and will be used against you.' },
  { q: 'Can police enter my home?', a: '4th Amendment. Only with a warrant, your consent, or exigent circumstances (they hear someone screaming for help). If they knock, you can speak through the door. Say: "Do you have a warrant?" If no: "I do not consent to entry."' },
  { q: 'Can I leave during a stop?', a: 'Ask: "Am I free to go?" If yes, walk away calmly. If no, you are being detained — invoke your rights and remain silent. Do not run.' },
  { q: 'What if police lie to me?', a: 'Police are legally allowed to lie during interrogation. They can say your friend confessed, they have evidence, etc. This is why you say NOTHING without a lawyer present. Their job is to get you to talk.' },
];

export default function RightsPage() {
  const [tab, setTab] = useState<RightsTab>('amendments');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);

  const filteredAmendments = search
    ? amendments.filter(a => a.title.toLowerCase().includes(search.toLowerCase()) || a.plain.toLowerCase().includes(search.toLowerCase()) || a.text.toLowerCase().includes(search.toLowerCase()))
    : amendments;

  const filteredSituations = search
    ? situations.filter(s => s.q.toLowerCase().includes(search.toLowerCase()) || s.a.toLowerCase().includes(search.toLowerCase()))
    : situations;

  return (
    <div className="space-y-4 animate-slide-up">
      <div>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white">MiRights</h1>
        <p className="text-xs text-gray-500">Know your rights. Defend yourself. The Constitution is your shield.</p>
        <div className="mt-2">
          <ReadAloudButton
            texts={amendments.map(a => `Amendment ${a.num}. ${a.title}. ${a.plain}`)}
            size="sm"
          />
        </div>
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="input-field !py-2.5 text-sm"
        placeholder="Search... &quot;Can police search my car?&quot;"
      />

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide">
        {([
          { key: 'amendments', label: '📜 Constitution' },
          { key: 'search', label: '🔍 Situations' },
          { key: 'tools', label: '🛡️ Tools' },
        ] as { key: RightsTab; label: string }[]).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={cn('px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all', tab === t.key ? 'bg-harbor-800 text-white dark:bg-teal-500' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600 dark:text-gray-300')}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Amendments */}
      {tab === 'amendments' && (
        <div className="space-y-3">
          {filteredAmendments.length === 0 ? (
            <p className="text-center py-8 text-gray-400">No amendments match your search.</p>
          ) : filteredAmendments.map(a => (
            <div key={a.num} className="card">
              <button onClick={() => setExpanded(expanded === a.num ? null : a.num)} className="w-full text-left">
                <div className="flex items-start gap-3">
                  <span className="w-8 h-8 rounded-lg bg-harbor-100 dark:bg-harbor-800 flex items-center justify-center text-xs font-bold text-harbor-600 dark:text-harbor-300 flex-shrink-0">
                    {a.num}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-harbor-800 dark:text-white">{a.title}</p>
                    <p className="text-xs text-teal-600 dark:text-teal-400 mt-1 line-clamp-2">{a.plain}</p>
                  </div>
                  <span className="text-gray-400 text-sm">{expanded === a.num ? '▼' : '▶'}</span>
                </div>
              </button>
              {expanded === a.num && (
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-harbor-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-medium text-gray-400 uppercase mb-1">What this means for you:</p>
                    <ReadAloudButton
                      texts={[`Amendment ${a.num}. ${a.title}.`, a.plain]}
                      size="sm"
                    />
                  </div>
                  <p className="text-sm text-harbor-700 dark:text-gray-200 leading-relaxed">{a.plain}</p>
                  <div>
                    <p className="text-[10px] font-medium text-gray-400 uppercase mb-1">Original text:</p>
                    <p className="text-xs text-gray-500 italic leading-relaxed">{a.text}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Situations */}
      {tab === 'search' && (
        <div className="space-y-3">
          {filteredSituations.map((s, i) => (
            <div key={i} className="card">
              <p className="text-sm font-bold text-harbor-800 dark:text-white">{s.q}</p>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-2 leading-relaxed">{s.a}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tools */}
      {tab === 'tools' && (
        <div className="space-y-3">
          <Link href="/rights/police" className="card flex items-center gap-4 hover:scale-[1.02] transition-transform border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10">
            <span className="text-3xl">🚨</span>
            <div className="flex-1">
              <p className="text-sm font-bold text-harbor-800 dark:text-white">I&apos;m Being Stopped</p>
              <p className="text-xs text-gray-500">Record, log badge info, know what to say</p>
            </div>
          </Link>

          <Link href="/rights/police" className="card flex items-center gap-4 hover:scale-[1.02] transition-transform">
            <span className="text-2xl">📋</span>
            <div className="flex-1">
              <p className="text-sm font-bold text-harbor-800 dark:text-white">Interaction Log</p>
              <p className="text-xs text-gray-500">View & export your police encounter history</p>
            </div>
          </Link>

          <div className="card bg-harbor-50 dark:bg-harbor-900 border-harbor-200 dark:border-harbor-700">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-bold text-harbor-800 dark:text-white">Remember:</p>
              <ReadAloudButton
                texts={[
                  'Remember these phrases if you are stopped by police.',
                  'I do not consent to a search.',
                  'I am invoking my right to remain silent.',
                  'I want a lawyer.',
                  'Then stop talking. Say nothing else.',
                ]}
                size="sm"
              />
            </div>
            <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
              <li>• &quot;I do not consent to a search.&quot;</li>
              <li>• &quot;I am invoking my right to remain silent.&quot;</li>
              <li>• &quot;I want a lawyer.&quot;</li>
              <li>• Then STOP TALKING.</li>
            </ul>
          </div>

          <div className="card">
            <p className="text-sm font-bold text-harbor-800 dark:text-white mb-2">Emergency Legal Help</p>
            <a href="tel:9043568371" className="btn-primary w-full text-center text-sm">
              📞 Jacksonville Legal Aid — 904-356-8371
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
