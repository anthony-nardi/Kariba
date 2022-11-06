import { Lobby } from '@app/game/lobby/lobby';
import { AuthenticatedSocket, Scores, WateringHole, CardsHeld } from '@app/game/types';
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
  public deck = getInitialDeck()
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

  }

  public playCards(clientId: AuthenticatedSocket, cards: string[]) { 
    
  }

}