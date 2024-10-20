import Itransformer, {
  PlayerPosition,
  PlayerPositionRaw,
  RawData,
  PlayerTransformedData,
  TransformedData,
  MatchWithPlayerData,
} from "./ITransformer";

export class PlayerStatisticTransformer implements Itransformer {
  private contextData: any = {};
  constructor() {}

  public transform(inputData: RawData): TransformedData {
    const rawInput = inputData as PlayerPositionRaw;
    const player = this.stats?.homeLineup?.playerStats.find((player) => {
      return (player.name === rawInput.player.name;
    });
    if (!player) {
      return {};
    }
    const index = this.playerStats.indexOf(player);
    const position = this.getPosition(index + 1);
    const transformedData = { ...player, position };
    return transformedData;
  }

  public setContextData<T>(contextData: T): void {
    this.contextData = contextData;
  }
  getContextData<T>(): T {
    return this.contextData as T;
  }

  private getPosition(index: number): PlayerPosition {
    switch (index) {
      case 1:
        return PlayerPosition.fullback;
      case 2 | 5:
        return PlayerPosition.winger;
      case 3 | 4:
        return PlayerPosition.center;
      case 6:
        return PlayerPosition.standoff;
      case 7:
        return PlayerPosition.halfback;
      case 8 | 10:
        return PlayerPosition.prop;
      case 9:
        return PlayerPosition.hooker;
      case 11 | 12:
        return PlayerPosition.secondrow;
      case 13:
        return PlayerPosition.lock;
      default:
        return PlayerPosition.interchange;
    }
  }
}
