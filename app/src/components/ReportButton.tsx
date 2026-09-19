import { useRef, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createReport, type ReportTargetType } from '../lib/createReport'
import './ReportButton.css'

const REPORT_REASONS: { value: string; label: string }[] = [
  { value: 'inappropriate', label: '不適切な画像・内容' },
  { value: 'spam', label: 'スパム・広告' },
  { value: 'other', label: 'その他' },
]

type Phase = 'idle' | 'open' | 'submitting' | 'error' | 'done'

export type ReportButtonProps = {
  client: SupabaseClient
  targetType: ReportTargetType
  targetId: string
  deviceId: string | null
  label?: string
}

export function ReportButton({ client, targetType, targetId, deviceId, label = '報告する' }: ReportButtonProps) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [reason, setReason] = useState(REPORT_REASONS[0].value)
  const submitGeneration = useRef(0)

  async function handleSubmit() {
    const generation = ++submitGeneration.current
    setPhase('submitting')
    try {
      await createReport(client, { targetType, targetId, reason, deviceId })
      if (submitGeneration.current === generation) {
        setPhase('done')
      }
    } catch {
      if (submitGeneration.current === generation) {
        setPhase('error')
      }
    }
  }

  if (phase === 'idle') {
    return (
      <button type="button" className="report-button__toggle" onClick={() => setPhase('open')}>
        {label}
      </button>
    )
  }

  if (phase === 'done') {
    return (
      <p className="report-button__done" role="status">
        報告を受け付けました。ご協力ありがとうございます。
      </p>
    )
  }

  return (
    <div className="report-button__form">
      <fieldset className="report-button__fieldset">
        <legend className="report-button__legend">通報理由</legend>
        {REPORT_REASONS.map((option) => (
          <label key={option.value} className="report-button__option">
            <input
              type="radio"
              name={`report-reason-${targetType}-${targetId}`}
              value={option.value}
              checked={reason === option.value}
              onChange={() => setReason(option.value)}
            />
            {option.label}
          </label>
        ))}
      </fieldset>
      {phase === 'error' && (
        <p className="report-button__error" role="alert">
          送信に失敗しました。時間をおいて再度お試しください。
        </p>
      )}
      <div className="report-button__actions">
        <button
          type="button"
          className="report-button__submit"
          onClick={() => void handleSubmit()}
          disabled={phase === 'submitting'}
        >
          送信する
        </button>
        <button
          type="button"
          className="report-button__cancel"
          onClick={() => {
            submitGeneration.current += 1
            setReason(REPORT_REASONS[0].value)
            setPhase('idle')
          }}
        >
          キャンセル
        </button>
      </div>
    </div>
  )
}
