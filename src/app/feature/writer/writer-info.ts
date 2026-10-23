import info from '../../../data/workshop/info.json';
import { WriterKind } from './writer.interface';

/** What a workshop collection is and where its entries end up. Ukrainian source text. */
export interface WriterInfo {
	title: string;
	about: string;
	uses: { where: string; how: string }[];
}

/**
 * Explanations behind the workshop's info buttons. They live in `src/data/workshop/info.json` so
 * the build can also put them into `/workshop.md`.
 */
export const WRITER_INFO = info as Record<WriterKind | 'chapters' | 'gaps' | 'review', WriterInfo>;
