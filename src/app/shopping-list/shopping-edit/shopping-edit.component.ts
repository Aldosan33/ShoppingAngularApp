import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Ingredient } from 'src/app/shared/ingredient.model';
import { NgForm } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Store } from '@ngrx/store';
import * as ShoppingListActions from '../store/shopping-list.actions';
import * as FromApp from '../../store/app.reducer';

@Component({
  selector: 'app-shopping-edit',
  templateUrl: './shopping-edit.component.html',
  styleUrls: ['./shopping-edit.component.css'],
})
export class ShoppingEditComponent implements OnInit, OnDestroy {
  @ViewChild('f') shoppingEditForm: NgForm;
  startedEditingSubscription: Subscription;
  editMode = false;
  editItem: Ingredient;

  constructor(
    // private shoppingListService: ShoppingListService,
    private store: Store<FromApp.AppState>
  ) {}

  ngOnInit() {
    this.startedEditingSubscription = this.store
      .select('shoppingList')
      .subscribe((stateData) => {
        if (stateData.editedIngredientIndex > -1) {
          this.editMode = true;
          this.editItem = stateData.editedIngredient;
          this.shoppingEditForm.setValue({
            name: this.editItem.name,
            amount: this.editItem.amount,
          });
        } else {
          this.editMode = false;
        }
      });

    // this.startedEditingSubscription =
    //   this.shoppingListService.startedEditing.subscribe((index: number) => {
    //     this.editMode = true;
    //     this.editItemIndex = index;
    //     this.editItem = this.shoppingListService.getIngredient(index);
    //     this.shoppingEditForm.setValue({
    //       name: this.editItem.name,
    //       amount: this.editItem.amount,
    //     });
    //   });
  }

  onSubmit(form: NgForm) {
    const formValue = form.value;
    const newIngredient = new Ingredient(formValue.name, formValue.amount);

    if (this.editMode) {
      // this.shoppingListService.updateIngredient(
      //   this.editItemIndex,
      //   newIngredient
      // );
      this.store.dispatch(
        new ShoppingListActions.UpdateIngredient(newIngredient)
      );
    } else {
      // this.shoppingListService.addIngredient(newIngredient);
      this.store.dispatch(new ShoppingListActions.AddIngredient(newIngredient));
    }

    this.onClear();
  }

  onClear() {
    this.editMode = false;
    this.shoppingEditForm.reset();
    this.store.dispatch(new ShoppingListActions.StopEdit());
  }

  onDelete() {
    // this.shoppingListService.deleteIngredient(this.editItemIndex);
    this.store.dispatch(new ShoppingListActions.DeleteIngredient());
    this.onClear();
  }

  ngOnDestroy() {
    this.startedEditingSubscription.unsubscribe();
    this.store.dispatch(new ShoppingListActions.StopEdit());
  }
}
