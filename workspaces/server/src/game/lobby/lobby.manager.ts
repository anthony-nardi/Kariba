import { Lobby } from '@app/game/lobby/lobby';
import { Server } from 'socket.io';
import { AuthenticatedSocket } from '@app/game/types';
import { ServerException } from '@app/game/server.exception';
import { SocketExceptions } from '@shared/server/SocketExceptions';
import { LOBBY_MAX_LIFETIME } from '@app/game/constants';
import { ServerEvents } from '@shared/server/ServerEvents';
import { ServerPayloads } from '@shared/server/ServerPayloads';
import { Cron } from '@nestjs/schedule';

export class LobbyManager {
  public server: Server;

  private readonly lobbies: Map<Lobby['id'], Lobby> = new Map<Lobby['id'], Lobby>();
  public logger: any;

  public initializeSocket(client: AuthenticatedSocket): void {
    client.data.lobby = null;
  }

  public terminateSocket(client: AuthenticatedSocket): void {
    client.data.lobby?.removeClient(client);
  }

  public createLobby(delayBetweenRounds: number): Lobby {


    const lobby = new Lobby(this.server, this.logger);
    lobby.instance.delayBetweenRounds = delayBetweenRounds;

    this.lobbies.set(lobby.id, lobby);

    return lobby;
  }

  public joinLobby(lobbyId: string, client: AuthenticatedSocket, userName: string): void {
    const lobby = this.lobbies.get(lobbyId);

    if (!lobby) {
      throw new ServerException(SocketExceptions.LobbyError, 'Lobby not found');
    }

    if (lobby.clients.size >= lobby.maxClients) {
      throw new ServerException(SocketExceptions.LobbyError, 'Lobby already full');
    }


    lobby.addClient(client, userName);
  }

  public startGame(client: AuthenticatedSocket) {
    if (client.data.isHost && client.data.lobby) {
      const lobby = this.lobbies.get(client.data.lobby.id)
      if (lobby && lobby.clients && lobby.clients.size > 1 && client.id === lobby.instance.hostId) {
        lobby.startGame(client)
      }
    }
  }

  public passTurn(client: AuthenticatedSocket) {
    if (client.data.lobby) {
      const lobby = this.lobbies.get(client.data.lobby.id)
      if (lobby && client.id === lobby.instance.currentPlayer) {
        lobby.passTurn(client)
      }
    }

  }

  public drawChip(client: AuthenticatedSocket) {
    if (client.data.lobby) {

      const lobby = this.lobbies.get(client.data.lobby.id)
      if (lobby && client.id === lobby.instance.currentPlayer) {
        lobby.drawChip(client)
      }
    }

  }

  // Periodically clean up lobbies
  @Cron('*/5 * * * *')
  private lobbiesCleaner(): void {
    for (const [lobbyId, lobby] of this.lobbies) {
      const now = (new Date()).getTime();
      const lobbyCreatedAt = lobby.createdAt.getTime();
      const lobbyLifetime = now - lobbyCreatedAt;

      if (lobbyLifetime > LOBBY_MAX_LIFETIME) {
        lobby.dispatchToLobby<ServerPayloads[ServerEvents.GameMessage]>(ServerEvents.GameMessage, {
          color: 'blue',
          message: 'Game timed out',
        });

        lobby.instance.triggerFinish();

        this.lobbies.delete(lobby.id);
      }
    }
  }
}