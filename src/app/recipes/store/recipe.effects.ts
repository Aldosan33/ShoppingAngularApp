import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as RecipeActions from './recipe.actions';
import { map, switchMap, tap, withLatestFrom } from 'rxjs';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Recipe } from '../recipe.model';
import * as FromApp from '../../store/app.reducer';
import { Store } from '@ngrx/store';

@Injectable()
export class RecipeEffects {
  constructor(
    private actions$: Actions,
    private http: HttpClient,
    private store: Store<FromApp.AppState>
  ) {}

  fetchRecipes = createEffect(() =>
    this.actions$.pipe(
      ofType(RecipeActions.FETCH_RECIPES),
      switchMap(() => {
        return this.http.get<Recipe[]>(
          'https://shoppingapp-723b9-default-rtdb.firebaseio.com/recipes.json'
        );
      }),
      map((recipes) => {
        return recipes.map((recipe) => {
          return {
            ...recipe,
            ingredients: recipe.ingredients ? recipe.ingredients : [],
          };
        });
      }),
      map((recipes) => {
        return new RecipeActions.SetRecipes(recipes);
      })
    )
  );

  storeRecipes = createEffect(
    () =>
      this.actions$.pipe(
        ofType(RecipeActions.STORE_RECIPES),
        withLatestFrom(this.store.select('recipes')),
        switchMap(([actionData, recipesState]) => {
          return this.http.put(
            'https://shoppingapp-723b9-default-rtdb.firebaseio.com/recipes.json',
            recipesState.recipes
          );
        })
      ),
    { dispatch: false }
  );
}
