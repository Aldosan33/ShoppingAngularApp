import { Actions, createEffect, ofType } from '@ngrx/effects';
import { switchMap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { of } from 'rxjs';
import { Injectable } from '@angular/core';
import { catchError, map, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { User } from '../user.model';
import { AuthService } from '../auth.service';
import * as AuthActions from './auth.actions';

export interface AuthResponseData {
  kind: string;
  idToken: string;
  email: string;
  refreshToken: string;
  expiresIn: string;
  localId: string;
  registered?: boolean;
}

const handleAuthentication = (
  email: string,
  userId: string,
  expiresIn: number,
  token: string
) => {
  const expirationDate = new Date(new Date().getTime() + expiresIn * 1000);
  const user = new User(email, userId, token, expirationDate);
  localStorage.setItem('userData', JSON.stringify(user));
  return new AuthActions.AuthenticateSuccess({
    email: email,
    userId: userId,
    token: token,
    expirationDate: expirationDate,
    redirect: true,
  });
};

const handleError = (err: any) => {
  let errorMessage = 'An unknown error occurred!';
  if (!err.error || !err.error.error) {
    return of(new AuthActions.AuthenticateFail(errorMessage));
  }
  switch (err.error.error.message) {
    case 'EMAIL_EXISTS':
      errorMessage = 'This email exists already';
      break;
    case 'EMAIL_NOT_FOUND':
      errorMessage = 'This email does not exists';
      break;
    case 'INVALID_PASSWORD':
      errorMessage = 'Email or password are invalid';
      break;
  }
  return of(new AuthActions.AuthenticateFail(errorMessage));
};

@Injectable()
export class AuthEffects {
  constructor(
    private actions$: Actions,
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) {}

  authSignup = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.SIGNUP_START),
      switchMap((signupAction: AuthActions.SignupStart) => {
        return this.http
          .post<AuthResponseData>(
            `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${environment.googleDatabaseApiKey}`,
            {
              email: signupAction.payload.email,
              password: signupAction.payload.password,
            }
          )
          .pipe(
            tap((responseData) => {
              this.authService.setLogoutTimer(+responseData.expiresIn * 1000);
            }),
            map((responseData) =>
              handleAuthentication(
                responseData.email,
                responseData.localId,
                +responseData.expiresIn,
                responseData.idToken
              )
            ),
            catchError((err) => handleError(err))
          );
      })
    )
  );

  authLogin = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.LOGIN_START),
      switchMap((authData: AuthActions.LoginStart) => {
        return this.http
          .post<AuthResponseData>(
            `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${environment.googleDatabaseApiKey}`,
            {
              email: authData.payload.email,
              password: authData.payload.password,
              returnSecureToken: true,
            }
          )
          .pipe(
            tap((responseData) => {
              this.authService.setLogoutTimer(+responseData.expiresIn * 1000);
            }),
            map((responseData) =>
              handleAuthentication(
                responseData.email,
                responseData.localId,
                +responseData.expiresIn,
                responseData.idToken
              )
            ),
            catchError((err) => handleError(err))
          );
      })
    )
  );

  authLogout = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.LOGOUT),
        tap(() => {
          this.authService.clearLogoutTimer();
          localStorage.removeItem('userData');
          this.router.navigate(['/auth']);
        })
      ),
    { dispatch: false }
  );

  autoLogin = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.AUTO_LOGIN),
        map(() => {
          const userData: {
            email: string;
            id: string;
            _token: string;
            _tokenExpirationDate: string;
          } = JSON.parse(localStorage.getItem('userData'));

          if (!userData) {
            return of();
          }

          const loadedUser = new User(
            userData.email,
            userData.id,
            userData._token,
            new Date(userData._tokenExpirationDate)
          );

          if (loadedUser.token) {
            const expirationDuration =
              new Date(userData._tokenExpirationDate).getTime() -
              new Date().getTime();

            this.authService.setLogoutTimer(expirationDuration);

            return new AuthActions.AuthenticateSuccess({
              email: loadedUser.email,
              userId: loadedUser.id,
              token: loadedUser.token,
              expirationDate: new Date(userData._tokenExpirationDate),
              redirect: false,
            });
            // this.autoLogout(expirationDuration);
          }

          return of();
        })
      ),
    { dispatch: false }
  );

  authRedirect = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.AUTHENTICATE_SUCCESS),
        tap((authSuccessAction: AuthActions.AuthenticateSuccess) => {
          if (authSuccessAction.payload.redirect) {
            this.router.navigate(['/']);
          }
        })
      ),
    { dispatch: false }
  );
}
