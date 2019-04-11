import { getLocalStorage, lastSelectedId } from "./chromeApi";
import { IShopItem } from "./item";

export class Model {

  private _itemList: IShopItem[];
  private _id: string;
  dispatcher: HTMLDivElement;
  private _datachange: Event;
  private _selectchange: Event;

  constructor() {
    this._itemList = getLocalStorage();
    this._id = lastSelectedId();
    this.dispatcher = document.createElement('div');
    this._datachange = new Event('dataChange');
    this._selectchange = new Event('selectChange');
  }


  getTitleList = (): { title: string, id: string }[] => {
    return this._itemList.map(item => ({title: item.name, id: item.id}) )
  }

  getSelectedItem = (): IShopItem => {
    return this._itemList.find(item => item.id === this._id);
  }

  select = (id: string): void => {
    this._id = id;
    this.dispatcher.dispatchEvent(this._selectchange);
  }

  updateItem = (type: 'update' | 'new' | 'delete', form?: FormData): void => {

    if (type === "update") {

      const index = this._itemList.findIndex(item => item.id === this._id);
      if (index === -1) { alert('no index'); }

      this._itemList[index] = this.form_to_item(this._id, form);

    } else if (type === "new") {

      this._itemList.push(
        this.form_to_item(this.uniqueId(), form)
      );

    } else if (type === "delete") {

      const index = this._itemList.findIndex(item => item.id === this._id)
      if (index === -1) { alert('no index'); }

      this._itemList.splice(index, 1);
    }

    this.dispatcher.dispatchEvent(this._datachange);
    console.log(this._itemList);
  }



  private uniqueId = (): string => {
    return Math.random().toString(34).slice(2);
  }

  private form_to_item = (id: string, form: FormData): IShopItem => {
    return {
      id: id,
      name: form.get('name').toString(),
      price: form.get('price').toString(),
      weight: form.get('weight').toString(),
      rakuten_stock: form.get('rakuten_stock').toString(),
      makeshop_stock: form.get('makeshop_stock').toString(),
      jancode: form.get('jancode').toString(),
      descriptions: [],
      details: []
    }
  }
}

