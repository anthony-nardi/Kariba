import { Lobby } from '@app/game/lobby/lobby';
import { AuthenticatedSocket, Scores, WateringHole, CardsHeld,CardValues } from '@app/game/types';
import { Socket } from 'socket.io';
import { ServerPayloads } from '@shared/server/ServerPayloads';
import { ServerEvents } from '@shared/server/ServerEvents';
import { getInitialDeck } from './utils';

const getRandomItemFromMap = (iterable) => iterable.get([...iterable.keys()][Math.floor(Math.random() * iterable.size)])
const getRandomItemFromArray = (items) => items[Math.floor(Math.random() * items.length)];


export class Instance {
  public hasStarted: boolean = false;
  public hasFinished: boolean = false;
  public hostId: string;
  public scores: Scores = new Map();
  public cardsHeld: CardsHeld = new Map()
  public currentPlayer: string
  public turnOrder: string[]
  public deck: string[] = getInitialDeck()
  public winner: string | null = null;
  public wateringHole: WateringHole = new Map()

  constructor(
    private readonly lobby: Lobby,
  ) {
  }


  private getRandomClient(): AuthenticatedSocket {
    return getRandomItemFromMap(this.lobby.clients)
  }

  private initializeGame(clients: Map<Socket['id'], AuthenticatedSocket | Bot> | Map<Socket['id'], Bot>): void {
    // deal cards
    // scores are 0
    // choose starting player
    // game starts

    const clientIds = Array.from(clients.keys());

    clientIds.forEach(clientId => {
      this.refillHand(clientId)
      this.scores.set(clientId, 0)
    }) 

    this.currentPlayer = this.getRandomClient().id
    this.turnOrder = clientIds
    this.hasStarted = true;
  }

  public setHostId(hostId: Socket['id']): void {
    this.hostId = hostId
  }

  public triggerStart(clients: Map<Socket['id'], AuthenticatedSocket | Bot>): void {
    if (this.hasStarted) {
      return;
    }
    // Start game, set current player, determine player order, init game state
    this.initializeGame(clients)
    this.lobby.dispatchLobbyState();

    this.lobby.dispatchToLobby<ServerPayloads[ServerEvents.GameMessage]>(ServerEvents.GameMessage, {
      color: 'blue',
      message: 'Game started!',
    });
  }

  public triggerFinish(): void {
    if (this.hasFinished || !this.hasStarted) {
      return;
    }

    this.hasFinished = true;

    this.lobby.dispatchToLobby<ServerPayloads[ServerEvents.GameMessage]>(ServerEvents.GameMessage, {
      color: 'blue',
      message: 'Game finished!',
    });
  }

  private refillHand(clientId: AuthenticatedSocket ) {
    const currentCardsHeld = this.cardsHeld.get(clientId)

    while(currentCardsHeld && currentCardsHeld.length < 5 && this.deck.length > 0) {
      const cardDrawn: CardValues = getRandomItemFromArray(this.deck)
      this.deck.splice(this.deck.indexOf(cardDrawn), 1)
      currentCardsHeld.push(cardDrawn)
    }
  }

  public playCards(clientId: AuthenticatedSocket, cards: CardValues[]) { 
    const cardsHeldByPlayer = this.cardsHeld.get(clientId)
    if (!cardsHeldByPlayer) {
      return;
    }
    cards.forEach(card => {
      const cardIndex = cardsHeldByPlayer.indexOf(card)
      cardsHeldByPlayer.splice(cardIndex, 1)
      this.wateringHole.get(card)?.push(card)
    })
    // resolve wateringhole spot >= 3 (remove cards and score)
    // is deck empty and players hands empty? If so game is over
    this.lobby.dispatchLobbyState()
  }
}