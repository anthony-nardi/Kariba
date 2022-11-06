// Initial deck is 64 cards, 8 of each number 1-8
export function getInitialDeck() {
  const cards: string[] = [];
  for (let i = 1; i <= 8; i++) {
    for (let k = 1; k <=8; k++) {
      cards.push(`${i}`)
    }
  }
}

