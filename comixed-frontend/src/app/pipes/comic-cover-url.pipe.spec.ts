/*
 * ComiXed - A digital comic book library management application.
 * Copyright (C) 2018, The ComiXed Project
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.package
 * org.comixed;
 */

import {
  ComicCoverUrlPipe,
  MISSING_COMIC_IMAGE_URL
} from './comic-cover-url.pipe';
import { COMIC_SERVICE_API_URL } from '../services/comic.service';
import { COMIC_1000, COMIC_1003 } from '../models/comics/comic.fixtures';

describe('ComicCoverUrlPipe', () => {
  const pipe = new ComicCoverUrlPipe();

  it('returns the missing page URL if the comic is missing', () => {
    expect(pipe.transform(COMIC_1003)).toEqual(MISSING_COMIC_IMAGE_URL);
  });

  it('returns the URL for the comic\'s cover image', () => {
    expect(pipe.transform(COMIC_1000)).toEqual(
      `${COMIC_SERVICE_API_URL}/comics/${COMIC_1000.id}/pages/0/content`
    );
  });
});
