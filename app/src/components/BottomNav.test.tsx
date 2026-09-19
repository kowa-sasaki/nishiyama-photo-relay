import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { BottomNav } from './BottomNav'

describe('BottomNav', () => {
  it('renders all four navigation items', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <BottomNav />
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: 'ホーム' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '定点' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '＋投稿' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '概要' })).toBeInTheDocument()
  })

  it('marks the current route as active', () => {
    render(
      <MemoryRouter initialEntries={['/spots']}>
        <BottomNav />
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: '定点' })).toHaveClass('bottom-nav__item--active')
    expect(screen.getByRole('link', { name: 'ホーム' })).not.toHaveClass('bottom-nav__item--active')
  })
})
