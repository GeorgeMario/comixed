/*
 * ComiXed - A digital comic book library management application.
 * Copyright (C) 2021, The ComiXed Project
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
 * along with this program. If not, see <http://www.gnu.org/licenses>
 */

import { createReducer, on } from '@ngrx/store';
import {
  comicsRescanning,
  rescanComics,
  rescanComicsFailed
} from '../actions/rescan-comics.actions';

export const RESCAN_COMICS_FEATURE_KEY = 'rescan_comics_state';

export interface RescanComicsState {
  working: boolean;
}

export const initialState: RescanComicsState = {
  working: false
};

export const reducer = createReducer(
  initialState,

  on(rescanComics, state => ({ ...state, working: true })),
  on(comicsRescanning, state => ({ ...state, working: false })),
  on(rescanComicsFailed, state => ({ ...state, working: false }))
);
