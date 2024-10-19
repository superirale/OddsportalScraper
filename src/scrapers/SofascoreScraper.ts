import { Page } from "puppeteer";
import IScraper, { JSONScraperOptions, MatchOddsData } from "./IScraper"
import { MatchTransformedData } from "../transformers/ITransformer";

export default class SofascoreScraper implements IScraper {
    constructor(
        readonly page: Page,
        readonly options: JSONScraperOptions,
        readonly transformers: Array<Transformer> = []
    ) {}
    crawl(url: string): Promise<string[] | MatchTransformedData[]> {
        throw new Error("Method not implemented.");
    }
    scrape(url: string, opt?: Record<string, unknown>): Promise<MatchOddsData> {
        throw new Error("Method not implemented.");
    }
}
