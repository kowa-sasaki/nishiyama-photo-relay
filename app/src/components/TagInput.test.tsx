import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TagInput } from './TagInput'

describe('TagInput', () => {
  it('adds a suggestion tag when its chip is clicked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<TagInput value={[]} onChange={onChange} />)
    await user.click(screen.getByRole('button', { name: '桜' }))
    expect(onChange).toHaveBeenCalledWith(['桜'])
  })

  it('removes a selected tag when its chip is clicked again', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<TagInput value={['桜']} onChange={onChange} />)
    await user.click(screen.getByRole('button', { name: '桜' }))
    expect(onChange).toHaveBeenCalledWith([])
  })

  it('adds a free-text tag on Enter and clears the input', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<TagInput value={[]} onChange={onChange} />)
    const input = screen.getByLabelText('タグを追加')
    await user.type(input, '朝もや{Enter}')
    expect(onChange).toHaveBeenCalledWith(['朝もや'])
    expect(input).toHaveValue('')
  })

  it('adds a free-text tag when the add button is tapped, without relying on Enter', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<TagInput value={[]} onChange={onChange} />)
    const input = screen.getByLabelText('タグを追加')
    await user.type(input, '朝もや')
    await user.click(screen.getByRole('button', { name: '追加' }))
    expect(onChange).toHaveBeenCalledWith(['朝もや'])
    expect(input).toHaveValue('')
  })

  it('does not add an empty tag when the add button is tapped with a blank input', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<TagInput value={[]} onChange={onChange} />)
    await user.click(screen.getByRole('button', { name: '追加' }))
    expect(onChange).not.toHaveBeenCalled()
  })

  it('does not add a duplicate tag', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<TagInput value={['桜']} onChange={onChange} />)
    const input = screen.getByLabelText('タグを追加')
    await user.type(input, '桜{Enter}')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('removes a selected tag via its remove button', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<TagInput value={['朝もや']} onChange={onChange} />)
    await user.click(screen.getByRole('button', { name: '朝もやを削除' }))
    expect(onChange).toHaveBeenCalledWith([])
  })
})
