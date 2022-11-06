import { atom } from 'recoil';
import { ServerPayloads } from '@kariba/shared/server/ServerPayloads';
import { ServerEvents } from '@kariba/shared/server/ServerEvents';

export const CurrentLobbyState = atom<ServerPayloads[ServerEvents.LobbyState] | null>({
  key: 'CurrentLobbyState',
  default: null,
});