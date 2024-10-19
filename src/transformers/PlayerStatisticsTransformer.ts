import Itransformer, { PlayerPosition, RawData, TransformedData } from "./ITransformer";

export class PlayerStatisticTransformer implements Itransformer {
    constructor() {}
    transform(inputData: RawData): TransformedData {
        throw new Error("Method not implemented.");
    }
}
