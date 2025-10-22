# Study Session Components

Komponenty dla widoku Sesji Nauki z algorytmem SM-2 (SuperMemo 2) spaced repetition.

## Struktura komponentów

```
StudySessionView (main container)
├── StudyErrorBoundary (error handling)
├── StudySessionHeader (fixed header)
│   ├── StudyProgressBar
│   ├── Stats (remaining, reviewed)
│   └── Exit button (z confirmation dialog)
├── LoadingState (podczas inicjalizacji)
├── EmptyState (brak fiszek)
├── ActiveSession (główny flow nauki)
│   ├── StudyCard (fiszka front/back)
│   ├── FlipButton (pokazanie odpowiedzi)
│   └── StudyControls (4 przyciski oceny)
└── CompletedState (gratulacje po sesji)
```

## Accessibility Features

### Semantic HTML

- `<main>` - główny content sesji
- `<article>` - StudyCard
- `<button>` - wszystkie interaktywne elementy
- `<nav>` - nawigacja w header
- Proper heading hierarchy (h1, h2, h3)

### ARIA Attributes

- `aria-label` - opisowe labels dla wszystkich interaktywnych elementów
- `aria-live="polite"` - announcements dla screen readers
- `aria-atomic="true"` - kompletne announcements
- `aria-disabled` - disabled states dla przycisków
- `role="main"` - explicit main landmark
- `role="status"` - dla completion message

### Keyboard Navigation

**Shortcuts:**

- `Spacja` - Flip karty (pokazanie odpowiedzi)
- `1` - Ocena "Again" (nie pamiętam)
- `2` - Ocena "Hard" (trudne)
- `3` - Ocena "Good" (dobre)
- `4` - Ocena "Easy" (łatwe)
- `Escape` - Wyjście z sesji (z confirmation)

**Tab Order:**

1. Exit button (header)
2. Flip button (gdy visible)
3. Rating buttons (gdy visible, 1-4)

**Focus Management:**

- `focus-visible:ring-2` - wyraźne focus rings
- `focus-visible:ring-offset-2` - offset dla lepszej widoczności
- Kolorowe focus rings odpowiadające wariantom przycisków

### Screen Reader Support

- Live regions dla dynamic updates (progress, transitions)
- Opisowe announcements po każdej akcji
- Hidden visual elements (`sr-only`) z kontekstem
- Proper ARIA labels dla icon-only buttons
- Keyboard hints visible dla wszystkich userów

### Reduced Motion Support

```css
@media (prefers-reduced-motion: reduce) {
  /* Wszystkie animacje wyłączone lub znacząco uproszczone */
  animation: none !important;
  transition: none !important;
}
```

## Testing Checklist

### Manual Keyboard Testing

- [ ] Tab przez wszystkie interaktywne elementy
- [ ] Spacja działa dla flip
- [ ] 1-4 działają dla oceny (tylko gdy isFlipped)
- [ ] Escape otwiera confirmation dialog
- [ ] Enter/Space aktywują przyciski
- [ ] Focus visible na wszystkich elementach

### Screen Reader Testing (NVDA/JAWS/VoiceOver)

- [ ] All landmarks announced properly
- [ ] Button labels clear and descriptive
- [ ] Live regions announce updates
- [ ] Card content readable
- [ ] Progress updates announced

### Lighthouse Accessibility Score

- Target: **100/100**
- Required checks:
  - All images have alt text (N/A - brak images)
  - Color contrast ratio >= 4.5:1
  - All interactive elements keyboard accessible
  - No duplicate IDs
  - Valid ARIA attributes

### Browser Compatibility

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Android

## Performance

### Optimizations

- `React.memo` dla StudyCard (prevent re-renders)
- `useCallback` dla event handlers
- `useMemo` dla sorted cards
- Smooth transitions z 300ms delay
- localStorage batch updates

### Expected Performance

- Initial load: < 2s
- Flip transition: 300ms
- Card transition: 300ms
- 60fps animations
- Smooth keyboard response

## Edge Cases Handled

1. **Brak fiszek** → EmptyState z CTAs
2. **Tylko 1 fiszka** → Działa normalnie, kończy po 1
3. **Bardzo długie teksty (>500 chars)** → Scroll support + smaller font
4. **Corrupted localStorage** → Silent reset do nowego storage
5. **localStorage full** → Graceful degradation, warning toast
6. **Network offline** → Error toast z retry
7. **API timeout** → Error handling z fallback
8. **React error** → ErrorBoundary z fallback UI
9. **Multiple rapid keypresses** → Debouncing z processing state
10. **Input focus** → Keyboard shortcuts disabled

## Future Enhancements (Post-MVP)

- [ ] Backend sync (save SM-2 data to database)
- [ ] Due cards only filter
- [ ] Study streak tracking
- [ ] Daily goals
- [ ] Statistics charts
- [ ] Sound effects (with mute toggle)
- [ ] Haptic feedback on mobile
- [ ] Dark mode optimizations
- [ ] Batch study sessions
- [ ] Study reminders
