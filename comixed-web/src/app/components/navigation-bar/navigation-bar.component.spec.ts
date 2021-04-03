/*
 * ComiXed - A digital comic book library management application.
 * Copyright (C) 2020, The ComiXed Project
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

import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NavigationBarComponent } from './navigation-bar.component';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { LoggerLevel, LoggerModule, LoggerService } from '@angular-ru/logger';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { ConfirmationService } from '@app/core';
import { Confirmation } from '@app/core/models/confirmation';
import { logoutUser, saveUserPreference } from '@app/user/actions/user.actions';
import { USER_ADMIN, USER_READER } from '@app/user/user.fixtures';
import {
  MatDialog,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDividerModule } from '@angular/material/divider';
import {
  LANGUAGE_PREFERENCE,
  LOGGER_LEVEL_PREFERENCE
} from '@app/app.constants';
import { MatSelectModule } from '@angular/material/select';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ComicViewMode } from '@app/library';

describe('NavigationBarComponent', () => {
  const USER = USER_ADMIN;
  const initialState = {};

  let component: NavigationBarComponent;
  let fixture: ComponentFixture<NavigationBarComponent>;
  let store: MockStore<any>;
  let router: Router;
  let confirmationService: ConfirmationService;
  let dialog: MatDialog;
  let dialogRef: jasmine.SpyObj<MatDialogRef<any>>;
  let translateService: TranslateService;
  let logger: LoggerService;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [NavigationBarComponent],
      imports: [
        NoopAnimationsModule,
        RouterTestingModule.withRoutes([{ path: '*', redirectTo: '' }]),
        TranslateModule.forRoot(),
        LoggerModule.forRoot(),
        MatDialogModule,
        MatMenuModule,
        MatIconModule,
        MatToolbarModule,
        MatTooltipModule,
        MatFormFieldModule,
        MatDividerModule,
        MatSelectModule
      ],
      providers: [
        provideMockStore({ initialState }),
        {
          provide: MatDialogRef,
          useValue: {
            afterClosed: jasmine.createSpy('MatDialogRef.afterClosed()')
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NavigationBarComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(MockStore);
    spyOn(store, 'dispatch');
    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
    confirmationService = TestBed.inject(ConfirmationService);
    dialog = TestBed.inject(MatDialog);
    dialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<
      MatDialogRef<any>
    >;
    translateService = TestBed.inject(TranslateService);
    logger = TestBed.inject(LoggerService);
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('on login clicked', () => {
    beforeEach(() => {
      component.onLogin();
    });

    it('sends the browser to the login page', () => {
      expect(router.navigate).toHaveBeenCalledWith(['login']);
    });
  });

  describe('on logout clicked', () => {
    beforeEach(() => {
      spyOn(
        confirmationService,
        'confirm'
      ).and.callFake((confirm: Confirmation) => confirm.confirm());
      component.onLogout();
    });

    it('fires an action', () => {
      expect(store.dispatch).toHaveBeenCalledWith(logoutUser());
    });

    it('sends the user to the login page', () => {
      expect(router.navigate).toHaveBeenCalledWith(['login']);
    });
  });

  describe('when an admin user is logged in', () => {
    beforeEach(() => {
      component.isAdmin = false;
      component.user = USER_ADMIN;
    });

    it('sets the admin flag', () => {
      expect(component.isAdmin).toBeTrue();
    });
  });

  describe('when an admin reader is logged in', () => {
    beforeEach(() => {
      component.isAdmin = true;
      component.user = USER_READER;
    });

    it('clears the admin flag', () => {
      expect(component.isAdmin).toBeFalse();
    });
  });

  describe('when the display options menu item is selected', () => {
    beforeEach(() => {
      spyOn(dialog, 'open').and.returnValue(dialogRef);
      component.onShowDisplayOptions();
    });

    it('invokes the confirm callback', () => {
      expect(dialog.open).toHaveBeenCalled();
    });
  });

  describe('when the language is changed', () => {
    const LANGUAGE = 'foo';

    beforeEach(() => {
      spyOn(translateService, 'use');
    });

    describe('for an anonymous user', () => {
      beforeEach(() => {
        component.onSelectLanguage(LANGUAGE);
      });

      it('changes the active translation', () => {
        expect(translateService.use).toHaveBeenCalledWith(LANGUAGE);
      });

      it('does not the language choice', () => {
        expect(store.dispatch).not.toHaveBeenCalled();
      });
    });

    describe('for an authenticated user', () => {
      beforeEach(() => {
        component.user = USER;
        component.onSelectLanguage(LANGUAGE);
      });

      it('stores the language choice', () => {
        expect(store.dispatch).toHaveBeenCalledWith(
          saveUserPreference({ name: LANGUAGE_PREFERENCE, value: LANGUAGE })
        );
      });
    });
  });

  describe('changing the active language', () => {
    const LANGUAGE = 'fr';

    beforeEach(() => {
      translateService.use(LANGUAGE);
    });

    it('updates the current language', () => {
      expect(component.currentLanguage).toEqual(LANGUAGE);
    });
  });

  describe('changing the logging level', () => {
    const LOGGER_LEVEL = LoggerLevel.TRACE;

    beforeEach(() => {
      logger.level = LoggerLevel.OFF;
    });

    describe('when the user is anonymous', () => {
      beforeEach(() => {
        component.user = null;
        component.onSetLogging(LOGGER_LEVEL);
      });

      it('changes the logging level', () => {
        expect(logger.level).toEqual(LOGGER_LEVEL);
      });
    });

    describe('when the user is logged in', () => {
      beforeEach(() => {
        component.user = USER;
        component.onSetLogging(LOGGER_LEVEL);
      });

      it('changes the logging level', () => {
        expect(logger.level).toEqual(LOGGER_LEVEL);
      });

      it('saves the preference', () => {
        expect(store.dispatch).toHaveBeenCalledWith(
          saveUserPreference({
            name: LOGGER_LEVEL_PREFERENCE,
            value: `${LOGGER_LEVEL}`
          })
        );
      });
    });
  });

  describe('toggling stacked mode', () => {
    const stacked = Math.random() > 0.5;

    beforeEach(() => {
      component.stacked = stacked;
      component.onToggleStacked();
    });

    it('flips the stacked flag', () => {
      expect(component.stacked).toEqual(!stacked);
    });
  });

  describe('changing the comic view', () => {
    it('can show all comics', () => {
      component.onComicViewChange(ComicViewMode.ALL);
      expect(router.navigate).toHaveBeenCalledWith(['/library']);
    });
  });

  it('can show the build details', () => {
    component.onShowBuildDetails();
    expect(router.navigate).toHaveBeenCalledWith(['/build']);
  });

  describe('toggling the sidebar', () => {
    beforeEach(() => {
      spyOn(component.toggleSidebar, 'emit');
      component.onToggleSidebar();
    });

    it('emits an event', () => {
      expect(component.toggleSidebar.emit).toHaveBeenCalled();
    });
  });
});
