import Logger from "../utils/Logger";
import Itransformer, {
  PlayerPosition,
  PlayerPositionRaw,
  RawData,
  PlayerTransformedData,
  TransformedData,
  MatchWithPlayerData,
} from "./ITransformer";

export class PlayerStatisticTransformer<T> implements Itransformer {
  private contextData: T = {} as T;
  constructor(readonly logger: Logger) {}

  public transform(inputData: RawData): TransformedData {
    const rawInput = inputData as PlayerPositionRaw;


    try {
      let player: PlayerTransformedData;
      let lineupIndex: number = -1;

      if ((this.contextData as MatchWithPlayerData).key === "home") {
        lineupIndex = (
          (this.contextData as any).homeLineUp.playerStats || []
        ).findIndex(
          (p: PlayerTransformedData) =>
            p.name?.trim() === rawInput.player.name?.trim()
        );
      } else if ((this.contextData as MatchWithPlayerData).key === "away") {
        lineupIndex = (
          (this.contextData as any).awayLineUp.playerStats || []
        ).findIndex(
          (p: PlayerTransformedData) =>
            p.name?.trim() === rawInput.player.name?.trim()
        );
      } else if (lineupIndex === -1) {
        this.logger.warn(JSON.stringify({ lineupIndex }));
        console.log("THERE");
        return {};
      }

      player =
      (this.contextData as any).key === "home"
          ? (this.contextData as any).homeLineUp?.playerStats[lineupIndex]
          : (this.contextData as any).awayLineUp?.playerStats[lineupIndex];

      const position = this.getPosition(lineupIndex + 1);
      const transformedData = { ...player, position };

      return transformedData;
    } catch (error) {
      this.logger.error(
        JSON.stringify({
          message: (error as Error).message,
          target: { name: rawInput.player.name },
          lineup:
            (this.contextData as any).homeLineUp ||
            (this.contextData as any).awayLineUp ||
            [],
          sofascoreMatchId: (this.contextData as any).sofascoreMatchId,
          stack: (error as Error).stack,
        })
      );
      return {};
    }
  }

  public setContextData<U>(contextData: U): void {
    this.contextData = contextData as unknown as T;
  }

  getContextData<T>(): T {
    return this.contextData as unknown as T;
  }

  private getPosition(index: number): PlayerPosition {
    switch (index) {
      case 1:
        return PlayerPosition.fullback;
      case 2:
      case 5:
        return PlayerPosition.winger;
      case 3:
      case 4:
        return PlayerPosition.center;
      case 6:
        return PlayerPosition.standoff;
      case 7:
        return PlayerPosition.halfback;
      case 8:
      case 10:
        return PlayerPosition.prop;
      case 9:
        return PlayerPosition.hooker;
      case 11:
      case 12:
        return PlayerPosition.secondrow;
      case 13:
        return PlayerPosition.lock;
      default:
        return PlayerPosition.interchange;
    }
  }
}
